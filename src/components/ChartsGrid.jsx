import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const COLORS = {
  accent: "#35A7FF",
  high: "#34D399",
  medium: "#F5A524",
  low: "#F5484B",
  purple: "#B084F5",
  grid: "#223049",
  text: "#8FA1BF",
};

const tooltipStyle = {
  background: "#101828",
  border: "1px solid #223049",
  borderRadius: 8,
  fontSize: 12,
  color: "#EAF0FA",
};

function ChartCard({ title, children, height = 260 }) {
  return (
    <div className="panel chart-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export default function ChartsGrid({ cityStats }) {
  const withCapacity = cityStats.filter((c) => c.total > 0 || c.referrals > 0);

  const byReferrals = [...withCapacity].sort((a, b) => b.referrals - a.referrals);
  const topReferrals = byReferrals.slice(0, 12);

  const byUtil = [...withCapacity].filter((c) => c.total > 0).sort((a, b) => b.utilPct - a.utilPct).slice(0, 10);

  const topPerformers = byReferrals.slice(0, 8);

  const totalInstalled = cityStats.reduce((s, c) => s + c.installed, 0);
  const totalUninstallable = cityStats.reduce((s, c) => s + c.uninstallable, 0);
  const totalPending = cityStats.reduce((s, c) => s + c.pending, 0);
  const installPieData = [
    { name: "Installed", value: totalInstalled, color: COLORS.high },
    { name: "Uninstallable", value: totalUninstallable, color: COLORS.low },
    { name: "Pending", value: totalPending, color: COLORS.medium },
  ].filter((d) => d.value > 0);

  const linesData = [...withCapacity]
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map((c) => ({ name: shortName(c.displayName), working: c.working, vacant: c.vacant }));

  const scatterData = withCapacity
    .filter((c) => c.total > 0)
    .map((c) => ({ name: c.displayName, vacant: c.vacant, referrals: c.referrals, total: c.total }));

  return (
    <div className="charts-grid">
      <ChartCard title="Referral volume by municipality">
        <BarChart data={topReferrals.map((c) => ({ name: shortName(c.displayName), referrals: c.referrals }))}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 10 }} angle={-35} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fill: COLORS.text, fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="referrals" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Installed vs. uninstallable applications">
        <PieChart>
          <Pie data={installPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {installPieData.map((d, i) => (
              <Cell key={i} fill={d.color} stroke="#0A0F1C" />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: COLORS.text }} />
        </PieChart>
      </ChartCard>

      <ChartCard title="Working vs. vacant lines">
        <BarChart data={linesData}>
          <CartesianGrid stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 10 }} angle={-35} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fill: COLORS.text, fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: COLORS.text }} />
          <Bar dataKey="working" stackId="a" fill={COLORS.accent} name="Working" />
          <Bar dataKey="vacant" stackId="a" fill={COLORS.grid} name="Vacant" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Highest utilization municipalities">
        <BarChart data={byUtil.map((c) => ({ name: shortName(c.displayName), util: Number(c.utilPct.toFixed(1)) }))} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid stroke={COLORS.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: COLORS.text, fontSize: 11 }} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fill: COLORS.text, fontSize: 10.5 }} width={110} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="util" fill={COLORS.medium} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Referral volume vs. available capacity">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke={COLORS.grid} />
          <XAxis type="number" dataKey="vacant" name="Vacant lines" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <YAxis type="number" dataKey="referrals" name="Referrals" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <ZAxis type="number" dataKey="total" range={[40, 200]} name="Capacity" />
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [v, n]} labelFormatter={() => ""} />
          <Scatter data={scatterData} fill={COLORS.purple} fillOpacity={0.75} />
        </ScatterChart>
      </ChartCard>

      <ChartCard title="Top performing municipalities">
        <BarChart data={topPerformers.map((c) => ({ name: shortName(c.displayName), referrals: c.referrals, installed: c.installed }))} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid stroke={COLORS.grid} horizontal={false} />
          <XAxis type="number" tick={{ fill: COLORS.text, fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fill: COLORS.text, fontSize: 10.5 }} width={110} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, color: COLORS.text }} />
          <Bar dataKey="referrals" fill={COLORS.accent} name="Referrals" radius={[0, 4, 4, 0]} />
          <Bar dataKey="installed" fill={COLORS.high} name="Installed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function shortName(name) {
  return name.replace("City of ", "").replace("Doña Remedios Trinidad", "DRT");
}
