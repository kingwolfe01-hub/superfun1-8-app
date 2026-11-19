// js/teacher-admin.js
const modeNames = {
  listening: '看圖測驗',
  phonicsQuiz: '辨音測驗',
  sentenceListenEn: '句子聽力(英)',
  sentenceListenZh: '句子聽力(中)',
  speaking: '口說測驗',
  storyListening: '故事聽力測驗'
};

function openTeacherAuthModal() {
  document.getElementById('modalPasscode').value = '';
  document.getElementById('modalLoginError').style.display = 'none';
  document.getElementById('teacherAuthModal').style.display = 'flex';
}

function closeTeacherAuthModal() {
  document.getElementById('teacherAuthModal').style.display = 'none';
}

function handleTeacherModalLogin() {
  const passcode = document.getElementById('modalPasscode').value.trim();
  if (!passcode) return;
  document.getElementById('modalLoginError').style.display = 'none';
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'teacherLogin', passcode: passcode })
  })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success') {
        currentTeacher = data.teacher;
        currentTeacher.passcode = passcode;
        closeTeacherAuthModal();
        document.getElementById('login-wrapper').style.display = 'none';
        document.getElementById('main-menu-wrapper').style.display = 'none';
        document.getElementById('player-wrapper').style.display = 'none';
        document.getElementById('vocab-wrapper').style.display = 'none';
        document.getElementById('admin-wrapper').style.display = 'flex';
        document.getElementById('teacherBadge').textContent = `${currentTeacher.teacherName}（${currentTeacher.allowedGrade}）`;
        switchAdminTab('dashboard');
        fetchAdminRecords();
      } else {
        document.getElementById('modalLoginError').style.display = 'block';
      }
    })
    .catch(() => {
      alert('連線失敗，請檢查網路連線。');
    });
}

function closeAdminSection() {
  currentTeacher = null;
  document.getElementById('admin-wrapper').style.display = 'none';
  document.getElementById('login-wrapper').style.display = 'flex';
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

function isClassAllowedForTeacher(gradeClass, teacher) {
  if (!teacher || !teacher.allowedGrade) return true;
  const allowed = String(teacher.allowedGrade).trim();
  if (['ALL', '全校', '全部', '管理員', 'admin'].includes(allowed) || allowed === '') return true;
  const targetClass = String(gradeClass || '').trim();
  if (!targetClass) return false;
  const allowedList = allowed.split(/[,，、/ ]+/).filter(Boolean);
  const numMap = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六' };
  return allowedList.some(item => {
    const clean = item.trim().replace(/年級|年/g, '');
    const chineseGrade = numMap[clean] || clean;
    return targetClass.includes(chineseGrade + '年') || targetClass.includes(item);
  });
}


function extractWrongItemText(w) {
  if (!w) return '';
  if (typeof w === 'object') {
    return String(w.word || w.sentence || w.text || w.meaning || JSON.stringify(w)).trim();
  }
  const s = String(w).trim();
  if (s.startsWith('{') || s.startsWith('[') || s === '[object Object]') {
    try {
      const parsed = JSON.parse(s);
      return String(parsed.word || parsed.sentence || parsed.text || parsed.meaning || '').trim();
    } catch (e) {
      return '';
    }
  }
  return s;
}

function fetchAdminRecords() {
  const tbody = document.getElementById('adminRecordsTbody');
  tbody.innerHTML = '<tr><td colspan="8">正在同步學習紀錄...</td></tr>';
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getTeacherReport', passcode: currentTeacher.passcode })
  })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success') {
        const rawRecords = data.records || [];
        allAdminRecords = rawRecords.filter(r => isClassAllowedForTeacher(r.gradeClass, currentTeacher));
        populateAdminClassFilter(allAdminRecords);
        populateAdminUnitFilter(allAdminRecords);
        renderAdminFilteredData();
      }
    });
}

function populateAdminClassFilter(records) {
  const select = document.getElementById('adminFilterClass');
  if (!select) return;
  const existingVal = select.value;
  const classes = [...new Set(records.map(r => r.gradeClass).filter(Boolean))].sort();
  select.innerHTML = '<option value="ALL">全部班級</option>';
  classes.forEach(c => {
    const op = document.createElement('option');
    op.value = c;
    op.textContent = c;
    select.appendChild(op);
  });
  if (classes.includes(existingVal)) select.value = existingVal;
}

function populateAdminUnitFilter(records) {
  const select = document.getElementById('adminFilterUnit');
  if (!select) return;
  const existingVal = select.value;
  const units = [...new Set(records.map(r => r.unit).filter(Boolean))].sort();
  select.innerHTML = '<option value="ALL">全部單元</option>';
  units.forEach(u => {
    const op = document.createElement('option');
    op.value = u;
    op.textContent = u;
    select.appendChild(op);
  });
  if (units.includes(existingVal)) select.value = existingVal;
}

