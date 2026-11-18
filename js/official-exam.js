// js/official-exam.js
let studentAssignedExam = null;
let examQuestionsQueue = [];
let examCurrentIdx = 0;
let examScoreState = { listenOk: 0, listenTotal: 0, phonicsOk: 0, phonicsTotal: 0, sentOk: 0, sentTotal: 0 };
let examWrongDetails = [];
let allPublishedExams = [];
let examQuestionAttempts = 0;
let examCountdownTimer = null;
let examProgressInterval = null;
let examAudioPlaysLeft = 2;
let examCurrentOrderTokens = [];
let examSelectedOrderTokens = [];
let activeExamAudioObj = null;

function stopExamPlaybackAudio() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (activeExamAudioObj) {
    try {
      activeExamAudioObj.onended = null;
      activeExamAudioObj.onerror = null;
      activeExamAudioObj.pause();
    } catch (e) {}
    activeExamAudioObj = null;
  }
}

function getExamTargetBook() {
  const bId = studentAssignedExam?.bookId || '';
  if (bId && typeof bookData !== 'undefined' && bookData[bId]) {
    return bookData[bId];
  }
  return currentBook || null;
}

function resolveExamItemAudioPath(q) {
  if (!q) return '';
  if (q.audio && typeof q.audio === 'string' && q.audio.trim() !== '') {
    return q.audio.trim();
  }
  const targetText = normalizeText(getItemText(q));
  if (!targetText) return '';
  const booksToSearch = [];
  const examBook = getExamTargetBook();
  if (examBook) booksToSearch.push(examBook);
  if (currentBook && currentBook !== examBook) booksToSearch.push(currentBook);
  if (typeof bookData !== 'undefined') {
    Object.values(bookData).forEach(b => {
      if (b && !booksToSearch.includes(b)) booksToSearch.push(b);
    });
  }
  for (const b of booksToSearch) {
    const pools = [
      ...Object.values(b.vocabularyWithPaths || {}).flat(),
      ...Object.values(b.sentenceUnits || {}).flat(),
      ...Object.values(b.dailyTalkUnits || {}).flat(),
      ...Object.values(b.storyUnits || {}).flat()
    ];
    const found = pools.find(it => normalizeText(getItemText(it)) === targetText && it.audio);
    if (found) return found.audio;
  }
  return '';
}

function playExamAudioWithCallback(q, onFinished) {
  stopExamPlaybackAudio();
  const text = getItemText(q);
  const audioPath = resolveExamItemAudioPath(q);
  let finished = false;
  let safetyTimer = null;

  const done = () => {
    if (finished) return;
    finished = true;
    if (safetyTimer) clearTimeout(safetyTimer);
    activeExamAudioObj = null;
    if (typeof onFinished === 'function') onFinished();
  };

  const fallbackSpeech = () => {
    if (finished) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.78;
      u.onend = done;
      u.onerror = done;
      safetyTimer = setTimeout(done, Math.max(2200, text.length * 110));
      window.speechSynthesis.speak(u);
    } else {
      safetyTimer = setTimeout(done, 1800);
    }
  };

  if (audioPath) {
    const audio = new Audio(audioPath);
    activeExamAudioObj = audio;
    audio.onended = done;
    audio.onerror = fallbackSpeech;
    safetyTimer = setTimeout(done, 10000);
    audio.play().catch(fallbackSpeech);
  } else {
    fallbackSpeech();
  }
}

function refreshStudentExamStatus(btn) {
  if (!loggedInStudent) return;
  const origText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳';
  }
  checkActiveStudentExam(loggedInStudent.gradeClass, loggedInStudent.number, () => {
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText || '🔄 更新狀態';
    }
  });
}

