export default function SignalBars({ pct }) {
  const filledCount = Math.max(0, Math.min(5, Math.round((pct / 100) * 5)));
  let color = "var(--data-high)";
  if (pct >= 90) color = "var(--data-low)";
  else if (pct >= 75) color = "var(--data-medium)";

  return (
    <span className="signal-bars" style={{ "--bar-color": color }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`bar ${i < filledCount ? "filled" : ""}`} />
      ))}
    </span>
  );
}
