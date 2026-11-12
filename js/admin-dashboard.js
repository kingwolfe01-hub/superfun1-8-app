function openTeacherAuthModal(){
  document.getElementById('modalPasscode').value='';
  document.getElementById('modalLoginError').style.display='none';
  document.getElementById('teacherAuthModal').style.display='flex';
}
function closeTeacherAuthModal(){
  document.getElementById('teacherAuthModal').style.display='none';
}

function handleTeacherModalLogin(){
  const passcode = document.getElementById('modalPasscode').value.trim();
  if(!passcode) return;

  document.getElementById('modalLoginError').style.display='none';

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'teacherLogin', passcode: passcode })
  })
  .then(r => r.json())
  .then(data => {
    if(data.status === 'success'){
      currentTeacher = data.teacher;
      currentTeacher.passcode = passcode;
      closeTeacherAuthModal();
      document.getElementById('login-wrapper').style.display='none';
      document.getElementById('main-menu-wrapper').style.display='none';
      document.getElementById('player-wrapper').style.display='none';
      document.getElementById('vocab-wrapper').style.display='none';
      document.getElementById('admin-wrapper').style.display='flex';
      document.getElementById('teacherBadge').textContent = `${currentTeacher.teacherName}（${currentTeacher.allowedGrade}）`;
      
      switchAdminTab('dashboard');
      fetchAdminRecords();
    } else {
      document.getElementById('modalLoginError').style.display='block';
    }
  })
  .catch(err => {
    alert('連線失敗，請檢查網路連線。');
  });
}

function closeAdminSection(){
  currentTeacher = null;
  document.getElementById('admin-wrapper').style.display='none';
  document.getElementById('login-wrapper').style.display='flex';
}

function switchAdminTab(tabName) {
  document.getElementById('adminTabDashboard').style.display = tabName === 'dashboard' ? 'block' : 'none';
  document.getElementById('adminTabStudents').style.display = tabName === 'students' ? 'block' : 'none';
  document.getElementById('adminTabExams').style.display = tabName === 'exams' ? 'block' : 'none';

  document.getElementById('tabBtnDashboard').className = tabName === 'dashboard' ? 'px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg' : 'px-4 py-2 bg-white text-indigo-900 font-bold rounded-lg border border-indigo-200';
  document.getElementById('tabBtnStudents').className = tabName === 'students' ? 'px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg' : 'px-4 py-2 bg-white text-indigo-900 font-bold rounded-lg border border-indigo-200';
  document.getElementById('tabBtnExams').className = tabName === 'exams' ? 'px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg' : 'px-4 py-2 bg-white text-indigo-900 font-bold rounded-lg border border-indigo-200';

  if (tabName === 'exams') {
    initNewExamForm();
    loadExamsForTeacher();
  }
}

// 判斷班級是否屬於該老師負責的年級
function isClassAllowedForTeacher(gradeClass, teacher) {
  if (!teacher || !teacher.allowedGrade) return true;
  const allowed = String(teacher.allowedGrade).trim();
  if (['ALL', '全校', '全部', '管理員', 'admin'].includes(allowed) || allowed === '') return true;

  const targetClass = String(gradeClass || '').trim();
  if (!targetClass) return false;

  const allowedList = allowed.split(/[,，、/ ]+/).filter(Boolean);
  const numMap = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九' };

  return allowedList.some(item => {
    let clean = item.trim().replace(/年級|年/g, '');
    let chineseGrade = numMap[clean] || clean;
    return targetClass.includes(chineseGrade + '年') || targetClass.includes(item);
  });
}

function fetchAdminRecords(){
  const tbody = document.getElementById('adminRecordsTbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:24px;">正在同步學習紀錄...</td></tr>';

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getTeacherReport', passcode: currentTeacher.passcode })
  })
  .then(r => r.json())
  .then(data => {
    if(data.status === 'success'){
      const rawRecords = data.records || [];
      // 依教師年級進行資料過濾
      allAdminRecords = rawRecords.filter(r => isClassAllowedForTeacher(r.gradeClass, currentTeacher));
      populateAdminClassFilter(allAdminRecords);
      renderAdminFilteredData();
    }
  })
  .catch(err => {
    console.error('fetchAdminRecords error:', err);
  });
}

function populateAdminClassFilter(records){
  const select = document.getElementById('adminFilterClass');
  const existingVal = select.value;
  const classes = [...new Set(records.map(r => r.gradeClass).filter(Boolean))].sort();
  select.innerHTML = '<option value="ALL">全部班級</option>';
  classes.forEach(c => {
    const op = document.createElement('option');
    op.value = c;
    op.textContent = c;
    select.appendChild(op);
  });
  if(classes.includes(existingVal)) select.value = existingVal;
}

