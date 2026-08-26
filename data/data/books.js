// data/books.js
// Super Fun multi-book configuration. Load order:
// sf1-structured-data.js -> sf3-structured-data.js -> sf5-structured-data.js -> sf7-structured-data.js -> books.js -> students-map.js
function sfNormalizeText(text){return String(text||"").toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g," ").trim();}
function uniqueByWordForBook(list){const map=new Map();(list||[]).forEach(item=>{const key=sfNormalizeText(item.word||item.sentence||"");if(key&&!map.has(key))map.set(key,item);});return [...map.values()];}
function getAssetFileName(path){if(!path)return"";const cleanPath=String(path).split("?")[0].split("#")[0];return cleanPath.split("/").pop();}
function makeBookAssetPath(path,basePath){
  if(!path)return"";
  if(/^(https?:|data:|blob:)/i.test(path))return path;
  // 自動將 .png 檔名轉為 .webp 檔名相容
  const cleanName = getAssetFileName(path).replace(/\.png$/i, '.webp');
  return basePath + cleanName;
}
function withBookAssetPaths(rawUnits,bookConfig){const output={};Object.entries(rawUnits||{}).forEach(([unitName,items])=>{output[unitName]=(items||[]).map(item=>({...item,image:makeBookAssetPath(item.image,bookConfig.imageBasePath),audio:makeBookAssetPath(item.audio,bookConfig.vocabAudioBasePath)}));});return output;}
function mergeSentencePracticeUnits(sentenceUnits,dailyTalkUnits){const output={};if(sentenceUnits&&sentenceUnits["Classroom English"])output["🗣️ 課室用語 Classroom English"]=sentenceUnits["Classroom English"];const daily=Object.values(dailyTalkUnits||{}).flat();if(daily.length)output["💬 Daily Talk 日常用語"]=daily;return output;}
function buildBookData(bookConfig,practiceSets,structuredData,fallbackRawUnits){const hasData=!!practiceSets;const vocabularyRaw=hasData?practiceSets.vocabularyUnits:(fallbackRawUnits||{});const vocabulary=withBookAssetPaths(vocabularyRaw,bookConfig);const sentencePractice=withBookAssetPaths(hasData?mergeSentencePracticeUnits(practiceSets.sentenceUnits,practiceSets.dailyTalkUnits):{},bookConfig);const rawUnits={...vocabulary,...sentencePractice};const courseData={...rawUnits,[`🏆 【全冊總複習】 ${bookConfig.title} Review`]:uniqueByWordForBook(Object.values(vocabulary).flat())};return {...bookConfig,structuredData:structuredData||null,practiceSets:practiceSets||null,rawUnits,courseData,sentenceUnits:hasData?practiceSets.sentenceUnits:{},dailyTalkUnits:hasData?practiceSets.dailyTalkUnits:{},storyUnits:hasData?practiceSets.storyUnits:{},patternUnits:hasData?(practiceSets.patternUnits||{}):{}};}

const bookConfigSF1={bookId:"sf1",title:"Super Fun 1",grade:"三年級",semester:"上學期",imageBasePath:"books/sf1/images/",vocabAudioBasePath:"books/sf1/vocab-audio/",sentenceAudioBasePath:"books/sf1/sentence-audio/",storyAudioBasePath:"books/sf1/story-audio/",cdBasePath:"books/sf1/cd/",cdConfig:{CD1:41,CD2:51}};
const bookConfigSF3={bookId:"sf3",title:"Super Fun 3",grade:"四年級",semester:"上學期",imageBasePath:"books/sf3/images/",vocabAudioBasePath:"books/sf3/vocab-audio/",sentenceAudioBasePath:"books/sf3/sentence-audio/",storyAudioBasePath:"books/sf3/story-audio/",cdBasePath:"books/sf3/cd/",cdConfig:{CD1:50,CD2:71}};
const bookConfigSF5={bookId:"sf5",title:"Super Fun 5",grade:"五年級",semester:"上學期",imageBasePath:"books/sf5/images/",vocabAudioBasePath:"books/sf5/vocab-audio/",sentenceAudioBasePath:"books/sf5/sentence-audio/",storyAudioBasePath:"books/sf5/story-audio/",cdBasePath:"books/sf5/cd/",cdConfig:{}};
const bookConfigSF7={bookId:"sf7",title:"Super Fun 7",grade:"六年級",semester:"上學期",imageBasePath:"books/sf7/images/",vocabAudioBasePath:"books/sf7/vocab-audio/",sentenceAudioBasePath:"books/sf7/sentence-audio/",storyAudioBasePath:"books/sf7/story-audio/",cdBasePath:"books/sf7/cd/",cdConfig:{CD1:46,CD2:69}};
const fallbackRawUnitsSF3={"Starter Unit":[{kind:"word",word:"classroom",sentence:"classroom",meaning:"教室",image:"classroom.png",audio:"classroom.mp3",similarWords:["classmate","room","class"]},{kind:"word",word:"teacher",sentence:"teacher",meaning:"老師",image:"teacher.png",audio:"teacher.mp3",similarWords:["teach","t-shirt","picture"]},{kind:"word",word:"library",sentence:"library",meaning:"圖書館",image:"library.png",audio:"library.mp3",similarWords:["lively","lion","berry"]}]};

const hasSf1StructuredData=typeof sf1StructuredData!=="undefined"&&typeof sf1PracticeSets!=="undefined";
const hasSf3StructuredData=typeof sf3StructuredData!=="undefined"&&typeof sf3PracticeSets!=="undefined";
const hasSf5StructuredData=typeof sf5StructuredData!=="undefined"&&typeof sf5PracticeSets!=="undefined";
const hasSf7StructuredData=typeof sf7StructuredData!=="undefined"&&typeof sf7PracticeSets!=="undefined";

const bookData={
  sf1: buildBookData(bookConfigSF1, hasSf1StructuredData?sf1PracticeSets:null, hasSf1StructuredData?sf1StructuredData:null, {}),
  sf3: buildBookData(bookConfigSF3, hasSf3StructuredData?sf3PracticeSets:null, hasSf3StructuredData?sf3StructuredData:null, fallbackRawUnitsSF3),
  sf5: buildBookData(bookConfigSF5, hasSf5StructuredData?sf5PracticeSets:null, hasSf5StructuredData?sf5StructuredData:null, {}),
  sf7: buildBookData(bookConfigSF7, hasSf7StructuredData?sf7PracticeSets:null, hasSf7StructuredData?sf7StructuredData:null, {})
};
function buildCdTracksForBook(book){const tracks=[];Object.entries(book.cdConfig||{}).forEach(([cdName,total])=>{for(let i=1;i<=total;i++){const num=i<10?"0"+i:String(i);tracks.push({cd:cdName,title:`${book.title} ${cdName} - 曲目 ${num}`,file:`${book.cdBasePath}${cdName}/${num}.mp3`});}});return tracks;}
