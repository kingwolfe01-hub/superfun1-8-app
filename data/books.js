// data/books.js
function sfNormalizeText(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ").trim();
}

function uniqueByWordForBook(list) {
  const map = new Map();
  (list || []).forEach(item => {
    const key = sfNormalizeText(item.word || item.sentence || "");
    if (key && !map.has(key)) map.set(key, item);
  });
  return [...map.values()];
}

function getAssetFileName(path) {
  if (!path) return "";
  const cleanPath = String(path).split("?")[0].split("#")[0];
  return cleanPath.split("/").pop();
}

function makeBookAssetPath(path, basePath) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const cleanName = getAssetFileName(path).replace(/\.png$/i, '.webp');
  return basePath + cleanName;
}

function withBookAssetPaths(rawUnits, bookConfig) {
  const output = {};
  Object.entries(rawUnits || {}).forEach(([unitName, items]) => {
    output[unitName] = (items || []).map(item => ({
      ...item,
      image: makeBookAssetPath(item.image, bookConfig.imageBasePath),
      audio: makeBookAssetPath(item.audio, bookConfig.vocabAudioBasePath)
    }));
  });
  return output;
}

function withSentenceAssetPaths(sentenceUnits, basePath, imageBasePath) {
  const output = {};
  Object.entries(sentenceUnits || {}).forEach(([unitName, items]) => {
    output[unitName] = (items || []).map(item => ({
      ...item,
      image: item.image && imageBasePath ? makeBookAssetPath(item.image, imageBasePath) : (item.image || ""),
      audio: makeBookAssetPath(item.audio, basePath)
    }));
  });
  return output;
}

function mergeSentencePracticeUnits(sentenceUnits, dailyTalkUnits) {
  const output = {};
  if (sentenceUnits && sentenceUnits["Classroom English"]) {
    output["🏫 課室用語 Classroom English"] = sentenceUnits["Classroom English"];
  }
  const daily = Object.values(dailyTalkUnits || {}).flat();
  if (daily.length) {
    output["💬 Daily Talk 日常用語"] = daily;
  }
  return output;
}

function resolveLessonCategory(rawName) {
  const m = String(rawName || "").match(/lesson\s*([1-4])/i);
  if (m) return "lesson" + m[1];
  return "lesson1";
}

function resolveLessonBadge(cat) {
  const map = { lesson1: "1️⃣", lesson2: "2️⃣", lesson3: "3️⃣", lesson4: "4️⃣" };
  return map[cat] || "🗼";
}

function resolveStoryCategory(rawName) {
  const lower = String(rawName || "").toLowerCase();
  if (lower.includes("festival") || lower.includes("halloween") || lower.includes("christmas") || lower.includes("moon festival") || lower.includes("new year")) {
    return "festival";
  }
  if (lower.includes("topic 2")) return "topic2_story";
  return "topic1_story";
}

