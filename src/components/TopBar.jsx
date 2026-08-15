export default function TopBar({ filters, setFilters, cityOptions, storeOptions }) {
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const reset = () =>
    setFilters({
      municipality: "ALL",
      store: "ALL",
      installStatus: "ALL",
      dateFrom: "",
      dateTo: "",
    });

  return (
    <header className="topbar">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Company logo" className="brand-mark" />
        <div className="brand-text">
          <h1>Globe Bulacan Network &amp; Sales Dashboard</h1>
          <p>Network capacity &amp; referral performance — read only</p>
        </div>
      </div>

      <div className="filters">
        <div className="filter-field">
          <label htmlFor="f-muni">Municipality</label>
          <select id="f-muni" value={filters.municipality} onChange={update("municipality")}>
            <option value="ALL">All municipalities</option>
            {cityOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-store">Store</label>
          <select id="f-store" value={filters.store} onChange={update("store")}>
            <option value="ALL">All stores</option>
            {storeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-status">Installation status</label>
          <select id="f-status" value={filters.installStatus} onChange={update("installStatus")}>
            <option value="ALL">All statuses</option>
            <option value="Installed">Installed</option>
            <option value="Uninstallable">Uninstallable</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-from">From</label>
          <input id="f-from" type="date" value={filters.dateFrom} onChange={update("dateFrom")} />
        </div>

        <div className="filter-field">
          <label htmlFor="f-to">To</label>
          <input id="f-to" type="date" value={filters.dateTo} onChange={update("dateTo")} />
        </div>

        <button className="reset-btn" onClick={reset}>
          Reset filters
        </button>
      </div>
    </header>
  );
}
