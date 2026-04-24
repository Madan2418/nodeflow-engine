import { useState, useCallback } from "react";
import { splitInput } from "../lib/clientParser";

const SAMPLE = `A->B, A->C, B->D, C->E, E->F,
X->Y, Y->Z, Z->X,
P->Q, Q->R,
G->H, G->H, G->I,
hello, 1->2, A->`;

export default function InputPanel({ onSubmit, onChange, loading }) {
  const [raw, setRaw] = useState("");

  const update = (val) => { setRaw(val); onChange?.(val); };
  const handleLoad = () => update(SAMPLE);
  const handleClear = () => update("");

  const handleSubmit = useCallback(() => {
    const items = splitInput(raw);
    if (items.length > 0) onSubmit(items, raw);
  }, [raw, onSubmit]);

  const handleKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const entryCount = splitInput(raw).length;

  return (
    <div className="input-panel">
      <textarea
        id="node-input"
        value={raw}
        onChange={(e) => update(e.target.value)}
        onKeyDown={handleKey}
        placeholder={`Enter node edges separated by commas or newlines:\nA->B, A->C, B->D\n\nOr paste a JSON array:\n["A->B","A->C","B->D"]`}
        spellCheck={false}
        aria-label="Node edge input"
      />
      <div className="input-actions">
        <span className="input-meta">
          {entryCount > 0 ? `${entryCount} entr${entryCount === 1 ? "y" : "ies"} · Ctrl+Enter to submit` : "Enter node edges above"}
        </span>
        <div className="input-buttons">
          <button className="btn btn-ghost" onClick={handleClear} disabled={!raw}>
            Clear
          </button>
          <button className="btn btn-sample" onClick={handleLoad}>
            Load sample
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || entryCount === 0}
            id="submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analysing…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Analyse
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