function renderAdminFilteredData() {
  const filterClass = document.getElementById('adminFilterClass')?.value || 'ALL';
  const filterUnit = document.getElementById('adminFilterUnit')?.value || 'ALL';
  const filterMode = document.getElementById('adminFilterMode')?.value || 'ALL';
  const filterSearch = document.getElementById('adminFilterSearch')?.value?.toLowerCase()?.trim() || '';
  const tbody = document.getElementById('adminRecordsTbody');

  const filtered = allAdminRecords.filter(r => {
    if (filterClass !== 'ALL' && r.gradeClass !== filterClass) return false;
    if (filterUnit !== 'ALL' && r.unit !== filterUnit) return false;
    if (filterMode !== 'ALL' && r.mode !== filterMode) return false;
    if (filterSearch) {
      const targetStr = `${r.gradeClass || ''} ${r.number || ''} ${r.name || ''}`.toLowerCase();
      if (!targetStr.includes(filterSearch)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="8">尚無符合條件的測驗紀錄</td></tr>';
    updateAdvancedDashboard([]);
    return;
  }

  if (tbody) {
    tbody.innerHTML = filtered.map(r => {
      const isPass = (Number(r.score) / (Number(r.total) || 1)) >= 0.6;
      let wrongBadges = '-';
      try {
        let arr = [];
        const parsed = typeof r.wrongDetails === 'string' ? JSON.parse(r.wrongDetails) : r.wrongDetails;
        if (Array.isArray(parsed)) arr = parsed;
        else if (parsed) arr = [parsed];
        const cleaned = arr.map(extractWrongItemText).filter(Boolean);
        if (cleaned.length > 0) {
          wrongBadges = cleaned.map(w => `<span class="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded mr-1">${escapeHtml(w)}</span>`).join('');
        }
      } catch (e) {
        if (r.wrongDetails) {
          const txt = extractWrongItemText(r.wrongDetails);
          if (txt) wrongBadges = `<span class="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded">${escapeHtml(txt)}</span>`;
        }
      }
      const studentKey = `${r.school || ''}__${r.gradeClass || ''}__${r.number || ''}__${r.name || ''}`;
      return `<tr>
        <td>${r.timestamp || '-'}</td>
        <td><strong>${escapeHtml(r.gradeClass)}</strong></td>
        <td>${r.number} 號</td>
        <td><a href="javascript:void(0)" onclick="openStudentDiagnosticsByName('${escapeHtml(r.gradeClass)}', '${r.number}', '${escapeHtml(r.name)}')" class="text-indigo-600 font-black hover:underline">${escapeHtml(r.name)}</a></td>
        <td>${escapeHtml(r.unit)}</td>
        <td>${modeNames[r.mode] || r.mode}</td>
        <td><span class="score-tag ${isPass ? 'score-pass' : 'score-fail'}">${r.score} / ${r.total}</span></td>
        <td>${wrongBadges}</td>
      </tr>`;
    }).join('');
  }
  updateAdvancedDashboard(filtered);
}

function exportAdminCsv() {
  if (!allAdminRecords.length) { alert('目前無資料可匯出！'); return; }
  let csvContent = "\uFEFF時間,學校,班級,座號,姓名,冊別,單元,題型模式,得分,總題數,錯題清單\n";
  allAdminRecords.forEach(r => {
    let cleanedWrongs = '';
    try {
      const parsed = typeof r.wrongDetails === 'string' ? JSON.parse(r.wrongDetails) : r.wrongDetails;
      const arr = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      cleanedWrongs = arr.map(extractWrongItemText).filter(Boolean).join(', ');
    } catch (e) {
      cleanedWrongs = extractWrongItemText(r.wrongDetails);
    }
    csvContent += `"${r.timestamp || ''}","${r.school || ''}","${r.gradeClass || ''}","${r.number || ''}","${r.name || ''}","${r.bookId || ''}","${r.unit || ''}","${modeNames[r.mode] || r.mode}","${r.score ?? ''}","${r.total ?? ''}","${cleanedWrongs.replace(/"/g, '""')}"\n`;
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${ACTIVE_SCHOOL.schoolValue}英語學習成果_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

let classChartInstance = null;
let abilityRadarChartInstance = null;
let mistakeChartInstance = null;
let unitPerformanceChartInstance = null;

function updateAdvancedDashboard(records) {
  if (!records || records.length === 0) {
    ['kpiTotalAttempts', 'kpiUniqueStudents', 'kpiAvgAccuracy', 'kpiPerfectCount'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '0';
    });
    const ctb = document.getElementById('classTableBody');
    if (ctb) ctb.innerHTML = '';
    ['topAttemptsTableBody', 'topAccuracyTableBody', 'needHelpTableBody'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    if (classChartInstance) classChartInstance.destroy();
    if (abilityRadarChartInstance) abilityRadarChartInstance.destroy();
    if (mistakeChartInstance) mistakeChartInstance.destroy();
    if (unitPerformanceChartInstance) unitPerformanceChartInstance.destroy();
    return;
  }

  const totalAttempts = records.length;
  const studentSet = new Set();
  let totalAccSum = 0;
  let perfectCount = 0;
  const classMap = {};
  const studentMap = {};
  const mistakeCountMap = {};
  const abilityMap = { phonics: { sum: 0, count: 0 }, listening: { sum: 0, count: 0 }, sentence: { sum: 0, count: 0 }, story: { sum: 0, count: 0 } };
  const unitMap = {};

  records.forEach(r => {
    const cls = r.gradeClass || '未知班級';
    const studentId = `${cls} (${r.number}) ${r.name}`;
    studentSet.add(studentId);
    const sc = Number(r.score) || 0;
    const totalQ = Number(r.total) || 1;
    const acc = (sc / totalQ) * 100;
    totalAccSum += acc;
    if (acc >= 99.5) perfectCount++;

    if (!classMap[cls]) classMap[cls] = { count: 0, students: new Set(), accSum: 0 };
    classMap[cls].count++;
    classMap[cls].students.add(studentId);
    classMap[cls].accSum += acc;

    if (!studentMap[studentId]) {
      studentMap[studentId] = { gradeClass: cls, number: r.number, name: r.name, attempts: 0, accSum: 0, totalQ: 0, modeCounts: {}, records: [] };
    }
    const sObj = studentMap[studentId];
    sObj.attempts++;
    sObj.accSum += acc;
    sObj.totalQ += totalQ;
    sObj.modeCounts[r.mode] = (sObj.modeCounts[r.mode] || 0) + 1;
    sObj.records.push(r);

    // Ability categorization (mutually exclusive)
    if (r.mode === 'phonicsQuiz') {
      abilityMap.phonics.sum += acc; abilityMap.phonics.count++;
    } else if (r.mode === 'listening') {
      abilityMap.listening.sum += acc; abilityMap.listening.count++;
    } else if (r.mode === 'sentenceListenEn' || r.mode === 'sentenceListenZh' || r.mode === 'sentencePractice' || r.mode === 'speaking') {
      abilityMap.sentence.sum += acc; abilityMap.sentence.count++;
    } else if (r.mode === 'storyRead' || r.mode === 'storyListening') {
      abilityMap.story.sum += acc; abilityMap.story.count++;
    }

    // Unit performance
    const uName = r.unit || '其他單元';
    if (!unitMap[uName]) unitMap[uName] = { count: 0, accSum: 0 };
    unitMap[uName].count++;
    unitMap[uName].accSum += acc;

    // Wrong items
    let wrongs = [];
    try {
      const parsed = typeof r.wrongDetails === 'string' ? JSON.parse(r.wrongDetails) : r.wrongDetails;
      if (Array.isArray(parsed)) wrongs = parsed;
      else if (parsed) wrongs = [parsed];
    } catch (e) {
      wrongs = String(r.wrongDetails || '').split(',');
    }
    wrongs.forEach(w => {
      const text = extractWrongItemText(w);
      if (text && text !== '[object Object]') {
        mistakeCountMap[text] = (mistakeCountMap[text] || 0) + 1;
      }
    });
  });

  const kpiTotalAttemptsEl = document.getElementById('kpiTotalAttempts');
  const kpiUniqueStudentsEl = document.getElementById('kpiUniqueStudents');
  const kpiAvgAttemptsEl = document.getElementById('kpiAvgAttemptsPerStudent');
  const kpiAvgAccEl = document.getElementById('kpiAvgAccuracy');
  const kpiPerfectCountEl = document.getElementById('kpiPerfectCount');
  const kpiPerfectRateEl = document.getElementById('kpiPerfectRate');

  if (kpiTotalAttemptsEl) kpiTotalAttemptsEl.innerHTML = `${totalAttempts} 次`;
  if (kpiUniqueStudentsEl) kpiUniqueStudentsEl.innerHTML = `${studentSet.size} 人`;
  if (kpiAvgAttemptsEl) kpiAvgAttemptsEl.innerHTML = `● 人均 ${(totalAttempts / Math.max(1, studentSet.size)).toFixed(2)} 次`;
  if (kpiAvgAccEl) kpiAvgAccEl.innerText = `${(totalAccSum / totalAttempts).toFixed(1)}%`;
  if (kpiPerfectCountEl) kpiPerfectCountEl.innerHTML = `${perfectCount} 次`;
  if (kpiPerfectRateEl) kpiPerfectRateEl.innerHTML = `● 滿分率 ${((perfectCount / totalAttempts) * 100).toFixed(1)}%`;

  const parsedClasses = Object.keys(classMap).map(clsKey => {
    const cData = classMap[clsKey];
    const avgAcc = cData.accSum / cData.count;
    return {
      name: clsKey, count: cData.count, students: cData.students.size, accuracy: avgAcc,
      status: avgAcc >= 90 ? '精熟表現' : (avgAcc < 80 ? '需介入輔導' : '穩定參與')
    };
  }).sort((a, b) => b.count - a.count);

  const parsedMistakes = Object.entries(mistakeCountMap).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const studentArr = Object.entries(studentMap).map(([label, s]) => ({ label, ...s, avgAcc: s.accSum / s.attempts }));

  const topAttempts = [...studentArr].sort((a, b) => b.attempts - a.attempts).slice(0, 10).map((s, i) => ({ rank: i + 1, label: `${s.gradeClass} ${s.number}號 ${s.name}`, count: `${s.attempts}次`, acc: `${s.avgAcc.toFixed(1)}%` }));
  
  // High score ranking: requires >= 3 attempts, sorted by avgAcc desc
  const topAcc = [...studentArr].filter(s => s.attempts >= 3).sort((a, b) => b.avgAcc - a.avgAcc).slice(0, 10).map((s, i) => ({ rank: i + 1, label: `${s.gradeClass} ${s.number}號 ${s.name}`, detail: `${s.attempts}次 (${s.totalQ}題)`, acc: `${s.avgAcc.toFixed(1)}%` }));

  // Need help: requires >= 2 attempts and avgAcc < 75%
  const needHelpArr = studentArr.filter(s => s.attempts >= 2 && s.avgAcc < 75).sort((a, b) => a.avgAcc - b.avgAcc).slice(0, 10).map((s, i) => {
    // Find weakest mode for student
    const modeScoreMap = {};
    s.records.forEach(rc => {
      const sc = Number(rc.score) || 0;
      const tot = Number(rc.total) || 1;
      if (!modeScoreMap[rc.mode]) modeScoreMap[rc.mode] = { sum: 0, count: 0 };
      modeScoreMap[rc.mode].sum += (sc / tot) * 100;
      modeScoreMap[rc.mode].count++;
    });
    let weakestMode = '綜合題型';
    let minAvg = 101;
    Object.entries(modeScoreMap).forEach(([mKey, mVal]) => {
      const avg = mVal.sum / mVal.count;
      if (avg < minAvg) { minAvg = avg; weakestMode = modeNames[mKey] || mKey; }
    });
    return { rank: i + 1, label: `${s.gradeClass} ${s.number}號 ${s.name}`, detail: `${s.attempts}次 (弱: ${weakestMode})`, acc: `${s.avgAcc.toFixed(1)}%` };
  });

  const ctb = document.getElementById('classTableBody');
  if (ctb) ctb.innerHTML = parsedClasses.map((c, idx) => `<tr><td>${idx + 1}</td><td>${escapeHtml(c.name)}</td><td>${c.count} 次</td><td>${c.students} 人</td><td>${c.accuracy.toFixed(1)}%</td><td>${c.status}</td></tr>`).join('');
  
  const tatEl = document.getElementById('topAttemptsTableBody');
  if (tatEl) tatEl.innerHTML = topAttempts.map(s => `<tr><td>${s.rank}</td><td>${escapeHtml(s.label)}</td><td>${s.count}</td><td>${s.acc}</td></tr>`).join('');
  
  const tacEl = document.getElementById('topAccuracyTableBody');
  if (tacEl) tacEl.innerHTML = topAcc.map(s => `<tr><td>${s.rank}</td><td>${escapeHtml(s.label)}</td><td>${s.detail}</td><td>${s.acc}</td></tr>`).join('');
  
  const nhtEl = document.getElementById('needHelpTableBody');
  if (nhtEl) nhtEl.innerHTML = needHelpArr.map(s => `<tr><td>${s.rank}</td><td>${escapeHtml(s.label)}</td><td>${escapeHtml(s.detail)}</td><td>${s.acc}</td></tr>`).join('');

  if (typeof Chart !== 'undefined') {
    // 1. Class Chart
    const ctxClass = document.getElementById('classChart')?.getContext('2d');
    if (ctxClass) {
      if (classChartInstance) classChartInstance.destroy();
      classChartInstance = new Chart(ctxClass, {
        type: 'bar',
        data: {
          labels: parsedClasses.map(c => c.name),
          datasets: [
            { type: 'bar', label: '次數', data: parsedClasses.map(c => c.count), backgroundColor: '#4f46e5', borderRadius: 6, yAxisID: 'y' },
            { type: 'line', label: '正確率(%)', data: parsedClasses.map(c => c.accuracy), borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, yAxisID: 'y1' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } } } }
      });
    }

    // 2. Ability Radar Chart
    const ctxRadar = document.getElementById('abilityRadarChart')?.getContext('2d');
    if (ctxRadar) {
      if (abilityRadarChartInstance) abilityRadarChartInstance.destroy();
      const pAvg = abilityMap.phonics.count ? (abilityMap.phonics.sum / abilityMap.phonics.count) : 0;
      const lAvg = abilityMap.listening.count ? (abilityMap.listening.sum / abilityMap.listening.count) : 0;
      const sAvg = abilityMap.sentence.count ? (abilityMap.sentence.sum / abilityMap.sentence.count) : 0;
      const stAvg = abilityMap.story.count ? (abilityMap.story.sum / abilityMap.story.count) : 0;
      abilityRadarChartInstance = new Chart(ctxRadar, {
        type: 'bar',
        data: {
          labels: ['🔤 Phonics', '👂 看圖聽力', '🎧 句子理解', '📖 故事聽力'],
          datasets: [{ label: '正確率 (%)', data: [pAvg, lAvg, sAvg, stAvg], backgroundColor: ['#f43f5e', '#3b82f6', '#10b981', '#8b5cf6'], borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } }
      });
    }

    // 3. Mistake Chart
    const ctxMistake = document.getElementById('mistakeChart')?.getContext('2d');
    if (ctxMistake) {
      if (mistakeChartInstance) mistakeChartInstance.destroy();
      mistakeChartInstance = new Chart(ctxMistake, {
        type: 'bar',
        data: {
          labels: parsedMistakes.map(m => m.word),
          datasets: [{ label: '錯誤次數', data: parsedMistakes.map(m => m.count), backgroundColor: '#f43f5e', borderRadius: 5 }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
      });
    }

    // 4. Unit Performance Chart
    const ctxUnit = document.getElementById('unitPerformanceChart')?.getContext('2d');
    if (ctxUnit) {
      if (unitPerformanceChartInstance) unitPerformanceChartInstance.destroy();
      const unitLabels = Object.keys(unitMap).sort();
      const unitAccs = unitLabels.map(u => unitMap[u].accSum / unitMap[u].count);
      const unitCounts = unitLabels.map(u => unitMap[u].count);
      unitPerformanceChartInstance = new Chart(ctxUnit, {
        type: 'bar',
        data: {
          labels: unitLabels,
          datasets: [
            { type: 'bar', label: '作答次數', data: unitCounts, backgroundColor: '#cbd5e1', borderRadius: 5, yAxisID: 'y' },
            { type: 'line', label: '單元平均正確率(%)', data: unitAccs, borderColor: '#0284c7', backgroundColor: '#0284c7', borderWidth: 2, yAxisID: 'y1' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } } } }
      });
    }
  }
}

function openStudentDiagnosticsByName(gradeClass, number, name) {
  const matchKey = `${gradeClass} (${number}) ${name}`;
  // Find student in allAdminRecords or studentMap
  const studentRecords = allAdminRecords.filter(r => r.gradeClass === gradeClass && String(r.number) === String(number) && r.name === name);
  if (!studentRecords.length) {
    alert(`找不到 ${gradeClass} ${number}號 ${name} 的作答紀錄！`);
    return;
  }
  
  const totalAttempts = studentRecords.length;
  let accSum = 0;
  let totalQ = 0;
  const mistakeCounts = {};
  const modeMap = {};

  studentRecords.forEach(r => {
    const sc = Number(r.score) || 0;
    const tot = Number(r.total) || 1;
    const acc = (sc / tot) * 100;
    accSum += acc;
    totalQ += tot;
    if (!modeMap[r.mode]) modeMap[r.mode] = { sum: 0, count: 0 };
    modeMap[r.mode].sum += acc;
    modeMap[r.mode].count++;

    try {
      let arr = [];
      const parsed = typeof r.wrongDetails === 'string' ? JSON.parse(r.wrongDetails) : r.wrongDetails;
      if (Array.isArray(parsed)) arr = parsed;
      else if (parsed) arr = [parsed];
      arr.map(extractWrongItemText).filter(Boolean).forEach(w => {
        if (w !== '[object Object]') mistakeCounts[w] = (mistakeCounts[w] || 0) + 1;
      });
    } catch (e) {}
  });

  const avgAcc = accSum / totalAttempts;
  let weakMode = '表現均衡';
  let minAvg = 101;
  Object.entries(modeMap).forEach(([mKey, mVal]) => {
    const avg = mVal.sum / mVal.count;
    if (avg < minAvg) { minAvg = avg; weakMode = modeNames[mKey] || mKey; }
  });

  const topWrong = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  document.getElementById('diagStudentName').textContent = `${name} 同學的學習診斷報告`;
  document.getElementById('diagStudentMeta').textContent = `${gradeClass} ｜ 座號 ${number} 號`;
  document.getElementById('diagTotalAttempts').textContent = `${totalAttempts} 次`;
  document.getElementById('diagAvgAccuracy').textContent = `${avgAcc.toFixed(1)}%`;
  document.getElementById('diagMasteredUnits').textContent = `${Object.keys(studentRecords.reduce((acc, r) => { if((Number(r.score)/Number(r.total))>=0.8) acc[r.unit]=1; return acc; }, {})).length} 個`;
  document.getElementById('diagWeakMode').textContent = weakMode;

  const wrongListEl = document.getElementById('diagWrongList');
  if (wrongListEl) {
    if (!topWrong.length) {
      wrongListEl.innerHTML = '<span class="text-xs text-slate-400 font-bold">目前無高頻錯題紀錄，表現優異！</span>';
    } else {
      wrongListEl.innerHTML = topWrong.map(([w, cnt]) => `<span class="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-2 py-1 rounded">${escapeHtml(w)} <span class="text-rose-500">(${cnt}次)</span></span>`).join('');
    }
  }

  const diagTbody = document.getElementById('diagRecordsTbody');
  if (diagTbody) {
    diagTbody.innerHTML = studentRecords.slice(0, 20).map(r => `<tr><td>${r.timestamp || '-'}</td><td>${escapeHtml(r.unit)}</td><td>${modeNames[r.mode] || r.mode}</td><td><strong>${r.score}/${r.total}</strong></td></tr>`).join('');
  }

  document.getElementById('studentDiagnosticModal').style.display = 'flex';
}

function closeStudentDiagnosticModal() {
  document.getElementById('studentDiagnosticModal').style.display = 'none';
}


let pendingBatchStudents = [];
function downloadStudentCsvTemplate() {
  const csvContent = "\uFEFF學校,班級,座號,姓名或遮罩,冊別 ID\n" + ACTIVE_SCHOOL.csvSampleRows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "學生名單匯入範例.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function submitSingleStudent() {
  const school = document.getElementById('singleAddSchool').value.trim();
  const cls = document.getElementById('singleAddClass').value.trim();
  const num = document.getElementById('singleAddNum').value.trim();
  const name = document.getElementById('singleAddName').value.trim();
  const book = document.getElementById('singleAddBook').value.trim();
  const msgEl = document.getElementById('singleAddMsg');
  if (!cls || !num || !name || !book) {
    msgEl.innerHTML = '❌ 請完整填寫班級、座號、姓名與冊別 ID';
    msgEl.className = 'mt-3 text-sm font-bold block text-rose-600';
    return;
  }
  msgEl.innerHTML = '⏳ 正在傳送資料中...';
  msgEl.className = 'mt-3 text-sm font-bold block text-sky-600';
  sendStudentData({
    action: 'importStudents',
    passcode: currentTeacher.passcode,
    students: [{ school, gradeClass: cls, number: num, name, bookId: book }]
  }, msgEl, () => {
    document.getElementById('singleAddNum').value = '';
    document.getElementById('singleAddName').value = '';
  });
}

function handleCsvFileSelect(event) {
  const file = event.target.files[0];
  if (!file || typeof Papa === 'undefined') return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      pendingBatchStudents = (results.data || []).map(r => ({
        school: String(r['學校'] || ACTIVE_SCHOOL.schoolValue).trim(),
        gradeClass: String(r['班級'] || r['Class'] || '').trim(),
        number: String(r['座號'] || r['Seat'] || '').trim(),
        name: String(r['姓名或遮罩'] || r['姓名'] || '').trim(),
        bookId: String(r['冊別 ID'] || r['冊別ID'] || r['BookId'] || '').trim()
      })).filter(s => s.gradeClass && s.number && s.name);

      if (!pendingBatchStudents.length) {
        alert('找不到有效資料！請確保 CSV 第一列包含「學校」、「班級」、「座號」、「姓名或遮罩」、「冊別 ID」。');
        return;
      }
      document.getElementById('csvCount').textContent = pendingBatchStudents.length;
      document.getElementById('csvPreviewTbody').innerHTML = pendingBatchStudents.slice(0, 100).map(s =>
        `<tr><td>${escapeHtml(s.school)}</td><td>${escapeHtml(s.gradeClass)}</td><td>${escapeHtml(s.number)}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.bookId)}</td></tr>`
      ).join('');
      document.getElementById('csvPreviewArea').classList.remove('hidden');
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
  msgEl.innerHTML = '⏳ 批次寫入資料庫中，請稍候...';
  msgEl.className = 'text-sm font-bold block text-sky-600 mt-2';
  sendStudentData({ action: 'importStudents', passcode: currentTeacher.passcode, students: pendingBatchStudents }, msgEl, () => {
    setTimeout(cancelBatchImport, 2500);
  });
}

function sendStudentData(payload, msgEl, onSuccess) {
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success') {
        msgEl.innerHTML = '✅ 學生資料已成功匯入！';
        if (onSuccess) onSuccess();
      } else {
        msgEl.innerHTML = `❌ 匯入失敗：${escapeHtml(data.message || '')}`;
      }
    })
    .catch(() => { msgEl.innerHTML = '⚠️ 網路連線異常，請稍後再試。'; });
}

function initNewExamForm() {
  const ts = new Date().getTime();
  document.getElementById('adminExamId').value = 'exam_' + ts;
  document.getElementById('adminExamTitle').value = '114學年度英語定期評量';
  document.getElementById('adminDisableAudio').checked = false;
  document.getElementById('adminExamSaveMsg').textContent = '';
  selectedListeningQuestionsMap.clear();
  const lTypeSel = document.getElementById('adminListeningTypeFilter');
  if (lTypeSel) lTypeSel.value = 'listen_image';

  if (currentTeacher && currentTeacher.allowedGrade) {
    const g = String(currentTeacher.allowedGrade);
    const bookSelect = document.getElementById('adminExamBookSelect');
    if ((g.includes('三') || g.includes('3')) && bookSelect) bookSelect.value = 'sf1';
    else if ((g.includes('四') || g.includes('4')) && bookSelect) bookSelect.value = 'sf3';
    else if ((g.includes('五') || g.includes('5')) && bookSelect) bookSelect.value = 'sf5';
    else if ((g.includes('六') || g.includes('6')) && bookSelect) bookSelect.value = 'sf7';
  }
  renderClassCheckboxes();
  populateQuestionPools();
}

function renderClassCheckboxes() {
  const container = document.getElementById('adminExamClassBoxes');
  let classList = Array.from(document.querySelectorAll('#class-select option')).map(o => o.value).filter(Boolean);
  if (currentTeacher && currentTeacher.allowedGrade) {
    classList = classList.filter(c => isClassAllowedForTeacher(c, currentTeacher));
  }
  container.innerHTML = `<label class="inline-flex items-center gap-1 font-black text-indigo-700 mr-2"><input type="checkbox" onchange="toggleAllExamClasses(this)" /> 全選</label>` +
    classList.map(c => `<label class="inline-flex items-center gap-1 text-xs font-bold"><input type="checkbox" class="exam-cls-chk" value="${escapeHtml(c)}" /> ${escapeHtml(c)}</label>`).join('');
}

function toggleAllExamClasses(master) {
  document.querySelectorAll('.exam-cls-chk').forEach(c => { c.checked = master.checked; });
}

let selectedListeningQuestionsMap = new Map();

function onAdminExamBookChange() {
  selectedListeningQuestionsMap.clear();
  populateQuestionPools();
}

function onAdminListeningTypeChange() {
  renderListeningPoolForSelectedType();
}

function toggleListeningQuestionSelection(chk) {
  const key = `${chk.dataset.qtype}__${chk.dataset.text}`;
  if (chk.checked) {
    selectedListeningQuestionsMap.set(key, {
      qType: chk.dataset.qtype,
      text: chk.dataset.text,
      word: chk.dataset.text,
      sentence: chk.dataset.text,
      meaning: chk.dataset.meaning || '',
      image: chk.dataset.img || '',
      audio: chk.dataset.audio || '',
      isListening: true
    });
  } else {
    selectedListeningQuestionsMap.delete(key);
  }
  updateSelectedCount();
}

function renderListeningPoolForSelectedType() {
  const targetBookId = document.getElementById('adminExamBookSelect').value;
  const listenBox = document.getElementById('adminListeningListContainer');
  const typeSel = document.getElementById('adminListeningTypeFilter');
  const qType = typeSel ? typeSel.value : 'listen_image';
  if (!listenBox) return;
  listenBox.innerHTML = '';

  if (typeof bookData === 'undefined' || !bookData[targetBookId]) return;
  const currentTargetBook = bookData[targetBookId];
  const vocabUnits = currentTargetBook.vocabularyWithPaths || {};
  const sentenceUnits = currentTargetBook.sentenceUnits || {};
  const dailyTalkUnits = currentTargetBook.dailyTalkUnits || {};

  let listenHtml = '';
  const typeBadgeMap = {
    listen_image: '🖼️ 看圖',
    listen_tf: '⭕❌ 是非',
    listen_response: '💬 聽句選意',
    listen_blank: '✏️ 克漏字',
    listen_order: '🧩 重組'
  };

  if (qType === 'listen_image' || qType === 'listen_tf') {
    Object.entries(vocabUnits).forEach(([uName, items]) => {
      if (uName.includes('全冊總複習')) return;
      const imgItems = (items || []).filter(hasImage);
      if (!imgItems.length) return;
      listenHtml += `<div class="bg-white p-2 rounded border mb-1"><div class="font-bold text-indigo-700 mb-1">${typeBadgeMap[qType]}｜${escapeHtml(uName)}</div>`;
      imgItems.forEach(it => {
        const text = it.word || it.sentence || '';
        const key = `${qType}__${text}`;
        const checked = selectedListeningQuestionsMap.has(key) ? 'checked' : '';
        listenHtml += `<label class="inline-flex items-center gap-1 mr-2 mb-1 cursor-pointer"><input type="checkbox" class="exam-l-chk" ${checked} data-qtype="${qType}" data-text="${escapeHtml(text)}" data-meaning="${escapeHtml(it.meaning || '')}" data-img="${escapeHtml(it.image || '')}" data-audio="${escapeHtml(it.audio || '')}" onchange="toggleListeningQuestionSelection(this)" /> ${escapeHtml(text)}</label>`;
      });
      listenHtml += '</div>';
    });
    listenBox.innerHTML = listenHtml || '此冊別尚無可用圖片素材';
  } else {
    const mergedSentencePools = { ...sentenceUnits, ...dailyTalkUnits };
    Object.entries(mergedSentencePools).forEach(([uName, items]) => {
      const validItems = (items || []).filter(it => {
        const s = (it.sentence || it.word || '').trim();
        if (!s) return false;
        if (qType === 'listen_order') {
          return s.split(/\s+/).filter(Boolean).length >= 2;
        }
        return true;
      });
      if (!validItems.length) return;
      listenHtml += `<div class="bg-white p-2 rounded border mb-1"><div class="font-bold text-indigo-700 mb-1">${typeBadgeMap[qType]}｜${escapeHtml(uName)}</div>`;
      validItems.forEach(it => {
        const s = it.sentence || it.word || '';
        const key = `${qType}__${s}`;
        const checked = selectedListeningQuestionsMap.has(key) ? 'checked' : '';
        listenHtml += `<label class="block mb-1 cursor-pointer"><input type="checkbox" class="exam-l-chk" ${checked} data-qtype="${qType}" data-text="${escapeHtml(s)}" data-meaning="${escapeHtml(it.meaning || '')}" data-img="${escapeHtml(it.image || '')}" data-audio="${escapeHtml(it.audio || '')}" onchange="toggleListeningQuestionSelection(this)" /> ${escapeHtml(s)} <span class="text-slate-400">(${escapeHtml(it.meaning || '')})</span></label>`;
      });
      listenHtml += '</div>';
    });
    listenBox.innerHTML = listenHtml || '此冊別尚無可用句型素材';
  }
}

function populateQuestionPools() {
  const targetBookId = document.getElementById('adminExamBookSelect').value;
  const phonicsBox = document.getElementById('adminPhonicsListContainer');
  const sentenceBox = document.getElementById('adminSentenceListContainer');
  if (phonicsBox) phonicsBox.innerHTML = '';
  if (sentenceBox) sentenceBox.innerHTML = '';

  renderListeningPoolForSelectedType();

  if (typeof bookData === 'undefined' || !bookData[targetBookId]) return;
  const currentTargetBook = bookData[targetBookId];
  const vocabUnits = currentTargetBook.vocabularyWithPaths || {};
  const sentenceUnits = currentTargetBook.sentenceUnits || {};

  Object.entries(vocabUnits).forEach(([unitName, items]) => {
    if (unitName.includes('全冊總複習')) return;
    const isPhonicsUnit = unitName.toLowerCase().includes('phonics') || (items || []).some(x => x.category === 'phonics');
    if (!isPhonicsUnit) return;
    let html = `<div class="bg-white p-2 rounded border mb-1"><div class="font-bold text-rose-700 mb-1">🔤 ${escapeHtml(unitName)}</div>`;
    items.forEach(it => {
      const w = it.word || it.sentence;
      html += `<label class="block"><input type="checkbox" class="exam-p-chk" data-word="${escapeHtml(w)}" data-meaning="${escapeHtml(it.meaning || '')}" data-audio="${escapeHtml(it.audio || '')}" onchange="updateSelectedCount()" /> ${escapeHtml(w)} (${escapeHtml(it.meaning || '')})</label>`;
    });
    html += '</div>';
    if (phonicsBox) phonicsBox.insertAdjacentHTML('beforeend', html);
  });

  Object.entries(sentenceUnits).forEach(([unitName, items]) => {
    let html = `<div class="bg-white p-2 rounded border mb-1"><div class="font-bold text-emerald-700 mb-1">🧩 ${escapeHtml(unitName)}</div>`;
    items.forEach(it => {
      const s = it.sentence || it.word;
      html += `<label class="block"><input type="checkbox" class="exam-s-chk" data-sentence="${escapeHtml(s)}" data-meaning="${escapeHtml(it.meaning || '')}" data-audio="${escapeHtml(it.audio || '')}" onchange="updateSelectedCount()" /> ${escapeHtml(s)} (${escapeHtml(it.meaning || '')})</label>`;
    });
    html += '</div>';
    if (sentenceBox) sentenceBox.insertAdjacentHTML('beforeend', html);
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const lCount = selectedListeningQuestionsMap.size;
  const pCount = document.querySelectorAll('.exam-p-chk:checked').length;
  const sCount = document.querySelectorAll('.exam-s-chk:checked').length;
  const lEl = document.getElementById('adminListeningCount');
  if (lEl) lEl.textContent = `已選 ${lCount} 題`;
  document.getElementById('adminPhonicsCount').textContent = `已選 ${pCount} 題`;
  document.getElementById('adminSentenceCount').textContent = `已選 ${sCount} 題`;
}

function saveAdminExamConfig() {
  const examId = document.getElementById('adminExamId').value.trim();
  const title = document.getElementById('adminExamTitle').value.trim();
  const examType = document.getElementById('adminExamType').value;
  const bookId = document.getElementById('adminExamBookSelect').value;
  const disableAudio = document.getElementById('adminDisableAudio').checked;
  const selectedClasses = Array.from(document.querySelectorAll('.exam-cls-chk:checked')).map(c => c.value);
  const listeningQuestions = Array.from(selectedListeningQuestionsMap.values());
  const phonicsQuestions = Array.from(document.querySelectorAll('.exam-p-chk:checked')).map(c => ({
    word: c.dataset.word,
    meaning: c.dataset.meaning,
    audio: c.dataset.audio || ''
  }));
  const sentenceQuestions = Array.from(document.querySelectorAll('.exam-s-chk:checked')).map(c => ({
    sentence: c.dataset.sentence,
    meaning: c.dataset.meaning,
    audio: c.dataset.audio || ''
  }));

  if (!title || !selectedClasses.length || (!listeningQuestions.length && !phonicsQuestions.length && !sentenceQuestions.length)) {
    alert('請填寫標題、勾選至少一個班級，並挑選考試題目！');
    return;
  }
  const combinedPhonics = [...phonicsQuestions, ...listeningQuestions];
  const msg = document.getElementById('adminExamSaveMsg');
  msg.textContent = '⏳ 發布中...';
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'saveExamConfig',
      passcode: currentTeacher.passcode,
      exam: { examId, title, examType, bookId, targetClasses: selectedClasses, phonicsQuestions: combinedPhonics, sentenceQuestions, disableAudio, isActive: true }
    })
  })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success') {
        msg.textContent = '✅ 考卷已發布！';
        loadExamsForTeacher();
      } else {
        msg.textContent = '❌ 發布失敗：' + (data.message || '');
      }
    });
}

