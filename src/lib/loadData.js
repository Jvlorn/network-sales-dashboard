import * as XLSX from "xlsx";
import { normalizeCityName, normalizeBrgyName } from "./normalize";

const BASE = import.meta.env.BASE_URL;

// ---------------------------------------------------------------------------
// To read facility or referral data from a Google Sheet instead of the local
// .xlsx files, paste your published CSV links below. Leave either one as an
// empty string to keep using that local file instead. See README.md, section
// "Using Google Sheets for data" for how to get these links.
// ---------------------------------------------------------------------------
const FACILITY_GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQt2v_6wWFZnt3O-OljlPv9ydZHXeaQuZSqUJdbxUpYICQyCl0ALFx5cEYUKfA9YA/pub?output=csv";
const REFERRALS_GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRN-1e-qwKZoJGn38nQIUJnSv393r7MLmXwXWazGVDxCtdYrUQf4kyZNNdsOohb3Q/pub?output=csv";

async function fetchWorkbook(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Could not load ${path} (${res.status}). Make sure the file exists in /public/data.`);
  }
  const buf = await res.arrayBuffer();
  return XLSX.read(buf, { type: "array", cellDates: true });
}

async function fetchCsvAsWorkbook(url) {
  // Cache-bust so browsers don't serve a stale copy of the sheet.
  const bustedUrl = url + (url.includes("?") ? "&" : "?") + "cachebust=" + Date.now();
  const res = await fetch(bustedUrl);
  if (!res.ok) {
    throw new Error(
      `Could not load the Google Sheet (${res.status}). Make sure it's published to the web as CSV — see README.md.`
    );
  }
  const csvText = await res.text();
  return XLSX.read(csvText, { type: "string" });
}

function firstSheetRows(wb) {
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

// --- Facility (DP-level) rows -> normalized shape ---
function parseFacilityRow(row) {
  const cityRaw = row["CITY_NAME"];
  const brgyRaw = row["BRGY_NAME"];
  const working = Number(row["WORKING"]) || 0;
  const vacant = Number(row["VACANT"]) || 0;
  const total = row["S_Total"] != null ? Number(row["S_Total"]) : working + vacant;
  const util = row["S_Util"] != null ? Number(row["S_Util"]) : (total > 0 ? working / total : 0);

  return {
    cityRaw,
    cityKey: normalizeCityName(cityRaw),
    brgyRaw,
    brgyKey: normalizeBrgyName(brgyRaw),
    cabinet: row["Cabinet"] ?? null,
    dp: row["DP"] ?? null,
    working,
    vacant,
    total,
    // S_Util in source data may be a fraction (0-1) or a percentage (0-100); normalize to 0-100.
    utilPct: util <= 1 ? util * 100 : util,
    sellStatus: row["SELL STATUS"] ?? null,
    cabLat: row["CAB LAT"] != null ? Number(row["CAB LAT"]) : null,
    cabLong: row["CAB LONG"] != null ? Number(row["CAB LONG"]) : null,
    dpLat: row["DP/NAP LAT"] != null ? Number(row["DP/NAP LAT"]) : null,
    dpLong: row["DP/NAP LONG"] != null ? Number(row["DP/NAP LONG"]) : null,
  };
}

// --- Referral (per-referral) rows -> normalized shape ---
function parseReferralRow(row) {
  const cityRaw = row["CITY_NAME"];
  const brgyRaw = row["BRGY_NAME"];
  let dateVal = row["REFERRAL_DATE"];
  let date = null;
  if (dateVal instanceof Date) {
    date = dateVal;
  } else if (typeof dateVal === "string" && dateVal.trim()) {
    const d = new Date(dateVal);
    if (!isNaN(d)) date = d;
  } else if (typeof dateVal === "number") {
    // Excel serial date fallback
    const parsed = XLSX.SSF.parse_date_code(dateVal);
    if (parsed) date = new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  return {
    storeName: row["STORE_NAME"] ?? "Unknown Store",
    storeLat: row["STORE_LAT"] != null ? Number(row["STORE_LAT"]) : null,
    storeLong: row["STORE_LONG"] != null ? Number(row["STORE_LONG"]) : null,
    cityRaw,
    cityKey: normalizeCityName(cityRaw),
    brgyRaw,
    brgyKey: normalizeBrgyName(brgyRaw),
    date,
    accountNumber: row["ACCOUNT_NUMBER"] != null ? String(row["ACCOUNT_NUMBER"]) : null,
    subscriberName: row["SUBSCRIBER_NAME"] ?? null,
    subscriberAddress: row["SUBSCRIBER_ADDRESS"] ?? null,
    // Normalize to one of: Installed / Uninstallable / Pending
    installStatus: normalizeStatus(row["INSTALL_STATUS"]),
  };
}

function normalizeStatus(raw) {
  if (!raw) return "Pending";
  const s = String(raw).trim().toLowerCase();
  if (s.startsWith("install")) return "Installed";
  if (s.startsWith("uninstall") || s.startsWith("fail") || s.startsWith("cancel")) return "Uninstallable";
  return "Pending";
}

export async function loadAllData() {
  const facilityFromSheet = FACILITY_GOOGLE_SHEET_CSV_URL.trim().length > 0;
  const referralsFromSheet = REFERRALS_GOOGLE_SHEET_CSV_URL.trim().length > 0;

  const [facilityWb, referralWb, geojson] = await Promise.all([
    facilityFromSheet ? fetchCsvAsWorkbook(FACILITY_GOOGLE_SHEET_CSV_URL.trim()) : fetchWorkbook(`${BASE}data/facility.xlsx`),
    referralsFromSheet ? fetchCsvAsWorkbook(REFERRALS_GOOGLE_SHEET_CSV_URL.trim()) : fetchWorkbook(`${BASE}data/referrals.xlsx`),
    fetch(`${BASE}data/bulacan_geo.json`).then((r) => r.json()),
  ]);

  const facilityRows = firstSheetRows(facilityWb).map(parseFacilityRow);
  const referralRows = firstSheetRows(referralWb).map(parseReferralRow);

  return { facilityRows, referralRows, geojson };
}