function buildUnitCentricCatalog(book) {
  const units = [];
  const unitMap = new Map();

  function getOrCreateUnit(id, title, subtitle, category, badgeIcon) {
    if (!unitMap.has(id)) {
      const unitObj = {
        id,
        title,
        subtitle,
        category,
        badgeIcon,
        words: [],
        sentences: [],
        stories: []
      };
      unitMap.set(id, unitObj);
      units.push(unitObj);
    }
    return unitMap.get(id);
  }

  Object.entries(book.vocabularyWithPaths || {}).forEach(([rawName, items]) => {
    if (!items || !items.length) return;
    const lower = rawName.toLowerCase();
    if (lower.includes("phonics")) {
      const cleanTitle = rawName.replace(/^Get Ready - /i, "");
      const u = getOrCreateUnit("unit_" + rawName, cleanTitle, "自然發音與拼讀練習", "phonics", "🎈");
      u.words.push(...items);
    } else if (lower.includes("lesson")) {
      const baseTitle = rawName.replace(/\s*-?\s*Words$/i, "").trim();
      const lCat = resolveLessonCategory(rawName);
      const u = getOrCreateUnit("lesson_" + baseTitle, baseTitle, "課文核心單字與句型", lCat, resolveLessonBadge(lCat));
      u.words.push(...items);
    } else if (lower.includes("festival") || lower.includes("halloween") || lower.includes("christmas") || lower.includes("moon festival") || lower.includes("new year")) {
      const baseTitle = rawName.replace(/\s*-?\s*Words$/i, "").trim();
      const u = getOrCreateUnit("fest_" + baseTitle, baseTitle, "節慶與文化主題學習", "festival", "🎡");
      u.words.push(...items);
    } else if (lower.includes("number")) {
      const u = getOrCreateUnit("vocab_" + rawName, rawName, "數字認讀與聽力練習", "numbers", "🔢");
      u.words.push(...items);
    } else {
      const u = getOrCreateUnit("vocab_" + rawName, rawName, "基礎主題單字練習", "phonics", "✨");
      u.words.push(...items);
    }
  });

  Object.entries(book.sentenceUnits || {}).forEach(([rawName, items]) => {
    if (!items || !items.length) return;
    const lower = rawName.toLowerCase();
    if (lower.includes("lesson")) {
      const baseTitle = rawName.replace(/\s*-?\s*Sentences$/i, "").trim();
      const lCat = resolveLessonCategory(rawName);
      const u = getOrCreateUnit("lesson_" + baseTitle, baseTitle, "課文核心單字與句型", lCat, resolveLessonBadge(lCat));
      u.sentences.push(...items);
    } else if (lower.includes("festival") || lower.includes("halloween") || lower.includes("christmas") || lower.includes("moon festival") || lower.includes("new year")) {
      const baseTitle = rawName.replace(/\s*-?\s*Sentences$/i, "").trim();
      const u = getOrCreateUnit("fest_" + baseTitle, baseTitle, "節慶與文化主題學習", "festival", "🎡");
      u.sentences.push(...items);
    } else {
      const u = getOrCreateUnit("sent_" + rawName, rawName, "課室與日常實用句型", "dailytalk", "☕");
      if (items.some(it => it.image)) {
        u.words.push(...items);
      } else {
        u.sentences.push(...items);
      }
    }
  });

  Object.entries(book.dailyTalkUnits || {}).forEach(([rawName, items]) => {
    if (!items || !items.length) return;
    const u = getOrCreateUnit("daily_" + rawName, rawName, "生活情境對話練習", "dailytalk", "☕");
    if (items.some(it => it.image)) {
      u.words.push(...items);
    } else {
      u.sentences.push(...items);
    }
  });

  Object.entries(book.storyUnits || {}).forEach(([rawName, items]) => {
    if (!items || !items.length) return;
    const sCat = resolveStoryCategory(rawName);
    const badge = sCat === "festival" ? "🎡" : "🏮";
    const sub = sCat === "topic2_story" ? "Topic 2 故事雙語閱讀與聽力" : (sCat === "topic1_story" ? "Topic 1 故事雙語閱讀與聽力" : "節慶故事雙語閱讀與聽力");
    const u = getOrCreateUnit("story_" + rawName, rawName, sub, sCat, badge);
    u.stories.push(...items);
  });

  const allVocab = uniqueByWordForBook(Object.values(book.vocabularyWithPaths || {}).flat());
  if (allVocab.length > 0) {
    const rev = getOrCreateUnit("unit_all_review", `🏆 全冊單字總複習 (${book.title})`, "全冊單字綜合挑戰", "review", "🏆");
    rev.words.push(...allVocab);
  }
  return units;
}

