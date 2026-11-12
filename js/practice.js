function initVocabForCurrentBook(){if(!currentBook)return;currentMode='flashcard';document.getElementById('modeSelect').value='flashcard';populateUnitSelector();switchMode('flashcard');}
function pauseVocabActivities(){
  if('speechSynthesis'in window)window.speechSynthesis.cancel();
  if(activeRecognition){try{activeRecognition.abort();}catch(e){}activeRecognition=null;}
}
function unlockAudio(){audioUnlocked=true;}
function normalizeText(t){return String(t||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,' ').trim();}
function shuffle(a){return [...a].sort(()=>Math.random()-.5);}
function escapeHtml(text){return String(text).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function getItemText(item){return item?.word||item?.sentence||item?.text||'';}
function getItemMeaning(item){return item?.meaning||'';}
function hasImage(item){return !!(item && item.image && typeof item.image === 'string' && item.image.trim() !== '' && item.image !== 'null');}
function buildImageOnlyUnits(units){const output={};Object.entries(units||{}).forEach(([key,items])=>{const imageItems=(items||[]).filter(hasImage);if(imageItems.length>0)output[key]=imageItems;});return output;}
function safeList(){return activeWordList||[];}

function getUnitsForMode(mode){
  if(!currentBook)return{};
  if(mode==='flashcard')return currentBook.courseData||{};
  if(mode==='speaking')return currentBook.sentenceUnits||{};
  if(mode==='listening')return buildImageOnlyUnits(currentBook.rawUnits||{});
  if(mode==='phonicsQuiz')return currentBook.rawUnits||{};
  if(mode==='sentencePractice')return currentBook.sentenceUnits||{};
  if(mode==='storyPractice')return currentBook.storyUnits||{};
  if(mode==='patternPractice')return currentBook.patternUnits||{};
  return currentBook.courseData||{};
}

function populateUnitSelector(){
  const select=document.getElementById('unitSelect');
  const units=getUnitsForMode(currentMode);
  select.innerHTML='';
  Object.keys(units).forEach(k=>{const op=document.createElement('option');op.value=k;op.textContent=k;select.appendChild(op);});
  currentUnitKey=Object.keys(units)[0]||'';
  if(currentUnitKey)select.value=currentUnitKey;
  activeWordList=units[currentUnitKey]||[];
  currentIndex=0;quizIndex=0;
  renderUnitNavigationUI();
}
function onUnitChange(){
  unlockAudio();
  pauseVocabActivities();
  const units=getUnitsForMode(currentMode);
  currentUnitKey=document.getElementById('unitSelect').value;
  activeWordList=units[currentUnitKey]||[];
  currentIndex=0;quizIndex=0;
  renderUnitNavigationUI();
  runCurrentMode();
}
function switchMode(mode){
  unlockAudio();
  pauseVocabActivities();
  currentMode=mode;
  document.getElementById('modeSelect').value=mode;
  document.querySelectorAll('.mode-section').forEach(sec=>sec.classList.remove('active'));
  document.getElementById(mode+'-mode')?.classList.add('active');
  populateUnitSelector();
  runCurrentMode();
}
function runCurrentMode(){
  if(currentMode==='flashcard')updateFlashcard();
  if(currentMode==='listening')restartListeningQuiz();
  if(currentMode==='phonicsQuiz')restartPhonicsQuiz();
  if(currentMode==='speaking')restartSpeakingQuiz();
  if(currentMode==='sentencePractice')updateSentencePractice();
  if(currentMode==='storyPractice')updateStoryPractice();
  if(currentMode==='patternPractice')updatePatternPractice();
}
let isSlowPlayback = false;
function toggleSlowPlayback(){
  isSlowPlayback = !isSlowPlayback;
  const btn = document.getElementById('slow-audio-toggle-btn');
  if (btn) {
    btn.textContent = isSlowPlayback ? '🐢 慢速發音：開 (0.75x)' : '🐢 慢速發音：關';
    btn.style.background = isSlowPlayback ? '#fef3c7' : '';
    btn.style.borderColor = isSlowPlayback ? '#f59e0b' : '';
  }
}

function playAudio(item){
  unlockAudio();
  if(!item)return;
  const text=getItemText(item);
  if(item.audio){
    const audio=audioCache[item.audio]||new Audio(item.audio);
    audioCache[item.audio]=audio;
    try{audio.pause();audio.currentTime=0;audio.playbackRate=isSlowPlayback?0.75:1.0;}catch(e){}
    audio.play().catch(()=>speakText(text));
  }else speakText(text);
}
function speakText(text){
  if('speechSynthesis'in window){
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='en-US';u.rate=isSlowPlayback?0.58:0.78;
    window.speechSynthesis.speak(u);
  }
}

function updateFlashcard(){
  const list=safeList();if(!list.length)return;
  const item=list[currentIndex];
  const img=document.getElementById('fc-img');
  const text=getItemText(item);
  if(hasImage(item)){img.style.display='block';img.src=item.image;img.alt=text+' 圖片';}
  else{img.style.display='none';img.removeAttribute('src');}
  document.getElementById('fc-word').innerText=text;
  document.getElementById('fc-meaning').innerText=getItemMeaning(item);
}
function playCurrentWordAudio(){playAudio(safeList()[currentIndex]);}
function nextWord(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex+1)%l.length;updateFlashcard();}
function prevWord(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex-1+l.length)%l.length;updateFlashcard();}

