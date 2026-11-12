
let isExamSubmitting = false;

function getExamCheckpointKey() {
  if (!studentAssignedExam || !loggedInStudent) return '';
  return `sf_exam_ckpt_${ACTIVE_SCHOOL.schoolId}_${studentAssignedExam.examId}_${loggedInStudent.gradeClass}_${loggedInStudent.number}`;
}

function saveExamCheckpoint() {
  const key = getExamCheckpointKey();
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      examQuestionsQueue,
      examCurrentIdx,
      examScoreState,
      examWrongDetails
    }));
  } catch (e) {}
}

function clearExamCheckpoint() {
  const key = getExamCheckpointKey();
  if (!key) return;
  try { sessionStorage.removeItem(key); } catch (e) {}
}

function checkActiveStudentExam(gradeClass, number) {
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'checkStudentExam', gradeClass: gradeClass, number: number || '' })
  })
  .then(r => r.json())
  .then(data => {
    const banner = document.getElementById('student-exam-banner');
    const titleEl = document.getElementById('exam-banner-title');
    const descEl = document.getElementById('exam-banner-desc');
    const tagEl = document.getElementById('exam-banner-tag');
    const startBtn = document.getElementById('exam-start-action-btn');

    if (data.status === 'success' && data.exam && data.exam.isActive) {
      studentAssignedExam = data.exam;
      titleEl.textContent = data.exam.title;

      if (studentAssignedExam.hasSubmitted) {
        // 🔒 已交過卷：鎖定並禁止重新測驗
        banner.style.display = 'block';
        banner.style.background = '#f0fdf4';
        banner.style.borderColor = '#16a34a';

        tagEl.style.background = '#16a34a';
        tagEl.textContent = '✅ 已完成定期評量';

        titleEl.style.color = '#166534';
        descEl.style.color = '#14532d';
        descEl.innerHTML = `您已於本次定期考完成交卷，獲得 <strong>${studentAssignedExam.previousScore !== null ? studentAssignedExam.previousScore + ' 分' : '已交卷'}</strong>。<br><span style="font-size:0.8rem;color:#64748b;">（正式測驗每人限考一次，如需補考或重測，請洽詢任課老師開啟權限）</span>`;

        startBtn.disabled = true;
        startBtn.style.background = '#94a3b8';
        startBtn.style.cursor = 'not-allowed';
        startBtn.style.boxShadow = 'none';
        startBtn.innerHTML = '🔒 已交卷（測驗已鎖定）';
      } else {
        // 🎯 尚未交卷或老師已開放重測：允許進入作答
        banner.style.display = 'block';
        banner.style.background = '#fef2f2';
        banner.style.borderColor = '#ef4444';

        tagEl.style.background = '#dc2626';
        tagEl.textContent = '🔔 正式定期評量';

        titleEl.style.color = '#991b1b';
        descEl.style.color = '#7f1d1d';
        descEl.textContent = '老師已指派英語定期測驗（含聽力與口說評量），請在安靜環境下點擊開始作答。';

        startBtn.disabled = false;
        startBtn.style.background = 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)';
        startBtn.style.cursor = 'pointer';
        startBtn.style.boxShadow = '0 8px 16px rgba(220,38,38,0.25)';
        startBtn.innerHTML = '🎯 開始進入定期考作答';
      }
    } else {
      studentAssignedExam = null;
      banner.style.display = 'none';
    }
  })
  .catch(() => {});
}