function buildBookData(bookConfig, practiceSets, structuredData, fallbackRawUnits) {
  const hasData = !!practiceSets;
  const vocabularyRaw = hasData ? practiceSets.vocabularyUnits : (fallbackRawUnits || {});
  const vocabulary = withBookAssetPaths(vocabularyRaw, bookConfig);
  const sentenceUnitsWithPaths = withSentenceAssetPaths(hasData ? practiceSets.sentenceUnits : {}, bookConfig.sentenceAudioBasePath, bookConfig.imageBasePath);
  const dailyTalkWithPaths = withSentenceAssetPaths(hasData ? practiceSets.dailyTalkUnits : {}, bookConfig.sentenceAudioBasePath, bookConfig.imageBasePath);
  const storyUnitsWithPaths = withSentenceAssetPaths(hasData ? practiceSets.storyUnits : {}, bookConfig.storyAudioBasePath);
  const sentencePractice = withBookAssetPaths(hasData ? mergeSentencePracticeUnits(practiceSets.sentenceUnits, practiceSets.dailyTalkUnits) : {}, bookConfig);
  const rawUnits = { ...vocabulary, ...sentencePractice };
  const courseData = { ...rawUnits, [`🏆 【全冊總複習】 ${bookConfig.title} Review`]: uniqueByWordForBook(Object.values(vocabulary).flat()) };

  const baseBook = {
    ...bookConfig,
    structuredData: structuredData || null,
    practiceSets: practiceSets || null,
    vocabularyWithPaths: vocabulary,
    rawUnits,
    courseData,
    sentenceUnits: sentenceUnitsWithPaths,
    dailyTalkUnits: dailyTalkWithPaths,
    storyUnits: storyUnitsWithPaths
  };
  baseBook.unitCatalog = buildUnitCentricCatalog(baseBook);
  return baseBook;
}

const bookConfigSF1 = { bookId: "sf1", title: "Super Fun 1", grade: "三年級", semester: "上學期", imageBasePath: "books/sf1/images/", vocabAudioBasePath: "books/sf1/vocab-audio/", sentenceAudioBasePath: "books/sf1/sentence-audio/", storyAudioBasePath: "books/sf1/story-audio/", cdBasePath: "books/sf1/cd/", cdConfig: { CD1: 41, CD2: 51 } };
const bookConfigSF2 = { bookId: "sf2", title: "Super Fun 2", grade: "三年級", semester: "下學期", imageBasePath: "books/sf2/images/", vocabAudioBasePath: "books/sf2/vocab-audio/", sentenceAudioBasePath: "books/sf2/sentence-audio/", storyAudioBasePath: "books/sf2/story-audio/", cdBasePath: "books/sf2/cd/", cdConfig: { CD1: 46, CD2: 58 } };
const bookConfigSF3 = { bookId: "sf3", title: "Super Fun 3", grade: "四年級", semester: "上學期", imageBasePath: "books/sf3/images/", vocabAudioBasePath: "books/sf3/vocab-audio/", sentenceAudioBasePath: "books/sf3/sentence-audio/", storyAudioBasePath: "books/sf3/story-audio/", cdBasePath: "books/sf3/cd/", cdConfig: { CD1: 50, CD2: 71 } };
const bookConfigSF4 = { bookId: "sf4", title: "Super Fun 4", grade: "四年級", semester: "下學期", imageBasePath: "books/sf4/images/", vocabAudioBasePath: "books/sf4/vocab-audio/", sentenceAudioBasePath: "books/sf4/sentence-audio/", storyAudioBasePath: "books/sf4/story-audio/", cdBasePath: "books/sf4/cd/", cdConfig: { CD1: 48, CD2: 71 } };
const bookConfigSF5 = { bookId: "sf5", title: "Super Fun 5", grade: "五年級", semester: "上學期", imageBasePath: "books/sf5/images/", vocabAudioBasePath: "books/sf5/vocab-audio/", sentenceAudioBasePath: "books/sf5/sentence-audio/", storyAudioBasePath: "books/sf5/story-audio/", cdBasePath: "books/sf5/cd/", cdConfig: { CD1: 47, CD2: 62 } };
const bookConfigSF6 = { bookId: "sf6", title: "Super Fun 6", grade: "五年級", semester: "下學期", imageBasePath: "books/sf6/images/", vocabAudioBasePath: "books/sf6/vocab-audio/", sentenceAudioBasePath: "books/sf6/sentence-audio/", storyAudioBasePath: "books/sf6/story-audio/", cdBasePath: "books/sf6/cd/", cdConfig: { CD1: 48, CD2: 62 } };
const bookConfigSF7 = { bookId: "sf7", title: "Super Fun 7", grade: "六年級", semester: "上學期", imageBasePath: "books/sf7/images/", vocabAudioBasePath: "books/sf7/vocab-audio/", sentenceAudioBasePath: "books/sf7/sentence-audio/", storyAudioBasePath: "books/sf7/story-audio/", cdBasePath: "books/sf7/cd/", cdConfig: { CD1: 46, CD2: 69 } };
const bookConfigSF8 = { bookId: "sf8", title: "Super Fun 8", grade: "六年級", semester: "下學期", imageBasePath: "books/sf8/images/", vocabAudioBasePath: "books/sf8/vocab-audio/", sentenceAudioBasePath: "books/sf8/sentence-audio/", storyAudioBasePath: "books/sf8/story-audio/", cdBasePath: "books/sf8/cd/", cdConfig: { CD1: 46, CD2: 73 } };

