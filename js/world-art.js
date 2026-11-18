// js/world-art.js
const CUSTOM_ISLAND_IMAGES = {};

function getWorldLandmarkSvg(category, index = 0) {
  if (CUSTOM_ISLAND_IMAGES[category]) {
    return `<img src="${CUSTOM_ISLAND_IMAGES[category]}" class="island-custom-img" alt="island" />`;
  }
  const icons = {
    numbers: '🔢',
    phonics: '🎈',
    lesson1: '🗻',
    lesson2: '🗼',
    lesson3: '🏙️',
    lesson4: '🏛️',
    topic1_story: '🏮',
    topic2_story: '🏰',
    dailytalk: '☕',
    festival: '🎡',
    review: '🏆'
  };
  return `<div style="font-size:3.2rem;line-height:1;">${icons[category] || '🏝️'}</div>`;
}

function getCategoryLabelTag(category) {
  const map = {
    numbers: '🔢 數字探索站',
    phonics: '🎈 發音熱氣球站',
    lesson1: '1️⃣ Lesson 1 單字句型島',
    lesson2: '2️⃣ Lesson 2 單字句型島',
    lesson3: '3️⃣ Lesson 3 單字句型島',
    lesson4: '4️⃣ Lesson 4 單字句型島',
    topic1_story: '🏮 Topic 1 Story 故事島',
    topic2_story: '🏰 Topic 2 Story 故事島',
    dailytalk: '☕ 環球對話站',
    festival: '🎡 世界節慶站',
    review: '🏆 環球總複習紀念碑'
  };
  return map[category] || '🏝️ 學習探索站';
}