// 2. 學生端：進入考試（佇列順序：聽力題 -> 發音口說 -> 句型口說）
function startOfficialExam() {
  if (!studentAssignedExam) return;
  if (studentAssignedExam.hasSubmitted) {
    alert('您已完成本次定期考評量！如需補測，請向任課老師申請開放。');
    return;
  }

  // 雙向相容解析：同時相容 Google Sheet 的 phonicsList/sentenceList 欄位與獨立 listeningQuestions 格式
  const rawP = studentAssignedExam.phonicsList || studentAssignedExam.phonicsQuestions || [];
  const rawS = studentAssignedExam.sentenceList || studentAssignedExam.sentenceQuestions || [];
  const rawL = studentAssignedExam.listeningList || studentAssignedExam.listeningQuestions || [];

  let lList = Array.isArray(rawL) ? [...rawL] : [];
  let pList = [];
  (rawP || []).forEach(q => {
    if (q.isListening || (q.qType && q.qType.startsWith('listen_'))) {
      lList.push(q);
    } else {
      pList.push({ ...q, qType: 'phonics' });
    }
  });

  let sList = [];
  (rawS || []).forEach(q => {
    if (q.isListening || (q.qType && q.qType.startsWith('listen_'))) {
      lList.push(q);
    } else {
      sList.push({ ...q, qType: 'sentence' });
    }
  });

  // 去除重複聽力題目 (依 qType + 文字)
  const seenL = new Set();
  const uniqueLList = [];
  lList.forEach(q => {
    const textVal = q.text || q.word || q.sentence || '';
    const key = `${q.qType || 'listen'}_${textVal}`;
    if (!seenL.has(key)) {
      seenL.add(key);
      uniqueLList.push({
        ...q,
        qType: q.qType || 'listen_image',
        text: textVal,
        word: textVal,
        sentence: textVal
      });
    }
  });

  // 測驗施測順序：聽力測驗題 -> Phonics 口說 -> 句型口說
  examQuestionsQueue = [...uniqueLList, ...pList, ...sList];

  if (!examQuestionsQueue.length) {
    alert('老師尚未在此考卷中配置題目！請通知任課老師勾選題目後點擊「發布／更新此考試」。');
    return;
  }

  isExamSubmitting = false;
  const ckptKey = getExamCheckpointKey();
  let restored = false;
  if (ckptKey) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(ckptKey) || 'null');
      if (saved && Array.isArray(saved.examQuestionsQueue) && saved.examQuestionsQueue.length > 0 && saved.examCurrentIdx < saved.examQuestionsQueue.length) {
        examQuestionsQueue = saved.examQuestionsQueue;
        examCurrentIdx = saved.examCurrentIdx || 0;
        examScoreState = saved.examScoreState || examScoreState;
        examWrongDetails = saved.examWrongDetails || [];
        restored = true;
      }
    } catch (e) {}
  }
  if (!restored) {
    examCurrentIdx = 0;
  examScoreState = {
    listenOk: 0, listenTotal: uniqueLList.length,
    phonicsOk: 0, phonicsTotal: pList.length,
    sentOk: 0, sentTotal: sList.length
  };
  examWrongDetails = [];

  }
  document.getElementById('main-menu-wrapper').style.display = 'none';
  document.getElementById('exam-wrapper').style.display = 'flex';
  document.getElementById('exam-quiz-view').style.display = 'flex';
  document.getElementById('exam-result-view').style.display = 'none';
  document.getElementById('exam-view-title').textContent = studentAssignedExam.title;

  renderExamQuestion();
}