function restartListeningQuiz(){
  currentQuizList=shuffle(safeList().filter(hasImage));
  quizIndex=0;score=0;wrongWords=[];
  document.getElementById('listening-quiz-view').style.display='block';
  document.getElementById('listening-result-view').style.display='none';
  if(!currentQuizList.length){
    document.getElementById('listening-quiz-view').innerHTML='<div class="card-box"><h3>此單元沒有可用圖片題目</h3><p style="font-weight:800;color:#64748b;text-align:center;">看圖測驗只會使用已設定圖片的單字。</p></div>';
    return;
  }
  loadListeningQuestion();
}
function loadListeningQuestion(){
  if(quizIndex>=currentQuizList.length){showSimpleResult('listening');return;}
  const cur=currentQuizList[quizIndex];
  document.getElementById('list-progress').innerText=`題目 ${quizIndex+1} / ${currentQuizList.length}`;
  document.getElementById('listening-feedback').className='feedback-box';
  document.getElementById('listening-feedback').innerHTML='';
  const all=Object.values(getUnitsForMode(currentMode)).flat().filter(hasImage);
  const opts=[cur];
  while(opts.length<Math.min(4,all.length)){
    const r=all[Math.floor(Math.random()*all.length)];
    if(!opts.some(o=>normalizeText(getItemText(o))===normalizeText(getItemText(r))))opts.push(r);
  }
  const box=document.getElementById('quiz-options');
  box.innerHTML='';
  shuffle(opts).forEach(opt=>{
    const btn=document.createElement('button');
    if(hasImage(opt)){
      btn.className='option-img-btn';
      const img=document.createElement('img');img.src=opt.image;
      img.onerror=function(){this.src='https://via.placeholder.com/120?text='+encodeURIComponent(getItemText(opt));};
      btn.appendChild(img);
    }else{
      btn.className='option-text-btn';btn.innerText=getItemText(opt);
    }
    btn.onclick=()=>checkListeningAnswer(opt,cur,btn);
    box.appendChild(btn);
  });
  if(audioUnlocked)playAudio(cur);
}
function playQuizAudio(){playAudio(currentQuizList[quizIndex]);}
function checkListeningAnswer(sel,cor,btn){
  document.querySelectorAll('#quiz-options button').forEach(b=>b.disabled=true);
  const fb=document.getElementById('listening-feedback');
  if(normalizeText(getItemText(sel))===normalizeText(getItemText(cor))){
    score++;fb.className='feedback-box correct';fb.innerHTML='🎉 答對了！';
    setTimeout(()=>{quizIndex++;loadListeningQuestion();},800);
  }else{
    wrongWords.push(cor);fb.className='feedback-box incorrect';
    fb.innerHTML=`正確答案：<strong>${escapeHtml(getItemText(cor))}</strong>`;
    setTimeout(()=>{quizIndex++;loadListeningQuestion();},1600);
  }
}

