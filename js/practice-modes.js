// js/practice-modes.js
let selectedUnitObj = null;
let vocabNavLevel = 'hub';
let activeWorldCategoryFilter = 'all';
let storyAutoPlaying = false;
let storyAutoPlayIndex = 0;
let storyShowZh = true;
let activeStoryAudioObj = null;
let storyAutoPlayTimer = null;
let storyAutoPlayToken = 0;

function getProgressStorageKey() {
  if (!loggedInStudent || !currentBookId) return 'sf_progress_guest';
  return `sf_progress_${loggedInStudent.school}_${loggedInStudent.gradeClass}_${loggedInStudent.number}_${currentBookId}`;
}

function getStudentUnitProgress() {
  try {
    return JSON.parse(localStorage.getItem(getProgressStorageKey()) || '{}');
  } catch (e) {
    return {};
  }
}

function saveMissionProgress(unitId, missionKey, scorePercent = 100) {
  if (!unitId || !missionKey) return;
  const prog = getStudentUnitProgress();
  if (!prog[unitId]) prog[unitId] = {};
  const prev = prog[unitId][missionKey] || { completed: false, bestScore: 0 };
  prog[unitId][missionKey] = {
    completed: true,
    bestScore: Math.max(prev.bestScore || 0, Math.round(scorePercent))
  };
  try {
    localStorage.setItem(getProgressStorageKey(), JSON.stringify(prog));
  } catch (e) {}
}

function initVocabForCurrentBook() {
  if (!currentBook) return;
  pauseVocabActivities();
  activeWorldCategoryFilter = 'all';
  resetWorldFilterVisuals();
  document.querySelectorAll('.world-filter-select').forEach(s => { s.value = ''; });
  const allBtn = document.getElementById('filter-btn-all');
  if (allBtn) allBtn.classList.add('active');
  renderWorldMapHub();
}

function pauseVocabActivities() {
  stopStoryAutoPlay();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (activeRecognition) {
    try { activeRecognition.abort(); } catch (e) {}
    activeRecognition = null;
  }
}

function handleVocabTopBack() {
  pauseVocabActivities();
  const isMobile = window.innerWidth < 768;
  if (isMobile && vocabNavLevel === 'stage' && selectedUnitObj) {
    openUnitMissionMenu(selectedUnitObj.id, false);
  } else {
    backToMenu();
  }
}

function setActiveVocabView(viewId) {
  document.querySelectorAll('#stage-content-area .mode-section').forEach(sec => sec.classList.remove('active'));
  const menuEl = document.getElementById('unit-menu-view');
  const workspaceEl = document.getElementById('stage-workspace');
  if (viewId === 'unit-menu-view') {
    workspaceEl.classList.remove('has-active-mission');
    if (menuEl) menuEl.classList.add('active');
  } else {
    workspaceEl.classList.add('has-active-mission');
    if (menuEl) {
      if (window.innerWidth >= 768) {
        menuEl.classList.add('active');
      } else {
        menuEl.classList.remove('active');
      }
    }
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
  }
}

function resetWorldFilterVisuals() {
  document.querySelectorAll('.world-filter-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.world-filter-select').forEach(s => {
    s.classList.remove('active');
  });
}

function filterWorldStations(cat, btn) {
  if (btn && btn.disabled) return;
  activeWorldCategoryFilter = cat || 'all';
  resetWorldFilterVisuals();
  document.querySelectorAll('.world-filter-select').forEach(s => { s.value = ''; });
  if (btn) btn.classList.add('active');
  renderWorldMapHub();
}

function handleWorldSelectFilter(group, selectEl) {
  if (!selectEl || selectEl.disabled) return;
  const val = selectEl.value;
  if (!val) {
    filterWorldStations('all', document.getElementById('filter-btn-all'));
    return;
  }
  activeWorldCategoryFilter = val;
  resetWorldFilterVisuals();
  document.querySelectorAll('.world-filter-select').forEach(s => {
    if (s !== selectEl) s.value = '';
  });
  selectEl.classList.add('active');
  renderWorldMapHub();
}

function updateWorldFilterAvailability(catalog) {
  const cats = new Set((catalog || []).map(u => u.category));
  const setBtnState = (id, available) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = !available;
    el.classList.toggle('filter-disabled', !available);
  };
  setBtnState('filter-btn-numbers', cats.has('numbers'));
  setBtnState('filter-btn-dailytalk', cats.has('dailytalk'));
  setBtnState('filter-btn-festival', cats.has('festival'));

  const phonicsSel = document.getElementById('filter-sel-phonics');
  if (phonicsSel) {
    const phonicsUnits = (catalog || []).filter(u => u.category === 'phonics');
    const prevVal = phonicsSel.value;
    let optsHtml = '<option value="">🎈 發音 ▾</option>';
    if (phonicsUnits.length) {
      optsHtml += '<option value="phonics">全部發音</option>';
      phonicsUnits.forEach(u => {
        const shortName = escapeHtml(u.title.replace(/^Get Ready\s*-?\s*/i, ''));
        optsHtml += `<option value="unit:${escapeHtml(u.id)}">${shortName}</option>`;
      });
    }
    phonicsSel.innerHTML = optsHtml;
    if (prevVal && [...phonicsSel.options].some(o => o.value === prevVal)) {
      phonicsSel.value = prevVal;
    }
    const hasPhonics = phonicsUnits.length > 0;
    phonicsSel.disabled = !hasPhonics;
    phonicsSel.classList.toggle('filter-disabled', !hasPhonics);
  }

  const lessonSel = document.getElementById('filter-sel-lesson');
  if (lessonSel) {
    const hasAnyLesson = ['lesson1','lesson2','lesson3','lesson4'].some(k => cats.has(k));
    [...lessonSel.options].forEach(opt => {
      if (!opt.value) return;
      if (opt.value === 'lesson_all') opt.disabled = !hasAnyLesson;
      else opt.disabled = !cats.has(opt.value);
    });
    lessonSel.disabled = !hasAnyLesson;
    lessonSel.classList.toggle('filter-disabled', !hasAnyLesson);
  }

  const storySel = document.getElementById('filter-sel-story');
  if (storySel) {
    const hasAnyStory = cats.has('topic1_story') || cats.has('topic2_story');
    [...storySel.options].forEach(opt => {
      if (!opt.value) return;
      if (opt.value === 'story_all') opt.disabled = !hasAnyStory;
      else opt.disabled = !cats.has(opt.value);
    });
    storySel.disabled = !hasAnyStory;
    storySel.classList.toggle('filter-disabled', !hasAnyStory);
  }
}

