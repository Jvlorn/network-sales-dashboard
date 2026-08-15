// Normalizes municipality/city names so values coming from Excel (e.g. "MALOLOS CITY",
// "CITY OF MALOLOS", "malolos") reliably match the GeoJSON's adm3_en values
// (e.g. "City of Malolos").
export function normalizeCityName(raw) {
  if (!raw) return "";
  let s = String(raw).trim().toUpperCase();
  s = s.replace(/^CITY OF\s+/i, "");
  s = s.replace(/\s+CITY$/i, "");
  s = s.replace(/[.]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function normalizeBrgyName(raw) {
  if (!raw) return "";
  let s = String(raw).trim().toUpperCase();
  s = s.replace(/[.]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// Builds a lookup from normalized city name -> geojson feature properties (incl. adm3_en)
export function buildCityLookup(geojson) {
  const lookup = new Map();
  for (const feature of geojson.features) {
    const displayName = feature.properties.adm3_en;
    const key = normalizeCityName(displayName);
    lookup.set(key, { displayName, feature });
  }
  return lookup;
}