function restartPhonicsQuiz(){
  currentQuizList=shuffle(safeList());
  quizIndex=0;score=0;wrongWords=[];
  document.getElementById('phonics-quiz-view').style.display='block';
  document.getElementById('phonics-result-view').style.display='none';
  loadPhonicsQuestion();
}
function buildPhonicsChoices(cur){
  const correct=getItemText(cur);
  const choices=[];
  const add=w=>{if(!normalizeText(w))return;if(!choices.some(c=>normalizeText(c)===normalizeText(w)))choices.push(w);};
  add(correct);
  (cur.similarWords||[]).forEach(add);
  shuffle(safeList().map(getItemText)).forEach(w=>{if(choices.length<4&&normalizeText(w)!==normalizeText(correct))add(w);});
  shuffle(Object.values(activeRawUnits).flat().map(getItemText)).forEach(w=>{if(choices.length<4&&normalizeText(w)!==normalizeText(correct))add(w);});
  return shuffle(choices.slice(0,4));
}
function loadPhonicsQuestion(){
  if(quizIndex>=currentQuizList.length){showSimpleResult('phonicsQuiz');return;}
  const cur=currentQuizList[quizIndex];
  document.getElementById('phonics-progress').innerText=`題目 ${quizIndex+1} / ${currentQuizList.length}`;
  document.getElementById('phonics-feedback').className='feedback-box';
  document.getElementById('phonics-feedback').innerHTML='';
  const box=document.getElementById('phonics-quiz-options');
  box.innerHTML='';
  buildPhonicsChoices(cur).forEach(choice=>{
    const btn=document.createElement('button');
    btn.className='option-text-btn';
    btn.innerText=choice;
    btn.onclick=()=>checkPhonicsAnswer(choice,cur,btn);
    box.appendChild(btn);
  });
  if(audioUnlocked)playAudio(cur);
}
function playPhonicsQuizAudio(){playAudio(currentQuizList[quizIndex]);}
function checkPhonicsAnswer(sel,cor,btn){
  document.querySelectorAll('#phonics-quiz-options button').forEach(b=>b.disabled=true);
  const fb=document.getElementById('phonics-feedback');
  if(normalizeText(sel)===normalizeText(getItemText(cor))){
    score++;fb.className='feedback-box correct';fb.innerHTML='🎉 答對了！';
    setTimeout(()=>{quizIndex++;loadPhonicsQuestion();},800);
  }else{
    wrongWords.push(cor);fb.className='feedback-box incorrect';
    fb.innerHTML=`正確答案：<strong>${escapeHtml(getItemText(cor))}</strong>`;
    setTimeout(()=>{quizIndex++;loadPhonicsQuestion();},1600);
  }
}

function restartSpeakingQuiz(){
  currentQuizList=shuffle(safeList());
  quizIndex=0;score=0;wrongWords=[];
  document.getElementById('speaking-quiz-view').style.display='block';
  document.getElementById('speaking-result-view').style.display='none';
  loadSpeakingQuestion();
}

function loadSpeakingQuestion(){
  if(quizIndex>=currentQuizList.length){showSimpleResult('speaking');return;}
  const item=currentQuizList[quizIndex];
  document.getElementById('spk-progress').innerText=`句子 ${quizIndex+1} / ${currentQuizList.length}`;
  const img=document.getElementById('sp-img');
  if(img) img.style.display='none';
  
  document.getElementById('sp-word').innerText=getItemText(item);
  document.getElementById('sp-meaning').innerText=getItemMeaning(item);
  document.getElementById('speaking-feedback').className='feedback-box';
  document.getElementById('speaking-feedback').innerHTML='';
}

