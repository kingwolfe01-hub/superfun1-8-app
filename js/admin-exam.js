function initNewExamForm() {
  const ts = new Date().getTime();
  document.getElementById('adminExamId').value = 'exam_' + ts;
  document.getElementById('adminExamTitle').value = '114學年度英語定期評量';
  document.getElementById('adminDisableAudio').checked = false;
  document.getElementById('adminExamSaveMsg').textContent = '';

  // 依教師年級自動連動冊別
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
  let classList = Array.from(document.querySelectorAll('#class-select option'))
    .map(o => o.value).filter(Boolean);

  // 僅顯示該任課老師所屬年級的班級
  if (currentTeacher && currentTeacher.allowedGrade) {
    classList = classList.filter(c => isClassAllowedForTeacher(c, currentTeacher));
  }

  container.innerHTML = `
    <label class="inline-flex items-center gap-1 font-bold text-xs bg-indigo-50 px-2 py-1 rounded">
      <input type="checkbox" id="chkClassAll" onchange="toggleAllExamClasses(this)"> 全選
    </label>
  ` + classList.map(c => `
    <label class="inline-flex items-center gap-1 text-xs">
      <input type="checkbox" class="exam-cls-chk" value="${escapeHtml(c)}" onchange="onClassCheckboxChanged(this)"> ${escapeHtml(c)}
    </label>
  `).join('');
}

function toggleAllExamClasses(master) {
  document.querySelectorAll('.exam-cls-chk').forEach(c => c.checked = master.checked);
}

function onClassCheckboxChanged(chk) {
  if (chk.checked) {
    const clsName = chk.value;
    const bookSelect = document.getElementById('adminExamBookSelect');
    if (clsName.includes('三年') && bookSelect.value !== 'sf1') { bookSelect.value = 'sf1'; onAdminExamBookChange(); }
    else if (clsName.includes('四年') && bookSelect.value !== 'sf3') { bookSelect.value = 'sf3'; onAdminExamBookChange(); }
    else if (clsName.includes('五年') && bookSelect.value !== 'sf5') { bookSelect.value = 'sf5'; onAdminExamBookChange(); }
    else if (clsName.includes('六年') && bookSelect.value !== 'sf7') { bookSelect.value = 'sf7'; onAdminExamBookChange(); }
  }
}

function onAdminExamBookChange() {
  populateQuestionPools();
}

