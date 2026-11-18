// data/sf8-structured-data.js
function sf8Slug(text) {
  return String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function sf8Word(word, meaning, options = {}) {
  const slug = options.slug || sf8Slug(word);
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
function sf8Sentence(sentence, meaning, options = {}) {
  const slug = options.slug || sf8Slug(sentence);
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
function sf8StoryLine(no, sentence, meaning, options = {}) {
  const prefix = options.prefix || "t1";
  const sentSlug = sf8Slug(sentence);
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

const sf8StructuredData = {
  bookId: "sf8",
  title: "Super Fun 8",
  grade: "六年級",
  semester: "下學期",
  curriculum: {
    preUnits: {
      phonics: {
        phonics1: [
          sf8Word("black", "黑色", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["blue", "back", "block"] }),
          sf8Word("clean", "乾淨的", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["green", "clock", "clear"] }),
          sf8Word("blow", "吹", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["blue", "snow", "slow"] }),
          sf8Word("clock", "時鐘", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["block", "clean", "lock"] }),
          sf8Word("plane", "飛機", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["plate", "plan", "plant"] }),
          sf8Word("glass", "玻璃杯；玻璃", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["grass", "class", "glasses"] }),
          sf8Word("plug", "插頭", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["plus", "bug", "mug"] }),
          sf8Word("glue", "膠水", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["blue", "clue", "true"] })
        ],
        phonics2: [
          sf8Word("French fries", "薯條", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["fresh", "frog", "fruit"] }),
          sf8Word("dress", "洋裝", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["grass", "press", "desk"] }),
          sf8Word("frog", "青蛙", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["dog", "fog", "from"] }),
          sf8Word("driver", "司機", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["river", "drive", "dress"] }),
          sf8Word("grapes", "葡萄", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["grass", "great", "grade"] }),
          sf8Word("trash", "垃圾", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["truck", "train", "wash"] }),
          sf8Word("grass", "草", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["glass", "class", "grapes"] }),
          sf8Word("truck", "卡車", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["trash", "train", "duck"] })
        ],
        phonics3: [
          sf8Word("skate", "輪冰", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["skirt", "snake", "state"] }),
          sf8Word("spoon", "湯匙", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["moon", "soon", "noon"] }),
          sf8Word("skirt", "裙子", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["shirt", "skate", "hurt"] }),
          sf8Word("star", "星星", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["car", "jar", "far"] }),
          sf8Word("spider", "蜘蛛", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["sticker", "tiger", "slider"] }),
          sf8Word("sticker", "貼紙", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["spider", "sister", "ticket"] })
        ],
        phonics4: [
          sf8Word("knee", "膝蓋", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["knife", "tree", "key"] }),
          sf8Word("wrench", "扳手", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["wreath", "bench", "French"] }),
          sf8Word("knife", "刀子", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["knee", "life", "wife"] }),
          sf8Word("comb", "梳子", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["home", "come", "thumb"] }),
          sf8Word("wreath", "花圈", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["wrench", "breath", "teeth"] }),
          sf8Word("thumb", "拇指", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["comb", "dumb", "numb"] })
        ],
        phonics5: [
          sf8Word("long", "長的", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["song", "strong", "wrong"] }),
          sf8Word("bank", "銀行", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["sink", "pink", "thank"] }),
          sf8Word("ring", "戒指", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["sing", "king", "swing"] }),
          sf8Word("pink", "粉紅色", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["sink", "bank", "ink"] }),
          sf8Word("swing", "鞦韆", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["sing", "ring", "wing"] }),
          sf8Word("sink", "水槽", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["pink", "bank", "drink"] })
        ]
      }
    },
    topics: {
      topic1: {
        title: "Wonderful Moment",
        chineseTitle: "美好時刻",
        lessons: {
          lesson1: {
            title: "Lesson 1",
            words: [
              sf8Word("last Sunday", "上個星期日", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["Sunday", "last week", "yesterday"] }),
              sf8Word("an hour ago", "一個小時前", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["ten minutes ago", "hour", "ago"] }),
              sf8Word("yesterday", "昨天", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["today", "tomorrow", "Sunday"] }),
              sf8Word("ten minutes ago", "十分鐘前", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["an hour ago", "minutes", "this morning"] }),
              sf8Word("this morning", "今天早上", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["good morning", "morning", "yesterday"] })
            ],
            sentences: [
              sf8Sentence("Where were you yesterday?", "你昨天在哪裡？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf8Sentence("I was at the park yesterday.", "我昨天在公園。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf8Sentence("Were you at the zoo an hour ago?", "你一個小時前在動物園嗎？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf8Sentence("Yes, I was.", "是的，我是。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf8Sentence("No, I wasn’t.", "不，我不是。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf8Sentence("I was at the zoo this morning.", "我今天早上在動物園。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" })
            ]
          },
          lesson2: {
            title: "Lesson 2",
            words: [
              sf8Word("at home", "在家", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["at school", "home", "house"] }),
              sf8Word("at the museum", "在博物館", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["museum", "at the park", "at school"] }),
              sf8Word("at school", "在學校", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["at home", "school", "at the zoo"] }),
              sf8Word("at the restaurant", "在餐廳", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["restaurant", "at the museum", "at the store"] }),
              sf8Word("at the amusement park", "在遊樂園", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["at the park", "amusement park", "at the zoo"] }),
              sf8Word("at the department store", "在百貨公司", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["bookstore", "department store", "supermarket"] })
            ],
            sentences: [
              sf8Sentence("Where was he last Sunday?", "他上個星期日在哪裡？", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf8Sentence("He was at the restaurant last Sunday.", "他上個星期日在餐廳。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf8Sentence("Was she at the museum yesterday?", "她昨天在博物館嗎？", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf8Sentence("Yes, she was.", "是的，她是。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf8Sentence("No, she wasn’t.", "不，她不是。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf8Sentence("She was at home yesterday.", "她昨天在家。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" })
            ]
          }
        },
        storyTime: [
          sf8StoryLine(1, "Look! That's Mike.", "快看！那是Mike。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(2, "The T-Rex has sixty teeth and short arms.", "暴龍有六十顆牙齒和短手臂。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(3, "Hi, Mike.", "嗨，Mike。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(4, "You look good without glasses.", "你沒戴眼鏡看起來很好呀。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(5, "Where are my glasses?", "我的眼鏡在哪裡呢？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(6, "Let's recall your schedule for today.", "讓我們來回想你今天的行程。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(7, "I was at the Science Lab this morning.", "我今天早上在科學實驗室。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(8, "What are you doing, Tess?", "妳在做什麼，Tess？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(9, "I'm making a robot.", "我在製作機器人。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(10, "This is so cool.", "這真的好酷。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(11, "You should wear glasses like me.", "你應該要跟我一樣戴眼鏡。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(12, "Where were you next?", "接下來你在哪裡呢？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(13, "I was at the restaurant.", "我當時在餐廳。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(14, "Ken was there, too.", "Ken也在那裡。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(15, "Why can you see clearly when eating hot food?", "為什麼你在吃熱食時能看得清楚呢？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(16, "I wash my glasses with some soap.", "我用一些肥皂洗我的眼鏡。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(17, "Was Ken with you after lunch?", "吃完午餐後Ken還是跟你一起嗎？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(18, "No, he wasn't.", "不，他不是。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(19, "But I was there after lunch.", "但我吃完午餐後是在那裡。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(20, "I think they’re your glasses.", "我想這是你的眼鏡。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(21, "Were you here two hours ago?", "你兩小時前是在這裡嗎？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(22, "Yes, I was. Thank you very much.", "是的，我是。非常感謝妳。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(23, "It's dark here.", "這裡好暗。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(24, "I need to take off my glasses.", "我需要將我的眼鏡拿下來。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(25, "Wow! It's beautiful!", "哇！這真美！", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(26, "But I can't see anything.", "但我看不見任何東西。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(27, "Thanks for your help.", "謝謝你們的幫忙。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf8StoryLine(28, "Wait! Where's my bike?", "等等！我的自行車在哪裡？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" })
        ]
      },
      topic2: {
        title: "My Dream",
        chineseTitle: "我的夢想",
        lessons: {
          lesson3: {
            title: "Lesson 3",
            words: [
              sf8Word("firefighter", "消防員", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["fighter", "police officer", "driver"] }),
              sf8Word("singer", "歌手", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["player", "finger", "sing"] }),
              sf8Word("police officer", "警察", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["post office", "officer", "firefighter"] }),
              sf8Word("YouTuber", "影片創作者", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["singer", "reporter", "teacher"] }),
              sf8Word("baseball player", "棒球選手", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["player", "basketball", "baseball"] }),
              sf8Word("engineer", "工程師", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["scientist", "reporter", "singer"] }),
              sf8Word("reporter", "記者", { category: "recognition", sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["singer", "driver", "engineer"] }),
              sf8Word("be", "成為；是", { category: "recognition", sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["bee", "we", "he"] }),
              sf8Word("scientist", "科學家", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["science", "engineer", "artist"] })
            ],
            sentences: [
              sf8Sentence("What do you want to be?", "你想成為什麼？", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf8Sentence("I want to be a baseball player.", "我想成為一名棒球選手。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf8Sentence("Does she want to be a singer?", "她想成為一名歌手嗎？", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf8Sentence("Yes, she does.", "是的，她想。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf8Sentence("No, she doesn’t.", "不，她不想。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf8Sentence("She wants to be a scientist.", "她想成為一名科學家。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" })
            ]
          },
          lesson4: {
            title: "Lesson 4",
            words: [
              sf8Word("phone", "電話", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["home", "bone", "cone"] }),
              sf8Word("watch", "手錶", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["wash", "match", "catch"] }),
              sf8Word("jacket", "外套", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["pocket", "racket", "sachet"] }),
              sf8Word("key", "鑰匙", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["knee", "tea", "bee"] }),
              sf8Word("lunch bag", "午餐袋", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["shopping bag", "plastic bag", "bag"] }),
              sf8Word("glasses", "眼鏡", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["glass", "grass", "classes"] }),
              sf8Word("umbrella", "雨傘", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["camera", "banana", "under"] }),
              sf8Word("shoes", "鞋子（複數）", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["shorts", "socks", "whose"] }),
              sf8Word("whose", "誰的", { category: "recognition", sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["who", "those", "shoes"] })
            ],
            sentences: [
              sf8Sentence("Whose watch is this?", "這是誰的手錶？", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf8Sentence("It’s my watch.", "它是我的手錶。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf8Sentence("It’s Alan’s watch.", "它是 Alan 的手錶。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf8Sentence("Whose shoes are these?", "這些是誰的鞋子？", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf8Sentence("They’re my shoes.", "它們是我的鞋子。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" })
            ]
          }
        },
        storyTime: [
          sf8StoryLine(1, "Ken is good at playing baseball.", "Ken擅長打棒球。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(2, "He can be a great player.", "他可以當一名厲害的球員。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(3, "You're right.", "你是對的。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(4, "He wants to be a baseball player.", "他想成為一個棒球選手。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(5, "What do you want to be, Alan?", "你想從事什麼職業呢，Alan？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(6, "I want to be a YouTuber.", "我想成為一個YouTuber。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(7, "You can come to my town and shoot a video.", "你可以到我住的鎮上拍攝一部影片。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(8, "Good idea.", "好主意。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(9, "Welcome!", "歡迎！", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(10, "Are you ready to be the little warriors?", "你們準備好要成為小勇士了嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(11, "Whose shoes are these?", "這些鞋子是誰的呢？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(12, "They're Mike's shoes.", "它們是Mike的鞋子。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(13, "Look! There's a fish.", "快看！有一條魚。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(14, "This dress is beautiful.", "這件洋裝很美麗。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(15, "Whose dress is this?", "這是誰的洋裝呢？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(16, "It's my dress.", "這是我的洋裝。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(17, "You can try on other clothes.", "妳可以試試其他服裝。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(18, "Are we going to make bamboo rice for lunch?", "我們要做竹筒飯當午餐嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(19, "Yes, but we need to cut the bamboo first.", "是的，但我們要先砍竹子。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(20, "Good job, Wendy!", "做得好，Wendy！", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(21, "Emma, you sing so well.", "Emma, 妳歌唱得很好。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(22, "Do you want to be a singer?", "妳想當一個歌手嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(23, "Yes, I do.", "是的，我想。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(24, "Do you like my video?", "你們喜歡我的影片嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(25, "Yes! It's super fun.", "當然！它真的超級有趣的。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf8StoryLine(26, "You're really a YouTuber now.", "你現在真的是一位YouTuber了呢。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" })
        ]
      }
    },
    festival: {
      worldBicycleDay: {
        title: "World Bicycle Day",
        chineseTitle: "世界自行車日",
        words: [
          sf8Word("have fun", "玩得愉快", { sourceUnit: "Festival - World Bicycle Day Words", category: "recognition", similarWords: ["fun", "have", "funny"] }),
          sf8Word("stay healthy", "維持健康", { sourceUnit: "Festival - World Bicycle Day Words", category: "recognition", similarWords: ["healthy", "stay", "happy"] }),
          sf8Word("keep the air clean", "保持空氣清淨", { sourceUnit: "Festival - World Bicycle Day Words", category: "recognition", similarWords: ["clean", "air", "keep"] }),
          sf8Word("save money", "節省金錢", { sourceUnit: "Festival - World Bicycle Day Words", category: "recognition", similarWords: ["money", "save", "monkey"] })
        ],
        sentences: [
          sf8Sentence("We’re here for World Bicycle Day.", "我們為了世界自行車日來到這裡。", { sourceUnit: "Festival - World Bicycle Day Sentences", category: "recognition" })
        ],
        storyTime: [
          sf8StoryLine(1, "Hi, Emma! What are you doing here?", "嗨，Emma！你們正在這裡做什麼呢？", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(2, "We're here for World Bicycle Day.", "我們是為了世界自行車日而來的。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(3, "Cool! Let's ride bikes together.", "酷！讓我們一起騎自行車吧。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(4, "The air is clean here.", "這裡的空氣真清淨。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(5, "Being a farmer isn't easy.", "當農夫真不容易。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(6, "It takes about six months to grow into rice.", "稻米生長大約需要六個月。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(7, "Yeah! Time for lunch.", "耶！午餐時間到了。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(8, "The rice and vegetables are all from the farm.", "稻米和蔬菜都是由農場直送。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(9, "Mike, do you like today's bike trip?", "Mike，你喜歡今天的自行車之旅嗎？", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(10, "Yes! I like to ride a bike with all of you.", "是的！我喜歡和你們一起騎自行車。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(11, "Traveling by bike is fun.", "乘自行車旅行真有趣。", { prefix: "festival", storyId: "world_bicycle_day_story" }),
          sf8StoryLine(12, "Are you ready to join us?", "你準備好要加入我們了嗎？", { prefix: "festival", storyId: "world_bicycle_day_story" })
        ]
      }
    }
  }
};

const sf8PracticeSets = {
  vocabularyUnits: {
    "Get Ready - Phonics 1": sf8StructuredData.curriculum.preUnits.phonics.phonics1,
    "Get Ready - Phonics 2": sf8StructuredData.curriculum.preUnits.phonics.phonics2,
    "Get Ready - Phonics 3": sf8StructuredData.curriculum.preUnits.phonics.phonics3,
    "Get Ready - Phonics 4": sf8StructuredData.curriculum.preUnits.phonics.phonics4,
    "Get Ready - Phonics 5": sf8StructuredData.curriculum.preUnits.phonics.phonics5,
    "Topic 1 - Lesson 1 Words": sf8StructuredData.curriculum.topics.topic1.lessons.lesson1.words,
    "Topic 1 - Lesson 2 Words": sf8StructuredData.curriculum.topics.topic1.lessons.lesson2.words,
    "Topic 2 - Lesson 3 Words": sf8StructuredData.curriculum.topics.topic2.lessons.lesson3.words,
    "Topic 2 - Lesson 4 Words": sf8StructuredData.curriculum.topics.topic2.lessons.lesson4.words,
    "Festival - World Bicycle Day Words": sf8StructuredData.curriculum.festival.worldBicycleDay.words
  },
  sentenceUnits: {
    "Topic 1 - Lesson 1 Sentences": sf8StructuredData.curriculum.topics.topic1.lessons.lesson1.sentences,
    "Topic 1 - Lesson 2 Sentences": sf8StructuredData.curriculum.topics.topic1.lessons.lesson2.sentences,
    "Topic 2 - Lesson 3 Sentences": sf8StructuredData.curriculum.topics.topic2.lessons.lesson3.sentences,
    "Topic 2 - Lesson 4 Sentences": sf8StructuredData.curriculum.topics.topic2.lessons.lesson4.sentences,
    "Festival - World Bicycle Day Sentences": sf8StructuredData.curriculum.festival.worldBicycleDay.sentences
  },
  dailyTalkUnits: {},
  storyUnits: {
    "Topic 1 - Story Time": sf8StructuredData.curriculum.topics.topic1.storyTime,
    "Topic 2 - Story Time": sf8StructuredData.curriculum.topics.topic2.storyTime,
    "Festival - World Bicycle Day Story Time": sf8StructuredData.curriculum.festival.worldBicycleDay.storyTime
  }
};

const rawUnitsSF8StructuredBase = sf8PracticeSets.vocabularyUnits;
const sentenceUnitsSF8 = sf8PracticeSets.sentenceUnits;
const dailyTalkUnitsSF8 = sf8PracticeSets.dailyTalkUnits;
const storyUnitsSF8 = sf8PracticeSets.storyUnits;
