import { useState } from "react";
import TreeViz from "./TreeViz";

const TABS = [
  { id: "trees", label: "Trees" },
  { id: "cycles", label: "Cycles" },
  { id: "invalids", label: "Invalid" },
  { id: "dups", label: "Duplicates" },
  { id: "summary", label: "Summary" },
];

function countForTab(tabId, data) {
  if (tabId === "trees") return data.hierarchies?.filter((item) => !item.has_cycle).length ?? 0;
  if (tabId === "cycles") return data.hierarchies?.filter((item) => item.has_cycle).length ?? 0;
  if (tabId === "invalids") return data.invalid_entries?.length ?? 0;
  if (tabId === "dups") return data.duplicate_edges?.length ?? 0;
  return null;
}

export default function ResponseView({ data, elapsed, error, allEdges }) {
  const [activeTab, setActiveTab] = useState("trees");
  const [showJson, setShowJson] = useState(false);

  if (error) {
    return (
      <div className="error-alert animate-fadeInUp">
        <span className="err-icon">!</span>
        <div>
          <strong>Request failed</strong>
          <br />
          <span style={{ fontSize: 13, opacity: 0.85 }}>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const trees = data.hierarchies?.filter((item) => !item.has_cycle) ?? [];
  const cycles = data.hierarchies?.filter((item) => item.has_cycle) ?? [];
  const invalids = data.invalid_entries ?? [];
  const dups = data.duplicate_edges ?? [];
  const summary = data.summary ?? {};

  return (
    <div className="animate-fadeInUp">
      <div className="response-bar">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="response-badge success">200 OK</span>
          {elapsed != null && <span className="response-badge time">{elapsed} ms</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
            {data.user_id}
          </span>
          <button
            type="button"
            className={`json-toggle${showJson ? " active" : ""}`}
            onClick={() => setShowJson((value) => !value)}
          >
            {showJson ? "Hide JSON" : "View JSON"}
          </button>
        </div>
      </div>

      {showJson && <pre className="json-panel animate-fadeIn">{JSON.stringify(data, null, 2)}</pre>}

      <div className="tabs">
        {TABS.map((tab) => {
          const count = countForTab(tab.id, data);
          return (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              id={`tab-${tab.id}`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span className="tab-badge">
                  <span style={{ color: "#fff", fontSize: 11 }}>{count}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "trees" &&
        (trees.length === 0 ? (
          <Empty label="No valid trees" icon="T" />
        ) : (
          <div className="tree-grid">
            {trees.map((hierarchy, index) => (
              <TreeViz key={`${hierarchy.root}-${index}`} hierarchy={hierarchy} allEdges={allEdges || []} />
            ))}
          </div>
        ))}

      {activeTab === "cycles" &&
        (cycles.length === 0 ? (
          <Empty label="No cycles detected" icon="C" />
        ) : (
          <div className="tree-grid">
            {cycles.map((hierarchy, index) => (
              <TreeViz key={`${hierarchy.root}-${index}`} hierarchy={hierarchy} allEdges={allEdges || []} />
            ))}
          </div>
        ))}

      {activeTab === "invalids" &&
        (invalids.length === 0 ? (
          <Empty label="No invalid entries" icon="I" />
        ) : (
          <div className="tag-list animate-fadeIn">
            {invalids.map((entry, index) => (
              <span key={index} className="tag invalid">
                {String(entry) || '""'}
              </span>
            ))}
          </div>
        ))}

      {activeTab === "dups" &&
        (dups.length === 0 ? (
          <Empty label="No duplicate edges" icon="D" />
        ) : (
          <div className="tag-list animate-fadeIn">
            {dups.map((entry, index) => (
              <span key={index} className="tag dup">
                {entry}
              </span>
            ))}
          </div>
        ))}

      {activeTab === "summary" && (
        <div className="summary-grid animate-fadeIn">
          <SummaryItem value={summary.total_trees ?? 0} label="Valid Trees" />
          <SummaryItem value={summary.total_cycles ?? 0} label="Cycles" color="var(--red)" />
          <SummaryItem value={summary.largest_tree_root || "-"} label="Largest Tree Root" size="36px" />
        </div>
      )}
    </div>
  );
}

function SummaryItem({ value, label, color, size }) {
  return (
    <div className="summary-item animate-popIn">
      <span className="si-value" style={{ color: color || "var(--blue)", fontSize: size || undefined }}>
        {value}
      </span>
      <span className="si-label">{label}</span>
    </div>
  );
}

function Empty({ label, icon }) {
  return (
    <div className="empty-state animate-fadeIn">
      <div className="empty-icon">{icon}</div>
      <p>{label}</p>
    </div>
  );
}