function renderExamQuestion() {
  if (examCurrentIdx >= examQuestionsQueue.length) {
    submitOfficialExam();
    return;
  }

  stopExamProgressTimer();
  saveExamCheckpoint();
  examQuestionAttempts = 0;
  const q = examQuestionsQueue[examCurrentIdx];
  document.getElementById('exam-progress-badge').textContent = `第 ${examCurrentIdx + 1} / ${examQuestionsQueue.length} 題`;

  const tag = document.getElementById('exam-section-tag');
  const instructionBox = document.getElementById('exam-instruction-box');
  const listenPanel = document.getElementById('exam-listening-panel');
  const targetImg = document.getElementById('exam-target-img');
  const targetText = document.getElementById('exam-target-text');
  const targetMeaning = document.getElementById('exam-target-meaning');
  const listenBtn = document.getElementById('exam-listen-btn');
  const recordBtn = document.getElementById('exam-record-btn');
  const timerBarContainer = document.getElementById('exam-timer-bar-container');
  const cardBox = document.getElementById('exam-card-box');

  cardBox.classList.remove('recording-active');
  document.getElementById('exam-countdown-overlay').style.display = 'none';
  if (timerBarContainer) timerBarContainer.style.display = 'none';
  targetImg.style.display = 'none';
  targetImg.removeAttribute('src');

  // ==================== 情況 A：聽力題型 (5 種) ====================
  if (q.qType && q.qType.startsWith('listen_')) {
    // 隱藏口說專用按鈕
    if (listenBtn) listenBtn.style.display = 'none';
    if (recordBtn) recordBtn.style.display = 'none';
    listenPanel.style.display = 'block';

    // 關鍵修復：每次進入新聽力題目時，強制解鎖面板內所有操作按鈕 (避免前一題 disabled 殘留)
    document.querySelectorAll('#exam-listening-panel button').forEach(b => {
      b.disabled = false;
    });

    // 重置重播次數限制
    examAudioPlaysLeft = 2;
    document.getElementById('exam-audio-plays-left').textContent = examAudioPlaysLeft;
    const playBtn = document.getElementById('exam-play-audio-btn');
    playBtn.disabled = false;
    playBtn.innerHTML = `🔊 點擊聆聽題目 (剩餘 <span id="exam-audio-plays-left">${examAudioPlaysLeft}</span> 次)`;

    targetText.textContent = '🎧 請專心聆聽題目...';
    targetMeaning.textContent = '';
    const fb = document.getElementById('exam-feedback-box');
    fb.className = 'feedback-box';
    fb.innerHTML = '請聆聽發音後，點選下方正確選項';

    setupListeningComponents(q, tag, instructionBox);
    setTimeout(playCurrentExamAudio, 400);
    return;
  }

  // ==================== 情況 B：原有口說題型 (保留原邏輯) ====================
  listenPanel.style.display = 'none';
  if (recordBtn) recordBtn.style.display = 'flex';
  
  if (studentAssignedExam.disableAudio) {
    if (listenBtn) listenBtn.style.display = 'none';
  } else {
    if (listenBtn) listenBtn.style.display = 'flex';
  }

  if (q.qType === 'phonics') {
    tag.textContent = '第一部分：🔤 Phonics 發音題';
    tag.style.background = '#fee2e2';
    tag.style.color = '#991b1b';
    instructionBox.textContent = '🎙️ 題型說明：請聽 3-2-1 嗶聲後，對著麥克風大聲朗讀單字。';
    targetText.textContent = q.word || '-';
    targetMeaning.textContent = q.meaning || '';
  } else {
    tag.textContent = '第二部分：🧩 核心句型朗讀題';
    tag.style.background = '#ecfdf5';
    tag.style.color = '#065f46';
    instructionBox.textContent = '🎙️ 題型說明：請聽 3-2-1 嗶聲後，對著麥克風完整朗讀句子。';
    targetText.textContent = q.sentence || '-';
    targetMeaning.textContent = q.meaning || '';
  }

  const fb = document.getElementById('exam-feedback-box');
  fb.className = 'feedback-box';
  fb.innerHTML = '請點擊「🎙 按下開始朗讀」進行評量（每題有 2 次機會）';

  recordBtn.disabled = false;
  recordBtn.classList.remove('opacity-50');
  recordBtn.style.background = 'linear-gradient(135deg,#10b981 0%,#059669 100%)';
  recordBtn.innerHTML = '🎙️ 按下開始朗讀';
}

