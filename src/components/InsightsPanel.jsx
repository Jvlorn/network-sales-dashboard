const TAG_META = {
  capacity_risk: { label: "Capacity risk", color: "var(--data-low)" },
  recruitment_opportunity: { label: "Opportunity", color: "var(--data-high)" },
  saturation: { label: "Saturation", color: "var(--data-medium)" },
  top_performer: { label: "Top performer", color: "var(--accent)" },
  worst_performer: { label: "Needs attention", color: "#B084F5" },
};

export default function InsightsPanel({ insights }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Business Insights</h2>
        <span className="eyebrow">{insights.length} flagged</span>
      </div>
      {insights.length === 0 ? (
        <div className="empty-state">No notable patterns for the current filters.</div>
      ) : (
        <div className="insights-list">
          {insights.map((ins, i) => {
            const meta = TAG_META[ins.type] || { label: ins.type, color: "var(--accent)" };
            return (
              <div className="insight-item" key={i} style={{ "--tag-color": meta.color }}>
                <span className="tag">{meta.label}</span>
                <span>{ins.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
