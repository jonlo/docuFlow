import "@blocknote/mantine/style.css";
import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useAppStore } from "@/stores/appStore";

interface BlockNoteBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content: unknown[];
  children: BlockNoteBlock[];
}

interface FetchResult {
  blocks: BlockNoteBlock[];
  hasUnsupportedBlocks: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function DocumentEditorPage(): JSX.Element {
  const { documentPage, closeDocumentPage } = useAppStore((s) => ({
    documentPage: s.documentPage,
    closeDocumentPage: s.closeDocumentPage,
  }));

  const editor = useCreateBlockNote();

  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState<string | null>(null);
  const [hasUnsupportedBlocks, setHasUnsupportedBlocks] = useState(false);
  const [syncing, setSyncing]                         = useState(false);
  const [syncStatus, setSyncStatus]                   = useState<"idle" | "success" | "error">("idle");
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const providerDocId = documentPage?.id ?? "";

  async function fetchBlocks(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/notion/documents/${providerDocId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { code?: string };
        setError(body.code === "NOTION_NOT_CONFIGURED" ? "Notion is not configured." : "Failed to load document.");
        return;
      }
      const data = await res.json() as FetchResult;
      setHasUnsupportedBlocks(data.hasUnsupportedBlocks);
      if (data.blocks.length > 0) {
        editor.replaceBlocks(
          editor.document,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.blocks as any
        );
      }
    } catch {
      setError("Failed to load document.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (providerDocId) void fetchBlocks();
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
    // fetchBlocks is defined inline; providerDocId is the real dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerDocId]);

  async function handleSync(): Promise<void> {
    setSyncing(true);
    setSyncStatus("idle");
    try {
      const blocks = editor.document;
      const res = await fetch(`${API_BASE}/api/notion/documents/${providerDocId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) {
        setSyncStatus("error");
      } else {
        setSyncStatus("success");
        syncTimeoutRef.current = setTimeout(() => setSyncStatus("idle"), 3000);
      }
    } catch {
      setSyncStatus("error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col" style={{ zIndex: 60 }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={closeDocumentPage}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <h1 className="text-sm font-semibold text-gray-900 flex-1 truncate">
          {documentPage?.title ?? "Document"}
        </h1>

        <a
          href={documentPage?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
        >
          Open in Notion ↗
        </a>

        <button
          onClick={() => void handleSync()}
          disabled={syncing || loading || !!error}
          className="flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? "Saving…" : "Sync to Notion"}
        </button>

        {syncStatus === "success" && (
          <span className="text-xs text-green-600 flex-shrink-0">Saved!</span>
        )}
        {syncStatus === "error" && (
          <span className="text-xs text-red-600 flex-shrink-0">Sync failed</span>
        )}
      </header>

      {/* Unsupported blocks banner */}
      {hasUnsupportedBlocks && !loading && !error && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex-shrink-0">
          Some blocks couldn't be fully rendered. Open in Notion for the complete view.
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => void fetchBlocks()}
              className="px-3 py-1.5 rounded text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="max-w-3xl mx-auto py-8 px-4">
            <BlockNoteView editor={editor} theme="light" />
          </div>
        )}
      </div>
    </div>
  );
}
