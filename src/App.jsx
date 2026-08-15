import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { loadAllData } from "./lib/loadData";
import { buildCityLookup } from "./lib/normalize";
import { aggregateByCity, computeKpis, filterFacility, filterReferrals, getStores } from "./lib/aggregate";
import { generateExecutiveSummary, generateBusinessInsights } from "./lib/insights";

import TopBar from "./components/TopBar";
import ExecutiveSummary from "./components/ExecutiveSummary";
import KpiCards from "./components/KpiCards";
import MapView from "./components/MapView";
import ChartsGrid from "./components/ChartsGrid";
import InsightsPanel from "./components/InsightsPanel";

const DEFAULT_FILTERS = {
  municipality: "ALL",
  store: "ALL",
  installStatus: "ALL",
  dateFrom: "",
  dateTo: "",
};

export default function App() {
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    loadAllData()
      .then(setRaw)
      .catch((err) => setError(err.message || String(err)));
  }, []);

  const cityLookup = useMemo(() => (raw ? buildCityLookup(raw.geojson) : new Map()), [raw]);

  const activeFilters = useMemo(
    () => ({
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : null,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : null,
    }),
    [filters]
  );

  const filteredFacility = useMemo(
    () => (raw ? filterFacility(raw.facilityRows, activeFilters) : []),
    [raw, activeFilters]
  );
  const filteredReferrals = useMemo(
    () => (raw ? filterReferrals(raw.referralRows, activeFilters) : []),
    [raw, activeFilters]
  );

  const cityStats = useMemo(
    () => (raw ? aggregateByCity(filteredFacility, filteredReferrals, cityLookup) : []),
    [raw, filteredFacility, filteredReferrals, cityLookup]
  );

  const kpis = useMemo(() => computeKpis(filteredFacility, filteredReferrals), [filteredFacility, filteredReferrals]);

  const stores = useMemo(() => (raw ? getStores(raw.referralRows) : []), [raw]);

  const cityOptions = useMemo(() => {
    if (!raw) return [];
    const seen = new Map();
    for (const [key, val] of cityLookup.entries()) seen.set(key, val.displayName);
    return Array.from(seen.entries())
      .map(([key, displayName]) => ({ key, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [raw, cityLookup]);

  const storeOptions = useMemo(() => {
    const names = new Set((raw ? raw.referralRows : []).map((r) => r.storeName));
    return Array.from(names).sort();
  }, [raw]);

  const scopeLabel =
    filters.municipality === "ALL"
      ? "Bulacan"
      : cityOptions.find((c) => c.key === filters.municipality)?.displayName || "Selected municipality";

  const summary = useMemo(
    () => (raw ? generateExecutiveSummary(cityStats, kpis, scopeLabel) : "Loading data…"),
    [raw, cityStats, kpis, scopeLabel]
  );

  const insights = useMemo(() => (raw ? generateBusinessInsights(cityStats) : []), [raw, cityStats]);

  if (error) {
    return (
      <div className="app">
        <div className="error-state">
          Failed to load dashboard data: {error}
          <br />
          Check that facility.xlsx, referrals.xlsx and bulacan_geo.json are present in /public/data.
        </div>
      </div>
    );
  }

  if (!raw) {
    return (
      <div className="app">
        <div className="loading-state">Loading network and referral data…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar filters={filters} setFilters={setFilters} cityOptions={cityOptions} storeOptions={storeOptions} />
      <div className="main-grid">
        <div className="col">
          <MapView geojson={raw.geojson} cityStats={cityStats} facilityRows={filteredFacility} stores={stores} filters={filters} />
          <ChartsGrid cityStats={cityStats} />
        </div>
        <div className="col">
          <ExecutiveSummary summary={summary} />
          <KpiCards kpis={kpis} />
          <InsightsPanel insights={insights} />
        </div>
      </div>
    </div>
  );
}