function loadExamsForTeacher() {
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getExamConfigsList' })
  })
    .then(r => r.json())
    .then(data => {
      allPublishedExams = data.exams || [];
      const select = document.getElementById('examFilterExamId');
      select.innerHTML = '<option value="">-- 請選擇考卷 --</option>' + allPublishedExams.map(ex => `<option value="${ex.examId}">${escapeHtml(ex.title)}</option>`).join('');
      const classSel = document.getElementById('examFilterClass');
      let classList = Array.from(document.querySelectorAll('#class-select option')).map(o => o.value).filter(Boolean);
      if (currentTeacher && currentTeacher.allowedGrade) classList = classList.filter(c => isClassAllowedForTeacher(c, currentTeacher));
      classSel.innerHTML = '<option value="ALL">全部班級</option>' + classList.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    });
}

function fetchAdminExamRecords() {
  const examId = document.getElementById('examFilterExamId').value;
  const gradeClass = document.getElementById('examFilterClass').value;
  const tbody = document.getElementById('adminExamRecordsTbody');
  if (!examId) { tbody.innerHTML = '<tr><td colspan="10">請先選擇考卷</td></tr>'; return; }
  tbody.innerHTML = '<tr><td colspan="10">查詢成績中...</td></tr>';
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getExamReport', examId, gradeClass })
  })
    .then(r => r.json())
    .then(data => {
      let list = data.records || [];
      if (currentTeacher && currentTeacher.allowedGrade) list = list.filter(r => isClassAllowedForTeacher(r.gradeClass, currentTeacher));
      if (!list.length) { tbody.innerHTML = '<tr><td colspan="10">尚無交卷資料</td></tr>'; return; }
      tbody.innerHTML = list.map(r => `<tr>
        <td>${r.timestamp}</td><td>${r.gradeClass}</td><td>${r.number} 號</td><td>${r.name}</td>
        <td><strong>${r.score} 分</strong></td><td>${r.listenScore || '-'}</td><td>${r.phonicsScore || '-'}</td><td>${r.sentenceScore || '-'}</td>
        <td>${r.wrongDetails || '-'}</td>
        <td><button type="button" onclick="handleResetSingleStudent('${r.examId}','${r.gradeClass}','${r.number}','${r.name}')" class="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">🔄 允許重測</button></td>
      </tr>`).join('');
    });
}