function checkActiveStudentExam(gradeClass, number, onComplete) {
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
      const mobileBanner = document.getElementById('mobile-exam-banner');
      const mobileTitle = document.getElementById('mobile-exam-title');

      if (data.status === 'success' && data.exam && data.exam.isActive) {
        studentAssignedExam = data.exam;
        if (titleEl) titleEl.textContent = data.exam.title;
        if (mobileTitle) mobileTitle.textContent = data.exam.title;

        if (studentAssignedExam.hasSubmitted) {
          if (banner) {
            banner.style.display = 'block';
            banner.style.background = '#f0fdf4';
            banner.style.borderColor = '#16a34a';
          }
          if (tagEl) { tagEl.style.background = '#16a34a'; tagEl.textContent = '✅ 已完成定期評量'; }
          if (titleEl) titleEl.style.color = '#166534';
          if (descEl) {
            descEl.style.color = '#14532d';
            descEl.innerHTML = `您已於本次定期考完成交卷，獲得 <strong>${studentAssignedExam.previousScore !== null ? studentAssignedExam.previousScore + ' 分' : '已交卷'}</strong>。<br>（正式測驗每人限考一次，如需補考請洽詢任課老師後點右上角「更新狀態」）`;
          }
          if (startBtn) {
            startBtn.disabled = true;
            startBtn.style.background = '#94a3b8';
            startBtn.style.cursor = 'not-allowed';
            startBtn.innerHTML = '🔒 已交卷（測驗已鎖定）';
          }
          if (mobileBanner) mobileBanner.style.display = 'none';
        } else {
          if (banner) {
            banner.style.display = 'block';
            banner.style.background = '#fef2f2';
            banner.style.borderColor = '#ef4444';
          }
          if (tagEl) { tagEl.style.background = '#dc2626'; tagEl.textContent = '🔔 正式定期評量'; }
          if (titleEl) titleEl.style.color = '#991b1b';
          if (descEl) {
            descEl.style.color = '#7f1d1d';
            descEl.textContent = '老師已指派英語定期測驗（含聽力與口說評量），請在安靜環境下點擊開始作答。';
          }
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.background = 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)';
            startBtn.style.cursor = 'pointer';
            startBtn.innerHTML = '🎯 開始進入定期考作答';
          }
          if (mobileBanner && window.innerWidth < 1024) mobileBanner.style.display = 'block';
        }
      } else {
        studentAssignedExam = null;
        if (banner) banner.style.display = 'none';
        if (mobileBanner) mobileBanner.style.display = 'none';
      }
      if (typeof onComplete === 'function') onComplete();
    })
    .catch(() => {
      if (typeof onComplete === 'function') onComplete();
    });
}

function startOfficialExam() {
  if (!studentAssignedExam) return;
  if (studentAssignedExam.hasSubmitted) {
    alert('您已完成本次定期考評量！如需補測，請向任課老師申請開放後點擊「🔄 更新狀態」。');
    return;
  }
  const rawP = studentAssignedExam.phonicsList || studentAssignedExam.phonicsQuestions || [];
  const rawS = studentAssignedExam.sentenceList || studentAssignedExam.sentenceQuestions || [];
  const rawL = studentAssignedExam.listeningList || studentAssignedExam.listeningQuestions || [];

  let lList = Array.isArray(rawL) ? [...rawL] : [];
  let pList = [];
  (rawP || []).forEach(q => {
    if (q.isListening || (q.qType && q.qType.startsWith('listen_'))) lList.push(q);
    else pList.push({ ...q, qType: 'phonics' });
  });
  let sList = [];
  (rawS || []).forEach(q => {
    if (q.isListening || (q.qType && q.qType.startsWith('listen_'))) lList.push(q);
    else sList.push({ ...q, qType: 'sentence' });
  });

  const seenL = new Set();
  const uniqueLList = [];
  lList.forEach(q => {
    const textVal = q.text || q.word || q.sentence || '';
    const key = `${q.qType || 'listen'}_${textVal}`;
    if (!seenL.has(key)) {
      seenL.add(key);
      uniqueLList.push({ ...q, qType: q.qType || 'listen_image', text: textVal, word: textVal, sentence: textVal });
    }
  });

  examQuestionsQueue = [...uniqueLList, ...pList, ...sList];
  if (!examQuestionsQueue.length) {
    alert('老師尚未在此考卷中配置題目！');
    return;
  }

  examCurrentIdx = 0;
  examScoreState = { listenOk: 0, listenTotal: uniqueLList.length, phonicsOk: 0, phonicsTotal: pList.length, sentOk: 0, sentTotal: sList.length };
  examWrongDetails = [];

  document.getElementById('main-menu-wrapper').style.display = 'none';
  document.getElementById('exam-wrapper').style.display = 'flex';
  document.getElementById('exam-quiz-view').style.display = 'flex';
  document.getElementById('exam-result-view').style.display = 'none';
  document.getElementById('exam-view-title').textContent = studentAssignedExam.title;
  renderExamQuestion();
}

