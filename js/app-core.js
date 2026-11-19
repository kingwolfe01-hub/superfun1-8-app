// js/app-core.js
const loginBtn = document.getElementById('login-btn');
const schoolSelect = document.getElementById('school-select');
const classSelect = document.getElementById('class-select');
const numberInput = document.getElementById('number-input');
const nameInput = document.getElementById('name-input');
const errorMsg = document.getElementById('error-msg');
const loadingText = document.getElementById('loading-text');
const dynamicSchoolHeader = document.getElementById('dynamic-school-header');
const studentBadge = document.getElementById('student-badge');
const bookBadge = document.getElementById('book-badge');

let loggedInStudent = null, currentClassInfo = null, currentBookId = null, currentBook = null;
let activeRawUnits = {}, activeCourseData = {}, activeWordList = [];
let currentUnitKey = "", currentMode = "flashcard", currentIndex = 0;
let currentQuizList = [], quizIndex = 0, score = 0, wrongWords = [];
let audioUnlocked = false, audioCache = {}, playerInitializedBookId = null, activeRecognition = null;
let currentTeacher = null, allAdminRecords = [];

function initSchoolEnvironment() {
  document.title = ACTIVE_SCHOOL.pageTitle;
  const loginTitleEl = document.getElementById('login-school-title');
  const loginSubEl = document.getElementById('login-school-subtitle');
  const adminTitleEl = document.getElementById('admin-school-title');
  const stuGuideTitleEl = document.getElementById('student-guide-title');
  const tchGuideTitleEl = document.getElementById('teacher-guide-title');
  const singleSchoolEl = document.getElementById('singleAddSchool');

  if (loginTitleEl) loginTitleEl.textContent = ACTIVE_SCHOOL.loginTitle;
  if (loginSubEl) loginSubEl.textContent = ACTIVE_SCHOOL.loginSubtitle;
  if (adminTitleEl) adminTitleEl.textContent = ACTIVE_SCHOOL.adminTitle;
  if (stuGuideTitleEl) stuGuideTitleEl.textContent = ACTIVE_SCHOOL.studentGuideTitle;
  if (tchGuideTitleEl) tchGuideTitleEl.textContent = ACTIVE_SCHOOL.teacherGuideTitle;
  if (singleSchoolEl) singleSchoolEl.value = ACTIVE_SCHOOL.schoolValue;

  if (schoolSelect) {
    schoolSelect.innerHTML = `<option value="${ACTIVE_SCHOOL.schoolValue}">${ACTIVE_SCHOOL.schoolFullName}</option>`;
  }
  if (classSelect) {
    classSelect.innerHTML = '<option value="">-- 請選擇班級 --</option>' +
      ACTIVE_SCHOOL.classes.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  const playerMenuBtn = document.getElementById('menu-player-btn');
  const mobileCdBtn = document.getElementById('mobile-cd-btn');
  if (!ACTIVE_SCHOOL.enableCdPlayer) {
    if (playerMenuBtn) {
      playerMenuBtn.classList.add('locked');
      playerMenuBtn.innerHTML = '🔒 教學音檔播放器 暫未開放<small>目前本校僅開放線上數位練習與測驗</small>';
    }
    if (mobileCdBtn) {
      mobileCdBtn.classList.add('locked');
      mobileCdBtn.textContent = '🔒 CD音檔';
    }
  }
}

let audioCtx = null;
function playTone(freq, type, duration) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

if (loginBtn) {
  loginBtn.addEventListener('click', handleStudentLogin);
}
[schoolSelect, classSelect, numberInput, nameInput].forEach(el => {
  if (el) {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleStudentLogin();
    });
  }
});

function handleStudentLogin() {
  const school = schoolSelect.value;
  const gradeClass = classSelect.value;
  const number = numberInput.value.trim();
  const name = nameInput.value.trim();

  if (!school || !gradeClass || !number || !name) {
    showError('請完整填寫學校、班級、座號與姓名！');
    return;
  }

  errorMsg.style.display = 'none';
  loadingText.style.display = 'block';
  loginBtn.disabled = true;

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ school, gradeClass, number, name })
  })
    .then(r => r.json())
    .then(data => {
      loadingText.style.display = 'none';
      loginBtn.disabled = false;

      if (data.status === 'success') {
        const serverStudent = data.student || {};
        const serverBookId = data.bookId || serverStudent.bookId || '';
        let resolved = null;

        if (typeof resolveBookForStudent === 'function') {
          resolved = resolveBookForStudent(school, gradeClass);
        }
        if (serverBookId && typeof bookData !== 'undefined' && bookData[serverBookId]) {
          const baseClassInfo = (typeof getClassBookInfo === 'function') ? (getClassBookInfo(school, gradeClass) || {}) : {};
          const targetBook = bookData[serverBookId];
          const bookNumMatch = String(serverBookId).match(/(\d+)/);
          const inferredSemester = targetBook.semester || (bookNumMatch ? (parseInt(bookNumMatch[1], 10) % 2 === 1 ? '上學期' : '下學期') : (baseClassInfo.semester || ''));
          resolved = {
            ok: true,
            classInfo: {
              ...baseClassInfo,
              grade: targetBook.grade || baseClassInfo.grade || '',
              semester: inferredSemester,
              bookId: serverBookId
            },
            book: targetBook
          };
        }
        if (!resolved || !resolved.ok) {
          showError(resolved ? resolved.message : '對應不到冊別資訊，請檢查教材設定檔。');
          return;
        }

        loggedInStudent = {
          school: serverStudent.school || school,
          gradeClass: serverStudent.gradeClass || gradeClass,
          number: serverStudent.number || number,
          name: serverStudent.displayName || data.displayName || name,
          displayName: serverStudent.displayName || data.displayName || name
        };
        currentClassInfo = resolved.classInfo;
        currentBook = resolved.book;
        currentBookId = currentBook.bookId;
        activeRawUnits = currentBook.rawUnits || {};
        activeCourseData = currentBook.courseData || {};

        if (typeof buildStudentDisplayText === 'function') {
          const d = buildStudentDisplayText(loggedInStudent, currentClassInfo, currentBook);
          studentBadge.textContent = d.studentBadge;
          bookBadge.textContent = d.bookBadge;
        } else {
          const displayName = typeof maskStudentName === 'function' ? maskStudentName(loggedInStudent.name) : loggedInStudent.name;
          studentBadge.textContent = `${loggedInStudent.school}｜${loggedInStudent.gradeClass}｜${loggedInStudent.number}號 ${displayName} 同學`;
          bookBadge.textContent = currentBook.title || 'Super Fun';
        }

        dynamicSchoolHeader.textContent = `${school} ${currentClassInfo.grade || ''}${currentClassInfo.semester || ''}｜${currentBook.title || ''}`;
        document.getElementById('login-wrapper').style.display = 'none';
        document.getElementById('main-menu-wrapper').style.display = 'flex';

        if (typeof renderWorldMapHub === 'function') renderWorldMapHub();
        if (typeof checkActiveStudentExam === 'function') {
          checkActiveStudentExam(loggedInStudent.gradeClass, loggedInStudent.number);
        }
      } else {
        showError('身分驗證失敗，請確認班級、座號與姓名是否正確。');
      }
    })
    .catch(err => {
      loadingText.style.display = 'none';
      loginBtn.disabled = false;
      showError('連線至資料庫失敗，請檢查網路連線。');
      console.error('Login Fetch Error:', err);
    });
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}