// 聽力題組件動態配置
function setupListeningComponents(q, tag, instructionBox) {
  const optionsGrid = document.getElementById('exam-options-grid');
  const tfGroup = document.getElementById('exam-tf-group');
  const orderGroup = document.getElementById('exam-order-group');
  const targetImg = document.getElementById('exam-target-img');
  const targetText = document.getElementById('exam-target-text');

  optionsGrid.style.display = 'none';
  tfGroup.style.display = 'none';
  orderGroup.style.display = 'none';

  // 1. 單字聽音選圖
  if (q.qType === 'listen_image') {
    tag.textContent = '👂 聽力測驗：看圖選答案';
    tag.style.background = '#e0e7ff';
    tag.style.color = '#3730a3';
    instructionBox.textContent = '🎧 題型說明：仔細聽單字發音，在下方選出正確的代表圖片！';

    optionsGrid.style.display = 'grid';
    optionsGrid.innerHTML = '';

    const allImgs = Object.values(currentBook?.rawUnits || {}).flat().filter(hasImage);
    const opts = [q];
    while (opts.length < Math.min(4, allImgs.length)) {
      const r = allImgs[Math.floor(Math.random() * allImgs.length)];
      if (!opts.some(o => normalizeText(getItemText(o)) === normalizeText(getItemText(r)))) {
        opts.push({ text: r.word, image: r.image });
      }
    }

    shuffle(opts).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-img-btn';
      const safeText = escapeHtml(getItemText(opt) || '圖片');
      btn.innerHTML = `<img src="${opt.image}" alt="${safeText}" style="width:100%;height:100px;object-fit:contain;" onerror="this.onerror=null;this.src='https://placehold.co/120x100/e0e7ff/3730a3?text='+encodeURIComponent('${safeText}');">`;
      btn.onclick = () => checkExamAnswer(normalizeText(getItemText(opt)) === normalizeText(getItemText(q)));
      optionsGrid.appendChild(btn);
    });
  }

  // 2. 聽音情境應答
  else if (q.qType === 'listen_response') {
    tag.textContent = '💬 聽力測驗：情境應答';
    tag.style.background = '#e0f2fe';
    tag.style.color = '#0369a1';
    instructionBox.textContent = '🎧 題型說明：仔細聽外師說的一句話，選出最適合回應的句子！';

    optionsGrid.style.display = 'grid';
    optionsGrid.innerHTML = '';

    const allSentences = Object.values(currentBook?.sentenceUnits || {}).flat();
    const correctAns = q.meaning || getItemText(q);
    const opts = [correctAns];
    while (opts.length < Math.min(3, allSentences.length)) {
      const r = allSentences[Math.floor(Math.random() * allSentences.length)];
      const candidate = r.meaning || getItemText(r);
      if (candidate && !opts.includes(candidate)) opts.push(candidate);
    }

    shuffle(opts).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline';
      btn.style.cssText = 'padding:14px;font-size:0.95rem;text-align:left;line-height:1.4;';
      btn.textContent = '💬 ' + opt;
      btn.onclick = () => checkExamAnswer(opt === correctAns);
      optionsGrid.appendChild(btn);
    });
  }

  // 3. 聽音克漏填空
  else if (q.qType === 'listen_blank') {
    tag.textContent = '🧩 聽力測驗：克漏字填空';
    tag.style.background = '#fef3c7';
    tag.style.color = '#92400e';
    instructionBox.textContent = '🎧 題型說明：仔細聽整句朗讀，選出空格中聽到的單字！';

    const fullSentence = getItemText(q);
    const words = fullSentence.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const targetWord = words[Math.floor(Math.random() * words.length)] || words[0] || 'English';
    targetText.textContent = fullSentence.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '______');

    optionsGrid.style.display = 'grid';
    optionsGrid.innerHTML = '';

    const opts = [targetWord];
    const candidatePool = ['do', 'does', 'is', 'are', 'have', 'has', 'like', 'likes', 'on', 'at', 'today', 'Friday'];
    while (opts.length < 4 && candidatePool.length > opts.length) {
      const r = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      if (!opts.includes(r)) opts.push(r);
    }

    shuffle(opts).forEach(w => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline';
      btn.textContent = w;
      btn.onclick = () => checkExamAnswer(normalizeText(w) === normalizeText(targetWord));
      optionsGrid.appendChild(btn);
    });
  }

  // 4. 聽音重組造句
  else if (q.qType === 'listen_order') {
    tag.textContent = '🔀 聽力測驗：重組造句';
    tag.style.background = '#f3e8ff';
    tag.style.color = '#6b21a8';
    instructionBox.textContent = '🎧 題型說明：仔細聽句子朗讀，將下方單字方塊依序排成正確句子！';

    orderGroup.style.display = 'block';
    targetText.textContent = '請把聽到的單字排成正確句子';
    renderExamOrderTokens(getItemText(q));
  }

  // 5. 聽音是非題
  else if (q.qType === 'listen_tf') {
    tag.textContent = '🎯 聽力測驗：是非判斷';
    tag.style.background = '#fee2e2';
    tag.style.color = '#991b1b';
    instructionBox.textContent = '🎧 題型說明：看著圖片並仔細聽描述，判斷內容是 ⭕ 還是 ❌！';

    tfGroup.style.display = 'grid';
    if (q.image) {
      targetImg.src = q.image;
      targetImg.style.display = 'block';
    }
  }
}

