import { useEffect, useRef, useState } from "react";
import { useLabels } from "@/hooks/useLabels";
import type { Label } from "@flowdocs/shared";

interface Props {
  selected: Label[];
  onChange: (labels: Label[]) => void;
}

export function LabelFilter({ selected, onChange }: Props): JSX.Element {
  const { data: allLabels = [] } = useLabels();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(label: Label) {
    if (selected.some((s) => s.id === label.id)) {
      onChange(selected.filter((s) => s.id !== label.id));
    } else {
      onChange([...selected, label]);
    }
  }

  const placeholder = selected.length === 0
    ? "All labels"
    : selected.length === 1
    ? selected[0]!.name
    : `${selected.length} labels`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-raised text-xs text-text-base hover:border-accent-primary/50 transition-colors min-w-[120px]"
      >
        {selected.length > 0 && (
          <span className="flex gap-0.5">
            {selected.slice(0, 3).map((l) => (
              <span key={l.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
            ))}
          </span>
        )}
        <span className="flex-1 text-left truncate">{placeholder}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 top-full left-0 mt-1 w-48 bg-surface-raised border border-surface-border rounded-lg shadow-lg overflow-hidden">
          {allLabels.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">No labels</div>
          )}
          {allLabels.map((label) => {
            const checked = selected.some((s) => s.id === label.id);
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => toggle(label)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-base hover:bg-accent-muted transition-colors"
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                <span className="flex-1 text-left truncate">{label.name}</span>
                {checked && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
          {selected.length > 0 && (
            <>
              <hr className="border-surface-border" />
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false); }}
                className="w-full px-3 py-2 text-xs text-text-muted hover:text-text-base hover:bg-surface-base transition-colors text-left"
              >
                Clear filter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
