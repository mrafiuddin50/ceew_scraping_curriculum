/**
 * IMD daily collector for Google Sheets (Apps Script)
 * CEEW Scraping Field Course, Track B, lesson B3.
 *
 * What it does: once a day, collects today's observations for every IMD
 * station in one state and adds them as new rows to this Google Sheet.
 * Over weeks this builds the history that IMD's page doesn't keep.
 *
 * How to set it up (no installation; runs on Google's servers):
 *   1. Create a new Google Sheet. Extensions > Apps Script.
 *   2. Delete what's there, paste this whole file, and save.
 *   3. Change STATE below if needed (use IMD's own spelling).
 *   4. Choose testOnce in the function menu and press Run. Approve the
 *      permissions Google asks for. Check the sheet has new rows.
 *   5. Choose installDailyTrigger and press Run, once. It now runs daily.
 *   To stop it: run removeTriggers.
 *
 * Limits: Apps Script stops any run after about 6 minutes. With a 2-second
 * pause plus IMD's reply time, that is roughly 70-120 stations. This script
 * stops itself at 5 minutes, saves what it has, and records how many stations
 * it skipped. Use a state from the course's practice list or set STATION_IDS.
 *
 * Status: written and tested on 12 October 2026 against saved IMD replies,
 * not yet against the live site from Google's servers. testOnce will tell you
 * if IMD refuses the connection.
 */

const STATE = 'Delhi';            // IMD's spelling, e.g. 'Orissa', 'Uttrakhand', 'Ladakh UT'
const STATION_IDS = [];           // leave empty for all stations, or e.g. ['42182', '42181']
const PAUSE_MS = 2000;            // at least 1000; 2000 is the course default
const RUN_HOUR_IST = 11;
const TIME_BUDGET_MS = 5 * 60 * 1000;  // stop safely before Apps Script's 6-minute limit
const SAVE_EVERY = 20;                 // write rows in batches so a cut-off run keeps what it has          // hour of day for the daily run (IMD's morning update is usually in by then)

const BASE = 'https://city.imd.gov.in/citywx/responsive/api/';
const HEADERS = { 'Referer': 'https://city.imd.gov.in/citywx/responsive/' };
const OBS_SHEET = 'observations';
const FAIL_SHEET = 'no_record';
const OBS_COLUMNS = ['collected_at_ist', 'state', 'station_id', 'station', 'page_date', 'max_temp_c',
  'max_temp_date', 'max_departure_c', 'min_temp_c', 'min_departure_c', 'rainfall_mm',
  'rh_0830_pct', 'rh_1730_pct', 'imd_updated', 'lat', 'lon'];
const FAIL_COLUMNS = ['collected_at_ist', 'state', 'station_id', 'station', 'problem'];

// IMD's ways of saying "no data", and the physical limits for each kind of value.
const TEXT_PLACEHOLDERS = ['', 'NA', 'N/A', '-', '--', '()', '0000-00-00', '0000-00-00 00:00:00'];
const LIMITS = { temperature: [-60, 60], departure: [-30, 30], humidity: [0, 100], rainfall: [0, 1500] };

function asText(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return TEXT_PLACEHOLDERS.indexOf(s) >= 0 ? '' : s;
}

function asNumber(v, kind) {
  const s = asText(v);
  if (s === '') return '';
  const x = Number(s);
  if (!isFinite(x)) return '';
  const [low, high] = LIMITS[kind];
  return (x >= low && x <= high) ? x : '';
}

function asCoord(v, low, high) {
  const x = Number(asText(v));
  return (asText(v) !== '' && isFinite(x) && x !== 0 && x >= low && x <= high) ? x : '';
}

function nowIst() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm');
}

function sheet(name, columns) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sh = book.getSheetByName(name);
  if (!sh) {
    sh = book.insertSheet(name);
    sh.appendRow(columns);
    sh.setFrozenRows(1);
  }
  return sh;
}