function renderWorldMapHub() {
  vocabNavLevel = 'hub';
  selectedUnitObj = null;
  const catalog = currentBook?.unitCatalog || [];
  const availableCats = new Set(catalog.map(u => u.category));
  if (activeWorldCategoryFilter !== 'all' && !activeWorldCategoryFilter.startsWith('unit:')) {
    const isValidFilter =
      (activeWorldCategoryFilter === 'lesson_all' && ['lesson1','lesson2','lesson3','lesson4'].some(k => availableCats.has(k))) ||
      (activeWorldCategoryFilter === 'story_all' && (availableCats.has('topic1_story') || availableCats.has('topic2_story'))) ||
      availableCats.has(activeWorldCategoryFilter);
    if (!isValidFilter) {
      activeWorldCategoryFilter = 'all';
      resetWorldFilterVisuals();
      document.querySelectorAll('.world-filter-select').forEach(s => { s.value = ''; });
      const allBtn = document.getElementById('filter-btn-all');
      if (allBtn) allBtn.classList.add('active');
    }
  }
  updateWorldFilterAvailability(catalog);
  const progress = getStudentUnitProgress();

  let totalCompletedUnits = 0;
  catalog.forEach(unit => {
    const unitProg = progress[unit.id] || {};
    const doneCount = Object.values(unitProg).filter(x => x && x.completed).length;
    const totalMissions = getAvailableMissionsForUnit(unit).length;
    if (totalMissions > 0 && doneCount >= totalMissions) totalCompletedUnits++;
  });
  const stampBadgeEl = document.getElementById('total-stamp-badge');
  if (stampBadgeEl) {
    stampBadgeEl.textContent = `🛂 ${totalCompletedUnits} / ${catalog.length} 枚印章`;
  }

  if (typeof window.render3DWorldFromCatalog === 'function') {
    window.render3DWorldFromCatalog(catalog, progress, activeWorldCategoryFilter);
  }

  const mobileExamBanner = document.getElementById('mobile-exam-banner');
  const mobileExamTitle = document.getElementById('mobile-exam-title');
  if (mobileExamBanner && typeof studentAssignedExam !== 'undefined' && studentAssignedExam && studentAssignedExam.isActive && !studentAssignedExam.hasSubmitted) {
    mobileExamBanner.style.display = 'block';
    if (mobileExamTitle) mobileExamTitle.textContent = studentAssignedExam.title;
  } else if (mobileExamBanner) {
    mobileExamBanner.style.display = 'none';
  }
}

function enterWorldStation(unitId) {
  document.getElementById('main-menu-wrapper').style.display = 'none';
  document.getElementById('vocab-wrapper').style.display = 'flex';
  openUnitMissionMenu(unitId, true);
}

function getAvailableMissionsForUnit(unit) {
  const missions = [];
  const hasWords = unit.words && unit.words.length > 0;
  const hasImages = hasWords && unit.words.some(hasImage);
  const hasSentences = unit.sentences && unit.sentences.length > 0;
  const hasStories = unit.stories && unit.stories.length > 0;

  if (hasWords) {
    missions.push({ key: 'flashcard', name: '⚡ 單字閃示卡', desc: '看圖認字、中英對照與外師發音', isScored: false });
  }
  if (hasImages) {
    missions.push({ key: 'listening', name: '👂 看圖聽力測驗', desc: '聽英文發音，選出正確的代表圖片', isScored: true });
  }
  if (hasWords) {
    missions.push({ key: 'phonicsQuiz', name: '🔤 單字辨音拼寫', desc: '仔細聆聽發音，選出拼寫正確的單字', isScored: true });
  }
  if (hasSentences) {
    const isLessonUnit = /^lesson[1-4]$/.test(unit.category || '');
    if (isLessonUnit) {
      missions.push({ key: 'sentencePractice', name: '📘 核心句子聆聽學習', desc: '逐句聆聽外師示範發音與中英對照', isScored: false });
      missions.push({ key: 'sentenceListenEn', name: '🎧 句子聽力測驗（選英文）', desc: '聆聽句子發音，選出正確的英文句子', isScored: true });
      missions.push({ key: 'sentenceListenZh', name: '💬 句子聽力測驗（選中文）', desc: '聆聽句子發音，選出正確的中文意思', isScored: true });
    } else {
      missions.push({ key: 'sentencePractice', name: '📘 核心句子跟讀', desc: '逐句聆聽示範句並練習開口跟讀', isScored: false });
      missions.push({ key: 'speaking', name: '🎙️ 課文句型口說測驗', desc: 'AI 語音辨識評分，完成後成績上傳後台', isScored: true });
    }
  }
  if (hasStories) {
    missions.push({ key: 'storyRead', name: '📖 Story Time 故事閱讀', desc: '完整故事雙語對照、點擊發音與全篇連播', isScored: false });
    missions.push({ key: 'storyListening', name: '🎧 Story Time 故事聽力測驗', desc: '聆聽故事句子，選出正確的中文意思', isScored: true });
  }
  return missions;
}

function openUnitMissionMenu(unitId, autoLaunchOnDesktop = true) {
  const catalog = currentBook?.unitCatalog || [];
  const unit = catalog.find(u => u.id === unitId);
  if (!unit) return;
  selectedUnitObj = unit;
  currentUnitKey = unit.title;
  vocabNavLevel = 'menu';
  setActiveVocabView('unit-menu-view');

  document.getElementById('vocab-smart-back-btn').textContent = '← 返回 3D 英語島';
  document.getElementById('vocab-breadcrumb').textContent = '站點任務關卡';
  document.getElementById('vocab-header-title').textContent = `${unit.badgeIcon || '🏝️'} ${unit.title}`;
  document.getElementById('vocab-header-subtitle').textContent = unit.subtitle || '請選擇要挑戰的學習任務';
  document.getElementById('selected-unit-title').textContent = unit.title;
  document.getElementById('selected-unit-subtitle').textContent = '完成任務即可在 3D 島嶼升起通關金旗！';
  refreshMissionMenuBadges();

  const missions = getAvailableMissionsForUnit(unit);
  if (autoLaunchOnDesktop && window.innerWidth >= 768 && missions.length > 0) {
    launchUnitMission(missions[0].key);
  }
}

function refreshMissionMenuBadges() {
  if (!selectedUnitObj) return;
  const missions = getAvailableMissionsForUnit(selectedUnitObj);
  const progress = getStudentUnitProgress()[selectedUnitObj.id] || {};
  const listEl = document.getElementById('unit-mission-list');
  if (!listEl) return;

  listEl.innerHTML = missions.map((m, idx) => {
    const mProg = progress[m.key];
    const isDone = !!(mProg && mProg.completed);
    const isCurrent = (vocabNavLevel === 'stage' && currentMode === m.key);
    const statusText = isDone ? (m.isScored ? `⭐ ${mProg.bestScore}分` : '✅ 已完成') : '出發 →';
    return `<button type="button" class="mission-card-btn ${isDone ? 'done' : ''} ${isCurrent ? 'current-active' : ''}" onclick="launchUnitMission('${m.key}')">
      <div class="mission-left">
        <span class="mission-step-num">${isDone ? '✓' : (idx + 1)}</span>
        <div>
          <div class="mission-name">${escapeHtml(m.name)}</div>
          <div class="mission-desc">${escapeHtml(m.desc)}</div>
        </div>
      </div>
      <span class="mission-status">${statusText}</span>
    </button>`;
  }).join('');
}

