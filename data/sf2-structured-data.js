// data/sf2-structured-data.js
function sf2Slug(text) {
  return String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function sf2Word(word, meaning, options = {}) {
  const slug = options.slug || sf2Slug(word);
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
function sf2Sentence(sentence, meaning, options = {}) {
  const slug = options.slug || sf2Slug(sentence);
  return {
    kind: "sentence",
    word: sentence,
    sentence,
    meaning,
    category: options.category || "sentence",
    sourceUnit: options.sourceUnit || "",
    topicId: options.topicId || "",
    lessonId: options.lessonId || "",
    image: options.image || (options.withImage ? `${slug}.png` : ""),
    audio: options.audio || `${slug}.mp3`,
    similarWords: options.similarWords || []
  };
}
function sf2StoryLine(no, sentence, meaning, options = {}) {
  const prefix = options.prefix || (options.storyId === "topic2_story" ? "t2" : (options.storyId === "mothers_day_story" ? "festival" : "t1"));
  const sentSlug = sf2Slug(sentence);
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

const sf2StructuredData = {
  bookId: "sf2",
  title: "Super Fun 2",
  grade: "三年級",
  semester: "下學期",
  curriculum: {
    preUnits: {
      classroomEnglish: [
        sf2Sentence("Look.", "你看。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Listen.", "你聽。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Come here, please.", "請過來這裡。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Go back to your seat.", "回到你的位子。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Take out your book.", "把你的書拿出來。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Put away your book.", "把你的書收起來。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Repeat after me.", "跟著我唸。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf2Sentence("Louder, please.", "請大聲一點。", { sourceUnit: "Classroom English", category: "recognition", withImage: true })
      ],
      numbers: [
        sf2Word("eleven", "十一", { category: "recognition", sourceUnit: "Numbers", similarWords: ["seven", "even", "twelve"] }),
        sf2Word("twelve", "十二", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty", "two", "tell"] }),
        sf2Word("thirteen", "十三", { category: "recognition", sourceUnit: "Numbers", similarWords: ["three", "thirty", "thirsty"] }),
        sf2Word("fourteen", "十四", { category: "recognition", sourceUnit: "Numbers", similarWords: ["four", "forty", "fifteen"] }),
        sf2Word("fifteen", "十五", { category: "recognition", sourceUnit: "Numbers", similarWords: ["five", "fifty", "fourteen"] })
      ],
      phonics: {
        phonics1: [
          sf2Word("map", "地圖", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["mop", "cap", "tap"] }),
          sf2Word("mop", "拖把", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["map", "hop", "top"] }),
          sf2Word("cap", "帽子", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["map", "tap", "cup"] }),
          sf2Word("tap", "水龍頭", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["cap", "top", "map"] }),
          sf2Word("hop", "單腳跳", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["mop", "top", "hot"] }),
          sf2Word("top", "頂端", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["hop", "mop", "tap"] })
        ],
        phonics2: [
          sf2Word("bag", "袋子", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["bug", "rag", "tag"] }),
          sf2Word("bug", "小昆蟲", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["bag", "mug", "hug"] }),
          sf2Word("rag", "抹布", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["bag", "tag", "rug"] }),
          sf2Word("tag", "標籤", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["bag", "rag", "tug"] }),
          sf2Word("mug", "馬克杯", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["bug", "hug", "map"] }),
          sf2Word("hug", "擁抱", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["bug", "mug", "hat"] })
        ],
        phonics3: [
          sf2Word("pet", "寵物", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pit", "jet", "net"] }),
          sf2Word("pit", "坑洞", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pet", "sit", "hit"] }),
          sf2Word("jet", "噴射機", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pet", "net", "wet"] }),
          sf2Word("net", "網子", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pet", "jet", "nut"] }),
          sf2Word("sit", "坐下", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pit", "hit", "six"] }),
          sf2Word("hit", "打擊", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["pit", "sit", "hat"] })
        ],
        phonics4: [
          sf2Word("fix", "修理", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["fox", "six", "mix"] }),
          sf2Word("fox", "狐狸", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["fix", "ox", "box"] }),
          sf2Word("six", "六", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["fix", "mix", "sit"] }),
          sf2Word("mix", "混合", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["fix", "six", "max"] }),
          sf2Word("ox", "公牛", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["fox", "box", "on"] }),
          sf2Word("box", "箱子", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["fox", "ox", "boy"] })
        ]
      }
    },
    topics: {
      topic1: {
        title: "Fun Things",
        chineseTitle: "有趣的事物",
        lessons: {
          lesson1: {
            title: "Lesson 1",
            words: [
              sf2Word("eraser", "橡皮擦", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["ruler", "paper", "marker"] }),
              sf2Word("ruler", "尺", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["eraser", "marker", "runner"] }),
              sf2Word("pen", "原子筆；鋼筆", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["pencil", "pet", "ten"] }),
              sf2Word("marker", "彩色筆", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["ruler", "eraser", "maker"] }),
              sf2Word("pencil", "鉛筆", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["pen", "paper", "purple"] }),
              sf2Word("this", "這個", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["that", "his", "is"] }),
              sf2Word("that", "那個", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["this", "hat", "cat"] }),
              sf2Word("it", "它", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["is", "in", "at"] }),
              sf2Word("a/an", "一個", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["and", "at", "in"] })
            ],
            sentences: [
              sf2Sentence("What’s this?", "這是什麼？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf2Sentence("It’s a pen.", "它是一枝原子筆。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf2Sentence("What’s that?", "那是什麼？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf2Sentence("It’s an eraser.", "它是一塊橡皮擦。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" })
            ]
          },
          lesson2: {
            title: "Lesson 2",
            words: [
              sf2Word("red", "紅色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["read", "bed", "head"] }),
              sf2Word("yellow", "黃色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["hello", "pillow", "follow"] }),
              sf2Word("blue", "藍色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["glue", "blow", "black"] }),
              sf2Word("green", "綠色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["great", "clean", "queen"] }),
              sf2Word("orange", "橘色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["purple", "crayon", "apple"] }),
              sf2Word("purple", "紫色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["people", "pencil", "paper"] }),
              sf2Word("color", "顏色", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["cooler", "collar", "dollar"] })
            ],
            sentences: [
              sf2Sentence("What color is it?", "它是什麼顏色？", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf2Sentence("It’s red.", "它是紅色的。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" })
            ]
          }
        },
        dailyTalk: [
          sf2Sentence("I have an idea.", "我有個主意。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true }),
          sf2Sentence("Good idea.", "好主意。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true }),
          sf2Sentence("Here you are.", "這個給你。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true }),
          sf2Sentence("Thank you.", "謝謝你。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true })
        ],
        storyTime: [
          sf2StoryLine(1, "What’s this?", "這是什麼？", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(2, "It’s a pen. Oh, no! My bag!", "它是一枝原子筆。噢，不！我的袋子！", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(3, "It’s raining. We can’t go out. What can we do?", "下雨了。我們不能出去。我們可以做什麼呢？", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(4, "I have an idea. We can make a rainbow.", "我有個主意。我們可以製作一道彩虹。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(5, "Good idea!", "好主意！", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(6, "We need red, yellow, and blue.", "我們需要紅色、黃色和藍色。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(7, "Put the paper into the cups.", "將紙放進杯子裡。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(8, "Guess! What color is it?", "猜猜看！它是什麼顏色？", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(9, "It’s orange.", "它是橘色的。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(10, "Cool!", "好酷！", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(11, "What’s that?", "那是什麼？", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(12, "It’s a marker.", "它是一枝彩色筆。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(13, "What color is it?", "它是什麼顏色？", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(14, "It’s green.", "它是綠色的。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(15, "What’s this, Emma?", "這是什麼，Emma？", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(16, "It’s an eraser.", "它是一塊橡皮擦。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(17, "Here you are, Mike.", "這個給你，Mike。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(18, "Thank you.", "謝謝你。", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(19, "Hey, look!", "嘿，你看！", { storyId: "topic1_story", topicId: "topic1" }),
          sf2StoryLine(20, "Wow! It’s a rainbow.", "哇！是彩虹啊。", { storyId: "topic1_story", topicId: "topic1" })
        ]
      },
      topic2: {
        title: "Show Time",
        chineseTitle: "表演時間",
        lessons: {
          lesson3: {
            title: "Lesson 3",
            words: [
              sf2Word("bear", "熊", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["pear", "dear", "ear"] }),
              sf2Word("monkey", "猴子", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["money", "donkey", "honey"] }),
              sf2Word("tiger", "老虎", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["timer", "tired", "lion"] }),
              sf2Word("lion", "獅子", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["line", "iron", "tiger"] }),
              sf2Word("horse", "馬", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["house", "mouse", "nose"] }),
              sf2Word("goat", "山羊", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["boat", "coat", "goal"] })
            ],
            sentences: [
              sf2Sentence("Is it a bear?", "牠是一隻熊嗎？", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf2Sentence("Yes, it is.", "是的，牠是。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf2Sentence("No, it isn’t.", "不，牠不是。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf2Sentence("It’s a monkey.", "牠是一隻猴子。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" })
            ]
          },
          lesson4: {
            title: "Lesson 4",
            words: [
              sf2Word("sing", "唱歌", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["ring", "king", "wing"] }),
              sf2Word("dance", "跳舞", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["chance", "fence", "lance"] }),
              sf2Word("read", "閱讀", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["red", "lead", "head"] }),
              sf2Word("write", "寫字", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["white", "right", "ride"] }),
              sf2Word("draw", "畫畫", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["door", "drop", "claw"] }),
              sf2Word("can", "能夠", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["can’t", "cat", "man"] }),
              sf2Word("can’t", "不能", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["can", "cat", "ant"] })
            ],
            sentences: [
              sf2Sentence("Can you sing?", "你會唱歌嗎？", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf2Sentence("Yes, I can.", "是的，我會。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf2Sentence("No, I can’t.", "不，我不會。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" })
            ]
          }
        },
        dailyTalk: [
          sf2Sentence("Goodbye.", "再見。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "application", withImage: true }),
          sf2Sentence("See you.", "再見。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "application", withImage: true }),
          sf2Sentence("I’m sorry.", "我很抱歉。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "application", withImage: true }),
          sf2Sentence("That’s OK.", "沒關係。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "application", withImage: true })
        ],
        storyTime: [
          sf2StoryLine(1, "What can we do for them?", "我們能為他們做什麼？", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(2, "How about a show?", "一場表演如何？", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(3, "Good idea.", "好主意。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(4, "I can draw.", "我會畫畫。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(5, "I can sing, and I have a pet. It can sing, too.", "我會唱歌，而且我有一隻寵物。牠也會唱歌。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(6, "Can you dance, Ken?", "你會跳舞嗎，Ken？", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(7, "No, I can’t.", "不，我不會。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(8, "Hi, Emma. Can you dance?", "嗨，Emma。妳會跳舞嗎？", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(9, "Yes, I can.", "是的，我會。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(10, "Great.", "好極了。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(11, "Is it a lion?", "牠是一隻獅子嗎？", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(12, "Yes, it is.", "是的，牠是。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(13, "Is it a monkey?", "牠是一隻猴子嗎？", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(14, "No, it isn’t. That’s me.", "不，牠不是。那是我。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(15, "Time to go home.", "回家的時間到了。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(16, "Goodbye.", "再見。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(17, "See you, Mike.", "再見，Mike。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(18, "I’m sorry, Mike. I can’t dance today.", "我很抱歉，Mike。我今天不能跳舞了。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(19, "That’s OK.", "沒關係。", { storyId: "topic2_story", topicId: "topic2" }),
          sf2StoryLine(20, "Look! I’m a lion. I can dance.", "你看！我是一隻獅子。我會跳舞。", { storyId: "topic2_story", topicId: "topic2" })
        ]
      }
    },
    festival: {
      mothersDay: {
        title: "Mother’s Day",
        chineseTitle: "母親節",
        words: [
          sf2Word("mom/mommy/mother", "媽媽", { sourceUnit: "Festival - Mother’s Day Words", category: "recognition", similarWords: ["mop", "man", "mouse"] }),
          sf2Word("card", "卡片", { sourceUnit: "Festival - Mother’s Day Words", category: "recognition", similarWords: ["car", "cat", "cart"] }),
          sf2Word("flower", "花", { sourceUnit: "Festival - Mother’s Day Words", category: "recognition", similarWords: ["floor", "fly", "four"] }),
          sf2Word("cake", "蛋糕", { sourceUnit: "Festival - Mother’s Day Words", category: "recognition", similarWords: ["make", "lake", "take"] })
        ],
        sentences: [
          sf2Sentence("Happy Mother’s Day.", "母親節快樂。", { sourceUnit: "Festival - Mother’s Day Sentences", category: "recognition" })
        ],
        storyTime: [
          sf2StoryLine(1, "What can I do on Mother’s Day?", "我能在母親節做什麼？", { storyId: "mothers_day_story" }),
          sf2StoryLine(2, "Don’t worry. We can help.", "別擔心，我們可以幫忙。", { storyId: "mothers_day_story" }),
          sf2StoryLine(3, "Let’s make a card.", "我們來做一張卡片。", { storyId: "mothers_day_story" }),
          sf2StoryLine(4, "Here is the cake.", "這是蛋糕。", { storyId: "mothers_day_story" }),
          sf2StoryLine(5, "Mom, I love you. Happy Mother’s Day.", "媽媽，我愛妳。母親節快樂。", { storyId: "mothers_day_story" })
        ]
      }
    }
  }
};

const sf2PracticeSets = {
  vocabularyUnits: {
    "Numbers": sf2StructuredData.curriculum.preUnits.numbers,
    "Get Ready - Phonics 1": sf2StructuredData.curriculum.preUnits.phonics.phonics1,
    "Get Ready - Phonics 2": sf2StructuredData.curriculum.preUnits.phonics.phonics2,
    "Get Ready - Phonics 3": sf2StructuredData.curriculum.preUnits.phonics.phonics3,
    "Get Ready - Phonics 4": sf2StructuredData.curriculum.preUnits.phonics.phonics4,
    "Topic 1 - Lesson 1 Words": sf2StructuredData.curriculum.topics.topic1.lessons.lesson1.words,
    "Topic 1 - Lesson 2 Words": sf2StructuredData.curriculum.topics.topic1.lessons.lesson2.words,
    "Topic 2 - Lesson 3 Words": sf2StructuredData.curriculum.topics.topic2.lessons.lesson3.words,
    "Topic 2 - Lesson 4 Words": sf2StructuredData.curriculum.topics.topic2.lessons.lesson4.words,
    "Festival - Mother’s Day Words": sf2StructuredData.curriculum.festival.mothersDay.words
  },
  sentenceUnits: {
    "Classroom English": sf2StructuredData.curriculum.preUnits.classroomEnglish,
    "Topic 1 - Lesson 1 Sentences": sf2StructuredData.curriculum.topics.topic1.lessons.lesson1.sentences,
    "Topic 1 - Lesson 2 Sentences": sf2StructuredData.curriculum.topics.topic1.lessons.lesson2.sentences,
    "Topic 2 - Lesson 3 Sentences": sf2StructuredData.curriculum.topics.topic2.lessons.lesson3.sentences,
    "Topic 2 - Lesson 4 Sentences": sf2StructuredData.curriculum.topics.topic2.lessons.lesson4.sentences,
    "Festival - Mother’s Day Sentences": sf2StructuredData.curriculum.festival.mothersDay.sentences
  },
  dailyTalkUnits: {
    "Topic 1 - Daily Talk": sf2StructuredData.curriculum.topics.topic1.dailyTalk,
    "Topic 2 - Daily Talk": sf2StructuredData.curriculum.topics.topic2.dailyTalk
  },
  storyUnits: {
    "Topic 1 - Story Time": sf2StructuredData.curriculum.topics.topic1.storyTime,
    "Topic 2 - Story Time": sf2StructuredData.curriculum.topics.topic2.storyTime,
    "Festival - Mother’s Day Story Time": sf2StructuredData.curriculum.festival.mothersDay.storyTime
  }
};

const rawUnitsSF2StructuredBase = sf2PracticeSets.vocabularyUnits;
const sentenceUnitsSF2 = sf2PracticeSets.sentenceUnits;
const dailyTalkUnitsSF2 = sf2PracticeSets.dailyTalkUnits;
const storyUnitsSF2 = sf2PracticeSets.storyUnits;