function handleResetSingleStudent(examId, gradeClass, number, studentName) {
  if (!confirm(`確定要允許「${gradeClass} ${number}號 ${studentName}」重新測驗嗎？`)) return;
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'resetStudentExamScore', passcode: currentTeacher.passcode, examId, gradeClass, number })
  })
    .then(r => r.json())
    .then(data => {
      alert(data.message || '操作完成');
      fetchAdminExamRecords();
    });
}

function handleDeleteCurrentExam() {
  const examId = document.getElementById('examFilterExamId').value;
  if (!examId) { alert('請先選擇要刪除的考卷！'); return; }
  if (!confirm('確定要永久刪除此試卷與所有學生成績嗎？')) return;
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'deleteExamCascade', passcode: currentTeacher.passcode, examId })
  })
    .then(r => r.json())
    .then(data => {
      alert(data.message || '已刪除');
      loadExamsForTeacher();
    });
}

function exportExamRecordsCsv() {
  const tbody = document.getElementById('adminExamRecordsTbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (!rows.length || rows[0].innerText.includes('請先選擇')) { alert('目前無成績可供匯出'); return; }
  let csv = "\uFEFF時間,班級,座號,姓名,總成績,聽力得分,Phonics得分,句型得分,未通過題目\n";
  rows.forEach(tr => {
    const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
    if (cols.length >= 9) csv += cols.slice(0, 9).join(',') + "\n";
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${ACTIVE_SCHOOL.schoolValue}_定期考成績_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
