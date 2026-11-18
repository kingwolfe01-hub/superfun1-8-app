// data/sf4-structured-data.js
function sf4Slug(text) {
  return String(text || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function sf4Word(word, meaning, options = {}) {
  const slug = options.slug || sf4Slug(word);
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
function sf4Sentence(sentence, meaning, options = {}) {
  const slug = options.slug || sf4Slug(sentence);
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
function sf4StoryLine(no, sentence, meaning, options = {}) {
  const prefix = options.prefix || "t1";
  const sentSlug = sf4Slug(sentence);
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

const sf4StructuredData = {
  bookId: "sf4",
  title: "Super Fun 4",
  grade: "四年級",
  semester: "下學期",
  curriculum: {
    preUnits: {
      classroomEnglish: [
        sf4Sentence("Let’s count.", "我們來數一數。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("Let’s clean up.", "我們來打掃吧。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("Any questions?", "有任何問題嗎？", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("It’s your turn.", "輪到你了。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("It’s time for class.", "上課了。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("It’s time for lunch.", "午餐時間到了。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("Spell the word “bag.”", "請拼出bag。", { sourceUnit: "Classroom English", category: "recognition", withImage: true }),
        sf4Sentence("Write the word “bag.”", "請寫出bag。", { sourceUnit: "Classroom English", category: "recognition", withImage: true })
      ],
      numbers: [
        sf4Word("twenty-one", "二十一", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-two", "twenty-four", "thirty-one"] }),
        sf4Word("twenty-two", "二十二", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-one", "twenty-three", "twenty-ten"] }),
        sf4Word("twenty-three", "二十三", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-two", "twenty-four", "thirteen"] }),
        sf4Word("twenty-four", "二十四", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-five", "fourteen", "forty-four"] }),
        sf4Word("twenty-five", "二十五", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-four", "twenty-nine", "fifteen"] }),
        sf4Word("twenty-six", "二十六", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-seven", "sixteen", "thirty-six"] }),
        sf4Word("twenty-seven", "二十七", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-six", "seventeen", "eleven"] }),
        sf4Word("twenty-eight", "二十八", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-nine", "eighteen", "twenty-one"] }),
        sf4Word("twenty-nine", "二十九", { category: "recognition", sourceUnit: "Numbers", similarWords: ["twenty-eight", "nineteen", "twenty-five"] }),
        sf4Word("thirty", "三十", { category: "recognition", sourceUnit: "Numbers", similarWords: ["thirteen", "thirsty", "forty"] })
      ],
      phonics: {
        phonics1: [
          sf4Word("cap", "鴨舌帽", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["cape", "hat", "cat"] }),
          sf4Word("hat", "圓邊帽", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["hate", "cap", "hot"] }),
          sf4Word("cape", "披風", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["cap", "cake", "tape"] }),
          sf4Word("hate", "討厭", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["hat", "late", "gate"] }),
          sf4Word("cake", "蛋糕", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["cape", "make", "lake"] }),
          sf4Word("name", "名字", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["game", "same", "vase"] }),
          sf4Word("vase", "花瓶", { category: "phonics", sourceUnit: "Get Ready - Phonics 1", similarWords: ["case", "base", "face"] })
        ],
        phonics2: [
          sf4Word("ten", "十", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["teen", "red", "pen"] }),
          sf4Word("red", "紅色", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["reed", "ten", "bed"] }),
          sf4Word("teen", "青少年", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["ten", "meet", "seen"] }),
          sf4Word("reed", "蘆葦", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["red", "seed", "need"] }),
          sf4Word("meet", "遇見", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["feet", "jeep", "teen"] }),
          sf4Word("jeep", "吉普車", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["keep", "deep", "meet"] }),
          sf4Word("seed", "種子", { category: "phonics", sourceUnit: "Get Ready - Phonics 2", similarWords: ["reed", "need", "feed"] })
        ],
        phonics3: [
          sf4Word("kit", "工具箱", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["kite", "sit", "fit"] }),
          sf4Word("Tim", "（男子名）", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["time", "Tom", "dim"] }),
          sf4Word("kite", "風箏", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["kit", "bite", "ride"] }),
          sf4Word("time", "時間", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["Tim", "dime", "line"] }),
          sf4Word("five", "五", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["dive", "live", "hive"] }),
          sf4Word("pipe", "水管", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["wipe", "ripe", "pie"] }),
          sf4Word("ride", "騎乘", { category: "phonics", sourceUnit: "Get Ready - Phonics 3", similarWords: ["side", "hide", "kite"] })
        ],
        phonics4: [
          sf4Word("not", "不", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["note", "cot", "hot"] }),
          sf4Word("cot", "鱈魚", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["cote", "not", "pot"] }),
          sf4Word("note", "筆記；便條", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["not", "cone", "vote"] }),
          sf4Word("cote", "條碼；密碼", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["cot", "note", "coat"] }),
          sf4Word("cone", "圓錐", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["bone", "note", "zone"] }),
          sf4Word("robe", "睡袍", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["hope", "rope", "globe"] }),
          sf4Word("hope", "希望", { category: "phonics", sourceUnit: "Get Ready - Phonics 4", similarWords: ["rope", "robe", "cope"] })
        ],
        phonics5: [
          sf4Word("cut", "切；剪", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["cute", "nut", "but"] }),
          sf4Word("tub", "浴缸", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["tube", "cub", "rub"] }),
          sf4Word("cute", "可愛的", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["cut", "mute", "cube"] }),
          sf4Word("tube", "試管；管子", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["tub", "cube", "tune"] }),
          sf4Word("cube", "正方體", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["tube", "cute", "cub"] }),
          sf4Word("dune", "沙丘", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["June", "tune", "mute"] }),
          sf4Word("mute", "無聲的", { category: "phonics", sourceUnit: "Get Ready - Phonics 5", similarWords: ["cute", "dune", "mule"] })
        ]
      }
    },
    topics: {
      topic1: {
        title: "My Toys",
        chineseTitle: "我的玩具",
        lessons: {
          lesson1: {
            title: "Lesson 1",
            words: [
              sf4Word("these", "這些", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["those", "this", "there"] }),
              sf4Word("those", "那些", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["these", "that", "nose"] }),
              sf4Word("yo-yos", "溜溜球（複數）", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["yo-yo", "toys", "dolls"] }),
              sf4Word("kites", "風箏（複數）", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["kite", "bikes", "likes"] }),
              sf4Word("dolls", "洋娃娃（複數）", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["balls", "doll", "bells"] }),
              sf4Word("balls", "球（複數）", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["dolls", "walls", "calls"] }),
              sf4Word("robots", "機器人（複數）", { sourceUnit: "Topic 1 - Lesson 1 Words", topicId: "topic1", lessonId: "lesson1", similarWords: ["robot", "rockets", "rabbits"] })
            ],
            sentences: [
              sf4Sentence("What are these?", "這些是什麼？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf4Sentence("They’re robots.", "它們是機器人。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf4Sentence("What are those?", "那些是什麼？", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" }),
              sf4Sentence("They’re yo-yos.", "它們是溜溜球。", { sourceUnit: "Topic 1 - Lesson 1 Sentences", topicId: "topic1", lessonId: "lesson1" })
            ]
          },
          lesson2: {
            title: "Lesson 2",
            words: [
              sf4Word("box", "箱子；盒子", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["fox", "ox", "boy"] }),
              sf4Word("desk", "桌子", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["disk", "duck", "deck"] }),
              sf4Word("chair", "椅子", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["hair", "fair", "pair"] }),
              sf4Word("in", "在…裡面", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["on", "it", "is"] }),
              sf4Word("on", "在…上面", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["in", "ox", "of"] }),
              sf4Word("under", "在…下面", { sourceUnit: "Topic 1 - Lesson 2 Words", topicId: "topic1", lessonId: "lesson2", similarWords: ["uncle", "over", "after"] })
            ],
            sentences: [
              sf4Sentence("Where’s the kite?", "風箏在哪裡？", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf4Sentence("It’s in the box.", "它在箱子裡。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf4Sentence("Where are the dolls?", "娃娃在哪裡？", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" }),
              sf4Sentence("They’re on the chair.", "它們在椅子上。", { sourceUnit: "Topic 1 - Lesson 2 Sentences", topicId: "topic1", lessonId: "lesson2" })
            ]
          }
        },
        dailyTalk: [
          sf4Sentence("Watch out.", "小心。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true }),
          sf4Sentence("Do you need help?", "你需要幫忙嗎？", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true }),
          sf4Sentence("I don’t know.", "我不知道。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true }),
          sf4Sentence("Wait a minute.", "請等一下。", { sourceUnit: "Topic 1 - Daily Talk", topicId: "topic1", category: "recognition", withImage: true })
        ],
        storyTime: [
          sf4StoryLine(1, "What are those, Mike?", "那些是什麼，Mike？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(2, "They’re kites.", "它們是風箏。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(3, "Look! We can go home and find some old toys.", "看！我們可以回家找一些舊玩具。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(4, "Good idea!", "好主意！", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(5, "What are these?", "這些是什麼？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(6, "They’re yo-yos.", "它們是溜溜球。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(7, "Where’s my robot, Mom?", "我的機器人在哪裡，媽媽？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(8, "It’s on the desk.", "它在桌子上。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(9, "I have lots of dolls.", "我有很多洋娃娃。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(10, "I’m happy. I can help.", "我好開心。我可以幫助別人。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(11, "Watch out, Wendy. Do you need help?", "小心，Wendy。妳需要幫忙嗎？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(12, "Yes. Thanks.", "是的。謝謝。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(13, "Where are the pens, Alan?", "原子筆在哪裡，Alan？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(14, "I don’t know.", "我不知道。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(15, "They’re under the chair.", "它們在椅子下面。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(16, "Wait a minute!", "等一下！", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(17, "What are those?", "那些是什麼？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(18, "They’re dolls.", "它們是洋娃娃。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(19, "OK. Please put them here.", "好的。請把它們放在這裡。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(20, "Are those your shoes, Mike?", "這是你的鞋子嗎，Mike？", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" }),
          sf4StoryLine(21, "Yes, they are.", "是的，它們是。", { prefix: "t1", storyId: "topic1_story", topicId: "topic1" })
        ]
      },
      topic2: {
        title: "My Day",
        chineseTitle: "我的一天",
        lessons: {
          lesson3: {
            title: "Lesson 3",
            words: [
              sf4Word("what time", "幾點", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["what", "time", "what color"] }),
              sf4Word("eleven", "十一", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["seven", "twelve", "even"] }),
              sf4Word("twelve", "十二", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["twenty", "eleven", "two"] }),
              sf4Word("twenty", "二十", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["twelve", "thirty", "ten"] }),
              sf4Word("thirty", "三十", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["thirteen", "twenty", "forty"] }),
              sf4Word("forty", "四十", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["fourteen", "fifty", "thirty"] }),
              sf4Word("fifty", "五十", { sourceUnit: "Topic 2 - Lesson 3 Words", topicId: "topic2", lessonId: "lesson3", similarWords: ["fifteen", "forty", "sixty"] })
            ],
            sentences: [
              sf4Sentence("What time is it?", "現在幾點了？", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf4Sentence("It’s seven o’clock.", "現在是七點鐘。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" }),
              sf4Sentence("It’s seven thirty.", "現在是七點三十分。", { sourceUnit: "Topic 2 - Lesson 3 Sentences", topicId: "topic2", lessonId: "lesson3" })
            ]
          },
          lesson4: {
            title: "Lesson 4",
            words: [
              sf4Word("like", "喜歡", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["bike", "hike", "look"] }),
              sf4Word("cake", "蛋糕", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["make", "lake", "bake"] }),
              sf4Word("ice cream", "冰淇淋", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["cream", "ice", "cake"] }),
              sf4Word("milk", "牛奶", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["silk", "juice", "water"] }),
              sf4Word("juice", "果汁", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["June", "milk", "rice"] }),
              sf4Word("water", "水", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["later", "winter", "milk"] }),
              sf4Word("pizza", "披薩", { sourceUnit: "Topic 2 - Lesson 4 Words", topicId: "topic2", lessonId: "lesson4", similarWords: ["pasta", "pie", "cake"] })
            ],
            sentences: [
              sf4Sentence("Do you like milk?", "你喜歡牛奶嗎？", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf4Sentence("Yes, I do.", "是的，我喜歡。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" }),
              sf4Sentence("No, I don’t.", "不，我不喜歡。", { sourceUnit: "Topic 2 - Lesson 4 Sentences", topicId: "topic2", lessonId: "lesson4" })
            ]
          }
        },
        dailyTalk: [
          sf4Sentence("I’m hungry.", "我肚子餓了。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "recognition", withImage: true }),
          sf4Sentence("Time for lunch.", "午餐時間到了。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "recognition", withImage: true }),
          sf4Sentence("Be careful.", "小心一點。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "recognition", withImage: true }),
          sf4Sentence("Let’s take a break.", "我們休息一下吧。", { sourceUnit: "Topic 2 - Daily Talk", topicId: "topic2", category: "recognition", withImage: true })
        ],
        storyTime: [
          sf4StoryLine(1, "I’m hungry. What time is it, Mike?", "我肚子餓了。現在幾點了，Mike？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(2, "It’s twelve o’clock. Time for lunch.", "十二點。午餐時間到了。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(3, "Do you like cake?", "你們喜歡蛋糕嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(4, "Yes, I do.", "是的，我喜歡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(5, "No, I don’t.", "不，我不喜歡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(6, "Welcome! Try this, please!", "歡迎光臨！請試試這個！", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(7, "Thanks.", "謝謝。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(8, "Do you like ice cream?", "妳喜歡冰淇淋嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(9, "Yes, I do.", "是的，我喜歡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(10, "Ha, I know! You can put the cake on the ice cream.", "哈，我知道了！妳可以把蛋糕放在冰淇淋上面。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(11, "We can make this place nice and clean.", "我們可以讓這個地方舒適又乾淨。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(12, "Good idea. Thank you.", "好主意。謝謝你們。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(13, "Be careful, Mike.", "小心一點，Mike。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(14, "Let’s take a break. Do you like juice?", "我們休息一下吧。你喜歡果汁嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(15, "Yes, I do.", "是的，我喜歡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(16, "What time is it?", "現在幾點了？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(17, "It’s five thirty. Time to go home.", "五點半。回家時間到了。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(18, "See you tomorrow.", "明天見。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(19, "Do you like cake?", "你喜歡蛋糕嗎？", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" }),
          sf4StoryLine(20, "Yes, I do.", "是的，我喜歡。", { prefix: "t2", storyId: "topic2_story", topicId: "topic2" })
        ]
      }
    },
    festival: {
      dragonBoat: {
        title: "Dragon Boat Festival",
        chineseTitle: "端午節",
        words: [
          sf4Word("dragon boat", "龍舟", { sourceUnit: "Festival - Dragon Boat Festival Words", category: "recognition", similarWords: ["dragon", "boat", "sailboat"] }),
          sf4Word("rice dumpling", "粽子", { sourceUnit: "Festival - Dragon Boat Festival Words", category: "recognition", similarWords: ["rice", "dumpling", "noodles"] }),
          sf4Word("sachet", "香包", { sourceUnit: "Festival - Dragon Boat Festival Words", category: "recognition", similarWords: ["basket", "jacket", "pocket"] }),
          sf4Word("stand an egg", "立蛋", { sourceUnit: "Festival - Dragon Boat Festival Words", category: "recognition", similarWords: ["stand up", "egg", "sand"] })
        ],
        sentences: [
          sf4Sentence("Happy Dragon Boat Festival.", "端午節快樂。", { sourceUnit: "Festival - Dragon Boat Festival Sentences", category: "recognition" }),
          sf4Sentence("Let’s row the dragon boat.", "我們一起划龍舟吧。", { sourceUnit: "Festival - Dragon Boat Festival Sentences", category: "recognition" })
        ],
        storyTime: [
          sf4StoryLine(1, "What are these?", "這些是什麼？", { prefix: "festival", storyId: "dragon_boat_story" }),
          sf4StoryLine(2, "They’re rice dumplings.", "它們是粽子。", { prefix: "festival", storyId: "dragon_boat_story" }),
          sf4StoryLine(3, "They smell good.", "它們聞起來好香。", { prefix: "festival", storyId: "dragon_boat_story" }),
          sf4StoryLine(4, "Come on, Mike. You can do it.", "加油，Mike。你可以的。", { prefix: "festival", storyId: "dragon_boat_story" }),
          sf4StoryLine(5, "Hooray!", "太棒了！", { prefix: "festival", storyId: "dragon_boat_story" }),
          sf4StoryLine(6, "This is for you, Mike. Happy Dragon Boat Festival!", "這個給你，Mike。端午節快樂！", { prefix: "festival", storyId: "dragon_boat_story" })
        ]
      }
    }
  }
};

const sf4PracticeSets = {
  vocabularyUnits: {
    "Numbers": sf4StructuredData.curriculum.preUnits.numbers,
    "Get Ready - Phonics 1": sf4StructuredData.curriculum.preUnits.phonics.phonics1,
    "Get Ready - Phonics 2": sf4StructuredData.curriculum.preUnits.phonics.phonics2,
    "Get Ready - Phonics 3": sf4StructuredData.curriculum.preUnits.phonics.phonics3,
    "Get Ready - Phonics 4": sf4StructuredData.curriculum.preUnits.phonics.phonics4,
    "Get Ready - Phonics 5": sf4StructuredData.curriculum.preUnits.phonics.phonics5,
    "Topic 1 - Lesson 1 Words": sf4StructuredData.curriculum.topics.topic1.lessons.lesson1.words,
    "Topic 1 - Lesson 2 Words": sf4StructuredData.curriculum.topics.topic1.lessons.lesson2.words,
    "Topic 2 - Lesson 3 Words": sf4StructuredData.curriculum.topics.topic2.lessons.lesson3.words,
    "Topic 2 - Lesson 4 Words": sf4StructuredData.curriculum.topics.topic2.lessons.lesson4.words,
    "Festival - Dragon Boat Festival Words": sf4StructuredData.curriculum.festival.dragonBoat.words
  },
  sentenceUnits: {
    "Classroom English": sf4StructuredData.curriculum.preUnits.classroomEnglish,
    "Topic 1 - Lesson 1 Sentences": sf4StructuredData.curriculum.topics.topic1.lessons.lesson1.sentences,
    "Topic 1 - Lesson 2 Sentences": sf4StructuredData.curriculum.topics.topic1.lessons.lesson2.sentences,
    "Topic 2 - Lesson 3 Sentences": sf4StructuredData.curriculum.topics.topic2.lessons.lesson3.sentences,
    "Topic 2 - Lesson 4 Sentences": sf4StructuredData.curriculum.topics.topic2.lessons.lesson4.sentences,
    "Festival - Dragon Boat Festival Sentences": sf4StructuredData.curriculum.festival.dragonBoat.sentences
  },
  dailyTalkUnits: {
    "Topic 1 - Daily Talk": sf4StructuredData.curriculum.topics.topic1.dailyTalk,
    "Topic 2 - Daily Talk": sf4StructuredData.curriculum.topics.topic2.dailyTalk
  },
  storyUnits: {
    "Topic 1 - Story Time": sf4StructuredData.curriculum.topics.topic1.storyTime,
    "Topic 2 - Story Time": sf4StructuredData.curriculum.topics.topic2.storyTime,
    "Festival - Dragon Boat Festival Story Time": sf4StructuredData.curriculum.festival.dragonBoat.storyTime
  }
};

const rawUnitsSF4StructuredBase = sf4PracticeSets.vocabularyUnits;
const sentenceUnitsSF4 = sf4PracticeSets.sentenceUnits;
const dailyTalkUnitsSF4 = sf4PracticeSets.dailyTalkUnits;
const storyUnitsSF4 = sf4PracticeSets.storyUnits;