function launchUnitMission(modeKey) {
  if (!selectedUnitObj) return;
  unlockAudio();
  pauseVocabActivities();
  currentMode = modeKey;
  vocabNavLevel = 'stage';
  currentIndex = 0;
  quizIndex = 0;

  if (window.innerWidth < 768) {
    document.getElementById('vocab-smart-back-btn').textContent = '← 返回本關任務';
  } else {
    document.getElementById('vocab-smart-back-btn').textContent = '← 返回 3D 英語島';
  }

  const isLessonUnit = /^lesson[1-4]$/.test(selectedUnitObj.category || '');
  const modeTitleMap = {
    flashcard: '⚡ 單字閃示卡',
    listening: '👂 看圖聽力測驗',
    phonicsQuiz: '🔤 單字辨音拼寫',
    sentencePractice: isLessonUnit ? '📘 核心句子聆聽學習' : '📘 核心句子跟讀',
    sentenceListenEn: '🎧 句子聽力測驗（選英文）',
    sentenceListenZh: '💬 句子聽力測驗（選中文）',
    speaking: '🎙️ 課文句型口說測驗',
    storyRead: '📖 Story Time 故事閱讀',
    storyListening: '🎧 Story Time 故事聽力測驗'
  };
  document.getElementById('vocab-breadcrumb').textContent = modeTitleMap[modeKey] || '學習練習';
  document.getElementById('vocab-header-title').textContent = `${selectedUnitObj.badgeIcon || '🏝️'} ${selectedUnitObj.title}`;
  document.getElementById('vocab-header-subtitle').textContent = modeTitleMap[modeKey] || '';
  setActiveVocabView(modeKey + '-mode');
  refreshMissionMenuBadges();

  const micBtn = document.getElementById('sentence-practice-mic-btn');
  if (micBtn) {
    micBtn.style.display = isLessonUnit ? 'none' : 'flex';
  }

  if (modeKey === 'flashcard') {
    activeWordList = selectedUnitObj.words || [];
    updateFlashcard();
  } else if (modeKey === 'listening') {
    activeWordList = selectedUnitObj.words || [];
    restartListeningQuiz();
  } else if (modeKey === 'phonicsQuiz') {
    activeWordList = selectedUnitObj.words || [];
    restartPhonicsQuiz();
  } else if (modeKey === 'sentencePractice') {
    activeWordList = selectedUnitObj.sentences || [];
    updateSentencePractice();
  } else if (modeKey === 'sentenceListenEn') {
    activeWordList = selectedUnitObj.sentences || [];
    restartSentenceListenEnQuiz();
  } else if (modeKey === 'sentenceListenZh') {
    activeWordList = selectedUnitObj.sentences || [];
    restartSentenceListenZhQuiz();
  } else if (modeKey === 'speaking') {
    activeWordList = selectedUnitObj.sentences || [];
    restartSpeakingQuiz();
  } else if (modeKey === 'storyRead') {
    activeWordList = selectedUnitObj.stories || [];
    initStoryReader();
  } else if (modeKey === 'storyListening') {
    activeWordList = selectedUnitObj.stories || [];
    restartStoryListeningQuiz();
  }
}

function updateFlashcard() {
  const list = safeList();
  if (!list.length) return;
  const item = list[currentIndex];
  const img = document.getElementById('fc-img');
  const text = getItemText(item);
  document.getElementById('fc-progress').innerText = `${currentIndex + 1} / ${list.length}`;
  if (hasImage(item)) {
    img.style.display = 'block';
    img.src = item.image;
    img.alt = text + ' 圖片';
  } else {
    img.style.display = 'none';
    img.removeAttribute('src');
  }
  document.getElementById('fc-word').innerText = text;
  document.getElementById('fc-meaning').innerText = getItemMeaning(item);
  if (currentIndex === list.length - 1 && selectedUnitObj) {
    saveMissionProgress(selectedUnitObj.id, 'flashcard', 100);
    refreshMissionMenuBadges();
  }
}
function playCurrentWordAudio() { playAudio(safeList()[currentIndex]); }
function nextWord() { const l = safeList(); if (!l.length) return; currentIndex = (currentIndex + 1) % l.length; updateFlashcard(); }
function prevWord() { const l = safeList(); if (!l.length) return; currentIndex = (currentIndex - 1 + l.length) % l.length; updateFlashcard(); }

function restartListeningQuiz() {
  currentQuizList = shuffle(safeList().filter(hasImage));
  quizIndex = 0; score = 0; wrongWords = [];
  document.getElementById('listening-quiz-view').style.display = 'block';
  document.getElementById('listening-result-view').style.display = 'none';
  if (!currentQuizList.length) {
    document.getElementById('listening-quiz-view').innerHTML = '<h3>此單元沒有可用圖片題目</h3>';
    return;
  }
  loadListeningQuestion();
}

function loadListeningQuestion() {
  if (quizIndex >= currentQuizList.length) { showSimpleResult('listening'); return; }
  const cur = currentQuizList[quizIndex];
  document.getElementById('list-progress').innerText = `題目 ${quizIndex + 1} / ${currentQuizList.length}`;
  document.getElementById('listening-feedback').className = 'feedback-box';
  document.getElementById('listening-feedback').innerHTML = '';
  const unitPool = safeList().filter(hasImage);
  const bookPool = Object.values(currentBook?.vocabularyWithPaths || {}).flat().filter(hasImage);
  const opts = [cur];
  const pickFrom = (pool) => {
    const shuffled = shuffle(pool);
    for (const r of shuffled) {
      if (opts.length >= 4) break;
      if (!opts.some(o => normalizeText(getItemText(o)) === normalizeText(getItemText(r)))) opts.push(r);
    }
  };
  pickFrom(unitPool);
  if (opts.length < 4) pickFrom(bookPool);
  const box = document.getElementById('quiz-options');
  box.innerHTML = '';
  shuffle(opts).forEach(opt => {
    const btn = document.createElement('button');
    if (hasImage(opt)) {
      btn.className = 'option-img-btn';
      const img = document.createElement('img');
      img.src = opt.image;
      img.onerror = function() { this.src = 'https://placehold.co/120x100/e0e7ff/3730a3?text=' + encodeURIComponent(getItemText(opt)); };
      btn.appendChild(img);
    } else {
      btn.className = 'option-text-btn';
      btn.innerText = getItemText(opt);
    }
    btn.onclick = () => checkListeningAnswer(opt, cur);
    box.appendChild(btn);
  });
  if (audioUnlocked) playAudio(cur);
}
function playQuizAudio() { playAudio(currentQuizList[quizIndex]); }
function checkListeningAnswer(sel, cor) {
  document.querySelectorAll('#quiz-options button').forEach(b => b.disabled = true);
  const fb = document.getElementById('listening-feedback');
  if (normalizeText(getItemText(sel)) === normalizeText(getItemText(cor))) {
    score++;
    fb.className = 'feedback-box correct';
    fb.innerHTML = '🎉 答對了！';
    setTimeout(() => { quizIndex++; loadListeningQuestion(); }, 800);
  } else {
    wrongWords.push(cor);
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `正確答案：<strong>${escapeHtml(getItemText(cor))}</strong>`;
    setTimeout(() => { quizIndex++; loadListeningQuestion(); }, 1600);
  }
}

function restartPhonicsQuiz() {
  currentQuizList = shuffle(safeList());
  quizIndex = 0; score = 0; wrongWords = [];
  document.getElementById('phonics-quiz-view').style.display = 'block';
  document.getElementById('phonics-result-view').style.display = 'none';
  loadPhonicsQuestion();
}