function populateQuestionPools() {
  const targetBookId = document.getElementById('adminExamBookSelect').value;
  const phonicsBox = document.getElementById('adminPhonicsListContainer');
  const sentenceBox = document.getElementById('adminSentenceListContainer');
  const listenBox = document.getElementById('adminListeningListContainer');

  if (phonicsBox) phonicsBox.innerHTML = '';
  if (sentenceBox) sentenceBox.innerHTML = '';
  if (listenBox) listenBox.innerHTML = '';

  if (typeof bookData === 'undefined' || !bookData[targetBookId]) {
    if (phonicsBox) phonicsBox.innerHTML = '<div class="text-slate-400 p-2">此冊別尚未載入題庫</div>';
    if (sentenceBox) sentenceBox.innerHTML = '<div class="text-slate-400 p-2">此冊別尚未載入題庫</div>';
    if (listenBox) listenBox.innerHTML = '<div class="text-slate-400 p-2">此冊別尚未載入題庫</div>';
    return;
  }

  const currentTargetBook = bookData[targetBookId];
  const rawUnits = currentTargetBook.rawUnits || {};
  const sentenceUnits = currentTargetBook.sentenceUnits || {};

  // ================= 1. 多元聽力測驗題庫 (5種題型) =================
  let listenHtml = '';

  // 1-A. 單字聽音選圖 (listen_image)
  let imgCount = 0;
  let imgHtml = '';
  Object.entries(rawUnits).forEach(([uName, items]) => {
    const imgItems = (items || []).filter(hasImage);
    if (!imgItems.length) return;
    imgCount += imgItems.length;
    imgHtml += `<div class="mb-2"><strong class="text-indigo-800 text-[11px]">📁 ${escapeHtml(uName)}</strong><div class="grid grid-cols-2 gap-1 mt-1">`;
    imgItems.forEach(it => {
      imgHtml += `
        <label class="flex items-center gap-1 hover:bg-blue-50 p-1 rounded cursor-pointer border border-slate-100">
          <input type="checkbox" class="exam-l-chk" data-qtype="listen_image" data-text="${escapeHtml(it.word)}" data-meaning="${escapeHtml(it.meaning||'')}" data-img="${escapeHtml(it.image||'')}" onchange="updateSelectedCount()">
          <span class="font-bold text-slate-700">${escapeHtml(it.word)}</span>
        </label>
      `;
    });
    imgHtml += `</div></div>`;
  });
  if (imgCount > 0) {
    listenHtml += `
      <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs mb-2.5">
        <div class="flex items-center justify-between pb-1 border-b border-slate-100 mb-1.5">
          <span class="font-black text-blue-900">🖼️ 1. 單字聽音選圖</span>
          <span class="text-[11px] text-blue-600 font-bold">${imgCount} 題</span>
        </div>
        ${imgHtml}
      </div>
    `;
  }

  // 1-B. 句型聽音應答 (listen_response)、重組 (listen_order)、克漏字 (listen_blank)
  let sentListenCount = 0;
  let sentListenHtml = '';
  Object.entries(sentenceUnits).forEach(([uName, items]) => {
    if (!items || !items.length) return;
    sentListenCount += items.length;
    sentListenHtml += `
      <div class="mb-2">
        <strong class="text-emerald-800 text-[11px]">📁 ${escapeHtml(uName)}</strong>
        <div class="space-y-1.5 mt-1">
    `;
    items.forEach(it => {
      const s = it.sentence || it.word;
      sentListenHtml += `
        <div class="p-1.5 bg-slate-50 rounded border border-slate-200 hover:bg-blue-50/60">
          <div class="font-bold text-slate-800">${escapeHtml(s)}</div>
          <div class="text-[11px] text-slate-400 mb-1">(${escapeHtml(it.meaning||'')})</div>
          <div class="flex flex-wrap gap-2 text-[11px]">
            <label class="inline-flex items-center gap-1 cursor-pointer font-bold text-indigo-700">
              <input type="checkbox" class="exam-l-chk" data-qtype="listen_response" data-text="${escapeHtml(s)}" data-meaning="${escapeHtml(it.meaning||'')}" onchange="updateSelectedCount()"> 💬 應答題
            </label>
            <label class="inline-flex items-center gap-1 cursor-pointer font-bold text-emerald-700">
              <input type="checkbox" class="exam-l-chk" data-qtype="listen_order" data-text="${escapeHtml(s)}" data-meaning="${escapeHtml(it.meaning||'')}" onchange="updateSelectedCount()"> 🔀 重組題
            </label>
            <label class="inline-flex items-center gap-1 cursor-pointer font-bold text-amber-700">
              <input type="checkbox" class="exam-l-chk" data-qtype="listen_blank" data-text="${escapeHtml(s)}" data-meaning="${escapeHtml(it.meaning||'')}" onchange="updateSelectedCount()"> 🧩 克漏題
            </label>
          </div>
        </div>
      `;
    });
    sentListenHtml += `</div></div>`;
  });

  if (sentListenCount > 0) {
    listenHtml += `
      <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs mb-2.5">
        <div class="flex items-center justify-between pb-1 border-b border-slate-100 mb-1.5">
          <span class="font-black text-indigo-900">💬 2. 句型聽音 (應答／重組／克漏)</span>
          <span class="text-[11px] text-indigo-600 font-bold">${sentListenCount} 句型</span>
        </div>
        ${sentListenHtml}
      </div>
    `;
  }

  // 1-C. 聽音是非題 (listen_tf) - 運用有圖項目
  if (imgCount > 0) {
    listenHtml += `
      <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs mb-2">
        <div class="flex items-center justify-between pb-1 border-b border-slate-100 mb-1.5">
          <span class="font-black text-rose-900">🎯 3. 聽音是非判斷 (⭕/❌)</span>
        </div>
        <div class="grid grid-cols-2 gap-1">
    `;
    Object.entries(rawUnits).forEach(([uName, items]) => {
      (items || []).filter(hasImage).forEach(it => {
        listenHtml += `
          <label class="flex items-center gap-1 hover:bg-rose-50 p-1 rounded cursor-pointer border border-slate-100">
            <input type="checkbox" class="exam-l-chk" data-qtype="listen_tf" data-text="${escapeHtml(it.word)}" data-meaning="${escapeHtml(it.meaning||'')}" data-img="${escapeHtml(it.image||'')}" onchange="updateSelectedCount()">
            <span class="font-bold text-slate-700">${escapeHtml(it.word)}</span>
          </label>
        `;
      });
    });
    listenHtml += `</div></div>`;
  }

  if (listenBox) {
    listenBox.innerHTML = listenHtml || '<div class="text-slate-400 p-2">此冊別尚未設定聽力素材</div>';
  }

  // ================= 2. Phonics 發音單元 (口說) =================
  let pUnitCount = 0;
  Object.entries(rawUnits).forEach(([unitName, items]) => {
    const isPhonicsUnit = unitName.toLowerCase().includes('phonics') || (items || []).some(x => x.category === 'phonics');
    if (!isPhonicsUnit) return;
    pUnitCount++;

    const safeUnitId = 'p_unit_' + pUnitCount;
    const unitCard = document.createElement('div');
    unitCard.className = 'bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs mb-2';
    
    let html = `
      <div class="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
        <label class="font-black text-slate-800 flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" class="unit-master-chk" data-target-group="${safeUnitId}" onchange="toggleUnitGroup(this)">
          📁 ${escapeHtml(unitName)}
        </label>
        <span class="text-[11px] text-indigo-500 font-bold">${items.length} 題</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-2" id="${safeUnitId}">
    `;

    items.forEach(it => {
      const w = it.word || it.sentence;
      html += `
        <label class="flex items-center gap-1 hover:bg-indigo-50 p-1 rounded cursor-pointer">
          <input type="checkbox" class="exam-p-chk" data-word="${escapeHtml(w)}" data-meaning="${escapeHtml(it.meaning||'')}" onchange="updateSelectedCount()">
          <span class="font-bold text-slate-700">${escapeHtml(w)}</span>
          <span class="text-slate-400 text-[10px]">(${escapeHtml(it.meaning||'')})</span>
        </label>
      `;
    });

    html += `</div>`;
    unitCard.innerHTML = html;
    if (phonicsBox) phonicsBox.appendChild(unitCard);
  });

  if (pUnitCount === 0 && phonicsBox) {
    phonicsBox.innerHTML = '<div class="text-slate-400 p-2">此冊別無專屬 Phonics 單元</div>';
  }

  // ================= 3. Sentence 句型單元 (口說) =================
  let sUnitCount = 0;
  Object.entries(sentenceUnits).forEach(([unitName, items]) => {
    sUnitCount++;
    const safeUnitId = 's_unit_' + sUnitCount;
    const unitCard = document.createElement('div');
    unitCard.className = 'bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs mb-2';

    let html = `
      <div class="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
        <label class="font-black text-slate-800 flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" class="unit-master-chk" data-target-group="${safeUnitId}" onchange="toggleUnitGroup(this)">
          📁 ${escapeHtml(unitName)}
        </label>
        <span class="text-[11px] text-emerald-600 font-bold">${items.length} 句</span>
      </div>
      <div class="space-y-1 pl-2" id="${safeUnitId}">
    `;

    items.forEach(it => {
      const s = it.sentence || it.word;
      html += `
        <label class="flex items-center gap-1.5 hover:bg-emerald-50 p-1 rounded cursor-pointer">
          <input type="checkbox" class="exam-s-chk" data-sentence="${escapeHtml(s)}" data-meaning="${escapeHtml(it.meaning||'')}" onchange="updateSelectedCount()">
          <span class="font-bold text-slate-800">${escapeHtml(s)}</span>
          <span class="text-slate-400 text-xs">(${escapeHtml(it.meaning||'')})</span>
        </label>
      `;
    });

    html += `</div>`;
    unitCard.innerHTML = html;
    if (sentenceBox) sentenceBox.appendChild(unitCard);
  });

  if (sUnitCount === 0 && sentenceBox) {
    sentenceBox.innerHTML = '<div class="text-slate-400 p-2">此冊別無專屬句型單元</div>';
  }

  updateSelectedCount();
}