function renderExamQuestion() {
  if (examCurrentIdx >= examQuestionsQueue.length) { submitOfficialExam(); return; }
  stopExamProgressTimer();
  stopExamPlaybackAudio();
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

  if (q.qType && q.qType.startsWith('listen_')) {
    if (listenBtn) listenBtn.style.display = 'none';
    if (recordBtn) recordBtn.style.display = 'none';
    listenPanel.style.display = 'block';
    document.querySelectorAll('#exam-listening-panel button').forEach(b => { b.disabled = false; });

    examAudioPlaysLeft = 2;
    const playsLeftEl = document.getElementById('exam-audio-plays-left');
    if (playsLeftEl) playsLeftEl.textContent = examAudioPlaysLeft;
    const playBtn = document.getElementById('exam-play-audio-btn');
    playBtn.disabled = false;
    playBtn.innerHTML = `🔊 點擊聆聽題目 (剩餘 ${examAudioPlaysLeft} 次)`;

    targetText.textContent = '🎧 請專心聆聽題目...';
    targetMeaning.textContent = '';
    const fb = document.getElementById('exam-feedback-box');
    fb.className = 'feedback-box';
    fb.innerHTML = '請聆聽發音後，點選下方正確選項';
    setupListeningComponents(q, tag, instructionBox);
    setTimeout(playCurrentExamAudio, 400);
    return;
  }

  listenPanel.style.display = 'none';
  if (recordBtn) recordBtn.style.display = 'flex';
  if (listenBtn) listenBtn.style.display = studentAssignedExam.disableAudio ? 'none' : 'flex';

  if (q.qType === 'phonics') {
    tag.textContent = '第一部分：🔤 Phonics 發音題';
    tag.style.background = '#fee2e2';
    tag.style.color = '#991b1b';
    instructionBox.textContent = '🗣️ 題型說明：請聽 3-2-1 嗶聲後，對著麥克風大聲朗讀單字。';
    targetText.textContent = q.word || '-';
    targetMeaning.textContent = q.meaning || '';
  } else {
    tag.textContent = '第二部分：🧩 核心句型朗讀題';
    tag.style.background = '#ecfdf5';
    tag.style.color = '#065f46';
    instructionBox.textContent = '🗣️ 題型說明：請聽 3-2-1 嗶聲後，對著麥克風完整朗讀句子。';
    targetText.textContent = q.sentence || '-';
    targetMeaning.textContent = q.meaning || '';
  }

  const fb = document.getElementById('exam-feedback-box');
  fb.className = 'feedback-box';
  fb.innerHTML = '請點擊「🎙️ 按下開始朗讀」進行評量（每題有 2 次機會）';
  recordBtn.disabled = false;
  recordBtn.classList.remove('opacity-50');
  recordBtn.style.background = 'linear-gradient(135deg,#10b981 0%,#059669 100%)';
  recordBtn.innerHTML = '🎙️ 按下開始朗讀';
}

