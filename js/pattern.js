function getCurrentPatternExample(){const item=safeList()[currentIndex];if(!item||!item.examples||!item.examples.length)return null;return item.examples[0];}
function getPatternResources(){return currentBook?.structuredData?.patternResources||currentBook?.practiceSets?.patternResources||{};}
function getPatternSelectValues(){const values={};document.querySelectorAll('.pattern-slot-select').forEach(sel=>values[sel.dataset.key]=sel.value);return values;}
function findPatternResource(listName,key,value){const resources=getPatternResources();const list=resources[listName]||[];return list.find(x=>String(x[key]||'').toLowerCase()===String(value||'').toLowerCase())||null;}
function actionText(action,form){
  if(!action)return'';
  let targetAction = action === 'do my homework' ? 'do homework' : action;
  const data=findPatternResource('actions','base',targetAction);
  if(form==='thirdPerson')return data?.thirdPerson||targetAction;
  return data?.base||targetAction;
}
function patternAuxForSubject(subject,lower){const aux=(subject==='you'||subject==='I')?'do':'does';return lower?aux:aux.charAt(0).toUpperCase()+aux.slice(1);}
function patternVerbForSubject(subject,base,third){return ['He','She','he','she'].includes(subject)?third:base;}

function generatePatternSentence(item,values){
  if(!item)return'';
  const id=item.patternId||'';const v=values||{};
  if(id==='sf5_t1_l1_what_day_question')return'What day is today?';
  if(id==='sf5_t1_l1_it_is_day')return`It’s ${v.day||'Friday'}.`;
  if(id==='sf5_t1_l1_is_today_day')return`Is today ${v.day||'Friday'}?`;
  if(id==='sf5_t1_l2_what_time_do_does'){const subject=v.subject||'you';const action=v.action||'get up';return`What time ${patternAuxForSubject(subject,true)} ${subject} ${actionText(action,'base')}?`;}
  if(id==='sf5_t1_l2_subject_action_time'){
    const subject=v.subject||'I';
    const action=v.action||'get up';
    const time=v.time||'6:50';
    const isThird = ['He', 'She', 'he', 'she'].includes(subject);
    return`${subject} ${actionText(action, isThird ? 'thirdPerson' : 'base')} at ${time}.`;
  }
  if(id==='sf5_t2_l3_hows_weather')return'How’s the weather?';
  if(id==='sf5_t2_l3_its_weather')return`It’s ${v.weather||'sunny'}.`;
  if(id==='sf5_t2_l3_is_it_weather')return`Is it ${v.weather||'hot'}?`;
  if(id==='sf5_t2_l4_what_subject_like'){const subject=v.subject||'you';return`What subject ${patternAuxForSubject(subject,true)} ${subject} like?`;}
  if(id==='sf5_t2_l4_subject_like_subject'){const subject=v.subject||'I';const schoolSubject=v.schoolSubject||'art';return`${subject} ${patternVerbForSubject(subject,'like','likes')} ${schoolSubject}.`;}
  if(id==='sf5_t2_l4_have_class_on_day'){const subject=v.subject||'you';const schoolSubject=v.schoolSubject||'PE';const day=v.day||'Monday';return`${patternAuxForSubject(subject,false)} ${subject} have ${schoolSubject} class on ${day}?`;}
  let text=item.template||getCurrentPatternExample()?.sentence||'';
  Object.entries(v).forEach(([k,val])=>{text=text.replaceAll(`{${k}}`,val)});
  return text.replace(/\{[^}]+\}/g,'___');
}
function getCurrentGeneratedPatternSentence(){const item=safeList()[currentIndex];if(!item)return'';const values=getPatternSelectValues();return generatePatternSentence(item,values)||getCurrentPatternExample()?.sentence||'';}
function patternShuffle(arr){const a=[...(arr||[])];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function uniquePatternOptions(list){const seen=new Set();return(list||[]).filter(x=>{const key=String(x||'').toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});}
function makePatternOptions(answer,candidates){const opts=uniquePatternOptions([answer,...(candidates||[])]).slice(0,4);return patternShuffle(opts);}
function blankPatternText(sentence,answer){if(!sentence||!answer)return sentence||'';const idx=sentence.indexOf(answer);if(idx<0)return sentence.replace(/\w+/, '___');return sentence.slice(0,idx)+'___'+sentence.slice(idx+String(answer).length);}
function getActionForms(action){
  let targetAction = action === 'do my homework' ? 'do homework' : action;
  const data=findPatternResource('actions','base',targetAction);
  return uniquePatternOptions([data?.base||targetAction,data?.thirdPerson||targetAction]);
}

function makePatternBlankQuiz(item,values){
  if(!item)return null;
  const v=values||{};const id=item.patternId||'';
  const sentence=generatePatternSentence(item,v);
  let answer='', candidates=[];
  if(id==='sf5_t1_l2_what_time_do_does'||id==='sf5_t2_l4_what_subject_like'){const subject=v.subject||'you';answer=patternAuxForSubject(subject,true);candidates=['do','does'];}
  else if(id==='sf5_t2_l4_have_class_on_day'){const subject=v.subject||'you';answer=patternAuxForSubject(subject,false);candidates=['Do','Does'];}
  else if(id==='sf5_t2_l4_subject_like_subject'){const subject=v.subject||'I';answer=patternVerbForSubject(subject,'like','likes');candidates=['like','likes'];}
  else if(id==='sf5_t1_l2_subject_action_time'){
    const action=v.action||'get up';
    const subject=v.subject||'I';
    const isThird = ['He', 'She', 'he', 'she'].includes(subject);
    answer=actionText(action, isThird ? 'thirdPerson' : 'base');
    candidates=getActionForms(action);
  }
  else if(item.slots&&item.slots.length){const s=item.slots[0];answer=v[s.key]||s.options?.[0]||'';candidates=s.options||[];}
  else {
    const words = (getCurrentPatternExample()?.sentence || sentence).replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    answer = words[0] || 'It';
    candidates = [answer];
  }
  if(!answer)return null;
  return{question:blankPatternText(sentence,answer),answer,options:makePatternOptions(answer,candidates),sentence};
}

function renderPatternBlankQuiz(q){
  const question=document.getElementById('pattern-blank-question');
  const options=document.getElementById('pattern-blank-options');
  const feedback=document.getElementById('pattern-blank-feedback');
  if(!question||!options||!feedback)return;
  if(!q){question.innerText='請先選擇欄位產生填空題';options.innerHTML='';feedback.className='feedback-box';feedback.innerHTML='';return;}
  question.innerText=q.question;
  options.innerHTML='';
  q.options.forEach(opt=>{
    const btn=document.createElement('button');
    btn.className='btn btn-outline';
    btn.style.cssText='padding:10px;font-size:.95rem;';
    btn.textContent=opt;
    btn.addEventListener('click',()=>checkPatternBlankAnswer(opt));
    options.appendChild(btn);
  });
  feedback.className='feedback-box';feedback.innerHTML='';
  window.currentPatternBlankQuiz=q;
}

function updatePatternBlankQuiz(){const item=safeList()[currentIndex];const values=getPatternSelectValues();renderPatternBlankQuiz(makePatternBlankQuiz(item,values));}
function checkPatternBlankAnswer(answer){
  const q=window.currentPatternBlankQuiz;const fb=document.getElementById('pattern-blank-feedback');
  if(!q||!fb)return;
  const ok=String(answer||'').trim()===String(q.answer||'').trim();
  fb.className=ok?'feedback-box correct':'feedback-box incorrect';
  fb.innerHTML=ok?`🎉 答對了！完整句：<strong>${escapeHtml(q.sentence)}</strong>`:`再試一次。正確答案是：<strong>${escapeHtml(q.answer)}</strong><br>完整句：${escapeHtml(q.sentence)}`;
}

function patternOrderNormalize(text){return String(text||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function patternOrderTokenize(sentence){return String(sentence||'').trim().split(/\s+/).filter(Boolean);}
function makePatternOrderQuiz(sentence){
  const tokens=patternOrderTokenize(sentence);
  let shuffled=patternShuffle(tokens);
  if(tokens.length>1&&shuffled.join(' ')===tokens.join(' '))shuffled=[...tokens].reverse();
  return{sentence,tokens,shuffled};
}
function patternOrderButton(token,idx,zone){return`<button id="pattern-order-${zone}-${idx}" class="btn btn-outline pattern-order-token pattern-order-${zone}-token" draggable="true" data-token="${escapeHtml(token)}" ondragstart="patternDragStart(event)" onclick="${zone==='bank'?'selectPatternOrderToken(this)':'removePatternOrderToken(this)'}" style="padding:8px 10px;font-size:.92rem;font-weight:900;">${escapeHtml(token)}</button>`;}

function renderPatternOrderQuiz(q){
  const bank=document.getElementById('pattern-order-bank');
  const answer=document.getElementById('pattern-order-answer');
  const target=document.getElementById('pattern-order-target');
  const feedback=document.getElementById('pattern-order-feedback');
  if(!bank||!answer||!target||!feedback)return;
  if(!q||!q.tokens||!q.tokens.length){target.innerText='請把單字排成正確句子';bank.innerHTML='';answer.innerHTML='';feedback.className='feedback-box';feedback.innerHTML='';window.currentPatternOrderQuiz=null;return;}
  window.currentPatternOrderQuiz=q;
  target.innerText='請排序：'+q.sentence;
  bank.innerHTML=q.shuffled.map((t,i)=>patternOrderButton(t,i,'bank')).join('');
  answer.innerHTML='';
  feedback.className='feedback-box';feedback.innerHTML='';
}
function updatePatternOrderQuiz(){const sentence=getCurrentGeneratedPatternSentence();renderPatternOrderQuiz(makePatternOrderQuiz(sentence));}
function patternAllowDrop(event){event.preventDefault();}
function patternDragStart(event){event.dataTransfer.setData('text/plain',event.target.dataset.token||'');event.dataTransfer.setData('source-id',event.target.id||'');}
function patternAppendAnswerToken(token){const answer=document.getElementById('pattern-order-answer');if(!answer||!token)return;const idx=answer.querySelectorAll('.pattern-order-answer-token').length;answer.insertAdjacentHTML('beforeend',patternOrderButton(token,idx,'answer'));const fb=document.getElementById('pattern-order-feedback');if(fb){fb.className='feedback-box';fb.innerHTML='';}}
function patternAppendBankToken(token){const bank=document.getElementById('pattern-order-bank');if(!bank||!token)return;const idx=bank.querySelectorAll('.pattern-order-bank-token').length;bank.insertAdjacentHTML('beforeend',patternOrderButton(token,idx,'bank'));const fb=document.getElementById('pattern-order-feedback');if(fb){fb.className='feedback-box';fb.innerHTML='';}}
function selectPatternOrderToken(btn){if(!btn)return;patternAppendAnswerToken(btn.dataset.token||'');btn.remove();}
function removePatternOrderToken(btn){if(!btn)return;patternAppendBankToken(btn.dataset.token||'');btn.remove();}
function patternDropToAnswer(event){event.preventDefault();const token=event.dataTransfer.getData('text/plain');const sourceId=event.dataTransfer.getData('source-id');if(token)patternAppendAnswerToken(token);const source=sourceId?document.getElementById(sourceId):null;if(source&&source.classList.contains('pattern-order-bank-token'))source.remove();}
function patternDropToBank(event){event.preventDefault();const token=event.dataTransfer.getData('text/plain');const sourceId=event.dataTransfer.getData('source-id');const source=sourceId?document.getElementById(sourceId):null;if(source&&source.classList.contains('pattern-order-answer-token')){patternAppendBankToken(token);source.remove();}}
function getPatternOrderAnswerText(){return Array.from(document.querySelectorAll('.pattern-order-answer-token')).map(el=>el.dataset.token||'').join(' ');}
function resetPatternOrderQuiz(){const q=window.currentPatternOrderQuiz;if(q)renderPatternOrderQuiz(makePatternOrderQuiz(q.sentence));}
function checkPatternOrderAnswer(){
  const q=window.currentPatternOrderQuiz;const fb=document.getElementById('pattern-order-feedback');
  if(!q||!fb)return;
  const answer=getPatternOrderAnswerText();
  const ok=patternOrderNormalize(answer)===patternOrderNormalize(q.sentence);
  fb.className=ok?'feedback-box correct':'feedback-box incorrect';
  fb.innerHTML=ok?`🎉 排對了！完整句：<strong>${escapeHtml(q.sentence)}</strong>`:`再調整一次。<br>你的答案：${escapeHtml(answer||'尚未排序')}<br>正確句：<strong>${escapeHtml(q.sentence)}</strong>`;
}

function updateGeneratedPatternSentence(){
  const item=safeList()[currentIndex];const box=document.getElementById('pattern-generated');
  if(!box)return;
  const sentence=getCurrentGeneratedPatternSentence();
  box.innerText=sentence?`產生句：${sentence}`:'請選擇欄位產生句子';
  updatePatternBlankQuiz();
  updatePatternOrderQuiz();
}
function buildPatternSlotControls(item){
  if(!item||!item.slots||!item.slots.length)return'<strong>固定句型：</strong>不需要替換欄位。';
  return'<strong>選擇欄位組句：</strong>'+item.slots.map((s,idx)=>`<label style="display:block;margin-top:10px;font-weight:900;color:#334155;">${escapeHtml(s.label||s.key)}<select class="pattern-slot-select" data-key="${escapeHtml(s.key)}" onchange="updateGeneratedPatternSentence()" style="width:100%;margin-top:6px;padding:10px;border:2px solid #c7d2fe;border-radius:12px;font-size:1rem;font-weight:800;color:#312e81;background:#fff;">${(s.options||[]).map(o=>`<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}</select></label>`).join('');
}

function updatePatternPractice(){
  const list=safeList();const item=list[currentIndex];
  const progress=document.getElementById('pattern-progress');
  const title=document.getElementById('pattern-title');
  const meaning=document.getElementById('pattern-meaning');
  const template=document.getElementById('pattern-template');
  const slots=document.getElementById('pattern-slots');
  const examples=document.getElementById('pattern-examples');
  const feedback=document.getElementById('pattern-feedback');
  const generated=document.getElementById('pattern-generated');

  document.getElementById('pattern-blank-feedback').className='feedback-box';
  document.getElementById('pattern-blank-feedback').innerHTML='';
  document.getElementById('pattern-order-feedback').className='feedback-box';
  document.getElementById('pattern-order-feedback').innerHTML='';

  if(!item){
    progress.innerText='尚無句型資料';title.innerText='此冊別尚未提供句型操練';meaning.innerText='請先選擇有 patternUnits 的冊別，例如 Super Fun 5。';template.innerText='';slots.innerHTML='';examples.innerHTML='';if(generated)generated.innerText='';renderPatternBlankQuiz(null);renderPatternOrderQuiz(null);feedback.className='feedback-box';feedback.innerHTML='';return;
  }
  progress.innerText=`句型 ${currentIndex+1} / ${list.length}`;
  title.innerText=item.title||'-';
  meaning.innerText=item.focus||item.meaning||'';
  template.innerText=item.template?`句型：${item.template}`:'';
  slots.innerHTML=buildPatternSlotControls(item);
  examples.innerHTML=(item.examples&&item.examples.length)?'<strong>範例：</strong><br>'+item.examples.map(ex=>`• ${escapeHtml(ex.sentence||'')}<br><span style="color:#64748b;">${escapeHtml(ex.meaning||'')}</span>`).join('<br>'):'';
  feedback.className='feedback-box';feedback.innerHTML='';
  updateGeneratedPatternSentence();
}
function nextPatternItem(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex+1)%l.length;updatePatternPractice();}
function prevPatternItem(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex-1+l.length)%l.length;updatePatternPractice();}
function playCurrentPatternAudio(){const sentence=getCurrentGeneratedPatternSentence();if(sentence)speakText(sentence);}
function startPatternSpeechRecognition(){
  const sentence=getCurrentGeneratedPatternSentence();
  if(!sentence)return;
  const cleanSentence = sentence.replace(/[.?!,]/g, '').trim();
  startGenericRecognition({word:cleanSentence,sentence:cleanSentence,meaning:''},'pattern-feedback');
}

// 💡 強化：語音辨識通用模組（10秒安全超時保險）
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
  fb.innerHTML = '🎧 正在聆聽，請對著麥克風清晰朗讀...';

  // 10 秒防死結超時保險
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

  rec.onerror = (err) => {
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

  try {
    rec.start();
  } catch (e) {
    clearTimeout(timeoutId);
    activeRecognition = null;
    if (onDone) onDone(false, 'start-failed');
  }
}

function submitQuizRecord(mode, score, total, wrongList = []) {
  if (!loggedInStudent || !GOOGLE_SCRIPT_URL) return;

  const payload = {
    action: 'submitScore',
    school: loggedInStudent.school || ACTIVE_SCHOOL.schoolName,
    gradeClass: loggedInStudent.gradeClass || '',
    number: loggedInStudent.number || '',
    name: loggedInStudent.name || loggedInStudent.displayName || '',
    bookId: currentBookId || '',
    unit: currentUnitKey || '',
    mode: mode,
    score: score,
    total: total,
    wrongWords: wrongList
  };

  postWithRetryAndQueue(
    payload,
    () => {
      const tip = document.getElementById(`${mode}-upload-tip`);
      if (tip) tip.innerHTML = '✅ 成績已自動上傳至老師後台';
    },
    () => {
      const tip = document.getElementById(`${mode}-upload-tip`);
      if (tip) tip.innerHTML = '⚠️ 網路忙碌，成績已暫存本機，下次連線將自動補傳';
    },
    3
  );
}


let lastWrongItemsForRetry = [];
function retryWrongItems(type) {
  if (!lastWrongItemsForRetry.length) return;
  const retryList = [...lastWrongItemsForRetry];
  currentQuizList = shuffle(retryList);
  quizIndex = 0;
  score = 0;
  wrongWords = [];
  if (type === 'listening') {
    document.getElementById('listening-result-view').style.display = 'none';
    document.getElementById('listening-quiz-view').style.display = 'block';
    loadListeningQuestion();
  } else if (type === 'phonics') {
    document.getElementById('phonics-result-view').style.display = 'none';
    document.getElementById('phonics-quiz-view').style.display = 'block';
    loadPhonicsQuestion();
  } else if (type === 'speaking') {
    document.getElementById('speaking-result-view').style.display = 'none';
    document.getElementById('speaking-quiz-view').style.display = 'block';
    loadSpeakingQuestion();
  }
}

function showSimpleResult(type){
  const total = currentQuizList.length;
  const text = `完成！分數：${score} / ${total}`;
  lastWrongItemsForRetry = currentQuizList.filter(it => wrongWords.includes(getItemText(it)));
  const retryBtnHtml = lastWrongItemsForRetry.length > 0
    ? `<button class="btn btn-primary" style="margin-top:10px;background:#f59e0b;" onclick="retryWrongItems('${type}')">🔁 只重練答錯題目 (${lastWrongItemsForRetry.length} 題)</button>`
    : '';
  
  submitQuizRecord(type, score, total, wrongWords);

  const uploadTipHtml = `<div id="${type}-upload-tip" style="margin-top:10px;font-size:0.9rem;color:#64748b;">☁️ 正在同步記錄中...</div>`;

  if(type==='listening'){
    document.getElementById('listening-quiz-view').style.display='none';
    document.getElementById('listening-result-view').style.display='block';
    document.getElementById('listening-result-view').innerHTML=`<div class="card-box"><h3>${text}</h3>${uploadTipHtml}<button class="btn btn-primary" style="margin-top:15px;" onclick="restartListeningQuiz()">重新測驗</button></div>`;
  }
  if(type==='phonicsQuiz'){
    document.getElementById('phonics-quiz-view').style.display='none';
    document.getElementById('phonics-result-view').style.display='block';
    document.getElementById('phonics-result-view').innerHTML=`<div class="card-box"><h3>${text}</h3>${uploadTipHtml}<button class="btn btn-primary" style="margin-top:15px;" onclick="restartPhonicsQuiz()">重新測驗</button></div>`;
  }
  if(type==='speaking'){
    document.getElementById('speaking-quiz-view').style.display='none';
    document.getElementById('speaking-result-view').style.display='block';
    document.getElementById('speaking-result-view').innerHTML=`<div class="card-box"><h3>${text}</h3>${uploadTipHtml}<button class="btn btn-primary" style="margin-top:15px;" onclick="restartSpeakingQuiz()">重新測驗</button></div>`;
  }
}

// ==========================================
// 老師後台整合控制邏輯
// ==========================================
const modeNames = { listening: '看圖測驗', phonicsQuiz: '辨音測驗', speaking: '口說測驗', patternPractice: '句型操練' };