// 聽力音檔播放與次數限制
function playCurrentExamAudio() {
  const q = examQuestionsQueue[examCurrentIdx];
  if (!q || examAudioPlaysLeft <= 0) return;

  examAudioPlaysLeft--;
  const counterEl = document.getElementById('exam-audio-plays-left');
  if (counterEl) counterEl.textContent = examAudioPlaysLeft;

  const playBtn = document.getElementById('exam-play-audio-btn');
  playBtn.disabled = true;
  playBtn.textContent = '🔊 音檔播放中...';

  speakText(getItemText(q));

  setTimeout(() => {
    if (examAudioPlaysLeft > 0) {
      playBtn.disabled = false;
      playBtn.innerHTML = `🔊 點擊聆聽題目 (剩餘 <span id="exam-audio-plays-left">${examAudioPlaysLeft}</span> 次)`;
    } else {
      playBtn.disabled = true;
      playBtn.textContent = '🔇 本題播放次數已達上限';
    }
  }, 1800);
}

// 聽力答案判定
function checkExamAnswer(isCorrect) {
  document.querySelectorAll('#exam-listening-panel button').forEach(b => b.disabled = true);
  const fb = document.getElementById('exam-feedback-box');
  const q = examQuestionsQueue[examCurrentIdx];

  if (isCorrect) {
    examScoreState.listenOk++;
    playTone(659.25, 'sine', 0.15); // E5
    fb.className = 'feedback-box correct';
    fb.innerHTML = '🎉 答對了！';
    setTimeout(() => {
      examCurrentIdx++;
      renderExamQuestion();
    }, 900);
  } else {
    examWrongDetails.push(getItemText(q) || q.meaning || '聽力題');
    playTone(329.63, 'sawtooth', 0.25); // E4
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `答案未吻合。<br>標準句：<strong>${escapeHtml(getItemText(q) || q.meaning || '')}</strong>`;
    setTimeout(() => {
      examCurrentIdx++;
      renderExamQuestion();
    }, 1800);
  }
}

// 聽音重組輔助函式 (強化：上方為答案欄位、下方為單字庫，獨立膠囊晶片樣式)
function renderExamOrderTokens(sentence) {
  const tokens = String(sentence || '').trim().split(/\s+/).filter(Boolean);
  examCurrentOrderTokens = (typeof patternShuffle === 'function') ? patternShuffle([...tokens]) : [...tokens].sort(() => Math.random() - 0.5);
  examSelectedOrderTokens = [];
  renderExamOrderDOM(sentence);
}

