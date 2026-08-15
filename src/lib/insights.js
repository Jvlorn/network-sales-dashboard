function pct(n) {
  return `${n.toFixed(1)}%`;
}

export function generateExecutiveSummary(cityStats, kpis, scopeLabel) {
  if (kpis.totalReferrals === 0 && kpis.total === 0) {
    return "No data matches the current filters. Adjust the filters above to see a summary.";
  }

  const withReferrals = cityStats.filter((c) => c.referrals > 0);
  const topReferralCity = [...withReferrals].sort((a, b) => b.referrals - a.referrals)[0];

  const expansionCandidates = cityStats
    .filter((c) => c.total > 0 && c.utilPct < 60 && c.referrals <= 5)
    .sort((a, b) => a.utilPct - b.utilPct);
  const topCandidate = expansionCandidates[0];

  const installRate = kpis.totalReferrals > 0 ? (kpis.installed / kpis.totalReferrals) * 100 : 0;

  let summary = `${scopeLabel} recorded ${kpis.totalReferrals} referral${kpis.totalReferrals === 1 ? "" : "s"}`;
  if (kpis.totalReferrals > 0) {
    summary += ` with ${kpis.installed} successful installation${kpis.installed === 1 ? "" : "s"} (${pct(installRate)} install rate)`;
  }
  summary += ".";

  if (topReferralCity) {
    summary += ` ${topReferralCity.displayName} generated the highest referral volume with ${topReferralCity.referrals} referral${topReferralCity.referrals === 1 ? "" : "s"}.`;
  }

  if (topCandidate) {
    summary += ` ${topCandidate.displayName} has available capacity (${pct(topCandidate.utilPct)} utilized) but low referral activity, making it a strong candidate for partner store recruitment.`;
  }

  const nearSaturation = cityStats.filter((c) => c.total > 0 && c.utilPct >= 90);
  if (nearSaturation.length > 0) {
    const names = nearSaturation.slice(0, 3).map((c) => c.displayName).join(", ");
    summary += ` ${nearSaturation.length === 1 ? `${names} is` : `${names} are`} approaching network saturation and may need capacity expansion.`;
  }

  return summary;
}

export function generateBusinessInsights(cityStats) {
  const insights = [];

  const withCapacity = cityStats.filter((c) => c.total > 0);

  // High referrals with limited capacity
  withCapacity
    .filter((c) => (c.referralLevel === "high" || c.referralLevel === "medium") && c.utilPct >= 80)
    .sort((a, b) => b.utilPct - a.utilPct)
    .forEach((c) => {
      insights.push({
        type: "capacity_risk",
        city: c.displayName,
        message: `${c.displayName} has strong referral activity (${c.referrals} referrals) but is at ${pct(c.utilPct)} utilization — expansion or capacity upgrade recommended before referrals convert to lost sales.`,
      });
    });

  // High available capacity, low/no referral activity -> recruitment candidates
  withCapacity
    .filter((c) => c.utilPct < 60 && (c.referralLevel === "low" || c.referralLevel === "none"))
    .sort((a, b) => a.utilPct - b.utilPct)
    .slice(0, 5)
    .forEach((c) => {
      insights.push({
        type: "recruitment_opportunity",
        city: c.displayName,
        message: `${c.displayName} has ${pct(c.utilPct)} utilization (plenty of vacant lines) but only ${c.referrals} referral${c.referrals === 1 ? "" : "s"} recorded — a good candidate for additional partner store recruitment.`,
      });
    });

  // Approaching saturation
  withCapacity
    .filter((c) => c.utilPct >= 90)
    .sort((a, b) => b.utilPct - a.utilPct)
    .forEach((c) => {
      insights.push({
        type: "saturation",
        city: c.displayName,
        message: `${c.displayName} is approaching network saturation at ${pct(c.utilPct)} utilization (${c.vacant} vacant line${c.vacant === 1 ? "" : "s"} remaining).`,
      });
    });

  // Top performers
  [...cityStats]
    .filter((c) => c.referrals > 0)
    .sort((a, b) => b.referrals - a.referrals)
    .slice(0, 3)
    .forEach((c, i) => {
      insights.push({
        type: "top_performer",
        city: c.displayName,
        message: `#${i + 1} performer: ${c.displayName} with ${c.referrals} referrals and ${c.installed} installations.`,
      });
    });

  // Worst performers — municipalities that already have network coverage
  // (so recruiting a store there is actionable) but the least referral activity.
  [...cityStats]
    .filter((c) => c.total > 0)
    .sort((a, b) => a.referrals - b.referrals)
    .slice(0, 3)
    .forEach((c, i) => {
      insights.push({
        type: "worst_performer",
        city: c.displayName,
        message: `Lowest referral activity: ${c.displayName} with only ${c.referrals} referral${c.referrals === 1 ? "" : "s"} recorded despite ${c.total} lines of available capacity.`,
      });
    });

  return insights;
}
