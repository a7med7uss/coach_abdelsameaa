/**
 * تخزين مركزي لتسجيلات مسابقة بيس VX باستخدام Google Sheets.
 *
 * خطوات التشغيل:
 * 1) افتح https://script.google.com وأنشئ مشروعًا جديدًا.
 * 2) الصق هذا الملف في Code.gs.
 * 3) شغّل setupSheet مرة واحدة ووافق على صلاحيات Google المطلوبة.
 * 4) من Deploy > New deployment > Web app:
 *    Execute as: Me
 *    Who has access: Anyone
 * 5) انسخ رابط Web app الذي ينتهي بـ /exec إلى registrationEndpoint داخل config.js.
 *
 * ملاحظة: لا تضع رموز سرية أو صلاحيات Google داخل كود الواجهة.
 */

const SHEET_TITLE = "مسابقة بيس VX - التسجيلات";
const SHEET_PROPERTY = "VX_REGISTRATION_SHEET_ID";
const HEADERS = ["رقم التسجيل", "الاسم الثلاثي", "رقم الهاتف", "وقت التسجيل", "الحالة"];

function setupSheet() {
  const sheet = ensureSheet_();
  Logger.log("رابط ملف التسجيلات: " + sheet.getParent().getUrl());
  return sheet.getParent().getUrl();
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "مسابقة بيس VX", message: "خدمة التسجيل جاهزة." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) return json_({ ok: false, message: "لا توجد بيانات." });

    const data = JSON.parse(raw);
    const fullName = String(data.fullName || "").trim().replace(/\s+/g, " ");
    const phone = normalizePhone_(data.phone || "");

    if (fullName.split(/\s+/).filter(Boolean).length < 3) {
      return json_({ ok: false, message: "الاسم الثلاثي مطلوب." });
    }
    if (!isEgyptianPhone_(phone)) {
      return json_({ ok: false, message: "رقم الهاتف غير صحيح." });
    }

    lock.waitLock(10000);
    const sheet = ensureSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const phones = sheet.getRange(2, 3, lastRow - 1, 1).getDisplayValues().flat();
      if (phones.some(existing => normalizePhone_(existing) === phone)) {
        return json_({ ok: false, duplicate: true, message: "رقم الهاتف مسجل بالفعل." });
      }
    }

    const now = new Date();
    const id = "VX-" + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random() * 900);
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([[id, fullName, phone, now, "قيد المراجعة"]]);
    sheet.getRange(row, 3).setNumberFormat("@");
    sheet.getRange(row, 4).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    return json_({ ok: true, id: id, message: "تم تسجيل البيانات." });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, message: "تعذر حفظ التسجيل." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function ensureSheet_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(SHEET_PROPERTY);
  let spreadsheet;
  if (existingId) {
    try {
      spreadsheet = SpreadsheetApp.openById(existingId);
    } catch (err) {
      properties.deleteProperty(SHEET_PROPERTY);
    }
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(SHEET_TITLE);
    properties.setProperty(SHEET_PROPERTY, spreadsheet.getId());
  }
  let sheet = spreadsheet.getSheetByName("التسجيلات");
  if (!sheet) sheet = spreadsheet.getSheets()[0].setName("التسجيلات");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground("#13271b")
      .setFontColor("#c5ff4a")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheet.setColumnWidth(1, 190);
    sheet.setColumnWidth(2, 230);
    sheet.setColumnWidth(3, 155);
    sheet.setColumnWidth(4, 180);
    sheet.setColumnWidth(5, 145);
    sheet.getRange("C:C").setNumberFormat("@");
    sheet.getRange("D:D").setNumberFormat("yyyy-mm-dd hh:mm:ss");
    sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).createFilter();
  }
  return sheet;
}

function normalizePhone_(value) {
  const digits = String(value).replace(/[٠-٩۰-۹]/g, c => {
    const ar = "٠١٢٣٤٥٦٧٨٩";
    const fa = "۰۱۲۳۴۵۶۷۸۹";
    return String(ar.indexOf(c) >= 0 ? ar.indexOf(c) : fa.indexOf(c));
  });
  return digits.replace(/[\s()+.\-]/g, "");
}

function isEgyptianPhone_(phone) {
  return /^(?:\+?20)?0?1[0125]\d{8}$/.test(phone) ||
         /^20?1[0125]\d{8}$/.test(phone) ||
         /^01[0125]\d{8}$/.test(phone);
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
