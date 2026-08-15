import { normalizeCityName } from "./normalize";

export function filterReferrals(rows, filters) {
  return rows.filter((r) => {
    if (filters.municipality !== "ALL" && r.cityKey !== filters.municipality) return false;
    if (filters.store !== "ALL" && r.storeName !== filters.store) return false;
    if (filters.installStatus !== "ALL" && r.installStatus !== filters.installStatus) return false;
    if (filters.dateFrom && (!r.date || r.date < filters.dateFrom)) return false;
    if (filters.dateTo && (!r.date || r.date > filters.dateTo)) return false;
    return true;
  });
}

export function filterFacility(rows, filters) {
  return rows.filter((r) => {
    if (filters.municipality !== "ALL" && r.cityKey !== filters.municipality) return false;
    return true;
  });
}

// One row per unique store, for the store filter dropdown & map pins
export function getStores(referralRows) {
  const map = new Map();
  for (const r of referralRows) {
    if (!map.has(r.storeName)) {
      map.set(r.storeName, {
        storeName: r.storeName,
        lat: r.storeLat,
        long: r.storeLong,
        cityKey: r.cityKey,
        cityRaw: r.cityRaw,
        referralCount: 0,
      });
    }
    map.get(r.storeName).referralCount += 1;
  }
  return Array.from(map.values());
}

export function aggregateByCity(facilityRows, referralRows, cityLookup) {
  const byCity = new Map();

  function ensure(cityKey, cityRaw) {
    if (!byCity.has(cityKey)) {
      const lookupHit = cityLookup.get(cityKey);
      byCity.set(cityKey, {
        cityKey,
        displayName: lookupHit ? lookupHit.displayName : cityRaw || cityKey,
        feature: lookupHit ? lookupHit.feature : null,
        working: 0,
        vacant: 0,
        total: 0,
        utilWeightedSum: 0, // sum(util * total) for weighted average
        dpCount: 0,
        referrals: 0,
        installed: 0,
        uninstallable: 0,
        pending: 0,
        storeNames: new Set(),
      });
    }
    return byCity.get(cityKey);
  }

  for (const f of facilityRows) {
    if (!f.cityKey) continue;
    const c = ensure(f.cityKey, f.cityRaw);
    c.working += f.working;
    c.vacant += f.vacant;
    c.total += f.total;
    c.utilWeightedSum += f.utilPct * f.total;
    c.dpCount += 1;
  }

  for (const r of referralRows) {
    if (!r.cityKey) continue;
    const c = ensure(r.cityKey, r.cityRaw);
    c.referrals += 1;
    if (r.installStatus === "Installed") c.installed += 1;
    else if (r.installStatus === "Uninstallable") c.uninstallable += 1;
    else c.pending += 1;
    if (r.storeName) c.storeNames.add(r.storeName);
  }

  const result = Array.from(byCity.values()).map((c) => ({
    ...c,
    utilPct: c.total > 0 ? c.utilWeightedSum / c.total : 0,
    storeCount: c.storeNames.size,
  }));

  // Referral-level classification (high/medium/low/none) using fixed thresholds.
  // Change these two numbers to adjust what counts as Low/Medium/High —
  // unlike the old percentile approach, these are absolute referral counts
  // that mean the same thing regardless of which filters are active.
  const LOW_MAX = 20; // 0 < referrals <= LOW_MAX -> "low"
  const MEDIUM_MAX = 50; // LOW_MAX < referrals <= MEDIUM_MAX -> "medium"; above that -> "high"

  for (const c of result) {
    if (c.referrals === 0) c.referralLevel = "none";
    else if (c.referrals <= LOW_MAX) c.referralLevel = "low";
    else if (c.referrals <= MEDIUM_MAX) c.referralLevel = "medium";
    else c.referralLevel = "high";
  }

  return result;
}

export function computeKpis(facilityRows, referralRows) {
  const working = facilityRows.reduce((s, r) => s + r.working, 0);
  const vacant = facilityRows.reduce((s, r) => s + r.vacant, 0);
  const total = facilityRows.reduce((s, r) => s + r.total, 0);
  const utilWeightedSum = facilityRows.reduce((s, r) => s + r.utilPct * r.total, 0);
  const avgUtil = total > 0 ? utilWeightedSum / total : 0;

  const totalReferrals = referralRows.length;
  const installed = referralRows.filter((r) => r.installStatus === "Installed").length;
  const uninstallable = referralRows.filter((r) => r.installStatus === "Uninstallable").length;

  return {
    working,
    vacant,
    total,
    avgUtil,
    totalReferrals,
    installed,
    uninstallable,
  };
}

export { normalizeCityName };
