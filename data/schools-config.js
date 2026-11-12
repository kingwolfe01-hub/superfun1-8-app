// data/schools-config.js
// 單一主程式多校設定檔：新增學校只需在 SCHOOLS_CONFIG 新增一筆設定即可。
// 對應網址參數：index.html?school=nankuang 或 index.html?school=zhongshan

const DEFAULT_SCHOOL_ID = "nankuang";

const SCHOOLS_CONFIG = {
  nankuang: {
    schoolId: "nankuang",
    schoolName: "南光國小",
    displayName: "南投縣南光國小",
    gasUrl: "https://script.google.com/macros/s/AKfycbw4fLrYwzEVwFnzoLhb2WH-JH6RpFEJH2WlbbRHtYP_TF7t-v-AcyBJxPvhQc3zPOTR2A/exec",
    allowCdPlayer: true,
    lockedCdMessage: "",
    classCountPerGrade: 8
  },
  zhongshan: {
    schoolId: "zhongshan",
    schoolName: "中山國小",
    displayName: "彰化縣中山國小",
    gasUrl: "https://script.google.com/macros/s/AKfycbzmZ3jyeQdYvzmd2vjTFsCWXfg1r9c04qJ1v6t_XJcFKfWNdihjkZ4UQDzqCOt5Ji3v/exec",
    allowCdPlayer: false,
    lockedCdMessage: "🔒【功能未開放】\n\n彰化縣中山國小目前暫未開放線上 CD 音檔播放功能。\n請點選「📚 學習與測驗」進入數位練習與測驗！",
    classCountPerGrade: 8
  }
};

function getActiveSchoolConfig() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const rawId = String(params.get("school") || "").trim().toLowerCase();
    if (rawId && SCHOOLS_CONFIG[rawId]) {
      return SCHOOLS_CONFIG[rawId];
    }
  } catch (e) {}
  return SCHOOLS_CONFIG[DEFAULT_SCHOOL_ID];
}

const ACTIVE_SCHOOL_CONFIG = getActiveSchoolConfig();