function toggleUnitGroup(master) {
  const groupContainer = document.getElementById(master.dataset.targetGroup);
  if (groupContainer) {
    groupContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.checked = master.checked;
    });
  }
  updateSelectedCount();
}

function updateSelectedCount() {
  const lCount = document.querySelectorAll('.exam-l-chk:checked').length;
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
  const disableAudio = document.getElementById('adminDisableAudio').checked;
  const selectedClasses = Array.from(document.querySelectorAll('.exam-cls-chk:checked')).map(c => c.value);

  const listeningQuestions = Array.from(document.querySelectorAll('.exam-l-chk:checked')).map(c => ({
    qType: c.dataset.qtype,
    text: c.dataset.text,
    word: c.dataset.text,
    sentence: c.dataset.text,
    meaning: c.dataset.meaning || '',
    image: c.dataset.img || '',
    isListening: true
  }));

  const phonicsQuestions = Array.from(document.querySelectorAll('.exam-p-chk:checked')).map(c => ({
    word: c.dataset.word, meaning: c.dataset.meaning
  }));
  const sentenceQuestions = Array.from(document.querySelectorAll('.exam-s-chk:checked')).map(c => ({
    sentence: c.dataset.sentence, meaning: c.dataset.meaning
  }));

  if (!title || !selectedClasses.length || (!listeningQuestions.length && !phonicsQuestions.length && !sentenceQuestions.length)) {
    alert('請填寫標題、勾選至少一個班級，並挑選考試題目（聽力或口說至少一題）！');
    return;
  }

  // 關鍵相容機制：Google Sheets 試算表原本只具備 phonicsList (E欄) 與 sentenceList (F欄)，
  // 將聽力題一併裝載入 phonicsList 中儲存，試算表即可完整寫入，學生端亦能無縫解析還原！
  const combinedPhonics = [
    ...phonicsQuestions,
    ...listeningQuestions
  ];

  const payload = {
    action: 'saveExamConfig',
    passcode: currentTeacher.passcode,
    exam: {
      examId, title, examType,
      targetClasses: selectedClasses,
      listeningQuestions: listeningQuestions,
      listeningList: listeningQuestions,
      phonicsQuestions: combinedPhonics,
      phonicsList: combinedPhonics,
      sentenceQuestions: sentenceQuestions,
      sentenceList: sentenceQuestions,
      disableAudio: disableAudio,
      isActive: true
    }
  };

  const msg = document.getElementById('adminExamSaveMsg');
  msg.textContent = '⏳ 發布中...';

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === 'success') {
      msg.textContent = '✅ 考卷已發布！學生登入即會收到。';
      loadExamsForTeacher();
    } else {
      msg.textContent = '❌ 發布失敗：' + (data.message || '');
    }
  })
  .catch(err => {
    msg.textContent = '❌ 連線失敗，請檢查網路後重試。';
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
    select.innerHTML = '<option value="">-- 請選擇考卷 --</option>' +
      allPublishedExams.map(ex => `<option value="${escapeHtml(ex.examId)}">${escapeHtml(ex.title)}</option>`).join('');

    const classSel = document.getElementById('examFilterClass');
    let classList = Array.from(document.querySelectorAll('#class-select option')).map(o => o.value).filter(Boolean);
    // 僅顯示該任課老師所屬年級的班級
    if (currentTeacher && currentTeacher.allowedGrade) {
      classList = classList.filter(c => isClassAllowedForTeacher(c, currentTeacher));
    }
    classSel.innerHTML = '<option value="ALL">全部班級</option>' + classList.map(c => `<option value="${c}">${c}</option>`).join('');
  })
  .catch(err => {
    console.error('loadExamsForTeacher error:', err);
  });
}