function renderExamOrderDOM(sentence) {
  const bank = document.getElementById('exam-order-bank');
  const answer = document.getElementById('exam-order-answer');
  const countEl = document.getElementById('exam-order-count');

  if (countEl) {
    const totalCount = examSelectedOrderTokens.length + examCurrentOrderTokens.length;
    countEl.textContent = `已排 ${examSelectedOrderTokens.length} / ${totalCount} 個字`;
  }

  // 上方：答案欄位 (點選可退回下方單字庫)
  if (!examSelectedOrderTokens || examSelectedOrderTokens.length === 0) {
    answer.innerHTML = '<span style="color:#818cf8;font-size:0.85rem;font-weight:bold;padding:6px 4px;">（請點選下方單字依序填入此答案區）</span>';
  } else {
    answer.innerHTML = examSelectedOrderTokens.map((t, idx) => 
      `<button type="button" class="exam-order-token-chip" style="display:inline-flex;align-items:center;width:auto!important;padding:8px 16px;border-radius:999px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;font-size:1rem;font-weight:900;border:none;cursor:pointer;box-shadow:0 3px 8px rgba(79,70,229,0.3);margin:2px;" onclick="removeExamOrderToken(${idx})">${escapeHtml(t)} <span style="font-size:0.75rem;margin-left:6px;opacity:0.8;">✕</span></button>`
    ).join('');
  }

  // 下方：待選單字庫 (點選加入上方答案欄)
  if (!examCurrentOrderTokens || examCurrentOrderTokens.length === 0) {
    bank.innerHTML = '<span style="color:#10b981;font-size:0.85rem;font-weight:bold;padding:6px 4px;">✓ 所有單字已排入上方答案區</span>';
  } else {
    bank.innerHTML = examCurrentOrderTokens.map((t, idx) => 
      `<button type="button" class="exam-order-token-chip" style="display:inline-flex;align-items:center;width:auto!important;padding:8px 16px;border-radius:999px;background:white;color:#1e293b;font-size:1rem;font-weight:900;border:2px solid #cbd5e1;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.06);margin:2px;" onclick="addExamOrderToken(${idx})">${escapeHtml(t)}</button>`
    ).join('');
  }
}

function addExamOrderToken(idx) {
  if (idx < 0 || idx >= examCurrentOrderTokens.length) return;
  const t = examCurrentOrderTokens.splice(idx, 1)[0];
  examSelectedOrderTokens.push(t);
  const q = examQuestionsQueue[examCurrentIdx];
  renderExamOrderDOM(getItemText(q));
}

function removeExamOrderToken(idx) {
  if (idx < 0 || idx >= examSelectedOrderTokens.length) return;
  const t = examSelectedOrderTokens.splice(idx, 1)[0];
  examCurrentOrderTokens.push(t);
  const q = examQuestionsQueue[examCurrentIdx];
  renderExamOrderDOM(getItemText(q));
}

function resetExamOrderTokens() {
  const q = examQuestionsQueue[examCurrentIdx];
  renderExamOrderTokens(getItemText(q));
}

function submitExamOrderAnswer() {
  const fb = document.getElementById('exam-feedback-box');
  if (!examSelectedOrderTokens || examSelectedOrderTokens.length === 0) {
    if (fb) {
      fb.className = 'feedback-box incorrect';
      fb.innerHTML = '⚠️ 請先點選下方單字排入上方「答案欄位」再確認送出！';
    } else {
      alert('請先點選單字完成句子再送出答案！');
    }
    return;
  }

  const q = examQuestionsQueue[examCurrentIdx];
  // 嚴格標準化：自動去除所有句點、問號、大小寫與多餘空白，確保判定寬容公平
  const rawTarget = getItemText(q) || q.text || q.word || q.sentence || '';
  const rawUser = examSelectedOrderTokens.join(' ');
  const target = (typeof patternOrderNormalize === 'function') 
    ? patternOrderNormalize(rawTarget) 
    : normalizeText(rawTarget);
  const user = (typeof patternOrderNormalize === 'function') 
    ? patternOrderNormalize(rawUser) 
    : normalizeText(rawUser);

  const isMatched = (user === target);
  checkExamAnswer(isMatched);
}

