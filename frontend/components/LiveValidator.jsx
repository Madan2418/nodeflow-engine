import { useMemo } from "react";
import { parseInput, splitInput } from "../lib/clientParser";

export default function LiveValidator({ raw }) {
  const stats = useMemo(() => {
    if (!raw.trim()) return null;
    const items = splitInput(raw);
    if (items.length === 0) return null;
    const { validEdges, invalidEntries, duplicateEdges } = parseInput(items);
    return {
      total: items.length,
      valid: validEdges.length,
      invalid: invalidEntries.length,
      duplicates: duplicateEdges.length,
    };
  }, [raw]);

  if (!stats) return null;

  return (
    <div className="live-validator animate-fadeIn">
      <div className="lv-chip total">
        <span className="lv-count">{stats.total}</span>
        <span className="lv-label">Total</span>
      </div>
      <div className="lv-chip valid">
        <span className="lv-count">{stats.valid}</span>
        <span className="lv-label">Valid</span>
      </div>
      <div className="lv-chip invalid">
        <span className="lv-count">{stats.invalid}</span>
        <span className="lv-label">Invalid</span>
      </div>
      <div className="lv-chip dup">
        <span className="lv-count">{stats.duplicates}</span>
        <span className="lv-label">Duplicates</span>
      </div>
    </div>
  );
}