const speechAliasMap={one:['one','1','won'],two:['two','2','to','too'],three:['three','3'],four:['four','4','for'],five:['five','5'],six:['six','6'],seven:['seven','7'],eight:['eight','8','ate'],nine:['nine','9'],ten:['ten','10']};

function expandContractions(text) {
  return String(text)
    .replace(/i['’]m/gi, 'i am')
    .replace(/he['’]s/gi, 'he is')
    .replace(/she['’]s/gi, 'she is')
    .replace(/it['’]s/gi, 'it is')
    .replace(/they['’]re/gi, 'they are')
    .replace(/we['’]re/gi, 'we are')
    .replace(/you['’]re/gi, 'you are')
    .replace(/don['’]t/gi, 'do not')
    .replace(/can['’]t/gi, 'cannot')
    .replace(/doesn['’]t/gi, 'does not');
}

function canonicalSpeechToken(t){const n=normalizeText(t);for(const [w,a] of Object.entries(speechAliasMap))if(a.includes(n))return w;return n;}
function canonicalSpeechText(t){return normalizeText(t).split(' ').map(canonicalSpeechToken).join(' ').trim();}

function isSpeakingMatch(ans,cor){
  const a=canonicalSpeechText(expandContractions(ans)),c=canonicalSpeechText(expandContractions(cor));
  if(!a||!c)return false;
  if(a===c)return true;
  const aw=a.split(' ').filter(Boolean),cw=c.split(' ').filter(Boolean);
  if(cw.length<=1)return aw.includes(c);
  return cw.filter(w=>aw.includes(w)).length/cw.length>=0.55;
}

function playSpeakingSentence(){
  if(!currentQuizList.length)return;
  playAudio(currentQuizList[quizIndex]);
}

function startSpeechRecognition(){
  if(!currentQuizList.length)return;
  const item = currentQuizList[quizIndex];
  const cleanText = getItemText(item).replace(/[.?!,]/g, '').trim();
  
  startGenericRecognition({ word: cleanText, sentence: cleanText, meaning: '' }, 'speaking-feedback', passed => {
    if(passed) score++; else wrongWords.push(item);
    setTimeout(()=>{quizIndex++;loadSpeakingQuestion();}, passed ? 550 : 1500);
  });
}

function updateSentencePractice(){
  const item=safeList()[currentIndex];
  document.getElementById('sentence-progress').innerText=safeList().length?`句子 ${currentIndex+1} / ${safeList().length}`:'尚無句子資料';
  document.getElementById('sentence-text').innerText=item?getItemText(item):'尚無句子資料';
  document.getElementById('sentence-meaning').innerText=item?getItemMeaning(item):'';
  document.getElementById('sentence-feedback').className='feedback-box';
  document.getElementById('sentence-feedback').innerHTML='';
}
function nextSentenceItem(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex+1)%l.length;updateSentencePractice();}
function prevSentenceItem(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex-1+l.length)%l.length;updateSentencePractice();}
function playCurrentSentenceAudio(){playAudio(safeList()[currentIndex]);}
function startSentenceSpeechRecognition(){
  const item=safeList()[currentIndex];
  if(!item)return;
  const text=getItemText(item).replace(/[.?!,]/g,'').trim();
  startGenericRecognition({word:text,sentence:text,meaning:''},'sentence-feedback');
}

function updateStoryPractice(){
  const item=safeList()[currentIndex];
  document.getElementById('story-progress').innerText=safeList().length?`Story Time ${currentIndex+1} / ${safeList().length}`:'尚無 Story Time 資料';
  document.getElementById('story-text').innerText=item?`${item.no?item.no+'. ':''}${getItemText(item)}`:'尚無 Story Time 資料';
  document.getElementById('story-meaning').innerText=item?getItemMeaning(item):'';
  document.getElementById('story-feedback').className='feedback-box';
  document.getElementById('story-feedback').innerHTML='';
}
function nextStoryItem(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex+1)%l.length;updateStoryPractice();}
function prevStoryItem(){const l=safeList();if(!l.length)return;currentIndex=(currentIndex-1+l.length)%l.length;updateStoryPractice();}
function playCurrentStoryAudio(){playAudio(safeList()[currentIndex]);}
function startStorySpeechRecognition(){
  const item=safeList()[currentIndex];
  if(!item)return;
  const text=getItemText(item).replace(/[.?!,]/g,'').trim();
  startGenericRecognition({word:text,sentence:text,meaning:''},'story-feedback');
}



function renderUnitNavigationUI() {
  const units = getUnitsForMode(currentMode);
  const keys = Object.keys(units);
  const titleEl = document.getElementById('active-unit-title');
  if (titleEl) {
    const count = (units[currentUnitKey] || []).length;
    titleEl.textContent = currentUnitKey ? `${currentUnitKey}（${count} 題）` : '無可用單元';
  }

  const buildCardsHtml = (onClickFn) => keys.map(k => {
    const count = (units[k] || []).length;
    const isActive = k === currentUnitKey;
    return `<button type="button" class="unit-choice-card ${isActive ? 'active' : ''}" onclick="${onClickFn}('${escapeHtml(k)}')"><span>${isActive ? '✅ ' : ''}${escapeHtml(k)}</span><span class="unit-choice-meta">${count} 題</span></button>`;
  }).join('') || '<div style="color:#64748b;padding:12px;">此模式尚無單元</div>';

  const sidebarEl = document.getElementById('unit-sidebar-list');
  if (sidebarEl) sidebarEl.innerHTML = buildCardsHtml('selectUnitFromUI');

  const drawerGrid = document.getElementById('unit-drawer-grid');
  if (drawerGrid) drawerGrid.innerHTML = buildCardsHtml('selectUnitFromDrawer');
}

function selectUnitFromUI(unitKey) {
  const select = document.getElementById('unitSelect');
  if (!select) return;
  select.value = unitKey;
  onUnitChange();
}

function selectUnitFromDrawer(unitKey) {
  selectUnitFromUI(unitKey);
  closeUnitDrawer();
}

function stepUnit(delta) {
  const units = getUnitsForMode(currentMode);
  const keys = Object.keys(units);
  if (!keys.length) return;
  const idx = keys.indexOf(currentUnitKey);
  const nextIdx = (idx + delta + keys.length) % keys.length;
  selectUnitFromUI(keys[nextIdx]);
}

function openUnitDrawer() {
  renderUnitNavigationUI();
  document.getElementById('unit-drawer-overlay')?.classList.add('open');
}

function closeUnitDrawer() {
  document.getElementById('unit-drawer-overlay')?.classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  const vocabWrap = document.getElementById('vocab-wrapper');
  if (!vocabWrap || vocabWrap.style.display === 'none' || getComputedStyle(vocabWrap).display === 'none') return;
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;

  if (e.key === 'ArrowRight') {
    if (currentMode === 'flashcard') nextWord();
    else if (currentMode === 'sentencePractice') nextSentenceItem();
    else if (currentMode === 'storyPractice') nextStoryItem();
    else if (currentMode === 'patternPractice') nextPatternItem();
  } else if (e.key === 'ArrowLeft') {
    if (currentMode === 'flashcard') prevWord();
    else if (currentMode === 'sentencePractice') prevSentenceItem();
    else if (currentMode === 'storyPractice') prevStoryItem();
    else if (currentMode === 'patternPractice') prevPatternItem();
  } else if (e.key === ' ') {
    e.preventDefault();
    if (currentMode === 'flashcard') playCurrentWordAudio();
    else if (currentMode === 'listening') playQuizAudio();
    else if (currentMode === 'phonicsQuiz') playPhonicsQuizAudio();
    else if (currentMode === 'speaking') playSpeakingSentence();
    else if (currentMode === 'sentencePractice') playCurrentSentenceAudio();
    else if (currentMode === 'storyPractice') playCurrentStoryAudio();
    else if (currentMode === 'patternPractice') playCurrentPatternAudio();
  }
});
