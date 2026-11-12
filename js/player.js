let playerTracks=[],currentTrackIndex=0,playerIsPlaying=false,currentPlayerTab='CD1';
const playerAudio=document.getElementById('main-audio'),playerPlayBtn=document.getElementById('play-btn'),playerPrevBtn=document.getElementById('prev-btn'),playerNextBtn=document.getElementById('next-btn'),playerProgressBar=document.getElementById('progress-bar'),playerProgressArea=document.getElementById('progress-area'),playerDisplayTitle=document.getElementById('display-title'),playerPlaylistContainer=document.getElementById('playlist-container'),playerCurrentTimeEl=document.getElementById('current-time'),playerTotalTimeEl=document.getElementById('total-time');

function formatPlayerTime(s){if(isNaN(s))return'0:00';const m=Math.floor(s/60),sec=Math.floor(s%60);return`${m}:${sec<10?'0':''}${sec}`;}
function loadPlayerPlaylist(){
  playerPlaylistContainer.innerHTML='';
  playerTracks.forEach((track,index)=>{
    const li=document.createElement('li');
    li.textContent=track.title;
    li.setAttribute('data-index',index);
    li.setAttribute('data-cd',track.cd);
    li.addEventListener('click',()=>loadPlayerTrack(index,true));
    playerPlaylistContainer.appendChild(li);
  });
}
function switchPlayerTab(cdName){
  currentPlayerTab=cdName;
  document.getElementById('btn-CD1')?.classList.toggle('active',cdName==='CD1');
  document.getElementById('btn-CD2')?.classList.toggle('active',cdName==='CD2');
  playerPlaylistContainer.querySelectorAll('li').forEach(item=>item.style.display=item.getAttribute('data-cd')===cdName?'flex':'none');
}
function loadPlayerTrack(index,isAutoPlay=false){
  if(!playerTracks.length)return;
  currentTrackIndex=index;
  playerAudio.src=playerTracks[currentTrackIndex].file;
  playerDisplayTitle.textContent=playerTracks[currentTrackIndex].title;
  if(playerTracks[currentTrackIndex].cd!==currentPlayerTab)switchPlayerTab(playerTracks[currentTrackIndex].cd);
  playerPlaylistContainer.querySelectorAll('li').forEach(item=>item.classList.remove('active'));
  const activeLi=playerPlaylistContainer.querySelector(`li[data-index="${index}"]`);
  if(activeLi){activeLi.classList.add('active');activeLi.scrollIntoView({behavior:'smooth',block:'nearest'});}
  if(isAutoPlay)playTrackAudio();else pauseTrackAudio();
}
function playTrackAudio(){
  if(!playerAudio.src&&playerTracks.length>0)loadPlayerTrack(currentTrackIndex,false);
  playerAudio.play().catch(()=>{});
  playerIsPlaying=true;
  playerPlayBtn.textContent='暫停';
}
function pauseTrackAudio(){
  if(playerAudio)playerAudio.pause();
  playerIsPlaying=false;
  if(playerPlayBtn)playerPlayBtn.textContent='播放';
}
function initPlayerForCurrentBook(){
  if(!currentBook)return;
  if(playerInitializedBookId===currentBookId)return;
  pauseTrackAudio();
  if(typeof buildCdTracksForBook==='function'){
    playerTracks=buildCdTracksForBook(currentBook);
  }else{
    playerTracks=[];
  }
  currentTrackIndex=0;
  playerPlaylistContainer.innerHTML='';
  loadPlayerPlaylist();
  switchPlayerTab('CD1');
  if(playerTracks.length>0)loadPlayerTrack(0,false);
  else playerDisplayTitle.textContent=`${currentBook.title} 尚未設定 CD 音檔`;
  playerInitializedBookId=currentBookId;
}

playerPlayBtn.addEventListener('click',()=>playerIsPlaying?pauseTrackAudio():playTrackAudio());
playerPrevBtn.addEventListener('click',()=>{if(!playerTracks.length)return;currentTrackIndex=(currentTrackIndex-1+playerTracks.length)%playerTracks.length;loadPlayerTrack(currentTrackIndex,true);});
playerNextBtn.addEventListener('click',()=>{if(!playerTracks.length)return;currentTrackIndex=(currentTrackIndex+1)%playerTracks.length;loadPlayerTrack(currentTrackIndex,true);});
playerAudio.addEventListener('loadedmetadata',()=>playerTotalTimeEl.textContent=formatPlayerTime(playerAudio.duration));
playerAudio.addEventListener('timeupdate',()=>{if(playerAudio.duration){playerProgressBar.style.width=`${(playerAudio.currentTime/playerAudio.duration)*100}%`;playerCurrentTimeEl.textContent=formatPlayerTime(playerAudio.currentTime);}});
playerProgressArea.addEventListener('click',e=>{if(!playerAudio.duration)return;playerAudio.currentTime=(e.offsetX/playerProgressArea.clientWidth)*playerAudio.duration;});
playerAudio.addEventListener('ended',()=>playerNextBtn.click());