function buildPhonicsChoices(cur) {
  const correct = getItemText(cur);
  const choices = [];
  const add = w => {
    if (!normalizeText(w)) return;
    if (!choices.some(c => normalizeText(c) === normalizeText(w))) choices.push(w);
  };
  add(correct);
  (cur.similarWords || []).forEach(add);
  shuffle(safeList().map(getItemText)).forEach(w => {
    if (choices.length < 4 && normalizeText(w) !== normalizeText(correct)) add(w);
  });
  shuffle(Object.values(activeRawUnits).flat().map(getItemText)).forEach(w => {
    if (choices.length < 4 && normalizeText(w) !== normalizeText(correct)) add(w);
  });
  return shuffle(choices.slice(0, 4));
}

function loadPhonicsQuestion() {
  if (quizIndex >= currentQuizList.length) { showSimpleResult('phonicsQuiz'); return; }
  const cur = currentQuizList[quizIndex];
  document.getElementById('phonics-progress').innerText = `題目 ${quizIndex + 1} / ${currentQuizList.length}`;
  document.getElementById('phonics-feedback').className = 'feedback-box';
  document.getElementById('phonics-feedback').innerHTML = '';
  const box = document.getElementById('phonics-quiz-options');
  box.innerHTML = '';
  buildPhonicsChoices(cur).forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'option-text-btn';
    btn.innerText = choice;
    btn.onclick = () => checkPhonicsAnswer(choice, cur);
    box.appendChild(btn);
  });
  if (audioUnlocked) playAudio(cur);
}
function playPhonicsQuizAudio() { playAudio(currentQuizList[quizIndex]); }
function checkPhonicsAnswer(sel, cor) {
  document.querySelectorAll('#phonics-quiz-options button').forEach(b => b.disabled = true);
  const fb = document.getElementById('phonics-feedback');
  if (normalizeText(sel) === normalizeText(getItemText(cor))) {
    score++;
    fb.className = 'feedback-box correct';
    fb.innerHTML = '🎉 答對了！';
    setTimeout(() => { quizIndex++; loadPhonicsQuestion(); }, 800);
  } else {
    wrongWords.push(cor);
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `正確答案：<strong>${escapeHtml(getItemText(cor))}</strong>`;
    setTimeout(() => { quizIndex++; loadPhonicsQuestion(); }, 1600);
  }
}

function updateSentencePractice() {
  const list = safeList();
  const item = list[currentIndex];
  document.getElementById('sentence-progress').innerText = list.length ? `句子 ${currentIndex + 1} / ${list.length}` : '尚無句子資料';
  document.getElementById('sentence-text').innerText = item ? getItemText(item) : '尚無句子資料';
  document.getElementById('sentence-meaning').innerText = item ? getItemMeaning(item) : '';
  document.getElementById('sentence-feedback').className = 'feedback-box';
  document.getElementById('sentence-feedback').innerHTML = '';
  if (list.length && currentIndex === list.length - 1 && selectedUnitObj) {
    saveMissionProgress(selectedUnitObj.id, 'sentencePractice', 100);
    refreshMissionMenuBadges();
  }
}
function nextSentenceItem() { const l = safeList(); if (!l.length) return; currentIndex = (currentIndex + 1) % l.length; updateSentencePractice(); }
function prevSentenceItem() { const l = safeList(); if (!l.length) return; currentIndex = (currentIndex - 1 + l.length) % l.length; updateSentencePractice(); }
function playCurrentSentenceAudio() { playAudio(safeList()[currentIndex]); }
function startSentenceSpeechRecognition() {
  const item = safeList()[currentIndex];
  if (!item) return;
  const text = getItemText(item).replace(/[.?!,]/g, '').trim();
  startGenericRecognition({ word: text, sentence: text, meaning: '' }, 'sentence-feedback');
}

function getBookSentencePool() {
  return [
    ...Object.values(currentBook?.sentenceUnits || {}).flat(),
    ...Object.values(currentBook?.dailyTalkUnits || {}).flat()
  ];
}

// 關卡 5A：句子聽力測驗（聽聲音選出正確的英文句子）
function restartSentenceListenEnQuiz() {
  const validItems = safeList().filter(item => getItemText(item));
  currentQuizList = shuffle(validItems);
  quizIndex = 0; score = 0; wrongWords = [];
  document.getElementById('sentence-listen-en-quiz-view').style.display = 'block';
  document.getElementById('sentence-listen-en-result-view').style.display = 'none';
  if (!currentQuizList.length) {
    document.getElementById('sentence-listen-en-quiz-view').innerHTML = '<h3>此單元尚無可用句子題目</h3>';
    return;
  }
  loadSentenceListenEnQuestion();
}

function loadSentenceListenEnQuestion() {
  if (quizIndex >= currentQuizList.length) { showSimpleResult('sentenceListenEn'); return; }
  const cur = currentQuizList[quizIndex];
  document.getElementById('sentence-listen-en-progress').innerText = `題目 ${quizIndex + 1} / ${currentQuizList.length}`;
  const fb = document.getElementById('sentence-listen-en-feedback');
  fb.className = 'feedback-box';
  fb.innerHTML = '';

  const correctEn = getItemText(cur).trim();
  const opts = [correctEn];
  const seenNorm = new Set([normalizeText(correctEn)]);

  const pickDistractors = (pool) => {
    for (const r of shuffle(pool)) {
      if (opts.length >= 4) break;
      const cand = getItemText(r).trim();
      const norm = normalizeText(cand);
      if (cand && norm && !seenNorm.has(norm)) {
        seenNorm.add(norm);
        opts.push(cand);
      }
    }
  };
  pickDistractors(safeList());
  if (opts.length < 4) pickDistractors(getBookSentencePool());

  const box = document.getElementById('sentence-listen-en-options');
  box.innerHTML = '';
  shuffle(opts).forEach(choiceEn => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.style.cssText = 'padding:13px 16px;font-size:1.02rem;text-align:left;justify-content:flex-start;line-height:1.4;';
    btn.textContent = choiceEn;
    btn.onclick = () => checkSentenceListenEnAnswer(choiceEn, cur);
    box.appendChild(btn);
  });
  if (audioUnlocked) playAudio(cur);
}

function playSentenceListenEnAudio() {
  playAudio(currentQuizList[quizIndex]);
}

function checkSentenceListenEnAnswer(selectedEn, curItem) {
  document.querySelectorAll('#sentence-listen-en-options button').forEach(b => b.disabled = true);
  const fb = document.getElementById('sentence-listen-en-feedback');
  const correctEn = getItemText(curItem);
  const meaningZh = getItemMeaning(curItem);
  if (normalizeText(selectedEn) === normalizeText(correctEn)) {
    score++;
    playTone(659.25, 'sine', 0.15);
    fb.className = 'feedback-box correct';
    fb.innerHTML = `🎉 答對了！<br>${escapeHtml(correctEn)}${meaningZh ? '（' + escapeHtml(meaningZh) + '）' : ''}`;
    setTimeout(() => { quizIndex++; loadSentenceListenEnQuestion(); }, 950);
  } else {
    wrongWords.push(curItem);
    playTone(329.63, 'sawtooth', 0.25);
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `正確句子：<strong>${escapeHtml(correctEn)}</strong>${meaningZh ? '<br>中文意思：' + escapeHtml(meaningZh) : ''}`;
    setTimeout(() => { quizIndex++; loadSentenceListenEnQuestion(); }, 1800);
  }
}

