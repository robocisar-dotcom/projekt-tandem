/**
 * Tandem → Google Sheets
 * Karty: Kable, Moduly
 * Riadok sa hľadá podľa markerId (stĺpec ID na konci, môže byť skrytý).
 */

var SPREADSHEET_ID = "1K5OpFtFQijyR0A9sfa3dIDhmxkhUVdsGcwCkuYh3nBk";

var SHEET_KABEL = "Kable";
var SHEET_MODUL = "Moduly";

var HEADERS_KABEL = [
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
  "ID",
];

var HEADERS_MODUL = [
  "Názov plánu",
  "Názov",
  "Dostupnosť",
  "Osadený",
  "Poznámky",
  "Pozícia X %",
  "Pozícia Y %",
  "Aktualizované",
  "ID",
];

function doPost(e) {
  return handleRequest_(parseBody_(e));
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  return handleRequest_(p);
}

/** Spustite raz v editore — vytvorí karty Kable a Moduly */
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

    var markerId = String(data.markerId || "").trim();
    if (!markerId) {
      return jsonResponse_({ ok: false, error: "Chýba markerId" });
    }

    var type = String(data.type || "").toLowerCase();
    var isModul = type === "modul";
    var sheetName = isModul ? SHEET_MODUL : SHEET_KABEL;
    var headers = isModul ? HEADERS_MODUL : HEADERS_KABEL;

    var sheet = getOrCreateSheet_(ss, sheetName, headers);
    var rowIndex = findRowByMarkerId_(sheet, markerId, headers.length);

    if (action === "delete") {
      if (rowIndex > 0) {
        sheet.deleteRow(rowIndex);
      }
      return jsonResponse_({
        ok: true,
        sheet: sheetName,
        markerId: markerId,
        deleted: rowIndex > 0,
      });
    }

    var row = buildRow_(data, isModul);

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return jsonResponse_({
      ok: true,
      sheet: sheetName,
      markerId: markerId,
      label: String(data.label || data.name || ""),
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
  var label = String(data.label || data.name || "").trim();
  if (!label) {
    label = isModul ? "Modul" : "Kábel";
  }
  var markerId = String(data.markerId || "");
  var tail = [
    String(data.notes || ""),
    numOrEmpty_(data.posX),
    numOrEmpty_(data.posY),
    now,
    markerId,
  ];

  if (isModul) {
    return [
      String(data.planName || ""),
      label,
      yesNo_(data.available),
      yesNo_(data.osadeny),
    ].concat(tail);
  }

  return [
    String(data.planName || ""),
    label,
    yesNo_(data.available),
    yesNo_(data.natiahnuty),
    yesNo_(data.tenant),
    yesNo_(data.abutisant),
  ].concat(tail);
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

function findRowByMarkerId_(sheet, markerId, idColIndex) {
  var search = String(markerId || "").trim();
  if (!search) return -1;
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var col = idColIndex || sheet.getLastColumn();
  var data = sheet.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === search) {
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
  try {
    sheet.hideColumns(headers.length);
  } catch (e) {
    /* stĺpec ID už môže byť skrytý */
  }
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