const fallbackRawUnitsSF3 = {
  "Starter Unit": [
    { kind: "word", word: "classroom", sentence: "classroom", meaning: "教室", image: "classroom.png", audio: "classroom.mp3", similarWords: ["classmate", "room", "class"] },
    { kind: "word", word: "teacher", sentence: "teacher", meaning: "老師", image: "teacher.png", audio: "teacher.mp3", similarWords: ["teach", "t-shirt", "picture"] },
    { kind: "word", word: "library", sentence: "library", meaning: "圖書館", image: "library.png", audio: "library.mp3", similarWords: ["lively", "lion", "berry"] }
  ]
};

const hasSf1StructuredData = typeof sf1StructuredData !== "undefined" && typeof sf1PracticeSets !== "undefined";
const hasSf2StructuredData = typeof sf2StructuredData !== "undefined" && typeof sf2PracticeSets !== "undefined";
const hasSf3StructuredData = typeof sf3StructuredData !== "undefined" && typeof sf3PracticeSets !== "undefined";
const hasSf4StructuredData = typeof sf4StructuredData !== "undefined" && typeof sf4PracticeSets !== "undefined";
const hasSf5StructuredData = typeof sf5StructuredData !== "undefined" && typeof sf5PracticeSets !== "undefined";
const hasSf6StructuredData = typeof sf6StructuredData !== "undefined" && typeof sf6PracticeSets !== "undefined";
const hasSf7StructuredData = typeof sf7StructuredData !== "undefined" && typeof sf7PracticeSets !== "undefined";
const hasSf8StructuredData = typeof sf8StructuredData !== "undefined" && typeof sf8PracticeSets !== "undefined";

const bookData = {
  sf1: buildBookData(bookConfigSF1, hasSf1StructuredData ? sf1PracticeSets : null, hasSf1StructuredData ? sf1StructuredData : null, {}),
  sf2: buildBookData(bookConfigSF2, hasSf2StructuredData ? sf2PracticeSets : null, hasSf2StructuredData ? sf2StructuredData : null, {}),
  sf3: buildBookData(bookConfigSF3, hasSf3StructuredData ? sf3PracticeSets : null, hasSf3StructuredData ? sf3StructuredData : null, fallbackRawUnitsSF3),
  sf4: buildBookData(bookConfigSF4, hasSf4StructuredData ? sf4PracticeSets : null, hasSf4StructuredData ? sf4StructuredData : null, {}),
  sf5: buildBookData(bookConfigSF5, hasSf5StructuredData ? sf5PracticeSets : null, hasSf5StructuredData ? sf5StructuredData : null, {}),
  sf6: buildBookData(bookConfigSF6, hasSf6StructuredData ? sf6PracticeSets : null, hasSf6StructuredData ? sf6StructuredData : null, {}),
  sf7: buildBookData(bookConfigSF7, hasSf7StructuredData ? sf7PracticeSets : null, hasSf7StructuredData ? sf7StructuredData : null, {}),
  sf8: buildBookData(bookConfigSF8, hasSf8StructuredData ? sf8PracticeSets : null, hasSf8StructuredData ? sf8StructuredData : null, {})
};

function buildCdTracksForBook(book) {
  const tracks = [];
  Object.entries(book.cdConfig || {}).forEach(([cdName, total]) => {
    for (let i = 1; i <= total; i++) {
      const num = i < 10 ? "0" + i : String(i);
      tracks.push({ cd: cdName, title: `${book.title} ${cdName} - 曲目 ${num}`, file: `${book.cdBasePath}${cdName}/${num}.mp3` });
    }
  });
  return tracks;
}