// 關卡 5B：句子聽力測驗（聽聲音選出正確的中文句子）
function restartSentenceListenZhQuiz() {
  const validItems = safeList().filter(item => getItemText(item) && getItemMeaning(item));
  currentQuizList = shuffle(validItems);
  quizIndex = 0; score = 0; wrongWords = [];
  document.getElementById('sentence-listen-zh-quiz-view').style.display = 'block';
  document.getElementById('sentence-listen-zh-result-view').style.display = 'none';
  if (!currentQuizList.length) {
    document.getElementById('sentence-listen-zh-quiz-view').innerHTML = '<h3>此單元尚無可用中文句意題目</h3>';
    return;
  }
  loadSentenceListenZhQuestion();
}

function loadSentenceListenZhQuestion() {
  if (quizIndex >= currentQuizList.length) { showSimpleResult('sentenceListenZh'); return; }
  const cur = currentQuizList[quizIndex];
  document.getElementById('sentence-listen-zh-progress').innerText = `題目 ${quizIndex + 1} / ${currentQuizList.length}`;
  const fb = document.getElementById('sentence-listen-zh-feedback');
  fb.className = 'feedback-box';
  fb.innerHTML = '';

  const correctZh = getItemMeaning(cur).trim();
  const opts = [correctZh];
  const seenZh = new Set([correctZh.toLowerCase()]);

  const pickDistractors = (pool) => {
    for (const r of shuffle(pool)) {
      if (opts.length >= 4) break;
      const cand = getItemMeaning(r).trim();
      if (cand && !seenZh.has(cand.toLowerCase())) {
        seenZh.add(cand.toLowerCase());
        opts.push(cand);
      }
    }
  };
  pickDistractors(safeList());
  if (opts.length < 4) pickDistractors(getBookSentencePool());

  const box = document.getElementById('sentence-listen-zh-options');
  box.innerHTML = '';
  shuffle(opts).forEach(choiceZh => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.style.cssText = 'padding:13px 16px;font-size:1rem;text-align:left;justify-content:flex-start;line-height:1.4;';
    btn.textContent = choiceZh;
    btn.onclick = () => checkSentenceListenZhAnswer(choiceZh, cur);
    box.appendChild(btn);
  });
  if (audioUnlocked) playAudio(cur);
}

function playSentenceListenZhAudio() {
  playAudio(currentQuizList[quizIndex]);
}

function checkSentenceListenZhAnswer(selectedZh, curItem) {
  document.querySelectorAll('#sentence-listen-zh-options button').forEach(b => b.disabled = true);
  const fb = document.getElementById('sentence-listen-zh-feedback');
  const correctZh = getItemMeaning(curItem).trim();
  const correctEn = getItemText(curItem);
  if (selectedZh === correctZh) {
    score++;
    playTone(659.25, 'sine', 0.15);
    fb.className = 'feedback-box correct';
    fb.innerHTML = `🎉 答對了！<br>${escapeHtml(correctEn)}`;
    setTimeout(() => { quizIndex++; loadSentenceListenZhQuestion(); }, 950);
  } else {
    wrongWords.push(curItem);
    playTone(329.63, 'sawtooth', 0.25);
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `正確意思：<strong>${escapeHtml(correctZh)}</strong><br>英文原句：${escapeHtml(correctEn)}`;
    setTimeout(() => { quizIndex++; loadSentenceListenZhQuestion(); }, 1800);
  }
}

function restartSpeakingQuiz() {
  currentQuizList = shuffle(safeList());
  quizIndex = 0; score = 0; wrongWords = [];
  document.getElementById('speaking-quiz-view').style.display = 'block';
  document.getElementById('speaking-result-view').style.display = 'none';
  loadSpeakingQuestion();
}
function loadSpeakingQuestion() {
  if (quizIndex >= currentQuizList.length) { showSimpleResult('speaking'); return; }
  const item = currentQuizList[quizIndex];
  document.getElementById('spk-progress').innerText = `句子 ${quizIndex + 1} / ${currentQuizList.length}`;
  const img = document.getElementById('sp-img');
  if (img) img.style.display = 'none';
  document.getElementById('sp-word').innerText = getItemText(item);
  document.getElementById('sp-meaning').innerText = getItemMeaning(item);
  document.getElementById('speaking-feedback').className = 'feedback-box';
  document.getElementById('speaking-feedback').innerHTML = '';
}
function playSpeakingSentence() { if (!currentQuizList.length) return; playAudio(currentQuizList[quizIndex]); }
function startSpeechRecognition() {
  if (!currentQuizList.length) return;
  const item = currentQuizList[quizIndex];
  const cleanText = getItemText(item).replace(/[.?!,]/g, '').trim();
  startGenericRecognition({ word: cleanText, sentence: cleanText, meaning: '' }, 'speaking-feedback', passed => {
    if (passed) score++; else wrongWords.push(item);
    setTimeout(() => { quizIndex++; loadSpeakingQuestion(); }, passed ? 1000 : 2200);
  });
}

