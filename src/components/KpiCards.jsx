import SignalBars from "./SignalBars";

function fmt(n) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function KpiCards({ kpis }) {
  const cards = [
    { label: "Total Working Lines", value: fmt(kpis.working) },
    { label: "Total Vacant Lines", value: fmt(kpis.vacant) },
    { label: "Total Capacity", value: fmt(kpis.total) },
    {
      label: "Average Utilization",
      value: `${kpis.avgUtil.toFixed(1)}%`,
      signal: kpis.avgUtil,
    },
    { label: "Total Referrals", value: fmt(kpis.totalReferrals), cls: "accent" },
    { label: "Installed Applications", value: fmt(kpis.installed), cls: "good" },
    { label: "Uninstallable Applications", value: fmt(kpis.uninstallable), cls: "bad" },
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Key Metrics</h2>
      </div>
      <div className="kpi-grid">
        {cards.map((c) => (
          <div className="kpi-card" key={c.label}>
            <div className="kpi-label">{c.label}</div>
            <div className={`kpi-value ${c.cls || ""}`}>
              {c.value}
              {c.signal !== undefined && <SignalBars pct={c.signal} />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
