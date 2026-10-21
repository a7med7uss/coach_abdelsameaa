/**
 * التخزين المركزي لتسجيلات مسابقة بيس VX باستخدام Google Sheets.
 * الأعمدة الوحيدة: الاسم الثلاثي، رقم الهاتف.
 */

const SHEET_TITLE = "مسابقة بيس VX - التسجيلات";
const SHEET_PROPERTY = "VX_REGISTRATION_SHEET_ID";
const HEADERS = ["الاسم الثلاثي", "رقم الهاتف"];

function setupSheet() {
  const sheet = ensureSheet_();
  Logger.log("رابط ملف التسجيلات: " + sheet.getParent().getUrl());
  return sheet.getParent().getUrl();
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: "مسابقة بيس VX",
      message: "خدمة التسجيل جاهزة."
    }))
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

    // يمنع تكرار رقم الهاتف: رقم الهاتف هو العمود الثاني.
    if (lastRow > 1) {
      const existingRows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
      const duplicate = existingRows.find(row => normalizePhone_(row[1]) === phone);
      if (duplicate) {
        return json_({
          ok: false,
          duplicate: true,
          registeredName: duplicate[0],
          message: "رقم الهاتف مسجل بالفعل."
        });
      }
    }

    const rowNumber = sheet.getLastRow() + 1;
    // لا نكتب أي أعمدة إضافية: الاسم الثلاثي ورقم الهاتف فقط.
    sheet.getRange(rowNumber, 1, 1, HEADERS.length)
      .setValues([[fullName, phone]]);
    sheet.getRange(rowNumber, 2).setNumberFormat("@");

    return json_({ ok: true, message: "تم التسجيل بنجاح." });
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
  } else {
    // عند تشغيل الكود على الشيت القديم، نحتفظ فقط بالاسم ورقم الهاتف.
    // الأعمدة الأخرى مثل رقم التسجيل ووقت التسجيل والحالة تُحذف.
    const existingData = sheet.getDataRange().getValues();
    const existingHeaders = existingData[0].map(value => String(value).trim());
    const sameSchema =
      existingHeaders.length === HEADERS.length &&
      HEADERS.every((header, index) => existingHeaders[index] === header);

    if (!sameSchema) {
      const migratedRows = existingData.slice(1).map(row =>
        HEADERS.map(header => {
          const oldIndex = existingHeaders.indexOf(header);
          return oldIndex >= 0 ? row[oldIndex] : "";
        })
      );

      sheet.clearContents();
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      if (migratedRows.length > 0) {
        sheet.getRange(2, 1, migratedRows.length, HEADERS.length).setValues(migratedRows);
      }
    }
  }

  // اجعل الجدول نفسه مكوّنًا من عمودين فقط.
  if (sheet.getMaxColumns() > HEADERS.length) {
    sheet.deleteColumns(HEADERS.length + 1, sheet.getMaxColumns() - HEADERS.length);
  }

  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground("#061126")
    .setFontColor("#79C4EA")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  sheet.setColumnWidth(1, 280); // الاسم الثلاثي
  sheet.setColumnWidth(2, 190); // رقم الهاتف
  sheet.getRange("B:B").setNumberFormat("@");

  const filter = sheet.getFilter();
  if (filter) filter.remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), HEADERS.length).createFilter();

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
