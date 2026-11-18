// data/school-config.js
const WEATHER_API_CONFIG = {
  // 若您有台灣中央氣象署 (CWA) 授權碼，填入下方 cwaApiKey 即可優先使用官方 F-D0047 預報；
  // 留空時系統會自動無縫切換至全球免金鑰即時氣象台 (Open-Meteo)，100% 確保離線/免金鑰也能自動定位報天氣！
  cwaApiKey: '',
  cwaEndpoint: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-017'
};

const SCHOOL_CONFIGS = {
  nanguang: {
    key: 'nanguang',
    schoolValue: '南光國小',
    schoolFullName: '南投縣南光國小',
    locationName: '南投縣埔里鎮',
    cwaLocationName: '埔里鎮',
    cwaDatasetId: 'F-D0047-021', // 南投縣鄉鎮預報
    lat: 23.9663,
    lon: 120.9695,
    pageTitle: 'Super Fun 教材整合平台 - 南光國小專屬',
    loginTitle: '🏫 南投縣南光國小 英語學習平台',
    loginSubtitle: '南光國小專屬教材，請驗證身分後開始使用。',
    adminTitle: '南投縣南光國小 - 英語教材看板與管理',
    studentGuideTitle: '📖 南光國小 學生英語自學與測驗指南',
    teacherGuideTitle: '📑 南光國小 教師後台管理指南與數據解讀手冊',
    csvSampleRows: '南光國小,六年一班,1,申O熙,sf7\n南光國小,六年一班,2,楊O哲,sf7',
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbw4fLrYwzEVwFnzoLhb2WH-JH6RpFEJH2WlbbRHtYP_TF7t-v-AcyBJxPvhQc3zPOTR2A/exec',
    enableCdPlayer: true,
    lockedPlayerMessage: '',
    classes: [
      '三年一班','三年二班','三年三班','三年四班','三年五班','三年六班','三年七班','三年八班','三年九班','三年十班',
      '四年一班','四年二班','四年三班','四年四班','四年五班','四年六班','四年七班','四年八班','四年九班','四年十班',
      '五年一班','五年二班','五年三班','五年四班','五年五班','五年六班','五年七班','五年八班','五年九班','五年十班',
      '六年一班','六年二班','六年三班','六年四班','六年五班','六年六班','六年七班','六年八班','六年九班','六年十班'
    ]
  },
  zhongshan: {
    key: 'zhongshan',
    schoolValue: '中山國小',
    schoolFullName: '彰化縣中山國小',
    locationName: '彰化縣彰化市',
    cwaLocationName: '彰化市',
    cwaDatasetId: 'F-D0047-017', // 彰化縣鄉鎮預報 (F-D0047-017)
    lat: 24.0815,
    lon: 120.5422,
    pageTitle: 'Super Fun 教材整合平台 - 彰化縣中山國小專屬',
    loginTitle: '🏫 彰化縣中山國小 英語學習平台',
    loginSubtitle: '中山國小專屬教材，請驗證身分後開始使用。',
    adminTitle: '彰化縣中山國小 - 英語教材看板與管理',
    studentGuideTitle: '📖 中山國小 學生英語自學與測驗指南',
    teacherGuideTitle: '📑 中山國小 教師後台管理指南與數據解讀手冊',
    csvSampleRows: '中山國小,六年一班,1,林O恩,sf7\n中山國小,六年一班,2,陳O安,sf7',
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbzmZ3jyeQdYvzmd2vjTFsCWXfg1r9c04qJ1v6t_XJcFKfWNdihjkZ4UQDzqCOt5Ji3v/exec',
    enableCdPlayer: false,
    lockedPlayerMessage: '🔒【功能未開放】\n\n彰化縣中山國小目前暫未開放線上 CD 音檔播放功能。\n請點選「🏝️ 3D 英語島」進入數位練習與測驗！',
    classes: [
      '三年一班','三年二班','三年三班','三年四班','三年五班','三年六班','三年七班','三年八班','三年九班','三年十班',
      '四年一班','四年二班','四年三班','四年四班','四年五班','四年六班','四年七班','四年八班','四年九班','四年十班',
      '五年一班','五年二班','五年三班','五年四班','五年五班','五年六班','五年七班','五年八班','五年九班','五年十班',
      '六年一班','六年二班','六年三班','六年四班','六年五班','六年六班','六年七班','六年八班','六年九班','六年十班','六年十一班'
    ]
  }
};

function getActiveSchoolConfig() {
  const params = new URLSearchParams(window.location.search);
  const paramKey = (params.get('school') || '').toLowerCase().trim();
  if (paramKey && SCHOOL_CONFIGS[paramKey]) {
    return SCHOOL_CONFIGS[paramKey];
  }
  return SCHOOL_CONFIGS.nanguang;
}

const ACTIVE_SCHOOL = getActiveSchoolConfig();
const GOOGLE_SCRIPT_URL = ACTIVE_SCHOOL.googleScriptUrl;