function initStoryReader() {
  const list = safeList();
  const container = document.getElementById('story-reader-list');
  storyAutoPlaying = false;
  storyAutoPlayIndex = 0;
  storyShowZh = true;
  document.getElementById('story-play-all-btn').textContent = '▶️ 全篇連播';
  document.getElementById('story-toggle-zh-btn').textContent = '👁️ 隱藏中文';
  container.classList.remove('hide-zh');
  if (!list.length) {
    container.innerHTML = '<h3>此單元尚無故事內容</h3>';
    return;
  }
  container.innerHTML = list.map((line, idx) => `
    <div id="story-line-${idx}" class="story-line-card" onclick="playSingleStoryLine(${idx})">
      <div class="story-line-en">${line.no ? `${line.no}. ` : ''}${escapeHtml(getItemText(line))} 🔊</div>
      <div class="story-line-zh">${escapeHtml(getItemMeaning(line))}</div>
    </div>
  `).join('');
  if (selectedUnitObj) {
    saveMissionProgress(selectedUnitObj.id, 'storyRead', 100);
  }
}
function highlightStoryLine(idx) {
  document.querySelectorAll('.story-line-card').forEach(el => el.classList.remove('playing'));
  const target = document.getElementById(`story-line-${idx}`);
  if (target) {
    target.classList.add('playing');
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function playSingleStoryLine(idx) {
  stopStoryAutoPlay();
  const list = safeList();
  const item = list[idx];
  if (!item) return;
  highlightStoryLine(idx);
  if (item.audio) {
    const audio = new Audio(item.audio);
    activeStoryAudioObj = audio;
    let fallbackFired = false;
    const fallback = () => {
      if (fallbackFired) return;
      fallbackFired = true;
      speakText(getItemText(item));
    };
    audio.onerror = fallback;
    audio.play().catch(fallback);
  } else {
    speakText(getItemText(item));
  }
}
function toggleStoryTranslation() {
  storyShowZh = !storyShowZh;
  const container = document.getElementById('story-reader-list');
  const btn = document.getElementById('story-toggle-zh-btn');
  container.classList.toggle('hide-zh', !storyShowZh);
  btn.textContent = storyShowZh ? '👁️ 隱藏中文' : '👁️ 顯示中文';
}
function toggleStoryAutoPlay() {
  if (storyAutoPlaying) { stopStoryAutoPlay(); return; }
  const list = safeList();
  if (!list.length) return;
  storyAutoPlayToken++;
  storyAutoPlaying = true;
  storyAutoPlayIndex = 0;
  document.getElementById('story-play-all-btn').textContent = '⏹️ 停止連播';
  playNextStoryChain(storyAutoPlayToken);
}
function stopStoryAutoPlay() {
  storyAutoPlayToken++;
  storyAutoPlaying = false;
  if (storyAutoPlayTimer) {
    clearTimeout(storyAutoPlayTimer);
    storyAutoPlayTimer = null;
  }
  if (activeStoryAudioObj) {
    try {
      activeStoryAudioObj.onended = null;
      activeStoryAudioObj.onerror = null;
      activeStoryAudioObj.pause();
    } catch (e) {}
    activeStoryAudioObj = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const btn = document.getElementById('story-play-all-btn');
  if (btn) btn.textContent = '▶️ 全篇連播';
}
function playNextStoryChain(token) {
  if (!storyAutoPlaying || token !== storyAutoPlayToken) return;
  const list = safeList();
  if (storyAutoPlayIndex >= list.length) { stopStoryAutoPlay(); return; }
  const item = list[storyAutoPlayIndex];
  highlightStoryLine(storyAutoPlayIndex);

  let settled = false;
  const advance = () => {
    if (settled || !storyAutoPlaying || token !== storyAutoPlayToken) return;
    settled = true;
    storyAutoPlayIndex++;
    storyAutoPlayTimer = setTimeout(() => playNextStoryChain(token), 450);
  };

  let fallbackStarted = false;
  const triggerFallback = () => {
    if (fallbackStarted || settled || !storyAutoPlaying || token !== storyAutoPlayToken) return;
    fallbackStarted = true;
    speakStoryWithCallback(getItemText(item), advance);
  };

  if (item.audio) {
    const audio = new Audio(item.audio);
    activeStoryAudioObj = audio;
    audio.onended = advance;
    audio.onerror = triggerFallback;
    audio.play().catch(triggerFallback);
  } else {
    triggerFallback();
  }
}
function speakStoryWithCallback(text, onEnd) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.8;
    u.onend = onEnd;
    u.onerror = onEnd;
    window.speechSynthesis.speak(u);
  } else {
    setTimeout(onEnd, 1800);
  }
}

function restartStoryListeningQuiz() {
  const validLines = safeList().filter(item => getItemText(item) && getItemMeaning(item));
  currentQuizList = shuffle(validLines);
  quizIndex = 0; score = 0; wrongWords = [];
  document.getElementById('story-listen-quiz-view').style.display = 'block';
  document.getElementById('story-listen-result-view').style.display = 'none';
  if (!currentQuizList.length) {
    document.getElementById('story-listen-quiz-view').innerHTML = '<h3>此故事尚無可用聽力題目</h3>';
    return;
  }
  loadStoryListeningQuestion();
}
function loadStoryListeningQuestion() {
  if (quizIndex >= currentQuizList.length) { showSimpleResult('storyListening'); return; }
  const cur = currentQuizList[quizIndex];
  document.getElementById('story-listen-progress').innerText = `題目 ${quizIndex + 1} / ${currentQuizList.length}`;
  const fb = document.getElementById('story-listen-feedback');
  fb.className = 'feedback-box';
  fb.innerHTML = '';
  const allStories = Object.values(currentBook?.storyUnits || {}).flat().filter(x => getItemMeaning(x));
  const correctZh = getItemMeaning(cur);
  const opts = [correctZh];
  while (opts.length < Math.min(4, allStories.length)) {
    const r = allStories[Math.floor(Math.random() * allStories.length)];
    const candidateZh = getItemMeaning(r);
    if (candidateZh && !opts.includes(candidateZh)) opts.push(candidateZh);
  }
  const box = document.getElementById('story-listen-options');
  box.innerHTML = '';
  shuffle(opts).forEach(choiceZh => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.style.cssText = 'padding:12px 14px;font-size:0.95rem;text-align:left;justify-content:flex-start;line-height:1.4;';
    btn.textContent = choiceZh;
    btn.onclick = () => checkStoryListeningAnswer(choiceZh, cur);
    box.appendChild(btn);
  });
  if (audioUnlocked) playAudio(cur);
}
function playStoryListenAudio() { playAudio(currentQuizList[quizIndex]); }
function checkStoryListeningAnswer(selectedZh, curItem) {
  document.querySelectorAll('#story-listen-options button').forEach(b => b.disabled = true);
  const fb = document.getElementById('story-listen-feedback');
  const correctZh = getItemMeaning(curItem);
  if (selectedZh === correctZh) {
    score++;
    fb.className = 'feedback-box correct';
    fb.innerHTML = `🎉 答對了！<br>${escapeHtml(getItemText(curItem))}`;
    setTimeout(() => { quizIndex++; loadStoryListeningQuestion(); }, 950);
  } else {
    wrongWords.push(curItem);
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = `正確意思：<strong>${escapeHtml(correctZh)}</strong><br>原句：${escapeHtml(getItemText(curItem))}`;
    setTimeout(() => { quizIndex++; loadStoryListeningQuestion(); }, 1800);
  }
}