function setupListeningComponents(q, tag, instructionBox) {
  const optionsGrid = document.getElementById('exam-options-grid');
  const tfGroup = document.getElementById('exam-tf-group');
  const orderGroup = document.getElementById('exam-order-group');
  const targetImg = document.getElementById('exam-target-img');
  const targetText = document.getElementById('exam-target-text');
  const targetBook = getExamTargetBook();

  optionsGrid.style.display = 'none';
  tfGroup.style.display = 'none';
  orderGroup.style.display = 'none';

  if (q.qType === 'listen_image') {
    tag.textContent = '👂 聽力測驗：看圖選答案';
    tag.style.background = '#e0e7ff';
    tag.style.color = '#3730a3';
    instructionBox.textContent = '🎧 題型說明：仔細聽單字發音，在下方選出正確的代表圖片！';
    optionsGrid.style.display = 'grid';
    optionsGrid.innerHTML = '';
    const allImgs = Object.values(targetBook?.vocabularyWithPaths || targetBook?.rawUnits || {}).flat().filter(hasImage);
    const opts = [q];
    const shuffledImgs = shuffle(allImgs);
    for (const r of shuffledImgs) {
      if (opts.length >= 4) break;
      if (!opts.some(o => normalizeText(getItemText(o)) === normalizeText(getItemText(r)))) {
        opts.push({ text: r.word, image: r.image });
      }
    }
    shuffle(opts).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-img-btn';
      const safeText = escapeHtml(getItemText(opt) || '圖片');
      btn.innerHTML = `<img src="${opt.image}" alt="${safeText}" onerror="this.src='https://placehold.co/120x100/e0e7ff/3730a3?text=${encodeURIComponent(safeText)}'" />`;
      btn.onclick = () => checkExamAnswer(normalizeText(getItemText(opt)) === normalizeText(getItemText(q)));
      optionsGrid.appendChild(btn);
    });
  } else if (q.qType === 'listen_response') {
    tag.textContent = '💬 聽力測驗：聽句選意';
    tag.style.background = '#e0f2fe';
    tag.style.color = '#0369a1';
    instructionBox.textContent = '🎧 題型說明：仔細聽英語句子發音，選出最符合的中文句意！';
    optionsGrid.style.display = 'grid';
    optionsGrid.innerHTML = '';
    const allSentences = [
      ...Object.values(targetBook?.sentenceUnits || {}).flat(),
      ...Object.values(targetBook?.dailyTalkUnits || {}).flat()
    ];
    const correctAns = (q.meaning || getItemText(q)).trim();
    const opts = [correctAns];
    const seenNorm = new Set([correctAns.toLowerCase()]);
    for (const r of shuffle(allSentences)) {
      if (opts.length >= 4) break;
      const candidate = (r.meaning || getItemText(r) || '').trim();
      if (candidate && !seenNorm.has(candidate.toLowerCase())) {
        seenNorm.add(candidate.toLowerCase());
        opts.push(candidate);
      }
    }
    shuffle(opts).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline';
      btn.style.cssText = 'padding:14px;font-size:0.95rem;text-align:left;line-height:1.4;';
      btn.textContent = '💬 ' + opt;
      btn.onclick = () => checkExamAnswer(opt === correctAns);
      optionsGrid.appendChild(btn);
    });
  } else if (q.qType === 'listen_blank') {
    tag.textContent = '✏️ 聽力測驗：克漏字填空';
    tag.style.background = '#fef3c7';
    tag.style.color = '#92400e';
    instructionBox.textContent = '🎧 題型說明：仔細聽整句朗讀，選出空格中聽到的單字！';
    const fullSentence = getItemText(q);
    const words = fullSentence.replace(/[^a-zA-Z0-9\s']/g, '').split(/\s+/).filter(Boolean);
    const contentWords = words.filter(w => w.length >= 3);
    const pickPool = contentWords.length > 0 ? contentWords : words;
    const targetWord = pickPool[Math.floor(Math.random() * pickPool.length)] || words[0] || 'English';
    const escapedTarget = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blankedText = fullSentence.replace(new RegExp(`\b${escapedTarget}\b`, 'i'), '______');
    targetText.textContent = blankedText !== fullSentence ? blankedText : fullSentence.replace(targetWord, '______');

    optionsGrid.style.display = 'grid';
    optionsGrid.innerHTML = '';
    const opts = [targetWord];
    const seenWords = new Set([targetWord.toLowerCase()]);

    const bookWords = Object.values(targetBook?.vocabularyWithPaths || {})
      .flat()
      .map(it => (it.word || '').trim())
      .filter(w => w && !w.includes(' ') && !w.includes('/'));
    const fallbackPool = ['do', 'does', 'is', 'are', 'have', 'has', 'like', 'likes', 'can', 'go', 'play', 'read'];

    for (const candidate of [...shuffle(bookWords), ...shuffle(fallbackPool)]) {
      if (opts.length >= 4) break;
      if (!seenWords.has(candidate.toLowerCase())) {
        seenWords.add(candidate.toLowerCase());
        opts.push(candidate);
      }
    }
    shuffle(opts).forEach(w => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline';
      btn.textContent = w;
      btn.onclick = () => checkExamAnswer(normalizeText(w) === normalizeText(targetWord));
      optionsGrid.appendChild(btn);
    });
  } else if (q.qType === 'listen_order') {
    tag.textContent = '🧩 聽力測驗：重組造句';
    tag.style.background = '#f3e8ff';
    tag.style.color = '#6b21a8';
    instructionBox.textContent = '🎧 題型說明：仔細聽句子朗讀，將下方單字方塊依序排成正確句子！';
    orderGroup.style.display = 'block';
    targetText.textContent = '請把聽到的單字排成正確句子';
    renderExamOrderTokens(getItemText(q));
  } else if (q.qType === 'listen_tf') {
    tag.textContent = '⭕❌ 聽力測驗：是非判斷';
    tag.style.background = '#fee2e2';
    tag.style.color = '#991b1b';
    instructionBox.textContent = '🎧 題型說明：看著圖片並仔細聽發音，判斷圖文是否相符！';
    tfGroup.style.display = 'grid';
    const allImgs = Object.values(targetBook?.vocabularyWithPaths || targetBook?.rawUnits || {}).flat().filter(hasImage);
    const otherImgs = allImgs.filter(item => normalizeText(getItemText(item)) !== normalizeText(getItemText(q)));
    const shouldMatch = (otherImgs.length === 0) ? true : (Math.random() < 0.5);
    q.isExpectedMatch = shouldMatch;
    let displayImg = q.image;
    if (!shouldMatch && otherImgs.length > 0) {
      displayImg = otherImgs[Math.floor(Math.random() * otherImgs.length)].image;
    }
    if (displayImg) {
      targetImg.src = displayImg;
      targetImg.style.display = 'block';
    }
    const tfBtns = tfGroup.querySelectorAll('button');
    if (tfBtns.length >= 2) {
      tfBtns[0].onclick = () => checkExamAnswer(q.isExpectedMatch === true);
      tfBtns[1].onclick = () => checkExamAnswer(q.isExpectedMatch === false);
    }
  }
}