function playExamTargetAudio() {
  const q = examQuestionsQueue[examCurrentIdx];
  if (!q) return;
  speakText(q.qType === 'phonics' ? q.word : q.sentence);
}

// 倒數進度條控制
function startExamProgressTimer(durationSec) {
  const container = document.getElementById('exam-timer-bar-container');
  const bar = document.getElementById('exam-timer-bar');
  container.style.display = 'block';
  bar.style.width = '100%';

  const startTime = Date.now();
  const totalMs = durationSec * 1000;

  stopExamProgressTimer();
  examProgressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remainingRatio = Math.max(0, (totalMs - elapsed) / totalMs);
    bar.style.width = (remainingRatio * 100) + '%';
    if (elapsed >= totalMs) {
      stopExamProgressTimer();
    }
  }, 100);
}

function stopExamProgressTimer() {
  if (examProgressInterval) {
    clearInterval(examProgressInterval);
    examProgressInterval = null;
  }
  const container = document.getElementById('exam-timer-bar-container');
  if (container) container.style.display = 'none';
}

// 3-2-1 倒數 + 嗶聲開麥 + 10 秒計時條作答核心 (保留原有口說機制)
function startExamRecognition() {
  const q = examQuestionsQueue[examCurrentIdx];
  if (!q) return;
  const targetText = (q.qType === 'phonics' ? q.word : q.sentence).replace(/[.?!,]/g, '').trim();

  const recordBtn = document.getElementById('exam-record-btn');
  const fb = document.getElementById('exam-feedback-box');
  const cardBox = document.getElementById('exam-card-box');
  const overlay = document.getElementById('exam-countdown-overlay');
  const countNum = document.getElementById('exam-countdown-number');
  const countText = document.getElementById('exam-countdown-text');

  recordBtn.disabled = true;
  recordBtn.classList.add('opacity-50');

  // 1. 啟動 3-2-1 預備倒數
  let count = 3;
  overlay.style.display = 'flex';
  countNum.textContent = count;
  countText.textContent = '請預備開口朗讀...';
  playTone(523.25, 'sine', 0.12); // C5

  if (examCountdownTimer) clearInterval(examCountdownTimer);

  examCountdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countNum.textContent = count;
      playTone(523.25, 'sine', 0.12); // C5
    } else {
      clearInterval(examCountdownTimer);
      overlay.style.display = 'none';

      // 2. 嗶聲 (高音 Beep 提示開始作答)
      playTone(880, 'sine', 0.25); // A5

      // 3. 視覺切換為「錄音中」光圈與倒數進度條
      cardBox.classList.add('recording-active');
      recordBtn.style.background = 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)';
      recordBtn.innerHTML = '🔴 正在收音中...請大聲朗讀';
      startExamProgressTimer(10); // 10 秒即時遞減

      // 4. 正式啟動 10 秒語音收音辨識
      startGenericRecognition({ word: targetText, sentence: targetText }, 'exam-feedback-box', (passed, reason) => {
        stopExamProgressTimer();
        cardBox.classList.remove('recording-active');
        examQuestionAttempts++;

        if (passed) {
          if (q.qType === 'phonics') examScoreState.phonicsOk++;
          else examScoreState.sentOk++;

          recordBtn.style.background = 'linear-gradient(135deg,#10b981 0%,#059669 100%)';
          recordBtn.innerHTML = '✅ 判定通過';
          setTimeout(() => {
            examCurrentIdx++;
            renderExamQuestion();
          }, 1200);

        } else {
          if (examQuestionAttempts < 2) {
            let hintMsg = '⚠️ 剛剛收音不夠清楚，請靠近麥克風再試一次！（剩餘 1 次機會）';
            if (reason === 'timeout' || reason === 'no-speech') {
              hintMsg = '⚠️ 未偵測到聲音，請聽「嗶」聲後開口朗讀！（剩餘 1 次機會）';
            }

            fb.className = 'feedback-box incorrect';
            fb.innerHTML = hintMsg;

            recordBtn.disabled = false;
            recordBtn.classList.remove('opacity-50');
            recordBtn.style.background = 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)';
            recordBtn.innerHTML = '🔄 再次按下朗讀（第 2 次）';

          } else {
            examWrongDetails.push(targetText);
            fb.className = 'feedback-box incorrect';
            fb.innerHTML = `本題已完成兩次測驗，即將進入下一題...`;
            recordBtn.innerHTML = '❌ 推進下一題';

            setTimeout(() => {
              examCurrentIdx++;
              renderExamQuestion();
            }, 1500);
          }
        }
      });
    }
  }, 750);
}

