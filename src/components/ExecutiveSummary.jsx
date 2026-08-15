export default function ExecutiveSummary({ summary }) {
  return (
    <section className="panel exec-summary">
      <div className="panel-header">
        <h2>Executive Summary</h2>
        <span className="eyebrow">Auto-generated</span>
      </div>
      <p>{summary}</p>
    </section>
  );
}
