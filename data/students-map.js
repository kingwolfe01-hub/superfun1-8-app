// data/students-map.js
// 依據 data/schools-config.js 自動產生各校班級對應冊別表，無需手動重複維護每校 32 個班級。

function buildStandardClassBookMap(classCountPerGrade = 8) {
  const numWords = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  const grades = [
    { prefix: "三", grade: "三年級", bookId: "sf1" },
    { prefix: "四", grade: "四年級", bookId: "sf3" },
    { prefix: "五", grade: "五年級", bookId: "sf5" },
    { prefix: "六", grade: "六年級", bookId: "sf7" }
  ];
  const map = {};
  const count = Math.min(Math.max(1, Number(classCountPerGrade) || 8), numWords.length);
  grades.forEach(g => {
    for (let i = 0; i < count; i++) {
      map[`${g.prefix}年${numWords[i]}班`] = {
        grade: g.grade,
        semester: "上學期",
        bookId: g.bookId
      };
    }
  });
  return map;
}

const schoolClassBookMap = {};
if (typeof SCHOOLS_CONFIG !== "undefined") {
  Object.values(SCHOOLS_CONFIG).forEach(cfg => {
    if (cfg && cfg.schoolName) {
      schoolClassBookMap[cfg.schoolName] = cfg.customClassBookMap || buildStandardClassBookMap(cfg.classCountPerGrade || 8);
    }
  });
}

function getClassBookInfo(school, gradeClass) {
  return schoolClassBookMap?.[school]?.[gradeClass] || null;
}

function resolveBookForStudent(school, gradeClass) {
  const classInfo = getClassBookInfo(school, gradeClass);
  if (!classInfo) {
    return {
      ok: false,
      message: "此學校或班級尚未設定教材冊別，請聯絡老師。",
      classInfo: null,
      book: null
    };
  }
  const book = typeof bookData !== "undefined" ? bookData[classInfo.bookId] : null;
  if (!book) {
    return {
      ok: false,
      message: `找不到教材資料：${classInfo.bookId}，請確認 data/books.js 是否已設定。`,
      classInfo,
      book: null
    };
  }
  return { ok: true, message: "教材設定完成。", classInfo, book };
}

/**
 * 方案 C：智慧動態姓名遮罩函式
 * @param {string} rawName - 原始姓名（含可能之空格或備註）
 * @param {string} maskChar - 遮罩字元（預設 '○'）
 * @returns {string} 遮罩後的姓名
 */
function maskStudentName(rawName, maskChar = '○') {
  if (!rawName) return '';
  const cleanName = String(rawName)
    .replace(/[\[\(（【].*?[\]\)）】]/g, '')
    .replace(/\s+/g, '')
    .trim();

  const len = cleanName.length;
  if (len <= 1) return cleanName;
  if (len === 2) return cleanName[0] + maskChar;
  if (len === 3) return cleanName[0] + maskChar + cleanName[2];
  if (len === 4) return cleanName[0] + maskChar + maskChar + cleanName[3];
  return cleanName[0] + maskChar.repeat(len - 2) + cleanName[len - 1];
}

function buildStudentDisplayText(student, classInfo, book) {
  const rawDisplay = student?.displayName || student?.name || "";
  const isAlreadyMasked = /[xXｘＸ○?*＊]/.test(rawDisplay);
  const maskedName = isAlreadyMasked ? rawDisplay : maskStudentName(rawDisplay);
  return {
    studentBadge: `${student?.school || ""}｜${student?.gradeClass || ""}｜${student?.number || ""}號 ${maskedName} 同學`,
    bookBadge: `${classInfo?.grade || ""}${classInfo?.semester || ""}｜${book?.title || ""}`
  };
}
