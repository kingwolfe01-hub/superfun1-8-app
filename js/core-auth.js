
const PENDING_QUEUE_KEY = 'sf_pending_submissions';

function savePendingSubmission(payload) {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]');
    queue.push({ payload, savedAt: Date.now() });
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue.slice(-30)));
  } catch (e) {}
}

function postWithRetryAndQueue(payload, onSuccess, onFail, maxRetries = 3) {
  let attempt = 0;
  function trySend() {
    attempt++;
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.status === 'success') {
        if (typeof onSuccess === 'function') onSuccess(data);
      } else {
        throw new Error((data && data.message) || 'Server returned error');
      }
    })
    .catch(err => {
      if (attempt < maxRetries) {
        setTimeout(trySend, 800 * attempt);
      } else {
        savePendingSubmission(payload);
        if (typeof onFail === 'function') onFail(err);
      }
    });
  }
  trySend();
}

function flushPendingSubmissions() {
  if (!GOOGLE_SCRIPT_URL) return;
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]');
    if (!Array.isArray(queue) || !queue.length) return;
    localStorage.removeItem(PENDING_QUEUE_KEY);
    queue.forEach(entry => {
      if (entry && entry.payload) {
        postWithRetryAndQueue(entry.payload, null, null, 2);
      }
    });
  } catch (e) {}
}

// 南光國小專屬 Google 試算表後端 URL
const ACTIVE_SCHOOL = (typeof ACTIVE_SCHOOL_CONFIG !== 'undefined') ? ACTIVE_SCHOOL_CONFIG : {
  schoolId: 'nankuang',
  schoolName: '南光國小',
  displayName: '南投縣南光國小',
  gasUrl: 'https://script.google.com/macros/s/AKfycbw4fLrYwzEVwFnzoLhb2WH-JH6RpFEJH2WlbbRHtYP_TF7t-v-AcyBJxPvhQc3zPOTR2A/exec',
  allowCdPlayer: true,
  lockedCdMessage: ''
};
const GOOGLE_SCRIPT_URL = ACTIVE_SCHOOL.gasUrl;

function handleLockedPlayerClick() {
  alert(ACTIVE_SCHOOL.lockedCdMessage || `🔒【功能未開放】\n\n${ACTIVE_SCHOOL.displayName}目前暫未開放線上 CD 音檔播放功能。`);
}

(function initActiveSchoolUI() {
  document.title = `Super Fun 教材整合平台 - ${ACTIVE_SCHOOL.displayName}專屬`;
  const loginTitle = document.getElementById('login-school-title');
  if (loginTitle) loginTitle.textContent = `🏫 ${ACTIVE_SCHOOL.displayName} 英語學習平台`;
  const loginSub = document.getElementById('login-school-subtitle');
  if (loginSub) loginSub.textContent = `${ACTIVE_SCHOOL.schoolName}專屬教材，請驗證身分後開始使用。`;

  try {
    const savedClass = localStorage.getItem(`sf_last_class_${ACTIVE_SCHOOL.schoolId}`);
    const clsSel = document.getElementById('class-select');
    if (savedClass && clsSel && Array.from(clsSel.options).some(o => o.value === savedClass)) {
      clsSel.value = savedClass;
    }
  } catch (e) {}
  const schoolSel = document.getElementById('school-select');
  if (schoolSel) {
    schoolSel.innerHTML = `<option value="${ACTIVE_SCHOOL.schoolName}" selected>${ACTIVE_SCHOOL.displayName}</option>`;
  }

  const adminTitle = document.getElementById('admin-school-title');
  if (adminTitle) adminTitle.textContent = `${ACTIVE_SCHOOL.displayName} - 英語教材看板與管理`;

  const singleAddSchool = document.getElementById('singleAddSchool');
  if (singleAddSchool) singleAddSchool.value = ACTIVE_SCHOOL.schoolName;

  const sGuideTitle = document.getElementById('student-guide-school-title');
  if (sGuideTitle) sGuideTitle.textContent = `📖 ${ACTIVE_SCHOOL.schoolName} 學生英語自學與測驗指南`;

  const tGuideTitle = document.getElementById('teacher-guide-school-title');
  if (tGuideTitle) tGuideTitle.textContent = `📑 ${ACTIVE_SCHOOL.schoolName} 教師後台管理指南與數據解讀手冊`;

  const cdDesc = document.getElementById('teacher-guide-cd-desc');
  if (cdDesc) {
    cdDesc.textContent = ACTIVE_SCHOOL.allowCdPlayer
      ? `${ACTIVE_SCHOOL.schoolName}完整開放線上 CD 音檔播放功能，學生登入後可依冊別載入各單元曲目自學聆聽。`
      : `${ACTIVE_SCHOOL.schoolName}目前設定為暫不開放線上 CD 音檔播放功能，主要使用數位練習與測驗模組。`;
  }

  const playerBtn = document.getElementById('module-player-btn');
  if (playerBtn && !ACTIVE_SCHOOL.allowCdPlayer) {
    playerBtn.classList.add('locked');
    playerBtn.setAttribute('onclick', 'handleLockedPlayerClick()');
  }
})();
const loginBtn=document.getElementById('login-btn'), schoolSelect=document.getElementById('school-select'), classSelect=document.getElementById('class-select'), numberInput=document.getElementById('number-input'), nameInput=document.getElementById('name-input'), errorMsg=document.getElementById('error-msg'), loadingText=document.getElementById('loading-text'), dynamicSchoolHeader=document.getElementById('dynamic-school-header'), studentBadge=document.getElementById('student-badge'), bookBadge=document.getElementById('book-badge');
let loggedInStudent=null,currentClassInfo=null,currentBookId=null,currentBook=null,activeRawUnits={},activeCourseData={},activeWordList=[],currentUnitKey="",currentMode="flashcard",currentIndex=0,currentQuizList=[],quizIndex=0,score=0,wrongWords=[],audioUnlocked=false,audioCache={},playerInitializedBookId=null,activeRecognition=null;
let currentTeacher=null, allAdminRecords=[];