function fetchAdminExamRecords() {
  const examId = document.getElementById('examFilterExamId').value;
  const gradeClass = document.getElementById('examFilterClass').value;
  const tbody = document.getElementById('adminExamRecordsTbody');

  if (!examId) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-6">請先選擇考卷</td></tr>';
    return;
  }

  tbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-500 py-6">查詢成績中...</td></tr>';

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getExamReport', examId, gradeClass })
  })
  .then(r => r.json())
  .then(data => {
    let list = data.records || [];
    // 依教師年級進行雙重過濾防護
    if (currentTeacher && currentTeacher.allowedGrade) {
      list = list.filter(r => isClassAllowedForTeacher(r.gradeClass, currentTeacher));
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-slate-400 py-6">尚無此班級交卷資料</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td class="p-2.5 text-slate-500">${escapeHtml(r.timestamp)}</td>
        <td class="p-2.5 font-bold">${escapeHtml(r.gradeClass)}</td>
        <td class="p-2.5 text-center">${escapeHtml(r.number)} 號</td>
        <td class="p-2.5 font-bold">${r.name}</td>
        <td class="p-2.5 text-right font-black text-emerald-600">${r.score} 分</td>
        <td class="p-2.5 text-center font-bold text-blue-700">${r.listenScore || r.listeningScore || '-'}</td>
        <td class="p-2.5 text-center">${r.phonicsScore || '-'}</td>
        <td class="p-2.5 text-center">${r.sentenceScore || '-'}</td>
        <td class="p-2.5 text-rose-600 font-semibold">${r.wrongDetails || '-'}</td>
        <td class="p-2.5 text-center">
          <button class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs"
            onclick="handleResetSingleStudent('${escapeHtml(r.examId)}','${escapeHtml(r.gradeClass)}','${escapeHtml(r.number)}','${escapeHtml(r.name)}')">
            🔄 允許重測
          </button>
        </td>
      </tr>
    `).join('');
  });
}

// 老師手動挑選學生重測（解鎖並清除成績）
function handleResetSingleStudent(examId, gradeClass, number, studentName) {
  const isConfirmed = confirm(`⚠️【開放重測確認】\n\n確定要允許「${gradeClass} ${number}號 ${studentName}」重新測驗嗎？\n\n執行後將清除該生原先的交卷紀錄，學生再次登入即可重新進入測驗。`);
  if (!isConfirmed) return;

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'resetStudentExamScore',
      passcode: currentTeacher.passcode,
      examId: examId,
      gradeClass: gradeClass,
      number: number
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === 'success') {
      alert(`✅ ${data.message}`);
      fetchAdminExamRecords();
    } else {
      alert(`❌ 操作失敗：${data.message}`);
    }
  })
  .catch(err => {
    alert('網路連線失敗，請稍候再試。');
  });
}

function handleDeleteCurrentExam() {
  const examId = document.getElementById('examFilterExamId').value;
  if (!examId) {
    alert('請先在下拉選單中「選擇要刪除的考卷」！');
    return;
  }

  const selectedOption = document.querySelector(`#examFilterExamId option[value="${examId}"]`);
  const examTitle = selectedOption ? selectedOption.textContent : examId;

  const isConfirmed = confirm(`⚠️【極危險操作確認】\n\n您確定要永久刪除「${examTitle}」嗎？\n\n此操作將會：\n1. 永久撤銷該試卷發布\n2. 連帶將所有學生的作答成績全數徹底清除\n\n確定執行請按「確定」，若要保留成績請按「取消」！`);
  
  if (!isConfirmed) return;

  const tbody = document.getElementById('adminExamRecordsTbody');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center text-rose-600 py-6">正在刪除考卷並連帶清除學生成績中...</td></tr>';

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'deleteExamCascade',
      passcode: currentTeacher.passcode,
      examId: examId
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === 'success') {
      alert(`✅ ${data.message}`);
      loadExamsForTeacher();
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-6">考卷已刪除，請重新選擇考卷</td></tr>';
    } else {
      alert(`❌ 刪除失敗：${data.message}`);
      fetchAdminExamRecords();
    }
  })
  .catch(err => {
    alert('網路連線失敗，刪除請求未完成。');
    fetchAdminExamRecords();
  });
}

function exportExamRecordsCsv() {
  const tbody = document.getElementById('adminExamRecordsTbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (!rows.length || rows[0].innerText.includes('請先選擇')) {
    alert('目前無成績可供匯出');
    return;
  }

  let csv = "\uFEFF時間,班級,座號,姓名,總成績,聽力得分,Phonics得分,句型得分,未通過題目\n";
  rows.forEach(tr => {
    const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
    if (cols.length >= 9) {
      csv += cols.slice(0, 9).join(',') + "\n";
    }
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${ACTIVE_SCHOOL.schoolName}_定期考成績_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
