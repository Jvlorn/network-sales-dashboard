import { useMemo, useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { normalizeCityName } from "../lib/normalize";
import "leaflet/dist/leaflet.css";

const LEVEL_COLOR = {
  high: "#34D399",
  medium: "#F5A524",
  low: "#F5484B",
  none: "#3B4A63",
};

function cityStyle(feature, cityStatsByKey) {
  const key = normalizeCityName(feature.properties.adm3_en);
  const stats = cityStatsByKey.get(key);
  const level = stats ? stats.referralLevel : "none";
  return {
    fillColor: LEVEL_COLOR[level],
    fillOpacity: 0.45,
    color: "#0A0F1C",
    weight: 1.2,
  };
}

// Fits the map to Bulacan's boundaries once on load, then locks that as the
// furthest-out zoom level allowed — so the user can never zoom out past
// seeing the whole province.
function LockToBulacan({ geojson }) {
  const map = useMap();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current || !geojson) return;
    const bounds = L.geoJSON(geojson).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [12, 12] });
      map.setMinZoom(map.getZoom());
    }
    didRun.current = true;
  }, [geojson, map]);

  return null;
}

export default function MapView({ geojson, cityStats, facilityRows, stores, filters }) {
  const [layers, setLayers] = useState({
    boundaries: true,
    cabinets: false,
    dps: false,
    stores: true,
  });
  const geoJsonRef = useRef(null);

  const cityStatsByKey = useMemo(() => {
    const m = new Map();
    for (const c of cityStats) m.set(c.cityKey, c);
    return m;
  }, [cityStats]);

  const cabinetPoints = useMemo(() => {
    const seen = new Map();
    for (const f of facilityRows) {
      if (f.cabLat == null || f.cabLong == null || !f.cabinet) continue;
      if (!seen.has(f.cabinet)) {
        seen.set(f.cabinet, { id: f.cabinet, lat: f.cabLat, long: f.cabLong, cityRaw: f.cityRaw });
      }
    }
    return Array.from(seen.values());
  }, [facilityRows]);

  const dpPoints = useMemo(() => {
    return facilityRows
      .filter((f) => f.dpLat != null && f.dpLong != null && f.dp)
      .map((f) => ({ id: f.dp, lat: f.dpLat, long: f.dpLong, cityRaw: f.cityRaw, working: f.working, vacant: f.vacant }));
  }, [facilityRows]);

  const filteredStores = useMemo(() => {
    if (filters.municipality === "ALL") return stores;
    return stores.filter((s) => s.cityKey === filters.municipality);
  }, [stores, filters.municipality]);

  function onEachFeature(feature, layer) {
    const key = normalizeCityName(feature.properties.adm3_en);
    const stats = cityStatsByKey.get(key);
    const html = renderPopupHtml(feature.properties.adm3_en, stats);
    // autoPan: false — clicking a municipality should never shift/recenter the
    // map, so the user doesn't lose their place while exploring pins.
    layer.bindPopup(html, { autoPan: false });
  }

  function renderPopupHtml(name, stats) {
    if (!stats) {
      return `<div class="muni-popup"><h3>${name}</h3><div class="row">No data available</div></div>`;
    }
    return `
      <div class="muni-popup">
        <h3>${name}</h3>
        <div class="row"><span>Referrals</span><b>${stats.referrals}</b></div>
        <div class="row"><span>Installed</span><b>${stats.installed}</b></div>
        <div class="row"><span>Uninstallable</span><b>${stats.uninstallable}</b></div>
        <div class="row"><span>Working lines</span><b>${stats.working}</b></div>
        <div class="row"><span>Vacant lines</span><b>${stats.vacant}</b></div>
        <div class="row"><span>Total capacity</span><b>${stats.total}</b></div>
        <div class="row"><span>Utilization</span><b>${stats.utilPct.toFixed(1)}%</b></div>
      </div>
    `;
  }

  const bulacanCenter = [14.94, 120.9];

  return (
    <div className="map-panel panel">
      <div className="panel-header">
        <h2>Network &amp; Referral Map</h2>
        <span className="eyebrow">Bulacan</span>
      </div>
      <div className="map-container">
        <MapContainer center={bulacanCenter} zoom={10} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <LockToBulacan geojson={geojson} />

          {layers.boundaries && (
            <GeoJSON
              ref={geoJsonRef}
              data={geojson}
              style={(feature) => cityStyle(feature, cityStatsByKey)}
              onEachFeature={onEachFeature}
            />
          )}

          {layers.cabinets &&
            cabinetPoints.map((p) => (
              <CircleMarker key={`cab-${p.id}`} center={[p.lat, p.long]} radius={4} pathOptions={{ color: "#35A7FF", fillColor: "#35A7FF", fillOpacity: 0.9, weight: 1 }}>
                <Popup autoPan={false}>
                  <div className="muni-popup">
                    <h3>Cabinet {p.id}</h3>
                    <div className="row"><span>Municipality</span><b>{p.cityRaw}</b></div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {layers.dps &&
            dpPoints.map((p, i) => (
              <CircleMarker key={`dp-${i}`} center={[p.lat, p.long]} radius={3} pathOptions={{ color: "#B084F5", fillColor: "#B084F5", fillOpacity: 0.85, weight: 1 }}>
                <Popup autoPan={false}>
                  <div className="muni-popup">
                    <h3>DP {p.id}</h3>
                    <div className="row"><span>Municipality</span><b>{p.cityRaw}</b></div>
                    <div className="row"><span>Working</span><b>{p.working}</b></div>
                    <div className="row"><span>Vacant</span><b>{p.vacant}</b></div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {layers.stores &&
            filteredStores.map((s) =>
              s.lat != null && s.long != null ? (
                <CircleMarker key={s.storeName} center={[s.lat, s.long]} radius={6} pathOptions={{ color: "#F5A524", fillColor: "#F5A524", fillOpacity: 0.9, weight: 1.5 }}>
                  <Popup autoPan={false}>
                    <div className="muni-popup">
                      <h3>{s.storeName}</h3>
                      <div className="row"><span>Referrals</span><b>{s.referralCount}</b></div>
                      <div className="row"><span>Municipality</span><b>{s.cityRaw}</b></div>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null
            )}
        </MapContainer>

        <div className="map-legend">
          <div className="legend-row"><span className="swatch" style={{ background: LEVEL_COLOR.high }} /> High referrals</div>
          <div className="legend-row"><span className="swatch" style={{ background: LEVEL_COLOR.medium }} /> Medium referrals</div>
          <div className="legend-row"><span className="swatch" style={{ background: LEVEL_COLOR.low }} /> Low referrals</div>
          <div className="legend-row"><span className="swatch" style={{ background: LEVEL_COLOR.none }} /> No referral data</div>
        </div>

        <div className="layer-toggles">
          <label>
            <input type="checkbox" checked={layers.boundaries} onChange={(e) => setLayers((l) => ({ ...l, boundaries: e.target.checked }))} />
            Municipality boundaries
          </label>
          <label>
            <input type="checkbox" checked={layers.cabinets} onChange={(e) => setLayers((l) => ({ ...l, cabinets: e.target.checked }))} />
            Cabinet locations
          </label>
          <label>
            <input type="checkbox" checked={layers.dps} onChange={(e) => setLayers((l) => ({ ...l, dps: e.target.checked }))} />
            DP / NAP locations
          </label>
          <label>
            <input type="checkbox" checked={layers.stores} onChange={(e) => setLayers((l) => ({ ...l, stores: e.target.checked }))} />
            Partner stores
          </label>
        </div>
      </div>
    </div>
  );
}