function playCurrentExamAudio() {
  const q = examQuestionsQueue[examCurrentIdx];
  if (!q || examAudioPlaysLeft <= 0) return;
  examAudioPlaysLeft--;
  const playBtn = document.getElementById('exam-play-audio-btn');
  playBtn.disabled = true;
  playBtn.textContent = '🔊 音檔播放中...';

  playExamAudioWithCallback(q, () => {
    if (!playBtn) return;
    if (examAudioPlaysLeft > 0) {
      playBtn.disabled = false;
      playBtn.innerHTML = `🔊 點擊聆聽題目 (剩餘 ${examAudioPlaysLeft} 次)`;
    } else {
      playBtn.disabled = true;
      playBtn.textContent = '🔇 本題播放次數已達上限';
    }
  });
}

function checkExamAnswer(isCorrect) {
  stopExamPlaybackAudio();
  document.querySelectorAll('#exam-listening-panel button').forEach(b => b.disabled = true);
  const fb = document.getElementById('exam-feedback-box');
  const q = examQuestionsQueue[examCurrentIdx];
  if (isCorrect) {
    examScoreState.listenOk++;
    playTone(659.25, 'sine', 0.15);
    fb.className = 'feedback-box correct';
    fb.innerHTML = '🎉 答對了！';
    setTimeout(() => { examCurrentIdx++; renderExamQuestion(); }, 900);
  } else {
    examWrongDetails.push(getItemText(q) || q.meaning || '聽力題');
    playTone(329.63, 'sawtooth', 0.25);
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `答案未吻合。<br>標準內容：<strong>${escapeHtml(getItemText(q) || '')}${q.meaning ? '（' + escapeHtml(q.meaning) + '）' : ''}</strong>`;
    setTimeout(() => { examCurrentIdx++; renderExamQuestion(); }, 1800);
  }
}