function showModule(moduleName) {
  if (moduleName === 'player' && !ACTIVE_SCHOOL.enableCdPlayer) {
    alert(ACTIVE_SCHOOL.lockedPlayerMessage || '🔒 本校目前暫未開放線上 CD 音檔播放功能。');
    return;
  }
  document.getElementById('main-menu-wrapper').style.display = 'none';
  document.getElementById('player-wrapper').style.display = moduleName === 'player' ? 'flex' : 'none';
  document.getElementById('vocab-wrapper').style.display = moduleName === 'vocab' ? 'flex' : 'none';
  if (moduleName === 'player') {
    if (typeof pauseVocabActivities === 'function') pauseVocabActivities();
    if (typeof initPlayerForCurrentBook === 'function') initPlayerForCurrentBook();
  }
  if (moduleName === 'vocab') {
    if (typeof pauseTrackAudio === 'function') pauseTrackAudio();
    if (typeof initVocabForCurrentBook === 'function') initVocabForCurrentBook();
  }
}

function backToMenu() {
  if (typeof pauseTrackAudio === 'function') pauseTrackAudio();
  if (typeof pauseVocabActivities === 'function') pauseVocabActivities();
  document.getElementById('player-wrapper').style.display = 'none';
  document.getElementById('vocab-wrapper').style.display = 'none';
  document.getElementById('main-menu-wrapper').style.display = 'flex';
  if (typeof renderWorldMapHub === 'function') renderWorldMapHub();
}

function logoutStudent() {
  if (typeof pauseTrackAudio === 'function') pauseTrackAudio();
  if (typeof pauseVocabActivities === 'function') pauseVocabActivities();
  loggedInStudent = null;
  document.getElementById('main-menu-wrapper').style.display = 'none';
  document.getElementById('player-wrapper').style.display = 'none';
  document.getElementById('vocab-wrapper').style.display = 'none';
  document.getElementById('login-wrapper').style.display = 'flex';
}

function unlockAudio() {
  audioUnlocked = true;
}

function normalizeText(t) {
  return String(t || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
}

function shuffle(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

function escapeHtml(text) {
  return String(text).replace(new RegExp("[&<>\'\"]", "g"), function(ch) {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === "'") return '&#39;';
    if (ch === '"') return '&quot;';
    return ch;
  });
}

function getItemText(item) {
  return item?.word || item?.sentence || item?.text || '';
}

function getItemMeaning(item) {
  return item?.meaning || '';
}

function hasImage(item) {
  return !!(item && item.image && typeof item.image === 'string' && item.image.trim() !== '' && item.image !== 'null');
}

function buildImageOnlyUnits(units) {
  const output = {};
  Object.entries(units || {}).forEach(([key, items]) => {
    const imageItems = (items || []).filter(hasImage);
    if (imageItems.length > 0) output[key] = imageItems;
  });
  return output;
}

function safeList() {
  return activeWordList || [];
}

let activeSingleAudio = null;
function playAudio(item) {
  unlockAudio();
  if (!item) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (activeSingleAudio) {
    try {
      activeSingleAudio.onerror = null;
      activeSingleAudio.pause();
    } catch (e) {}
    activeSingleAudio = null;
  }
  const text = getItemText(item);
  if (item.audio) {
    let audio = audioCache[item.audio];
    if (!audio || audio.error) {
      audio = new Audio(item.audio);
      audioCache[item.audio] = audio;
    }
    activeSingleAudio = audio;
    let fallbackFired = false;
    const fallback = () => {
      if (fallbackFired) return;
      fallbackFired = true;
      delete audioCache[item.audio];
      speakText(text);
    };
    audio.onerror = fallback;
    try {
      audio.pause();
      if (audio.readyState > 0) audio.currentTime = 0;
    } catch (e) {}
    audio.play().catch(fallback);
  } else {
    speakText(text);
  }
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.78;
    window.speechSynthesis.speak(u);
  }
}

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

document.addEventListener('DOMContentLoaded', initSchoolEnvironment);