function submitOfficialExam() {
  if (isExamSubmitting) return;
  isExamSubmitting = true;
  clearExamCheckpoint();

  document.getElementById('exam-quiz-view').style.display = 'none';
  document.getElementById('exam-result-view').style.display = 'flex';

  const total = examQuestionsQueue.length;
  const passedTotal = examScoreState.listenOk + examScoreState.phonicsOk + examScoreState.sentOk;
  const finalScore = Math.round((passedTotal / Math.max(1, total)) * 100);

  document.getElementById('exam-final-score').textContent = `${finalScore} 分`;
  const detailsEl = document.getElementById('exam-score-details');
  detailsEl.innerHTML = `
    <strong>👂 聽力測驗得分：</strong> ${examScoreState.listenOk} / ${examScoreState.listenTotal}<br>
    <strong>🔤 Phonics 答對：</strong> ${examScoreState.phonicsOk} / ${examScoreState.phonicsTotal}<br>
    <strong>🧩 核心句型答對：</strong> ${examScoreState.sentOk} / ${examScoreState.sentTotal}<br>
    <span id="exam-upload-status" class="text-xs text-amber-600">⏳ 正在上傳成績至老師後台，請勿關閉視窗...</span>
  `;

  if (studentAssignedExam) {
    studentAssignedExam.hasSubmitted = true;
    studentAssignedExam.previousScore = finalScore;
  }

  const payload = {
    action: 'submitExamScore',
    examId: studentAssignedExam.examId,
    school: loggedInStudent.school || ACTIVE_SCHOOL.schoolName,
    gradeClass: loggedInStudent.gradeClass,
    number: loggedInStudent.number,
    name: loggedInStudent.name,
    score: finalScore,
    listenScore: `${examScoreState.listenOk}/${examScoreState.listenTotal}`,
    phonicsScore: `${examScoreState.phonicsOk}/${examScoreState.phonicsTotal}`,
    sentenceScore: `${examScoreState.sentOk}/${examScoreState.sentTotal}`,
    wrongWords: examWrongDetails
  };

  postWithRetryAndQueue(
    payload,
    () => {
      const st = document.getElementById('exam-upload-status');
      if (st) {
        st.className = 'text-xs text-emerald-600 font-bold';
        st.textContent = '✅ 本次作答成績已完成登記並已上傳鎖定';
      }
    },
    () => {
      const st = document.getElementById('exam-upload-status');
      if (st) {
        st.className = 'text-xs text-rose-600 font-bold';
        st.textContent = '⚠️ 網路忙碌，成績已暫存本機，系統將自動補傳，請通知老師確認';
      }
    },
    3
  );
}

function backToMenuFromExam() {
  document.getElementById('exam-wrapper').style.display = 'none';
  document.getElementById('main-menu-wrapper').style.display = 'flex';
  if (loggedInStudent) {
    checkActiveStudentExam(loggedInStudent.gradeClass, loggedInStudent.number);
  }
}

// ---------------- 教師後台：年級冊別連動與單元化結構 ----------------