function renderExamOrderTokens(sentence) {
  const tokens = String(sentence || '').trim().split(/\s+/).filter(Boolean);
  examCurrentOrderTokens = [...tokens].sort(() => Math.random() - 0.5);
  examSelectedOrderTokens = [];
  renderExamOrderDOM();
}

function renderExamOrderDOM() {
  const bank = document.getElementById('exam-order-bank');
  const answer = document.getElementById('exam-order-answer');
  const countEl = document.getElementById('exam-order-count');
  if (countEl) {
    const totalCount = examSelectedOrderTokens.length + examCurrentOrderTokens.length;
    countEl.textContent = `已排 ${examSelectedOrderTokens.length} / ${totalCount} 個字`;
  }
  if (!examSelectedOrderTokens.length) {
    answer.innerHTML = '（請點選下方單字依序填入此答案區）';
  } else {
    answer.innerHTML = examSelectedOrderTokens.map((t, idx) =>
      `<button type="button" onclick="removeExamOrderToken(${idx})" class="px-3 py-1.5 bg-sky-600 text-white rounded-full text-sm font-black shadow-xs">${escapeHtml(t)} ✕</button>`
    ).join('');
  }
  if (!examCurrentOrderTokens.length) {
    bank.innerHTML = '✓ 所有單字已排入上方答案區';
  } else {
    bank.innerHTML = examCurrentOrderTokens.map((t, idx) =>
      `<button type="button" onclick="addExamOrderToken(${idx})" class="px-3 py-1.5 bg-white border-2 border-slate-300 text-slate-800 rounded-full text-sm font-black shadow-xs">${escapeHtml(t)}</button>`
    ).join('');
  }
}

function addExamOrderToken(idx) {
  if (idx < 0 || idx >= examCurrentOrderTokens.length) return;
  examSelectedOrderTokens.push(examCurrentOrderTokens.splice(idx, 1)[0]);
  renderExamOrderDOM();
}
function removeExamOrderToken(idx) {
  if (idx < 0 || idx >= examSelectedOrderTokens.length) return;
  examCurrentOrderTokens.push(examSelectedOrderTokens.splice(idx, 1)[0]);
  renderExamOrderDOM();
}
function resetExamOrderTokens() {
  const q = examQuestionsQueue[examCurrentIdx];
  renderExamOrderTokens(getItemText(q));
}
function submitExamOrderAnswer() {
  const fb = document.getElementById('exam-feedback-box');
  if (!examSelectedOrderTokens.length) {
    if (fb) {
      fb.className = 'feedback-box incorrect';
      fb.innerHTML = '⚠️ 請先點選下方單字排入上方「答案欄位」再確認送出！';
    }
    return;
  }
  const q = examQuestionsQueue[examCurrentIdx];
  const target = normalizeText(getItemText(q));
  const user = normalizeText(examSelectedOrderTokens.join(' '));
  checkExamAnswer(user === target);
}

function playExamTargetAudio() {
  const q = examQuestionsQueue[examCurrentIdx];
  if (!q) return;
  const listenBtn = document.getElementById('exam-listen-btn');
  if (listenBtn) listenBtn.disabled = true;
  playExamAudioWithCallback(q, () => {
    if (listenBtn) listenBtn.disabled = false;
  });
}

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
    if (elapsed >= totalMs) stopExamProgressTimer();
  }, 100);
}
function stopExamProgressTimer() {
  if (examProgressInterval) { clearInterval(examProgressInterval); examProgressInterval = null; }
  const container = document.getElementById('exam-timer-bar-container');
  if (container) container.style.display = 'none';
}