function renderAdminFilteredData(){
  const filterClass = document.getElementById('adminFilterClass').value;
  const filterMode = document.getElementById('adminFilterMode').value;
  const tbody = document.getElementById('adminRecordsTbody');

  const filtered = allAdminRecords.filter(r => {
    if(filterClass !== 'ALL' && r.gradeClass !== filterClass) return false;
    if(filterMode !== 'ALL' && r.mode !== filterMode) return false;
    return true;
  });

  if(!filtered.length){
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:24px;">尚無符合條件的測驗紀錄</td></tr>';
    updateAdvancedDashboard([]);
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const isPass = (Number(r.score) / (Number(r.total) || 1)) >= 0.6;
    let wrongBadges = '-';
    try {
      const arr = JSON.parse(r.wrongDetails);
      if(Array.isArray(arr) && arr.length > 0) wrongBadges = arr.map(w => `<span style="background:#fef3c7;color:#92400e;padding:3px 7px;border-radius:6px;font-size:12px;margin-right:4px;">${w}</span>`).join('');
    } catch(e){ if(r.wrongDetails) wrongBadges = `<span style="background:#fef3c7;color:#92400e;padding:3px 7px;border-radius:6px;font-size:12px;">${r.wrongDetails}</span>`; }

    return `<tr><td style="color:#64748b;font-size:13px;">${r.timestamp || '-'}</td><td><strong>${r.gradeClass}</strong></td><td>${r.number} 號</td><td>${r.name}</td><td>${r.unit}</td><td>${modeNames[r.mode] || r.mode}</td><td><span class="score-tag ${isPass ? 'score-pass' : 'score-fail'}">${r.score} / ${r.total}</span></td><td>${wrongBadges}</td></tr>`;
  }).join('');

  updateAdvancedDashboard(filtered);
}