// 提示音產生器 (Web Audio API)
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
  } catch(e) {}
}


loginBtn.addEventListener('click',handleStudentLogin);
[schoolSelect,classSelect,numberInput,nameInput].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')handleStudentLogin();}));

function handleStudentLogin(){
  const school=schoolSelect.value,gradeClass=classSelect.value,number=numberInput.value.trim(),name=nameInput.value.trim();
  if(!school||!gradeClass||!number||!name){showError('請完整填寫學校、班級、座號與姓名！');return;}
  errorMsg.style.display='none';
  loadingText.style.display='block';
  loginBtn.disabled=true;

  fetch(GOOGLE_SCRIPT_URL,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({school,gradeClass,number,name})
  })
  .then(r=>r.json())
  .then(data=>{
    loadingText.style.display='none';
    loginBtn.disabled=false;
    if(data.status==='success'){
      const serverStudent=data.student||{};
      const serverBookId=data.bookId||serverStudent.bookId||'';
      
      let resolved=null;
      if(typeof resolveBookForStudent==='function'){
        resolved=resolveBookForStudent(school,gradeClass);
      }

      if(serverBookId&&typeof bookData!=='undefined'&&bookData[serverBookId]){
        const baseClassInfo=(typeof getClassBookInfo==='function')?getClassBookInfo(school,gradeClass)||{}:{};
        resolved={
          ok:true,
          classInfo:{...baseClassInfo,bookId:serverBookId},
          book:bookData[serverBookId]
        };
      }

      if(!resolved||!resolved.ok){
        showError(resolved?resolved.message:'對應不到冊別資訊，請檢查教材設定檔。');
        return;
      }

      loggedInStudent={
        school:serverStudent.school||school,
        gradeClass:serverStudent.gradeClass||gradeClass,
        number:serverStudent.number||number,
        name:serverStudent.displayName||data.displayName||name,
        displayName:serverStudent.displayName||data.displayName||name
      };
      
      currentClassInfo=resolved.classInfo;
      currentBook=resolved.book;
      currentBookId=currentBook.bookId;
      activeRawUnits=currentBook.rawUnits||{};
      activeCourseData=currentBook.courseData||{};

      if(typeof buildStudentDisplayText==='function'){
        const d=buildStudentDisplayText(loggedInStudent,currentClassInfo,currentBook);
        studentBadge.textContent=d.studentBadge;
        bookBadge.textContent=d.bookBadge;
      }else{
        const isAlreadyMasked = /[xXｘＸ○?*＊]/.test(loggedInStudent.name || "");
        const displayName = (!isAlreadyMasked && typeof maskStudentName === 'function') ? maskStudentName(loggedInStudent.name) : loggedInStudent.name;
        studentBadge.textContent=`${loggedInStudent.school}｜${loggedInStudent.gradeClass}｜${loggedInStudent.number}號 ${displayName} 同學`;
        bookBadge.textContent=currentBook.title||'Super Fun';
      }

      dynamicSchoolHeader.textContent=`${school} ${currentClassInfo.grade||''}${currentClassInfo.semester||''}｜${currentBook.title||''}`;
      document.getElementById('login-wrapper').style.display='none';
      document.getElementById('main-menu-wrapper').style.display='flex';

      // 檢查該班級是否有指派進行中的定期考（傳入座號驗證交卷狀態）
      try { localStorage.setItem(`sf_last_class_${ACTIVE_SCHOOL.schoolId}`, loggedInStudent.gradeClass); } catch (e) {}
      flushPendingSubmissions();
      checkActiveStudentExam(loggedInStudent.gradeClass, loggedInStudent.number);
    }else{
      showError('身分驗證失敗，請確認班級、座號與姓名是否正確。');
    }
  })
  .catch(err=>{
    loadingText.style.display='none';
    loginBtn.disabled=false;
    showError('連線至資料庫失敗，請檢查網路連線。');
    console.error('Login Fetch Error:',err);
  });
}

function showError(msg){errorMsg.textContent=msg;errorMsg.style.display='block';}
function showModule(moduleName){
  document.getElementById('main-menu-wrapper').style.display='none';
  document.getElementById('player-wrapper').style.display=moduleName==='player'?'flex':'none';
  document.getElementById('vocab-wrapper').style.display=moduleName==='vocab'?'flex':'none';
  if(moduleName==='player'){pauseVocabActivities();initPlayerForCurrentBook();}
  if(moduleName==='vocab'){pauseTrackAudio();initVocabForCurrentBook();}
}
function backToMenu(){
  pauseTrackAudio();
  pauseVocabActivities();
  document.getElementById('player-wrapper').style.display='none';
  document.getElementById('vocab-wrapper').style.display='none';
  document.getElementById('main-menu-wrapper').style.display='flex';
}
