// data/sf6-structured-data.js
function sf6Slug(text) {
  return String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function sf6Word(word, meaning, options = {}) {
  const slug = options.slug || sf6Slug(word);
  return {
    kind: "word",
    word,
    sentence: word,
    meaning,
    category: options.category || "application",
    sourceUnit: options.sourceUnit || "",
    topicId: options.topicId || "",
    lessonId: options.lessonId || "",
    image: options.image || `${slug}.png`,
    audio: options.audio || `${slug}.mp3`,
    similarWords: options.similarWords || []
  };
}
function sf6Sentence(sentence, meaning, options = {}) {
  const slug = options.slug || sf6Slug(sentence);
  return {
    kind: "sentence",
    word: sentence,
    sentence,
    meaning,
    category: options.category || "sentence",
    sourceUnit: options.sourceUnit || "",
    topicId: options.topicId || "",
    lessonId: options.lessonId || "",
    image: "",
    audio: options.audio || `${slug}.mp3`,
    similarWords: options.similarWords || []
  };
}
function sf6StoryLine(no, sentence, meaning, options = {}) {
  const prefix = options.prefix || "t1";
  const sentSlug = sf6Slug(sentence);
  const slug = options.slug || `${prefix}_${String(no).padStart(2, "0")}_${sentSlug}`;
  return {
    kind: "storyLine",
    no,
    word: sentence,
    sentence,
    meaning,
    sourceUnit: options.sourceUnit || "",
    storyId: options.storyId || "",
    topicId: options.topicId || "",
    image: "",
    audio: options.audio || `${slug}.mp3`,
    similarWords: []
  };
}

const sf6StructuredData = {
  bookId: "sf6",
  title: "Super Fun 6",
  grade: "五年級",
  semester: "下學期",
  curriculum: {
    preUnits: {
      phonics: {
        phonics1: [
          sf6Word("cake", "蛋糕", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["plate", "make", "bake"] }),
          sf6Word("plate", "盤子", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["plane", "place", "late"] }),
          sf6Word("rain", "雨；下雨", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["train", "mail", "pain"] }),
          sf6Word("mail", "郵件", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["tail", "sail", "rain"] }),
          sf6Word("gray", "灰色", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["play", "tray", "day"] }),
          sf6Word("play", "玩", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["gray", "clay", "stay"] })
        ],
        phonics2: [
          sf6Word("Eve", "（女子名）", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["even", "ever", "tree"] }),
          sf6Word("these", "這些", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["those", "theme", "there"] }),
          sf6Word("feet", "腳（複數）", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["meet", "seed", "feel"] }),
          sf6Word("tree", "樹", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["three", "free", "tea"] }),
          sf6Word("tea", "茶", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["sea", "pea", "tree"] }),
          sf6Word("read", "閱讀", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["lead", "bead", "red"] })
        ],
        phonics3: [
          sf6Word("bike", "腳踏車", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["like", "hike", "bake"] }),
          sf6Word("nine", "九（數字）", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["fine", "line", "pine"] }),
          sf6Word("pie", "派", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["tie", "lie", "pig"] }),
          sf6Word("tie", "領帶", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pie", "lie", "die"] }),
          sf6Word("light", "燈", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["night", "right", "fight"] }),
          sf6Word("night", "夜晚", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["light", "right", "sight"] })
        ],
        phonics4: [
          sf6Word("nose", "鼻子", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["rose", "those", "note"] }),
          sf6Word("rope", "繩子", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["hope", "robe", "road"] }),
          sf6Word("goat", "山羊", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["boat", "coat", "road"] }),
          sf6Word("road", "道路", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["toad", "load", "goat"] }),
          sf6Word("window", "窗戶", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["yellow", "pillow", "snow"] }),
          sf6Word("snow", "雪；下雪", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["slow", "show", "blow"] })
        ],
        phonics5: [
          sf6Word("cube", "方塊", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["tube", "cute", "cub"] }),
          sf6Word("blue", "藍色", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["glue", "true", "clue"] }),
          sf6Word("mute", "靜音", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["cute", "flute", "mule"] }),
          sf6Word("glue", "膠水", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["blue", "true", "clue"] }),
          sf6Word("June", "六月", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["dune", "tune", "juice"] }),
          sf6Word("juice", "果汁", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["June", "fruit", "ice"] }),
          sf6Word("flute", "長笛", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["fruit", "mute", "blue"] }),
          sf6Word("fruit", "水果", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["flute", "suit", "juice"] })
        ]
      }
    },
    topics: {
      topic1: {
        title: "Care for Others",
        chineseTitle: "關懷他人",
        lessons: {
          lesson1: {
            title: "Lesson 1",
            words: [
              sf6Word("cook/cooking", "煮/正在煮", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["book", "look", "doing"] }),
              sf6Word("jump/jumping", "跳/正在跳", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["running", "pump", "dump"] }),
              sf6Word("sleep/sleeping", "睡/正在睡", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["sheep", "sweep", "deep"] }),
              sf6Word("study/studying", "讀書/正在讀書", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["sunny", "story", "standing"] }),
              sf6Word("write/writing", "寫/正在寫", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["white", "ride", "reading"] }),
              sf6Word("dance/dancing", "跳舞/正在跳舞", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["chance", "fence", "singing"] }),
              sf6Word("run/running", "跑/正在跑", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["sun", "fun", "jumping"] }),
              sf6Word("do/doing", "做/正在做", { category: "recognition", sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["go", "going", "cooking"] })
            ],
            sentences: [
              sf6Sentence("What are you doing?", "你正在做什麼呢？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf6Sentence("I’m cooking.", "我正在煮飯。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf6Sentence("What’s he doing?", "他正在做什麼呢？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf6Sentence("He’s dancing.", "他正在跳舞。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf6Sentence("What’s she doing?", "她正在做什麼呢？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf6Sentence("She’s running.", "她正在跑步。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" })
            ]
          },
          lesson2: {
            title: "Lesson 2",
            words: [
              sf6Word("fever", "發燒", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["river", "never", "clever"] }),
              sf6Word("runny nose", "流鼻水", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["nose", "funny", "sunny"] }),
              sf6Word("toothache", "牙痛", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["headache", "stomachache", "tooth"] }),
              sf6Word("headache", "頭痛", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["toothache", "head", "earache"] }),
              sf6Word("leg/legs", "腿（單/複數）", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["egg", "beg", "feet"] }),
              sf6Word("foot/feet", "腳（單/複數）", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["food", "meet", "boot"] }),
              sf6Word("hand/hands", "手（單/複數）", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["head", "land", "sand"] }),
              sf6Word("eye/eyes", "眼（單/複數）", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["ear", "ice", "yes"] }),
              sf6Word("wrong", "不對的；不對勁", { category: "recognition", sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["long", "strong", "song"] }),
              sf6Word("hurt", "疼痛", { category: "recognition", sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["shirt", "skirt", "heart"] })
            ],
            sentences: [
              sf6Sentence("What’s wrong?", "怎麼了？", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf6Sentence("I have a runny nose.", "我流鼻水。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf6Sentence("He has a headache.", "他頭痛。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf6Sentence("She has a fever.", "她發燒。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf6Sentence("My hand hurts.", "我的手痛。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf6Sentence("His foot hurts.", "他的腳痛。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf6Sentence("Her feet hurt.", "她的雙腳痛。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" })
            ]
          }
        },
        storyTime: [
          sf6StoryLine(1, "Good morning, Granny Lisa.", "早安，Lisa奶奶。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(2, "What are you doing?", "您正在做什麼呢？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(3, "I’m walking my dog.", "我正在遛狗。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(4, "Come in, please.", "請進。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(5, "Granny Lisa, are you OK?", "Lisa奶奶，您還好嗎？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(6, "You don’t look well.", "您看起來不太好。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(7, "I have a runny nose.", "我流鼻水。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(8, "You also have a fever.", "您也發燒了。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(9, "Maybe you need to see a doctor.", "或許您需要看醫生。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(10, "But the hospital is far.", "但是醫院很遠。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(11, "You can see a doctor at home.", "您可以在家看醫生。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(12, "Please drink more water and get some rest.", "請多喝水並且多休息。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(13, "What’s Granny Lisa doing?", "Lisa奶奶正在做什麼呢？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(14, "She’s sleeping.", "她正在睡覺。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(15, "Healthy food is good for Granny Lisa.", "健康的食物對Lisa奶奶有益。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(16, "Can you cook, Mike?", "你會煮東西嗎，Mike？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(17, "Of course. I’m good at cooking.", "當然。我很擅長煮東西。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(18, "Do you need help, Mike?", "你需要幫助嗎，Mike？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(19, "I’m OK. Don’t worry.", "我還好。別擔心。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(20, "What’s wrong, Mike?", "怎麼了，Mike？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(21, "My hand hurts.", "我的手痛。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(22, "I can’t cook now.", "我現在不能煮東西了。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(23, "I have an idea!", "我有個主意！", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(24, "Don’t waste the food.", "別浪費食物。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(25, "What are you doing, Wendy?", "妳正在做什麼呢，Wendy。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(26, "I’m writing.", "我正在寫字。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(27, "Ta-da! Dinner is ready.", "嗒噠！晚餐準備好了。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(28, "Wow! It’s amazing.", "哇！這真棒。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(29, "Granny Lisa, please enjoy it.", "Lisa奶奶，請享用。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf6StoryLine(30, "Thank you all. I feel much better.", "謝謝你們。我感覺好多了。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" })
        ]
      },
      topic2: {
        title: "A Nice Trip",
        chineseTitle: "美好的旅程",
        lessons: {
          lesson3: {
            title: "Lesson 3",
            words: [
              sf6Word("park", "公園", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["part", "dark", "bark"] }),
              sf6Word("library", "圖書館", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["bookstore", "lively", "bakery"] }),
              sf6Word("hospital", "醫院", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["hotel", "hostel", "capital"] }),
              sf6Word("supermarket", "超市", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["market", "super", "bookstore"] }),
              sf6Word("bookstore", "書店", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["library", "store", "bookcase"] }),
              sf6Word("tea shop", "飲料店", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["toy shop", "pet shop", "coffee shop"] }),
              sf6Word("post office", "郵局", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["police", "office", "post"] }),
              sf6Word("zoo", "動物園", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["too", "pool", "school"] }),
              sf6Word("road", "路；道路", { category: "recognition", sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["boat", "coat", "toad"] }),
              sf6Word("next to…", "在…旁邊", { category: "recognition", sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", slug: "next_to", similarWords: ["near", "under", "next"] })
            ],
            sentences: [
              sf6Sentence("Where are you going?", "你要去哪裡呢？", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf6Sentence("I’m going to the tea shop.", "我要去飲料店。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf6Sentence("Where’s the library?", "圖書館在哪裡呢？", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf6Sentence("It’s on Park Road.", "它在公園路上。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf6Sentence("It’s next to the zoo.", "它在動物園隔壁。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" })
            ]
          },
          lesson4: {
            title: "Lesson 4",
            words: [
              sf6Word("by bike", "騎腳踏車", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by bus", "bike", "by car"] }),
              sf6Word("by bus", "搭公車", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by bike", "by car", "bus"] }),
              sf6Word("by car", "搭汽車；開車", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by bus", "by train", "car"] }),
              sf6Word("by metro", "搭捷運", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by train", "by scooter", "metro"] }),
              sf6Word("by train", "搭火車", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by metro", "by car", "rain"] }),
              sf6Word("by scooter", "搭機車；騎機車", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by metro", "scooter", "by bike"] }),
              sf6Word("on foot", "走路；步行", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["by bike", "foot", "on time"] }),
              sf6Word("get", "到達", { category: "recognition", sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["got", "jet", "pet"] })
            ],
            sentences: [
              sf6Sentence("How can I get to the zoo?", "我要怎麼去動物園呢？", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf6Sentence("You can get there by bus.", "你可以搭公車去。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf6Sentence("Can we get to the bookstore on foot?", "我們可以走路去書店嗎？", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf6Sentence("Yes, we can.", "是的，我們可以。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf6Sentence("No, we can’t.", "不，我們不可以。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf6Sentence("We can get there by car.", "我們可以搭車去。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" })
            ]
          }
        },
        storyTime: [
          sf6StoryLine(1, "Excuse me. I’m going to the library.", "不好意思。我要去圖書館。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(2, "You can get there by bus.", "你可以搭公車去。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(3, "Look! The bus is coming.", "快看! 公車正在進站。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(4, "Are you going to the library?", "你要去圖書館嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(5, "We can take you there.", "我們可以帶你去那裡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(6, "Thanks.", "謝謝。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(7, "My name is Joe.", "我的名字是Joe。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(8, "I’m from the UK.", "我來自英國。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(9, "I’m Alan, and this is Wendy.", "我是Alan，這位是Wendy。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(10, "Where’s the library?", "圖書館在哪裡呢？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(11, "It’s in the park.", "它在公園裡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(12, "We can go there on foot.", "我們可以走路去。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(13, "Is this a swimming pool?", "這是一座游泳池嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(14, "No, it isn’t. It’s a hot spring.", "不，它不是。它是溫泉。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(15, "They really enjoy it.", "他們很享受溫泉。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(16, "Can we get to the library by bike?", "我們可以騎腳踏車去圖書館嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(17, "Yes, we can.", "是的，我們可以。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(18, "Where is the library?", "圖書館在哪裡呢？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(19, "It’s on Lixing Road.", "它在力行路上。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(20, "Where are you going?", "你要去哪裡？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(21, "I’m going to the tea shop.", "我要去飲料店。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(22, "I love bubble milk tea.", "我愛珍珠奶茶。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(23, "Here we are.", "我們到了。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(24, "Wow! The library is beautiful.", "哇！這座圖書館真美。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(25, "This is Joe from the UK.", "這位是來自英國的Joe。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(26, "Welcome, Joe! Come and join us!", "歡迎你，Joe！快來加入我們吧！", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(27, "You can see the red buses in London.", "在倫敦可以看到紅色的公車。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf6StoryLine(28, "Joe is a great helper.", "Joe是位好幫手。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" })
        ]
      }
    },
    festival: {
      earthDay: {
        title: "Earth Day",
        chineseTitle: "地球日",
        words: [
          sf6Word("plastic bag", "塑膠袋", { sourceUnit: "Festival - Earth Day Words", category: "recognition", similarWords: ["shopping bag", "lunch bag", "bag"] }),
          sf6Word("shopping bag", "購物袋", { sourceUnit: "Festival - Earth Day Words", category: "recognition", similarWords: ["plastic bag", "lunch bag", "schoolbag"] }),
          sf6Word("water bottle", "水壺", { sourceUnit: "Festival - Earth Day Words", category: "recognition", similarWords: ["water", "bottle", "reusable cup"] }),
          sf6Word("reusable fork and spoon", "環保叉子和湯匙", { sourceUnit: "Festival - Earth Day Words", category: "recognition", similarWords: ["reusable straw", "fork", "spoon"] }),
          sf6Word("reusable cup and box", "環保杯和餐盒", { sourceUnit: "Festival - Earth Day Words", category: "recognition", similarWords: ["reusable straw", "cup", "lunch box"] }),
          sf6Word("reusable straw", "環保吸管", { sourceUnit: "Festival - Earth Day Words", category: "recognition", similarWords: ["reusable cup and box", "straw", "draw"] })
        ],
        sentences: [
          sf6Sentence("Let’s sort the garbage.", "我們來分類垃圾吧。", { sourceUnit: "Festival - Earth Day Sentences", category: "recognition" }),
          sf6Sentence("We should use less plastics bags.", "我們應該減少使用塑膠袋。", { sourceUnit: "Festival - Earth Day Sentences", category: "recognition" })
        ],
        storyTime: [
          sf6StoryLine(1, "Sorry, I’m late.", "抱歉，我遲到了。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(2, "What’s in your plastic bag, Mike?", "你的塑膠袋裡有什麼東西呢，Mike？", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(3, "A bottle of water and lots of food.", "一瓶水和很多的食物。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(4, "Oh no! You make too much trash.", "喔，不！你製造太多垃圾了。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(5, "Look at us.", "看看我們。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(6, "That’s terrible.", "那真是糟糕。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(7, "Are you cleaning up the mountain?", "你們在淨山嗎？", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(8, "Yes. Today is Earth Day.", "是的。今天是世界地球日。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(9, "We can help.", "我們可以幫忙。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(10, "Let’s sort the garbage.", "讓我們來分類垃圾吧。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(11, "We should use fewer plastic bags.", "我們應該減少使用塑膠袋。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(12, "You’re right.", "你說得對。", { prefix: "festival", storyId: "earth_day_story" }),
          sf6StoryLine(13, "I will bring my own bag next time.", "下次我會自備袋子。", { prefix: "festival", storyId: "earth_day_story" })
        ]
      }
    }
  }
};

const sf6PracticeSets = {
  vocabularyUnits: {
    "Get Ready - Phonics 1": sf6StructuredData.curriculum.preUnits.phonics.phonics1,
    "Get Ready - Phonics 2": sf6StructuredData.curriculum.preUnits.phonics.phonics2,
    "Get Ready - Phonics 3": sf6StructuredData.curriculum.preUnits.phonics.phonics3,
    "Get Ready - Phonics 4": sf6StructuredData.curriculum.preUnits.phonics.phonics4,
    "Get Ready - Phonics 5": sf6StructuredData.curriculum.preUnits.phonics.phonics5,
    "Topic 1 - Lesson 1 Words": sf6StructuredData.curriculum.topics.topic1.lessons.lesson1.words,
    "Topic 1 - Lesson 2 Words": sf6StructuredData.curriculum.topics.topic1.lessons.lesson2.words,
    "Topic 2 - Lesson 3 Words": sf6StructuredData.curriculum.topics.topic2.lessons.lesson3.words,
    "Topic 2 - Lesson 4 Words": sf6StructuredData.curriculum.topics.topic2.lessons.lesson4.words,
    "Festival - Earth Day Words": sf6StructuredData.curriculum.festival.earthDay.words
  },
  sentenceUnits: {
    "Topic 1 - Lesson 1 Sentences": sf6StructuredData.curriculum.topics.topic1.lessons.lesson1.sentences,
    "Topic 1 - Lesson 2 Sentences": sf6StructuredData.curriculum.topics.topic1.lessons.lesson2.sentences,
    "Topic 2 - Lesson 3 Sentences": sf6StructuredData.curriculum.topics.topic2.lessons.lesson3.sentences,
    "Topic 2 - Lesson 4 Sentences": sf6StructuredData.curriculum.topics.topic2.lessons.lesson4.sentences,
    "Festival - Earth Day Sentences": sf6StructuredData.curriculum.festival.earthDay.sentences
  },
  dailyTalkUnits: {},
  storyUnits: {
    "Topic 1 - Story Time": sf6StructuredData.curriculum.topics.topic1.storyTime,
    "Topic 2 - Story Time": sf6StructuredData.curriculum.topics.topic2.storyTime,
    "Festival - Earth Day Story Time": sf6StructuredData.curriculum.festival.earthDay.storyTime
  }
};

const rawUnitsSF6StructuredBase = sf6PracticeSets.vocabularyUnits;
const sentenceUnitsSF6 = sf6PracticeSets.sentenceUnits;
const dailyTalkUnitsSF6 = sf6PracticeSets.dailyTalkUnits;
const storyUnitsSF6 = sf6PracticeSets.storyUnits;