function exportAdminCsv(){
  if(!allAdminRecords.length){ alert('目前無資料可匯出！'); return; }
  let csvContent = "\uFEFF時間,學校,班級,座號,姓名,冊別,單元,題型模式,得分,總題數,錯題清單\n";
  allAdminRecords.forEach(r => { csvContent += `"${r.timestamp}","${r.school}","${r.gradeClass}","${r.number}","${r.name}","${r.bookId}","${r.unit}","${modeNames[r.mode]||r.mode}","${r.score}","${r.total}","${String(r.wrongDetails).replace(/"/g, '""')}"\n`; });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.setAttribute("download", `${ACTIVE_SCHOOL.schoolName}英語學習成果_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// ---------------- 動態數據儀表板核心 ----------------
let classChartInstance = null;
let mistakeChartInstance = null;

function updateAdvancedDashboard(records) {
  if (!records || records.length === 0) {
    ['kpiTotalAttempts','kpiUniqueStudents','kpiAvgAccuracy','kpiPerfectCount'].forEach(id => { const el = document.getElementById(id); if(el) el.innerText = '0'; });
    document.getElementById('classTableBody').innerHTML = '';
    ['topAttemptsTableBody','topAccuracyTableBody','needHelpTableBody'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ''; });
    if (classChartInstance) classChartInstance.destroy();
    if (mistakeChartInstance) mistakeChartInstance.destroy();
    return;
  }

  const totalAttempts = records.length;
  const studentSet = new Set();
  let totalAccSum = 0; let perfectCount = 0;
  const classMap = {}; const studentMap = {}; const mistakeCountMap = {};

  records.forEach(r => {
    const cls = r.gradeClass || '未知班級';
    const studentId = `${cls} (${r.number}) ${r.name}`;
    studentSet.add(studentId);

    const score = Number(r.score) || 0;
    const totalQ = Number(r.total) || 1;
    const acc = (score / totalQ) * 100;
    totalAccSum += acc;
    if (acc >= 99.5) perfectCount++;

    if (!classMap[cls]) classMap[cls] = { count: 0, students: new Set(), accSum: 0, qSum: 0 };
    classMap[cls].count++; classMap[cls].students.add(studentId); classMap[cls].accSum += acc; classMap[cls].qSum += totalQ;

    if (!studentMap[studentId]) studentMap[studentId] = { attempts: 0, accSum: 0, totalQ: 0 };
    studentMap[studentId].attempts++; studentMap[studentId].accSum += acc; studentMap[studentId].totalQ += totalQ;

    let wrongs = [];
    try { wrongs = JSON.parse(r.wrongDetails); } catch(e) { wrongs = String(r.wrongDetails||'').split(','); }
    wrongs.forEach(w => { const text = w.trim(); if(text) mistakeCountMap[text] = (mistakeCountMap[text] || 0) + 1; });
  });

  document.getElementById('kpiTotalAttempts').innerHTML = `${totalAttempts} <span class="text-xs font-normal text-slate-500">次</span>`;
  document.getElementById('kpiUniqueStudents').innerHTML = `${studentSet.size} <span class="text-xs font-normal text-slate-500">人</span>`;
  document.getElementById('kpiAvgAttemptsPerStudent').innerHTML = `<span class="text-blue-500">●</span> 人均 ${(totalAttempts / Math.max(1, studentSet.size)).toFixed(2)} 次`;
  document.getElementById('kpiAvgAccuracy').innerText = `${(totalAccSum / totalAttempts).toFixed(1)}%`;
  document.getElementById('kpiPerfectCount').innerHTML = `${perfectCount} <span class="text-xs font-normal text-slate-500">次</span>`;
  document.getElementById('kpiPerfectRate').innerHTML = `<span class="text-amber-500">●</span> 滿分率 ${((perfectCount / totalAttempts) * 100).toFixed(1)}%`;

  const parsedClasses = Object.keys(classMap).map(clsKey => {
    const cData = classMap[clsKey]; const avgAcc = cData.accSum / cData.count;
    return { name: clsKey, count: cData.count, students: cData.students.size, accuracy: avgAcc, status: avgAcc >= 90 ? '精熟表現' : (avgAcc < 80 ? '需介入輔導' : '穩定參與'), statusColor: avgAcc >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700' };
  }).sort((a, b) => b.count - a.count);

  const parsedMistakes = Object.entries(mistakeCountMap).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const studentArr = Object.entries(studentMap).map(([label, s]) => ({ label, attempts: s.attempts, avgAcc: s.accSum / s.attempts, totalQ: s.totalQ }));

  const topAttempts = [...studentArr].sort((a, b) => b.attempts - a.attempts).slice(0, 10).map((s, i) => ({ rank: i+1, label: s.label, count: `${s.attempts}次`, acc: `${s.avgAcc.toFixed(1)}%`, tag: s.avgAcc >= 90 ? 'text-emerald-600' : 'text-slate-700' }));
  const topAcc = [...studentArr].filter(s => s.attempts >= 2).sort((a, b) => b.avgAcc - a.avgAcc).slice(0, 10).map((s, i) => ({ rank: i+1, label: s.label, detail: `${s.attempts}次 (${s.totalQ}題)`, acc: `${s.avgAcc.toFixed(1)}%` }));
  const needHelp = [...studentArr].sort((a, b) => a.avgAcc - b.avgAcc).slice(0, 10).map((s, i) => ({ rank: i+1, label: s.label, detail: `${s.attempts}次 (${s.totalQ}題)`, acc: `${s.avgAcc.toFixed(1)}%` }));

  renderTables(parsedClasses, topAttempts, topAcc, needHelp);
  initCharts(parsedClasses, parsedMistakes);
}

let lastRenderedMistakes = {};
function renderTables(classes, topAttempts, topAcc, needHelp) {
  document.getElementById('classTableBody').innerHTML = classes.map((c, idx) => `<tr class="${idx===0?'bg-indigo-50/50':''}"><td class="px-4 py-3 text-center ${idx===0?'text-indigo-700 font-extrabold':(idx<3?'text-indigo-600 font-bold':'text-slate-500')}">${idx+1}</td><td class="px-4 py-3 font-semibold text-slate-800">${c.name}</td><td class="px-4 py-3 text-center font-bold text-indigo-600">${c.count} 次</td><td class="px-4 py-3 text-center text-slate-600">${c.students} 人</td><td class="px-4 py-3 text-right font-bold ${c.accuracy>=90?'text-emerald-600':(c.accuracy<85?'text-amber-600':'text-slate-800')}">${c.accuracy.toFixed(1)}%</td><td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded text-xs ${c.statusColor}">${c.status}</span></td></tr>`).join('');
  document.getElementById('topAttemptsTableBody').innerHTML = topAttempts.map(s => `<tr><td class="py-2 px-2 font-bold text-slate-600">${s.rank}</td><td class="py-2 px-2 font-medium text-slate-800">${s.label}</td><td class="py-2 px-2 text-center font-bold text-indigo-600">${s.count}</td><td class="py-2 px-2 text-right ${s.tag}">${s.acc}</td></tr>`).join('');
  document.getElementById('topAccuracyTableBody').innerHTML = topAcc.map(s => `<tr><td class="py-2 px-2 font-bold text-slate-600">${s.rank}</td><td class="py-2 px-2 font-medium text-slate-800">${s.label}</td><td class="py-2 px-2 text-center text-slate-500">${s.detail}</td><td class="py-2 px-2 text-right font-bold text-emerald-600">${s.acc}</td></tr>`).join('');
  document.getElementById('needHelpTableBody').innerHTML = needHelp.map(s => `<tr><td class="py-2 px-2 font-bold text-rose-600">${s.rank}</td><td class="py-2 px-2 font-medium text-rose-900">${s.label}</td><td class="py-2 px-2 text-center text-slate-500">${s.detail}</td><td class="py-2 px-2 text-right font-black text-rose-600">${s.acc}</td></tr>`).join('');
}

function initCharts(classes, mistakes) {
  const ctxClass = document.getElementById('classChart').getContext('2d');
  if (classChartInstance) classChartInstance.destroy();
  classChartInstance = new Chart(ctxClass, {
    type: 'bar',
    data: {
      labels: classes.map(c => c.name),
      datasets: [
        { type: 'bar', label: '測驗次數', data: classes.map(c => c.count), backgroundColor: '#4f46e5', borderRadius: 6, yAxisID: 'y' },
        { type: 'line', label: '平均正確率(%)', data: classes.map(c => c.accuracy), borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, tension: 0.2, pointRadius: 4, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true }, y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: v => v + '%' } } },
      plugins: { legend: { position: 'top' } }
    }
  });

  const ctxMistake = document.getElementById('mistakeChart').getContext('2d');
  if (mistakeChartInstance) mistakeChartInstance.destroy();
  mistakeChartInstance = new Chart(ctxMistake, {
    type: 'bar',
    data: {
      labels: mistakes.map(m => m.word),
      datasets: [{ label: '錯誤次數', data: mistakes.map(m => m.count), backgroundColor: ['#e11d48','#f43f5e','#fb7185','#f97316','#fb923c','#f59e0b','#fbbf24','#cbd5e1'], borderRadius: 5 }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true } }, plugins: { legend: { display: false } } }
  });
}

