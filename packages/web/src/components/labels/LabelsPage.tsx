import { useState } from "react";
import { useLabels } from "@/hooks/useLabels";
import { useCreateLabel, useDeleteLabel, useUpdateLabel } from "@/hooks/useLabelMutations";
import type { Label } from "@flowdocs/shared";

const PRESET_COLORS = [
  "#6B5ECD", "#4F9CF9", "#38BFA1", "#F97316",
  "#EC4899", "#EAB308", "#8B5CF6", "#64748B",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}): JSX.Element {
  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0"
          style={{ backgroundColor: c, borderColor: value === c ? "#1A1A2E" : "transparent" }}
        />
      ))}
      <label
        className="w-6 h-6 rounded-full border-2 overflow-hidden cursor-pointer transition-transform hover:scale-110 flex-shrink-0 relative"
        style={{
          backgroundColor: PRESET_COLORS.includes(value) ? "#E5E7EB" : value,
          borderColor: !PRESET_COLORS.includes(value) ? "#1A1A2E" : "transparent",
        }}
        title="Custom color"
      >
        <input
          type="color"
          className="absolute opacity-0 w-full h-full cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

function LabelRow({ label }: { label: Label }): JSX.Element {
  const deleteLabel = useDeleteLabel();
  const updateLabel = useUpdateLabel();
  const [editing, setEditing] = useState(false);
  const [color, setColor]     = useState(label.color);

  function handleColorChange(c: string) {
    setColor(c);
    updateLabel.mutate({ id: label.id, color: c });
  }

  return (
    <li className="flex flex-col gap-2 px-3 py-2 rounded-lg border border-transparent hover:border-surface-border hover:bg-surface-raised transition-colors group">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-offset-1 hover:ring-2 hover:ring-accent-primary/50 transition-all"
          style={{ backgroundColor: color }}
          title="Edit colour"
        />
        <span className="text-sm text-text-base flex-1">{label.name}</span>
        <button
          type="button"
          onClick={() => deleteLabel.mutate(label.id)}
          disabled={deleteLabel.isPending}
          className="text-xs text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {editing && (
        <div className="pl-6">
          <ColorPicker value={color} onChange={handleColorChange} />
        </div>
      )}
    </li>
  );
}

export function LabelsPage(): JSX.Element {
  const { data: labels = [], isLoading } = useLabels();
  const createLabel = useCreateLabel();

  const [name, setName]           = useState("");
  const [color, setColor]         = useState(PRESET_COLORS[0]!);
  const [createError, setCreateError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateError("");
    try {
      await createLabel.mutateAsync({ name: name.trim(), color });
      setName("");
      setColor(PRESET_COLORS[0]!);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create label");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-lg">
      <h1 className="text-text-base font-semibold text-lg">Labels</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex flex-col gap-3 bg-surface-raised border border-surface-border rounded-xl p-4">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">New Label</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label name"
          className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Colour</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        {createError && <span className="text-xs text-red-500">{createError}</span>}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Preview:</span>
          {name.trim() && (
            <span className="text-xs text-white rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: color }}>
              {name.trim()}
            </span>
          )}
          <button
            type="submit"
            disabled={!name.trim() || createLabel.isPending}
            className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
          >
            {createLabel.isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>

      {/* Labels list */}
      {isLoading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-surface-border rounded-lg" />)}
        </div>
      ) : labels.length === 0 ? (
        <p className="text-sm text-text-muted">No labels yet. Create one above.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {labels.map((l) => <LabelRow key={l.id} label={l} />)}
        </ul>
      )}
    </div>
  );
}
