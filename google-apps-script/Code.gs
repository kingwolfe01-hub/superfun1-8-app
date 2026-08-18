/**
 * Google Apps Script: Super Fun Google Sheet masked-name login verifier
 *
 * Front-end compatibility:
 * - Keeps the existing front-end contract: data.status === "success" means login passed.
 * - Failure returns status: "error" with message.
 *
 * Sheet name: Students
 * Required columns:
 * enabled | school | gradeClass | number | nameMask | fullName | bookId | note
 */

const SHEET_NAME = "Students";
const LOG_SHEET_NAME = "LoginLog";
const ENABLE_LOGIN_LOG = true;

function doGet(e) {
  return handleLoginRequest_((e && e.parameter) || {});
}

function doPost(e) {
  let params = {};

  try {
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      params = e.parameter;
    }
  } catch (err) {
    params = (e && e.parameter) || {};
  }

  return handleLoginRequest_(params);
}

function handleLoginRequest_(params) {
  const school = normalizeText_(params.school);
  const gradeClass = normalizeText_(params.gradeClass || params.className);
  const number = normalizeSeatNo_(params.number);
  const inputName = normalizeExactNameText_(params.name);

  if (!school || !gradeClass || !number || !inputName) {
    return fail_("MISSING_FIELDS", "請完整填寫學校、班級、座號與姓名。", school, gradeClass, number, inputName);
  }

  const rows = getStudentRows_();

  const candidates = rows.filter(row => {
    if (!isEnabled_(row.enabled)) return false;
    if (normalizeText_(row.school) !== school) return false;
    if (normalizeText_(row.gradeClass) !== gradeClass) return false;

    // If the sheet has a seat number, it must match exactly after normalization.
    if (row.number) {
      if (normalizeSeatNo_(row.number) !== number) return false;
    }

    // Full-name mode, if fullName is filled.
    if (row.fullName) {
      return matchFullName_(inputName, row.fullName);
    }

    // Masked-name mode, if nameMask is filled.
    if (row.nameMask) {
      return matchMaskedName_(inputName, row.nameMask);
    }

    return false;
  });

  if (candidates.length === 0) {
    return fail_("NO_MATCH", "資料不符合，請確認學校、班級、座號或姓名。", school, gradeClass, number, inputName);
  }

  if (candidates.length > 1) {
    // Do not reveal the number of matches or details to the front end.
    return fail_("AMBIGUOUS_MATCH", "此資料無法唯一確認身分，請洽老師確認。", school, gradeClass, number, inputName);
  }

  const matched = candidates[0];
  const displayName = matched.nameMask || "已驗證學生";
  const bookId = normalizeText_(matched.bookId);

  logLogin_("OK", school, gradeClass, number, maskInputForLog_(inputName), bookId);

  return jsonOutput_({
    status: "success",
    ok: true,
    success: true,
    code: "OK",
    message: "驗證成功。",
    bookId: bookId,
    student: {
      school: normalizeText_(matched.school),
      gradeClass: normalizeText_(matched.gradeClass),
      number: normalizeSeatNo_(matched.number || number),
      displayName: displayName
    }
  });
}

function fail_(code, message, school, gradeClass, number, inputName) {
  logLogin_(code, school, gradeClass, number, maskInputForLog_(inputName), "");
  return jsonOutput_({
    status: "error",
    ok: false,
    success: false,
    code: code,
    message: message
  });
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStudentRows_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("找不到工作表：" + SHEET_NAME);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());

  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((key, index) => {
      obj[key] = row[index];
    });
    return obj;
  });
}

function isEnabled_(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "y" || text === "啟用";
}

function normalizeText_(text) {
  return String(text || "").normalize("NFKC").trim();
}

function normalizeSeatNo_(value) {
  return String(value || "").normalize("NFKC").trim().replace(/^0+/, "");
}

function normalizeMaskedNameText_(text) {
  return String(text || "")
    .normalize("NFKC")
    .trim()
    .replace(/Ｘ|ｘ|X/g, "x")
    .replace(/‧|･|·/g, "・")
    .replace(/\s+/g, " ");
}

function normalizeExactNameText_(text) {
  return String(text || "")
    .normalize("NFKC")
    .trim()
    .replace(/‧|･|·/g, "・")
    .replace(/\s+/g, " ");
}

function escapeRegex_(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskToRegex_(mask) {
  const normalizedMask = normalizeMaskedNameText_(mask);
  let pattern = "";

  for (const ch of normalizedMask) {
    if (ch === "x") {
      // Any single Unicode letter, including Chinese and Roman letters.
      pattern += "[\\p{L}]";
    } else if (ch === "?") {
      // Any single character.
      pattern += ".";
    } else if (ch === "*") {
      // Any 0 to 20 characters. Use sparingly.
      pattern += ".{0,20}";
    } else if (ch === " ") {
      // One or more spaces.
      pattern += "\\s+";
    } else {
      pattern += escapeRegex_(ch);
    }
  }

  return new RegExp("^" + pattern + "$", "u");
}

function matchMaskedName_(inputName, maskedName) {
  const input = normalizeMaskedNameText_(inputName);
  const mask = normalizeMaskedNameText_(maskedName);
  if (!input || !mask) return false;
  return maskToRegex_(mask).test(input);
}

function matchFullName_(inputName, fullName) {
  const input = normalizeExactNameText_(inputName);
  const target = normalizeExactNameText_(fullName);
  if (!input || !target) return false;
  return input === target;
}

function maskInputForLog_(name) {
  const text = normalizeExactNameText_(name);
  if (!text) return "";
  if (text.length <= 2) return text.charAt(0) + "x";
  return text.charAt(0) + "x".repeat(Math.max(1, text.length - 2)) + text.charAt(text.length - 1);
}

function logLogin_(code, school, gradeClass, number, maskedInputName, bookId) {
  if (!ENABLE_LOGIN_LOG) return;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET_NAME);
      sheet.appendRow(["timestamp", "code", "school", "gradeClass", "number", "maskedInputName", "bookId"]);
    }

    sheet.appendRow([
      new Date(),
      code || "",
      school || "",
      gradeClass || "",
      number || "",
      maskedInputName || "",
      bookId || ""
    ]);
  } catch (err) {
    // Avoid blocking login because logging failed.
  }
}

/**
 * Optional local test in Apps Script editor.
 * Run testMaskedName_() manually and inspect Logs.
 */
function testMaskedName_() {
  const cases = [
    ["黃亮智", "黃x智", true],
    ["王大志明", "王xx明", true],
    ["王明", "王xx明", false],
    ["阿明・巴大山", "阿x・巴xx", true],
    ["Mona Rudao", "Mxxx Rxxxx", true]
  ];

  cases.forEach(c => {
    const actual = matchMaskedName_(c[0], c[1]);
    Logger.log(c[0] + " / " + c[1] + " => " + actual + " expected " + c[2]);
  });
}