// ---------------- 學生名單上傳核心 ----------------
let pendingBatchStudents = [];

function downloadStudentCsvTemplate() {
  const csvContent = `\uFEFF學校,班級,座號,姓名或遮罩,冊別 ID\n${ACTIVE_SCHOOL.schoolName},六年一班,1,林○恩,sf7\n${ACTIVE_SCHOOL.schoolName},六年一班,2,陳○安,sf7`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "學生名單匯入範例.csv");
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function submitSingleStudent() {
  const school = document.getElementById('singleAddSchool').value.trim();
  const cls = document.getElementById('singleAddClass').value.trim();
  const num = document.getElementById('singleAddNum').value.trim();
  const name = document.getElementById('singleAddName').value.trim();
  const book = document.getElementById('singleAddBook').value.trim();
  const msgEl = document.getElementById('singleAddMsg');
  
  if (!cls || !num || !name || !book) {
    msgEl.innerHTML = '❌ <span class="text-red-600">請完整填寫班級、座號、姓名與冊別 ID</span>';
    msgEl.className = 'mt-3 text-sm font-bold block';
    return;
  }
  
  msgEl.innerHTML = '⏳ <span class="text-slate-600">正在傳送資料中...</span>';
  msgEl.className = 'mt-3 text-sm font-bold block';

  const payload = { 
    action: 'importStudents', 
    passcode: currentTeacher.passcode, 
    students: [{ school: school, gradeClass: cls, number: num, name: name, bookId: book }] 
  };
  
  sendStudentData(payload, msgEl, () => {
     document.getElementById('singleAddNum').value = '';
     document.getElementById('singleAddName').value = '';
  });
}

function handleCsvFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const rows = results.data;
      pendingBatchStudents = rows.map(r => ({
        school: String(r['學校'] || ACTIVE_SCHOOL.schoolName).trim(),
        gradeClass: String(r['班級'] || r['Class'] || '').trim(),
        number: String(r['座號'] || r['Seat'] || '').trim(),
        name: String(r['姓名或遮罩'] || r['姓名'] || '').trim(),
        bookId: String(r['冊別 ID'] || r['冊別ID'] || r['BookId'] || '').trim()
      })).filter(s => s.gradeClass && s.number && s.name);

      if (pendingBatchStudents.length === 0) {
        alert('找不到有效資料！請確保 CSV 第一列包含「學校」、「班級」、「座號」、「姓名或遮罩」、「冊別 ID」。');
        document.getElementById('batchCsvInput').value = '';
        return;
      }

      document.getElementById('csvCount').textContent = pendingBatchStudents.length;
      document.getElementById('csvPreviewTbody').innerHTML = pendingBatchStudents.slice(0, 100).map(s => 
        `<tr>
           <td class="p-2 border-b border-slate-100">${escapeHtml(s.school)}</td>
           <td class="p-2 border-b border-slate-100">${escapeHtml(s.gradeClass)}</td>
           <td class="p-2 border-b border-slate-100">${escapeHtml(s.number)}</td>
           <td class="p-2 border-b border-slate-100">${escapeHtml(s.name)}</td>
           <td class="p-2 border-b border-slate-100">${escapeHtml(s.bookId)}</td>
         </tr>`
      ).join('');
      
      if(pendingBatchStudents.length > 100) {
        document.getElementById('csvPreviewTbody').insertAdjacentHTML('beforeend', '<tr><td colspan="5" class="p-2 text-center text-slate-500 font-bold bg-slate-50">...僅顯示前 100 筆預覽</td></tr>');
      }
      
      document.getElementById('csvPreviewArea').classList.remove('hidden');
      document.getElementById('batchAddMsg').classList.add('hidden');
    },
    error: function(err) { 
      alert('CSV 解析失敗: ' + err.message); 
      document.getElementById('batchCsvInput').value = '';
    }
  });
}

function cancelBatchImport() {
  pendingBatchStudents = [];
  document.getElementById('batchCsvInput').value = '';
  document.getElementById('csvPreviewArea').classList.add('hidden');
}

function submitBatchStudents() {
  if (!pendingBatchStudents.length) return;
  const msgEl = document.getElementById('batchAddMsg');
  const btn = document.getElementById('confirmBatchBtn');
  
  btn.disabled = true;
  btn.classList.add('opacity-50', 'cursor-not-allowed');
  msgEl.innerHTML = '⏳ <span class="text-slate-600">批次寫入資料庫中，請稍候...</span>';
  msgEl.className = 'text-sm font-bold block';

  const payload = { 
    action: 'importStudents', 
    passcode: currentTeacher.passcode, 
    students: pendingBatchStudents 
  };
  
  sendStudentData(payload, msgEl, () => {
     btn.disabled = false;
     btn.classList.remove('opacity-50', 'cursor-not-allowed');
     setTimeout(cancelBatchImport, 3000); 
  }, () => { 
     btn.disabled = false; 
     btn.classList.remove('opacity-50', 'cursor-not-allowed');
  });
}

function sendStudentData(payload, msgEl, onSuccess, onError) {
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(data => {
    if(data.status === 'success') {
      msgEl.innerHTML = '✅ <span class="text-emerald-600">學生資料已成功匯入！</span>';
      msgEl.className = 'mt-3 text-sm font-bold block';
      if(onSuccess) onSuccess();
    } else {
      msgEl.innerHTML = `❌ <span class="text-red-600">匯入失敗：${escapeHtml(data.message||'請檢查後端邏輯')}</span>`;
      msgEl.className = 'mt-3 text-sm font-bold block';
      if(onError) onError();
    }
  })
  .catch(err => {
    msgEl.innerHTML = '⚠️ <span class="text-amber-600">網路連線異常，請稍後再試。</span>';
    msgEl.className = 'mt-3 text-sm font-bold block';
    if(onError) onError();
  });
}

// ---------------- 彈窗開關控制邏輯 ----------------
function openStudentGuideModal() {
  document.getElementById('studentGuideModal').style.display = 'flex';
}
function closeStudentGuideModal() {
  document.getElementById('studentGuideModal').style.display = 'none';
}
function openTeacherGuideModal() {
  document.getElementById('teacherGuideModal').style.display = 'flex';
}
function closeTeacherGuideModal() {
  document.getElementById('teacherGuideModal').style.display = 'none';
}

// ========================================================
// 🏆 定期考評量（整合 5 大聽力 + 2 大口說評量驅動引擎）
// ========================================================
let studentAssignedExam = null;
let examQuestionsQueue = [];
let examCurrentIdx = 0;
let examScoreState = { listenOk: 0, listenTotal: 0, phonicsOk: 0, phonicsTotal: 0, sentOk: 0, sentTotal: 0 };
let examWrongDetails = [];
let allPublishedExams = [];
let examQuestionAttempts = 0;
let examCountdownTimer = null;
let examProgressInterval = null;
let examAudioPlaysLeft = 2; // 每題最多可聽 2 次
let examCurrentOrderTokens = [];
let examSelectedOrderTokens = [];

// 1. 學生端：確認是否有指定考試（並依交卷紀錄進行鎖定判斷）
