// data/students-map.js
const schoolClassBookMap = {
  "南光國小": {
    // 三年級 (Super Fun 1)
    "三年一班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年二班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年三班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年四班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年五班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年六班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年七班": { grade: "三年級", semester: "上學期", bookId: "sf1" },
    "三年八班": { grade: "三年級", semester: "上學期", bookId: "sf1" },

    // 四年級 (Super Fun 3)
    "四年一班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年二班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年三班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年四班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年五班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年六班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年七班": { grade: "四年級", semester: "上學期", bookId: "sf3" },
    "四年八班": { grade: "四年級", semester: "上學期", bookId: "sf3" },

    // 五年級 (Super Fun 5)
    "五年一班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年二班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年三班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年四班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年五班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年六班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年七班": { grade: "五年級", semester: "上學期", bookId: "sf5" },
    "五年八班": { grade: "五年級", semester: "上學期", bookId: "sf5" },

    // 六年級 (Super Fun 7)
    "六年一班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年二班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年三班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年四班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年五班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年六班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年七班": { grade: "六年級", semester: "上學期", bookId: "sf7" },
    "六年八班": { grade: "六年級", semester: "上學期", bookId: "sf7" }
  }
};

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
  
  // 1. 去除註記文字（如 [名字只有兩個字]、(4個字) 等）與所有空格
  const cleanName = String(rawName)
    .replace(/[\[\(（【].*?[\]\)）】]/g, '')
    .replace(/\s+/g, '')
    .trim();

  const len = cleanName.length;

  // 2. 動態字數遮罩規則
  if (len <= 1) return cleanName;
  if (len === 2) return cleanName[0] + maskChar;
  if (len === 3) return cleanName[0] + maskChar + cleanName[2];
  if (len === 4) return cleanName[0] + maskChar + maskChar + cleanName[3];
  
  // 5 個字以上：保留首尾，中間全遮
  return cleanName[0] + maskChar.repeat(len - 2) + cleanName[len - 1];
}

function buildStudentDisplayText(student, classInfo, book) {
  const maskedName = maskStudentName(student?.name || student?.displayName || "");
  return {
    studentBadge: `${student?.school || ""}｜${student?.gradeClass || ""}｜${student?.number || ""}號 ${maskedName} 同學`,
    bookBadge: `${classInfo?.grade || ""}${classInfo?.semester || ""}｜${book?.title || ""}`
  };
}