const speechAliasMap = {
  one: ['one', '1', 'won'], two: ['two', '2', 'to', 'too'], three: ['three', '3'],
  four: ['four', '4', 'for'], five: ['five', '5'], six: ['six', '6'],
  seven: ['seven', '7'], eight: ['eight', '8', 'ate'], nine: ['nine', '9'], ten: ['ten', '10']
};
function expandContractions(text) {
  return String(text)
    .replace(/i['’]m/gi, 'i am').replace(/he['’]s/gi, 'he is').replace(/she['’]s/gi, 'she is')
    .replace(/it['’]s/gi, 'it is').replace(/they['’]re/gi, 'they are').replace(/we['’]re/gi, 'we are')
    .replace(/you['’]re/gi, 'you are').replace(/don['’]t/gi, 'do not').replace(/can['’]t/gi, 'cannot')
    .replace(/doesn['’]t/gi, 'does not');
}
function canonicalSpeechToken(t) {
  const n = normalizeText(t);
  for (const [w, a] of Object.entries(speechAliasMap)) if (a.includes(n)) return w;
  return n;
}
function canonicalSpeechText(t) {
  return normalizeText(t).split(' ').map(canonicalSpeechToken).join(' ').trim();
}
function isSpeakingMatch(ans, cor) {
  const a = canonicalSpeechText(expandContractions(ans));
  const c = canonicalSpeechText(expandContractions(cor));
  if (!a || !c) return false;
  if (a === c) return true;
  const aw = a.split(' ').filter(Boolean), cw = c.split(' ').filter(Boolean);
  if (cw.length <= 1) return aw.includes(c);
  return cw.filter(w => aw.includes(w)).length / cw.length >= 0.6;
}
function startGenericRecognition(item, feedbackId, onDone) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const fb = document.getElementById(feedbackId);
  if (!SR) {
    fb.className = 'feedback-box incorrect';
    fb.innerHTML = '此瀏覽器不支援語音辨識，建議使用 Chrome。';
    if (onDone) onDone(false, 'unsupported');
    return;
  }
  if (activeRecognition) {
    try { activeRecognition.abort(); } catch (e) {}
    activeRecognition = null;
  }
  const rec = new SR();
  activeRecognition = rec;
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let hasEnded = false;
  fb.className = 'feedback-box';
  fb.innerHTML = '🎙️ 正在聆聽，請對著麥克風清晰朗讀...';
  const timeoutId = setTimeout(() => {
    if (!hasEnded) {
      hasEnded = true;
      try { rec.abort(); } catch (e) {}
      activeRecognition = null;
      if (onDone) onDone(false, 'timeout');
    }
  }, 10000);
  rec.onresult = (e) => {
    if (hasEnded) return;
    hasEnded = true;
    clearTimeout(timeoutId);
    activeRecognition = null;
    const transcript = e.results[0][0].transcript;
    const target = getItemText(item);
    const passed = isSpeakingMatch(transcript, target);
    if (passed) {
      fb.className = 'feedback-box correct';
      fb.innerHTML = `🎉 朗讀正確！我聽到：<strong>${escapeHtml(transcript)}</strong>`;
    } else {
      fb.className = 'feedback-box incorrect';
      fb.innerHTML = `辨識未完全吻合。<br>標準：<strong>${escapeHtml(target)}</strong><br>我聽到：${escapeHtml(transcript || '未辨識到')}`;
    }
    if (onDone) onDone(passed, 'result');
  };
  rec.onerror = () => {
    if (hasEnded) return;
    hasEnded = true;
    clearTimeout(timeoutId);
    activeRecognition = null;
    if (onDone) onDone(false, 'error');
  };
  rec.onend = () => {
    if (!hasEnded) {
      hasEnded = true;
      clearTimeout(timeoutId);
      activeRecognition = null;
      if (onDone) onDone(false, 'no-speech');
    }
  };
  try { rec.start(); } catch (e) {
    clearTimeout(timeoutId);
    activeRecognition = null;
    if (onDone) onDone(false, 'start-failed');
  }
}

function submitQuizRecord(mode, scoreVal, totalVal, wrongList = []) {
  if (!loggedInStudent || !GOOGLE_SCRIPT_URL) return;
  const payload = {
    action: 'submitScore',
    school: loggedInStudent.school || ACTIVE_SCHOOL.schoolValue,
    gradeClass: loggedInStudent.gradeClass || '',
    number: loggedInStudent.number || '',
    name: loggedInStudent.name || loggedInStudent.displayName || '',
    bookId: currentBookId || '',
    unit: currentUnitKey || '',
    mode: mode,
    score: scoreVal,
    total: totalVal,
    wrongWords: (wrongList || []).map(item => getItemText(item)).filter(Boolean)
  };
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(() => {
      const tipEl = document.getElementById(`${mode}-upload-tip`);
      if (tipEl) tipEl.innerHTML = '☁️ 成績已自動記錄至後台';
    })
    .catch(() => {
      const tipEl = document.getElementById(`${mode}-upload-tip`);
      if (tipEl) tipEl.innerHTML = '⚠️ 網路不穩，暫未上傳成功';
    });
}

function showSimpleResult(type) {
  const total = currentQuizList.length;
  const pct = Math.round((score / Math.max(1, total)) * 100);
  const text = `完成！得分：${score} / ${total}（${pct} 分）`;
  if (selectedUnitObj) {
    saveMissionProgress(selectedUnitObj.id, type, pct);
    refreshMissionMenuBadges();
  }
  submitQuizRecord(type, score, total, wrongWords);
  const uploadTipHtml = `<p id="${type}-upload-tip" class="text-xs font-bold text-slate-500 my-2">☁️ 正在同步記錄中...</p>`;
  const backMissionBtn = selectedUnitObj ? `<button type="button" class="btn btn-outline mt-2" onclick="openUnitMissionMenu('${selectedUnitObj.id}', false)">← 返回本單元任務選單</button>` : '';
  const restartMap = {
    listening: 'restartListeningQuiz()',
    phonicsQuiz: 'restartPhonicsQuiz()',
    sentenceListenEn: 'restartSentenceListenEnQuiz()',
    sentenceListenZh: 'restartSentenceListenZhQuiz()',
    speaking: 'restartSpeakingQuiz()',
    storyListening: 'restartStoryListeningQuiz()'
  };
  const viewPrefixMap = {
    listening: 'listening',
    phonicsQuiz: 'phonics',
    sentenceListenEn: 'sentence-listen-en',
    sentenceListenZh: 'sentence-listen-zh',
    speaking: 'speaking',
    storyListening: 'story-listen'
  };
  const prefix = viewPrefixMap[type];
  document.getElementById(`${prefix}-quiz-view`).style.display = 'none';
  const resEl = document.getElementById(`${prefix}-result-view`);
  resEl.style.display = 'block';
  resEl.innerHTML = `<h3>${text}</h3>${uploadTipHtml}<button type="button" class="btn btn-primary mt-3" onclick="${restartMap[type]}">🔄 再測驗一次</button>${backMissionBtn}`;
}

// --- CD Player ---
let playerTracks = [], currentTrackIndex = 0, playerIsPlaying = false, currentPlayerTab = 'CD1';
const playerAudio = document.getElementById('main-audio');
const playerPlayBtn = document.getElementById('play-btn');
const playerPrevBtn = document.getElementById('prev-btn');
const playerNextBtn = document.getElementById('next-btn');
const playerProgressBar = document.getElementById('progress-bar');
const playerProgressArea = document.getElementById('progress-area');
const playerDisplayTitle = document.getElementById('display-title');
const playerPlaylistContainer = document.getElementById('playlist-container');
const playerCurrentTimeEl = document.getElementById('current-time');
const playerTotalTimeEl = document.getElementById('total-time');
const playerStatusMsgEl = document.getElementById('player-status-msg');

function setPlayerStatus(msg, isError = false) {
  if (!playerStatusMsgEl) return;
  if (!msg) {
    playerStatusMsgEl.style.display = 'none';
    playerStatusMsgEl.textContent = '';
    playerStatusMsgEl.className = 'player-status-msg';
  } else {
    playerStatusMsgEl.style.display = 'block';
    playerStatusMsgEl.textContent = msg;
    playerStatusMsgEl.className = isError ? 'player-status-msg error' : 'player-status-msg';
  }
}
function formatPlayerTime(s) {
  if (isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}
function loadPlayerPlaylist() {
  playerPlaylistContainer.innerHTML = '';
  playerTracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = track.title;
    li.setAttribute('data-index', index);
    li.setAttribute('data-cd', track.cd);
    li.addEventListener('click', () => loadPlayerTrack(index, true));
    playerPlaylistContainer.appendChild(li);
  });
}
function switchPlayerTab(cdName) {
  currentPlayerTab = cdName;
  document.getElementById('btn-CD1')?.classList.toggle('active', cdName === 'CD1');
  document.getElementById('btn-CD2')?.classList.toggle('active', cdName === 'CD2');
  playerPlaylistContainer.querySelectorAll('li').forEach(item => {
    item.style.display = item.getAttribute('data-cd') === cdName ? 'flex' : 'none';
  });
}
function loadPlayerTrack(index, isAutoPlay = false) {
  if (!playerTracks.length) return;
  currentTrackIndex = index;
  const track = playerTracks[currentTrackIndex];
  setPlayerStatus('');
  playerProgressBar.style.width = '0%';
  playerCurrentTimeEl.textContent = '0:00';
  playerTotalTimeEl.textContent = '0:00';
  playerAudio.src = track.file;
  playerDisplayTitle.textContent = track.title;
  if (track.cd !== currentPlayerTab) switchPlayerTab(track.cd);
  playerPlaylistContainer.querySelectorAll('li').forEach(item => item.classList.remove('active'));
  const activeLi = playerPlaylistContainer.querySelector(`li[data-index="${index}"]`);
  if (activeLi) {
    activeLi.classList.add('active');
    activeLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (isAutoPlay) playTrackAudio(); else pauseTrackAudio();
}
function playTrackAudio() {
  if (!playerTracks.length) { setPlayerStatus('此冊別尚未設定 CD 曲目資料。', false); return; }
  if (!playerAudio.src) loadPlayerTrack(currentTrackIndex, false);
  const track = playerTracks[currentTrackIndex];
  const playPromise = playerAudio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      playerIsPlaying = true;
      if (playerPlayBtn) playerPlayBtn.textContent = '暫停';
      setPlayerStatus('');
    }).catch(err => {
      playerIsPlaying = false;
      if (playerPlayBtn) playerPlayBtn.textContent = '播放';
      const filePath = track ? track.file : '';
      if (err && err.name === 'NotAllowedError') {
        setPlayerStatus('請點擊「播放」按鈕以啟動瀏覽器音訊播放。', false);
      } else {
        setPlayerStatus(`⚠️ 無法載入音檔（請確認路徑是否存在：${filePath}）`, true);
      }
    });
  }
}
function pauseTrackAudio() {
  if (playerAudio) playerAudio.pause();
  playerIsPlaying = false;
  if (playerPlayBtn) playerPlayBtn.textContent = '播放';
}
function initPlayerForCurrentBook() {
  if (!currentBook) return;
  const tabContainer = document.querySelector('#player-wrapper .player-tab-container');
  const controlsBox = document.querySelector('#player-wrapper .controls');
  const progressBox = document.querySelector('#player-wrapper .progress-container');
  if (playerInitializedBookId === currentBookId) return;
  pauseTrackAudio();
  setPlayerStatus('');
  playerTracks = typeof buildCdTracksForBook === 'function' ? buildCdTracksForBook(currentBook) : [];
  currentTrackIndex = 0;
  playerPlaylistContainer.innerHTML = '';
  if (playerTracks.length > 0) {
    if (tabContainer) tabContainer.style.display = 'flex';
    if (controlsBox) controlsBox.style.display = 'flex';
    if (progressBox) progressBox.style.display = 'flex';
    const hasCD1 = playerTracks.some(t => t.cd === 'CD1');
    const hasCD2 = playerTracks.some(t => t.cd === 'CD2');
    const btnCD1 = document.getElementById('btn-CD1');
    const btnCD2 = document.getElementById('btn-CD2');
    if (btnCD1) btnCD1.style.display = hasCD1 ? 'block' : 'none';
    if (btnCD2) btnCD2.style.display = hasCD2 ? 'block' : 'none';
    loadPlayerPlaylist();
    switchPlayerTab(hasCD1 ? 'CD1' : 'CD2');
    loadPlayerTrack(0, false);
  } else {
    if (tabContainer) tabContainer.style.display = 'none';
    if (controlsBox) controlsBox.style.display = 'none';
    if (progressBox) progressBox.style.display = 'none';
    playerDisplayTitle.textContent = `${currentBook.title} 尚未開放 CD 曲目`;
    setPlayerStatus(`目前 ${currentBook.title}（${currentBook.grade || ''}）尚未設定 CD 音檔清單，請使用「3D 英語島」中的單字與句子發音功能！`, false);
  }
  playerInitializedBookId = currentBookId;
}
if (playerPlayBtn) playerPlayBtn.addEventListener('click', () => playerIsPlaying ? pauseTrackAudio() : playTrackAudio());
if (playerPrevBtn) playerPrevBtn.addEventListener('click', () => {
  if (!playerTracks.length) return;
  currentTrackIndex = (currentTrackIndex - 1 + playerTracks.length) % playerTracks.length;
  loadPlayerTrack(currentTrackIndex, true);
});
if (playerNextBtn) playerNextBtn.addEventListener('click', () => {
  if (!playerTracks.length) return;
  currentTrackIndex = (currentTrackIndex + 1) % playerTracks.length;
  loadPlayerTrack(currentTrackIndex, true);
});
if (playerAudio) {
  playerAudio.addEventListener('loadedmetadata', () => { playerTotalTimeEl.textContent = formatPlayerTime(playerAudio.duration); });
  playerAudio.addEventListener('timeupdate', () => {
    if (playerAudio.duration) {
      playerProgressBar.style.width = `${(playerAudio.currentTime / playerAudio.duration) * 100}%`;
      playerCurrentTimeEl.textContent = formatPlayerTime(playerAudio.currentTime);
    }
  });
  playerAudio.addEventListener('ended', () => { if (playerNextBtn) playerNextBtn.click(); });
  playerAudio.addEventListener('error', () => {
    playerIsPlaying = false;
    if (playerPlayBtn) playerPlayBtn.textContent = '播放';
    const track = playerTracks[currentTrackIndex];
    if (track) setPlayerStatus(`⚠️ 找不到音檔或格式無法播放：${track.file}`, true);
  });
}
if (playerProgressArea) {
  playerProgressArea.addEventListener('click', e => {
    if (!playerAudio || !playerAudio.duration) return;
    const rect = playerProgressArea.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    playerAudio.currentTime = ratio * playerAudio.duration;
  });
}

window.openStationPreviewDrawer = function(unitId) {
  const catalog = currentBook?.unitCatalog || [];
  const unit = catalog.find(u => u.id === unitId);
  if (!unit) return;
  const drawer = document.getElementById('station-preview-drawer');
  const catTag = document.getElementById('preview-cat-tag');
  const titleEl = document.getElementById('preview-station-title');
  const metaEl = document.getElementById('preview-station-meta');
  const pillsEl = document.getElementById('preview-mission-pills');
  const enterBtn = document.getElementById('preview-enter-btn');
  if (!drawer) { enterWorldStation(unitId); return; }
  if (catTag && typeof getCategoryLabelTag === 'function') catTag.textContent = getCategoryLabelTag(unit.category);
  if (titleEl) titleEl.textContent = unit.title;
  const counts = [];
  if (unit.words?.length) counts.push(`${unit.words.length} 個單字`);
  if (unit.sentences?.length) counts.push(`${unit.sentences.length} 個句型`);
  if (unit.stories?.length) counts.push(`${unit.stories.length} 句故事`);
  if (metaEl) metaEl.textContent = counts.join('・') || unit.subtitle || '探索學習站點';

  const missions = getAvailableMissionsForUnit(unit);
  const progress = getStudentUnitProgress()[unit.id] || {};
  if (pillsEl) {
    pillsEl.innerHTML = missions.map(m => {
      const done = progress[m.key]?.completed;
      return `<span class="text-xs font-extrabold px-2.5 py-1 rounded-full ${done ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}">${done ? '✅' : '🎯'} ${escapeHtml(m.name)}</span>`;
    }).join('');
  }
  if (enterBtn) {
    enterBtn.onclick = () => {
      drawer.style.display = 'none';
      enterWorldStation(unitId);
    };
  }
  drawer.style.display = 'block';
};

window.closeStationPreview = function() {
  const drawer = document.getElementById('station-preview-drawer');
  if (drawer) drawer.style.display = 'none';
};