function startExamRecognition() {
  stopExamPlaybackAudio();
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
  let count = 3;
  overlay.style.display = 'flex';
  countNum.textContent = count;
  countText.textContent = '請預備開口朗讀...';
  playTone(523.25, 'sine', 0.12);

  if (examCountdownTimer) clearInterval(examCountdownTimer);
  examCountdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countNum.textContent = count;
      playTone(523.25, 'sine', 0.12);
    } else {
      clearInterval(examCountdownTimer);
      overlay.style.display = 'none';
      playTone(880, 'sine', 0.25);
      cardBox.classList.add('recording-active');
      recordBtn.style.background = 'linear-gradient(135deg,#dc2626 0%,#ef4444 100%)';
      recordBtn.innerHTML = '🎙️ 正在收音中...請大聲朗讀';
      startExamProgressTimer(10);

      startGenericRecognition({ word: targetText, sentence: targetText }, 'exam-feedback-box', (passed, reason) => {
        stopExamProgressTimer();
        cardBox.classList.remove('recording-active');
        examQuestionAttempts++;
        if (passed) {
          if (q.qType === 'phonics') examScoreState.phonicsOk++;
          else examScoreState.sentOk++;
          recordBtn.style.background = 'linear-gradient(135deg,#10b981 0%,#059669 100%)';
          recordBtn.innerHTML = '✅ 判定通過';
          setTimeout(() => { examCurrentIdx++; renderExamQuestion(); }, 1200);
        } else {
          if (examQuestionAttempts < 2) {
            fb.className = 'feedback-box incorrect';
            fb.innerHTML = reason === 'timeout' || reason === 'no-speech'
              ? '⚠️ 未偵測到聲音，請聽「嗶」聲後開口朗讀！（剩餘 1 次機會）'
              : '⚠️ 剛剛收音不夠清楚，請靠近麥克風再試一次！（剩餘 1 次機會）';
            recordBtn.disabled = false;
            recordBtn.classList.remove('opacity-50');
            recordBtn.style.background = 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)';
            recordBtn.innerHTML = '🔄 再次按下朗讀（第 2 次）';
          } else {
            examWrongDetails.push(targetText);
            fb.className = 'feedback-box incorrect';
            fb.innerHTML = '本題已完成兩次測驗，即將進入下一題...';
            recordBtn.innerHTML = '❌ 推進下一題';
            setTimeout(() => { examCurrentIdx++; renderExamQuestion(); }, 1500);
          }
        }
      });
    }
  }, 750);
}

function submitOfficialExam() {
  stopExamPlaybackAudio();
  document.getElementById('exam-quiz-view').style.display = 'none';
  document.getElementById('exam-result-view').style.display = 'flex';
  const total = examQuestionsQueue.length;
  const passedTotal = examScoreState.listenOk + examScoreState.phonicsOk + examScoreState.sentOk;
  const finalScore = Math.round((passedTotal / Math.max(1, total)) * 100);
  document.getElementById('exam-final-score').textContent = `${finalScore} 分`;
  document.getElementById('exam-score-details').innerHTML = `
    <strong>👂 聽力測驗得分：</strong> ${examScoreState.listenOk} / ${examScoreState.listenTotal}<br>
    <strong>🔤 Phonics 答對：</strong> ${examScoreState.phonicsOk} / ${examScoreState.phonicsTotal}<br>
    <strong>🧩 核心句型答對：</strong> ${examScoreState.sentOk} / ${examScoreState.sentTotal}<br>
    （本次作答成績已完成登記並已上傳鎖定）
  `;
  if (studentAssignedExam) {
    studentAssignedExam.hasSubmitted = true;
    studentAssignedExam.previousScore = finalScore;
  }
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'submitExamScore',
      examId: studentAssignedExam.examId,
      school: loggedInStudent.school || ACTIVE_SCHOOL.schoolValue,
      gradeClass: loggedInStudent.gradeClass,
      number: loggedInStudent.number,
      name: loggedInStudent.name,
      score: finalScore,
      listenScore: `${examScoreState.listenOk}/${examScoreState.listenTotal}`,
      phonicsScore: `${examScoreState.phonicsOk}/${examScoreState.phonicsTotal}`,
      sentenceScore: `${examScoreState.sentOk}/${examScoreState.sentTotal}`,
      wrongWords: examWrongDetails
    })
  }).catch(() => {});
}

function backToMenuFromExam() {
  stopExamPlaybackAudio();
  document.getElementById('exam-wrapper').style.display = 'none';
  document.getElementById('main-menu-wrapper').style.display = 'flex';
  if (loggedInStudent) checkActiveStudentExam(loggedInStudent.gradeClass, loggedInStudent.number);
}
