/**
 * Tandem → Google Sheets
 * Dve karty: „Kable“ a „Moduly“
 * action: setup | upsert
 */

var SPREADSHEET_ID = "1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk";

var SHEET_KABEL = "Kable";
var SHEET_MODUL = "Moduly";

var HEADERS_KABEL = [
  "ID",
  "Názov plánu",
  "Názov",
  "Dostupnosť",
  "Natiahnutý",
  "Tenant",
  "Abutisant",
  "Poznámky",
  "Pozícia X %",
  "Pozícia Y %",
  "Aktualizované",
];

var HEADERS_MODUL = [
  "ID",
  "Názov plánu",
  "Názov",
  "Dostupnosť",
  "Osadený",
  "Poznámky",
  "Pozícia X %",
  "Pozícia Y %",
  "Aktualizované",
];

function doPost(e) {
  return handleRequest_(parseBody_(e));
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  return handleRequest_(p);
}

/** Spustite raz v editore Apps Script — vytvorí karty Kable a Moduly */
function setupTandemSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  setupAllSheets_(ss);
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function handleRequest_(data) {
  try {
    var action = String(data.action || "upsert").toLowerCase();
    var ss = getSpreadsheet_(data);

    if (action === "setup") {
      setupAllSheets_(ss);
      return jsonResponse_({
        ok: true,
        sheets: [SHEET_KABEL, SHEET_MODUL],
        message: "Karty Kable a Moduly sú pripravené.",
      });
    }

    var type = String(data.type || "").toLowerCase();
    var isModul = type === "modul";
    var sheetName = isModul ? SHEET_MODUL : SHEET_KABEL;
    var headers = isModul ? HEADERS_MODUL : HEADERS_KABEL;

    var sheet = getOrCreateSheet_(ss, sheetName, headers);
    var row = buildRow_(data, isModul);
    var markerId = String(data.markerId || "").trim();

    if (!markerId) {
      return jsonResponse_({ ok: false, error: "Chýba markerId" });
    }

    var rowIndex = findRowByMarkerId_(sheet, markerId);
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return jsonResponse_({
      ok: true,
      sheet: sheetName,
      markerId: markerId,
      updated: rowIndex > 0,
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function setupAllSheets_(ss) {
  getOrCreateSheet_(ss, SHEET_KABEL, HEADERS_KABEL);
  getOrCreateSheet_(ss, SHEET_MODUL, HEADERS_MODUL);
}

function buildRow_(data, isModul) {
  var now = new Date();
  var common = [
    String(data.markerId || ""),
    String(data.planName || ""),
    String(data.label || data.name || ""),
    yesNo_(data.available),
    String(data.notes || ""),
    numOrEmpty_(data.posX),
    numOrEmpty_(data.posY),
    now,
  ];

  if (isModul) {
    return [
      common[0],
      common[1],
      common[2],
      common[3],
      yesNo_(data.osadeny),
      common[4],
      common[5],
      common[6],
      common[7],
    ];
  }

  return [
    common[0],
    common[1],
    common[2],
    common[3],
    yesNo_(data.natiahnuty),
    yesNo_(data.tenant),
    yesNo_(data.abutisant),
    common[4],
    common[5],
    common[6],
    common[7],
  ];
}

function yesNo_(val) {
  if (val === true || val === 1 || val === "1" || String(val).toLowerCase() === "áno") {
    return "Áno";
  }
  return "Nie";
}

function numOrEmpty_(val) {
  if (val === "" || val === null || val === undefined) return "";
  var n = parseFloat(val);
  return isNaN(n) ? "" : n;
}

function findRowByMarkerId_(sheet, markerId) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var data = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === markerId) {
      return i + 2;
    }
  }
  return -1;
}

function getSpreadsheet_(data) {
  var id = String((data && data.spreadsheetId) || SPREADSHEET_ID || "").trim();
  if (!id) {
    throw new Error("Chýba spreadsheetId");
  }
  return SpreadsheetApp.openById(id);
}

function getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  ensureHeaders_(sheet, headers);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  var width = headers.length;
  var range = sheet.getRange(1, 1, 1, width);
  var current = range.getValues()[0];
  var needsUpdate = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || "") !== headers[i]) {
      needsUpdate = true;
      break;
    }
  }
  if (needsUpdate) {
    range.setValues([headers]);
    range.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