function stationList() {
  const r = UrlFetchApp.fetch(BASE, { method: 'get', headers: HEADERS, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('IMD station list returned HTTP ' + r.getResponseCode());
  const data = JSON.parse(r.getContentText()).data || {};
  if (!data[STATE]) throw new Error("'" + STATE + "' is not in IMD's list. IMD spells states: " + Object.keys(data).join(', '));
  return data[STATE];
}

function fetchStation(id) {
  let r;
  try {
    r = UrlFetchApp.fetch(BASE + 'fetchCity_static.php',
      { method: 'post', payload: { ID: String(id) }, headers: HEADERS, muteHttpExceptions: true });
  } catch (e) {
    return { problem: 'Could not connect: ' + String(e.message || e).slice(0, 120) };
  }
  const code = r.getResponseCode();
  if (code === 429) return { problem: 'IMD said too many requests (429)', stop: true };
  if (code !== 200) return { problem: 'HTTP ' + code };
  let data;
  try { data = JSON.parse(r.getContentText()); } catch (e) { return { problem: 'Reply was not JSON' }; }
  if (Array.isArray(data) && data.length && data[0]) {
    if (String(data[0].station_id) !== String(id)) return { problem: 'Reply was for station ' + data[0].station_id };
    return { record: data[0] };
  }
  if (data && data.error) return { problem: 'IMD replied: ' + data.error + ' (status ' + data.status + ')' };
  return { problem: 'Unexpected reply format' };
}

function alreadyCollected(obsSheet) {
  // station_id + page_date pairs already in the sheet, so a rerun doesn't add duplicates.
  // Sheets turns "2026-10-12" into a date and "42182" into a number, so normalise both.
  const seen = {};
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const values = obsSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const d = values[i][4];
    const day = (Object.prototype.toString.call(d) === '[object Date]') ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : String(d);
    seen[String(values[i][2]).trim() + '|' + day] = true;
  }
  return seen;
}

function collectToday() {
  const obsSheet = sheet(OBS_SHEET, OBS_COLUMNS);
  const failSheet = sheet(FAIL_SHEET, FAIL_COLUMNS);
  const seen = alreadyCollected(obsSheet);
  const stamp = nowIst();
  let stations = stationList();
  if (STATION_IDS.length) {
    const pick = {};
    STATION_IDS.forEach(function (id) { if (stations[id]) pick[id] = stations[id]; });
    stations = pick;
  }
  let rows = [], fails = [], added = 0, noRecord = 0, skipped = 0;
  const flush = function () {
    if (rows.length) obsSheet.getRange(obsSheet.getLastRow() + 1, 1, rows.length, OBS_COLUMNS.length).setValues(rows);
    if (fails.length) failSheet.getRange(failSheet.getLastRow() + 1, 1, fails.length, FAIL_COLUMNS.length).setValues(fails);
    added += rows.length; noRecord += fails.length; rows = []; fails = [];
  };
  const startedAt = Date.now();
  let streak = 0;
  const ids = Object.keys(stations);
  for (let i = 0; i < ids.length; i++) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      skipped = ids.length - i;
      fails.push([stamp, STATE, '', '', 'Stopped at the time limit; ' + skipped + ' stations not collected this run']);
      break;
    }
    const id = ids[i], name = String(stations[id]).trim();
    const res = fetchStation(id);
    if (res.record) {
      streak = 0;
      const r = res.record;
      if (!seen[id + '|' + asText(r.dat)]) {
        rows.push([stamp, STATE, id, name, asText(r.dat), asNumber(r.max, 'temperature'), asText(r.max_date),
          asNumber(r.maxdep, 'departure'), asNumber(r.min, 'temperature'), asNumber(r.mindep, 'departure'),
          asNumber(r.rainfall, 'rainfall'), asNumber(r.rh0830, 'humidity'), asNumber(r.rh1730, 'humidity'),
          asText(r.updat), asCoord(r.lat, -90, 90), asCoord(r.lon, -180, 180)]);
      }
    } else {
      streak++;
      fails.push([stamp, STATE, id, name, res.problem]);
      if (res.stop || streak >= 5) { fails.push([stamp, STATE, '', '', 'Stopped early after repeated failures']); break; }
    }
    if (rows.length + fails.length >= SAVE_EVERY) flush();
    Utilities.sleep(Math.max(1000, PAUSE_MS));
  }
  flush();
  return { added: added, noRecord: noRecord, listed: ids.length, skipped: skipped };
}

function testOnce() {
  const out = collectToday();
  Logger.log('Stations listed: %s. Rows added: %s. No-record rows: %s. Skipped for time: %s.', out.listed, out.added, out.noRecord, out.skipped);
}

function installDailyTrigger() {
  removeTriggers();
  ScriptApp.newTrigger('collectToday').timeBased().everyDays(1).atHour(RUN_HOUR_IST).inTimezone('Asia/Kolkata').create();
  Logger.log('Daily run set for about %s:00 IST.', RUN_HOUR_IST);
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'collectToday') ScriptApp.deleteTrigger(t);
  });
}
