/* ==========================================================================
   VocabMaster Pro - Main JavaScript Application Logic
   (Click-to-Translate Popover Tooltip with POS Tag + Datamuse & Fast API)
   ========================================================================== */

// --- Global State ---
let vocabulary = [];
let currentSearchData = null;
let activeSubTab = 'learning'; // 'learning' | 'mastered'
let currentPracticeMode = null;
let practiceSession = null;
const searchCache = {}; // Cache for instant 0ms repeat searches
let activePopoverWord = null;
let activePopoverTr = '';
let activePopoverPos = 'noun';

// Preset Vocabulary Bundles
// Preset Vocabulary Bundles with authentic IPA phonetics
const PRESET_BUNDLES = {
  essential: [
    { word: "reluctant", synonyms: ["unwilling", "hesitant", "disinclined"], pos: "adjective", definition: "Unwilling and hesitant; disinclined.", example: "She was reluctant to leave her home.", trNote: "Gönülsüz, isteksiz" },
    { word: "abundant", synonyms: ["plentiful", "copious", "ample"], pos: "adjective", definition: "Existing or available in large quantities; plentiful.", example: "There is abundant evidence of climate change.", trNote: "Bol, bereketli" },
    { word: "foster", synonyms: ["encourage", "promote", "nurture"], pos: "verb", definition: "Encourage or promote the development of something.", example: "The teacher tried to foster a love of reading.", trNote: "Teşvik etmek, geliştirmek" },
    { word: "diligent", synonyms: ["industrious", "hardworking", "assiduous"], pos: "adjective", definition: "Having or showing care and conscientiousness in work.", example: "He is a diligent student who always finishes on time.", trNote: "Çalışkan, özenli" },
    { word: "ambiguous", synonyms: ["unclear", "vague", "equivocal"], pos: "adjective", definition: "Open to more than one interpretation; not having one obvious meaning.", example: "The law is ambiguous on this point.", trNote: "Muğlak, belirsiz" },
    { word: "mitigate", synonyms: ["alleviate", "reduce", "diminish"], pos: "verb", definition: "Make less severe, serious, or painful.", example: "Drainage schemes have helped to mitigate the risk.", trNote: "Hafifletmek, yatıştırmak" },
    { word: "candid", synonyms: ["frank", "honest", "outspoken"], pos: "adjective", definition: "Truthful and straightforward; frank.", example: "His candid remarks surprised everyone in the room.", trNote: "Samimi, açık sözlü" },
    { word: "resilient", synonyms: ["adaptable", "tough", "buoyant"], pos: "adjective", definition: "Able to withstand or recover quickly from difficult conditions.", example: "Babies are surprisingly resilient.", trNote: "Dayanıklı, kendini çabuk toparlayan" },
    { word: "plausible", synonyms: ["credible", "believable", "reasonable"], pos: "adjective", definition: "Seeming reasonable or probable.", example: "This explanation sounds entirely plausible.", trNote: "Makul, inandırıcı" },
    { word: "meticulous", synonyms: ["thorough", "precise", "painstaking"], pos: "adjective", definition: "Showing great attention to detail; very careful and precise.", example: "He had checked the documents with meticulous care.", trNote: "Titiz, çok dikkatli" }
  ],
  academic: [
    { word: "comprehend", synonyms: ["understand", "grasp", "fathom"], pos: "verb", definition: "Grasp mentally; understand.", example: "He failed to comprehend the seriousness of the situation.", trNote: "Kavramak, anlamak" },
    { word: "subsequent", synonyms: ["following", "ensuing", "consecutive"], pos: "adjective", definition: "Coming after something in time; following.", example: "Subsequent studies confirmed their findings.", trNote: "Sonraki, ardından gelen" },
    { word: "predominant", synonyms: ["main", "primary", "dominant"], pos: "adjective", definition: "Present as the strongest or main element.", example: "Yellow is the predominant color in the painting.", trNote: "Baskın, ana" },
    { word: "scrutinize", synonyms: ["inspect", "examine", "analyze"], pos: "verb", definition: "Examine or inspect closely and thoroughly.", example: "Customers were warned to scrutinize the small print.", trNote: "Detaylıca incelemek" },
    { word: "feasible", synonyms: ["practicable", "viable", "achievable"], pos: "adjective", definition: "Possible to do easily or conveniently.", example: "It is not feasible to build a canal here.", trNote: "Uygulanabilir, elverişli" }
  ],
  advanced: [
    { word: "ephemeral", synonyms: ["transitory", "fleeting", "short-lived"], pos: "adjective", definition: "Lasting for a very short time.", example: "Fame in the digital age is often ephemeral.", trNote: "Geçici, kısa ömürlü" },
    { word: "ubiquitous", synonyms: ["omnipresent", "pervasive", "universal"], pos: "adjective", definition: "Present, appearing, or found everywhere.", example: "Smartphones have become ubiquitous in modern life.", trNote: "Her yerde bulunan" },
    { word: "pragmatic", synonyms: ["practical", "sensible", "realistic"], pos: "adjective", definition: "Dealing with things sensibly and realistically.", example: "We need a pragmatic approach to solving this crisis.", trNote: "Gerekçi, pratik" }
  ]
};

// Global Authentic IPA Phonetics Map for Common & Academic Words
const KNOWN_PHONETICS = {
  'ambiguous': '/æmˈbɪɡjuəs/',
  'reluctant': '/rɪˈlʌktənt/',
  'abundant': '/əˈbʌndənt/',
  'foster': '/ˈfɒstər/',
  'diligent': '/ˈdɪlɪdʒənt/',
  'mitigate': '/ˈmɪtɪɡeɪt/',
  'candid': '/ˈkændɪd/',
  'resilient': '/rɪˈzɪliənt/',
  'plausible': '/ˈplɔːzəbl/',
  'meticulous': '/məˈtɪkjələs/',
  'comprehend': '/ˌkɒmprɪˈhend/',
  'subsequent': '/ˈsʌbsɪkwənt/',
  'predominant': '/prɪˈdɒmɪnənt/',
  'scrutinize': '/ˈskruːtənaɪz/',
  'feasible': '/ˈfiːzəbl/',
  'ephemeral': '/ɪˈfemərəl/',
  'ubiquitous': '/juːˈbɪkwɪtəs/',
  'pragmatic': '/præɡˈmætɪk/'
};

// Helper: Format phonetic (phonetics disabled per user preference)
function formatPhonetic(rawPhonetic, word) {
  return '';
}

// Helper: Normalize Part of Speech tag
function normalizePosTag(rawTag) {
  if (!rawTag) return 'noun';
  const tag = rawTag.toLowerCase().trim();
  if (tag === 'n' || tag === 'noun') return 'noun';
  if (tag === 'v' || tag === 'verb') return 'verb';
  if (tag === 'adj' || tag === 'adjective') return 'adjective';
  if (tag === 'adv' || tag === 'adverb') return 'adverb';
  if (tag === 'pron' || tag === 'pronoun') return 'pronoun';
  if (tag === 'prep' || tag === 'preposition') return 'preposition';
  if (tag === 'conj' || tag === 'conjunction') return 'conjunction';
  return tag;
}

// --- Helper: Convert Plain Text into Interactive Clickable Word Spans ---
function wrapTextWithClickableWords(text) {
  if (!text) return '';
  return text.split(/(\s+)/).map(token => {
    if (token.startsWith('__TARGET_')) return token;
    const cleanWord = token.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length >= 2) {
      return `<span class="clickable-word" onclick="handleWordClick(event, '${cleanWord}')">${token}</span>`;
    }
    return token;
  }).join('');
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  if (vocabulary.length === 0) {
    loadPresetBundle('essential', false);
  }
  updateStats();
  renderWordsGrid();

  // Close Popover on Outside Click
  document.addEventListener('click', (e) => {
    const popover = document.getElementById('word-popover');
    if (popover && popover.style.display !== 'none') {
      if (!popover.contains(e.target) && !e.target.classList.contains('clickable-word') && !e.target.classList.contains('word-highlight')) {
        closeWordPopover();
      }
    }
  });
});

// --- LocalStorage Logic ---
function saveDataToStorage() {
  localStorage.setItem('vocab_master_data', JSON.stringify(vocabulary));
  updateStats();
}

function loadDataFromStorage() {
  const data = localStorage.getItem('vocab_master_data');
  if (data) {
    try {
      vocabulary = JSON.parse(data);
      let modified = false;
      vocabulary.forEach(item => {
        if (item.phonetic) {
          item.phonetic = '';
          modified = true;
        }
      });
      if (modified) saveDataToStorage();
    } catch (e) {
      console.error("Storage load error:", e);
      vocabulary = [];
    }
  }
}

// --- Theme Switcher ---
function toggleTheme() {
  const htmlEl = document.documentElement;
  const currentTheme = htmlEl.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  htmlEl.setAttribute('data-theme', newTheme);
  
  // Sync both desktop and mobile theme toggle icons
  document.querySelectorAll('#theme-toggle i, #theme-toggle-mobile i').forEach(icon => {
    icon.className = newTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });
}

// --- Mobile Bottom Nav Active State ---
function setMobileActive(clickedBtn) {
  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (clickedBtn) clickedBtn.classList.add('active');
}

// --- Navigation Tab Switching ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const targetPane = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.getElementById(`nav-btn-${tabId}`);

  if (targetPane) targetPane.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  if (tabId === 'words') {
    renderWordsGrid();
  }
}

function switchSubTab(subTab) {
  activeSubTab = subTab;
  document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`sub-tab-${subTab}`);
  if (btn) btn.classList.add('active');
  renderWordsGrid();
}

// --- Fast Timeout Fetch Helper ---
async function fetchWithTimeout(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

// --- Fast Turkish Translation & POS Tag Fetcher for Popover Tooltip ---
async function fetchWordPosAndTrFast(word) {
  const trPromise = fetchWithTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(word)}`, 2000)
    .then(r => (r && r.ok) ? r.json() : null);

  const dmDefPromise = fetchWithTimeout(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`, 2000)
    .then(r => (r && r.ok) ? r.json() : null);

  const [trResult, dmDefResult] = await Promise.all([trPromise, dmDefPromise]);

  let trTranslation = 'Çeviri bulunamadı';
  if (trResult && Array.isArray(trResult[0])) {
    trTranslation = trResult[0].map(i => i[0]).filter(Boolean).join(' ');
  }

  let posTag = 'noun';
  if (Array.isArray(dmDefResult) && dmDefResult.length > 0 && dmDefResult[0].defs && dmDefResult[0].defs.length > 0) {
    const rawDef = dmDefResult[0].defs[0];
    const splitIndex = rawDef.indexOf('\t');
    if (splitIndex !== -1) {
      posTag = normalizePosTag(rawDef.substring(0, splitIndex).trim());
    }
  }

  return { trText: trTranslation, pos: posTag };
}

// --- CLICK-TO-TRANSLATE POPOVER LOGIC ---
async function handleWordClick(e, rawWord) {
  if (e) e.stopPropagation();
  const word = rawWord.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!word || word.length < 2) return;

  activePopoverWord = word;
  const popover = document.getElementById('word-popover');
  const titleEl = document.getElementById('popover-word-title');
  const posTagEl = document.getElementById('popover-pos-tag');
  const trEl = document.getElementById('popover-tr-text');
  const addBtn = document.getElementById('popover-add-btn');
  const audioBtn = document.getElementById('popover-audio-btn');

  titleEl.textContent = word;
  posTagEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ...`;
  trEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Çevriliyor...`;
  audioBtn.onclick = () => speakText(word);

  const existingInLib = vocabulary.find(v => v.word.toLowerCase() === word);
  if (existingInLib) {
    activePopoverPos = existingInLib.pos;
    activePopoverTr = existingInLib.trNote || '';
    posTagEl.innerHTML = `<i class="fa-solid fa-cube"></i> ${existingInLib.pos}`;
    addBtn.innerHTML = `<i class="fa-solid fa-trash"></i> Listenizden Sil`;
    addBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    addBtn.disabled = false;
    addBtn.onclick = () => {
      deleteWord(null, word);
      closeWordPopover();
    };
  } else {
    addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Kütüphaneme Ekle`;
    addBtn.style.background = 'var(--accent-gradient)';
    addBtn.disabled = false;
    addBtn.onclick = () => quickAddWordFromPopover();
  }

  // Calculate Popover Position near the clicked element
  const rect = e.target.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  popover.style.display = 'block';
  popover.style.top = `${rect.bottom + scrollY + 8}px`;
  
  let leftPos = rect.left + scrollX - 20;
  if (leftPos + 260 > window.innerWidth) {
    leftPos = window.innerWidth - 270;
  }
  popover.style.left = `${Math.max(10, leftPos)}px`;

  // Fetch Fast TR Translation and POS Tag
  const { trText, pos } = await fetchWordPosAndTrFast(word);
  activePopoverTr = trText;
  activePopoverPos = pos;

  posTagEl.innerHTML = `<i class="fa-solid fa-cube"></i> ${pos}`;
  trEl.innerHTML = `<i class="fa-solid fa-language" style="color: var(--success);"></i> ${trText}`;
}

function closeWordPopover() {
  const popover = document.getElementById('word-popover');
  if (popover) popover.style.display = 'none';
}

// --- WRONG ANSWER PROMPT MODAL & LEITNER DEMOTION ---
let wrongWordModalTimeout = null;

function handleWrongAnswerPrompt(targetWord, customTrNote = '') {
  if (!targetWord) return;
  const word = targetWord.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!word || word.length < 2) return;

  const modal = document.getElementById('wrong-word-modal');
  const titleEl = document.getElementById('wrong-word-modal-title');
  const textEl = document.getElementById('wrong-word-modal-text');
  const actionsEl = document.getElementById('wrong-word-modal-actions');
  const addBtn = document.getElementById('wrong-word-modal-add-btn');

  if (!modal) return;
  if (wrongWordModalTimeout) clearTimeout(wrongWordModalTimeout);

  const existing = vocabulary.find(v => v.word.toLowerCase() === word);

  if (existing) {
    // Word is already in vocabulary! Demote box to 1 so Leitner Spaced Repetition reviews it!
    existing.box = 1;
    existing.isMastered = false;
    saveDataToStorage();

    titleEl.textContent = "Tekrar Listesine Alındı!";
    textEl.innerHTML = `<strong style="color: var(--accent-secondary); text-transform: uppercase;">${word}</strong> kelimesi listenizde kayıtlı. Yanlış bilindiği için tekrar çalışılmak üzere <strong>Kutu 1</strong>'e alındı.`;
    actionsEl.style.display = 'none';
    modal.style.display = 'block';

    wrongWordModalTimeout = setTimeout(closeWrongWordModal, 4000);
  } else {
    // Word is NOT in vocabulary yet! Prompt user to add it!
    titleEl.textContent = "Kelime Listenize Eklensin mi?";
    textEl.innerHTML = `<strong style="color: var(--accent-secondary); text-transform: uppercase;">${word}</strong> kelimesini yanlış yanıtladınız. Bu kelimeyi <strong>'Öğrenilmekte Olanlar' (Kutu 1)</strong> listenize eklemek ister misiniz?`;
    actionsEl.style.display = 'flex';
    addBtn.disabled = false;
    addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> "${word}" Kelimesini Ekle`;
    
    addBtn.onclick = async () => {
      addBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ekleniyor...`;
      addBtn.disabled = true;
      try {
        const fullData = await fetchWordDetailsFast(word);
        const now = Date.now();
        vocabulary.push({
          id: `word_${word}_${now}`,
          word: word,
          phonetic: formatPhonetic(fullData.phonetic, word),
          audioUrl: fullData.audioUrl || '',
          pos: fullData.pos || 'noun',
          synonyms: fullData.synonyms.length > 0 ? fullData.synonyms : [word],
          antonyms: fullData.antonyms || [],
          definition: fullData.definition || `Practice exercise word.`,
          example: fullData.example || `Learned via practice test.`,
          trNote: customTrNote || fullData.trNote || word,
          box: 1,
          isMastered: false,
          createdAt: now,
          lastReviewed: now,
          nextReviewDate: now,
          reviewCount: 0,
          successCount: 0
        });
        saveDataToStorage();
        updateStats();

        textEl.innerHTML = `<span style="color: var(--success); font-weight:700;"><i class="fa-solid fa-circle-check"></i> "${word}" başarıyla 'Öğrenilmekte Olanlar' listenize eklendi!</span>`;
        actionsEl.style.display = 'none';
        wrongWordModalTimeout = setTimeout(closeWrongWordModal, 2500);
      } catch (err) {
        console.error("Wrong word add error", err);
        closeWrongWordModal();
      }
    };

    modal.style.display = 'block';
  }
}

function closeWrongWordModal() {
  const modal = document.getElementById('wrong-word-modal');
  if (modal) modal.style.display = 'none';
  if (wrongWordModalTimeout) clearTimeout(wrongWordModalTimeout);
}

async function quickAddWordFromPopover() {
  if (!activePopoverWord) return;
  const word = activePopoverWord;
  const trText = activePopoverTr;
  const posTag = activePopoverPos;

  const addBtn = document.getElementById('popover-add-btn');
  addBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ekleniyor...`;
  addBtn.disabled = true;

  try {
    const fullData = await fetchWordDetailsFast(word);
    
    const now = Date.now();
    const newWordItem = {
      id: `word_${word}_${now}`,
      word: word,
      phonetic: formatPhonetic(fullData.phonetic, word),
      audioUrl: fullData.audioUrl || '',
      pos: posTag || fullData.pos || 'noun',
      synonyms: fullData.synonyms.length > 0 ? fullData.synonyms : [word],
      antonyms: fullData.antonyms || [],
      definition: fullData.definition || `Refers to ${trText}.`,
      example: fullData.example || `Learning how to use "${word}" correctly.`,
      trNote: trText,
      box: 1,
      isMastered: false,
      createdAt: now,
      lastReviewed: now,
      nextReviewDate: now,
      reviewCount: 0,
      successCount: 0
    };

    vocabulary.push(newWordItem);
    saveDataToStorage();

    addBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Eklendi!`;
    alert(`"${word}" (${posTag} - ${trText}) kelimesi başarıyla 'Öğrenilmekte Olanlar' kütüphanenize eklendi!`);
    setTimeout(closeWordPopover, 600);
  } catch (err) {
    console.error("Quick add error", err);
    closeWordPopover();
  }
}

// --- Dictionary API Fetching with Datamuse Defs & POS Parser ---
async function handleWordSearch(e) {
  if (e) e.preventDefault();
  const inputEl = document.getElementById('word-search-input');
  const word = inputEl.value.trim().toLowerCase();
  if (!word) return;

  const btn = document.getElementById('search-submit-btn');
  const resultContainer = document.getElementById('dict-result-container');
  
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Aranıyor...`;
  btn.disabled = true;

  try {
    if (searchCache[word]) {
      currentSearchData = searchCache[word];
      renderDictionaryResult(currentSearchData);
      resultContainer.style.display = 'block';
      return;
    }

    const wordData = await fetchWordDetailsFast(word);
    searchCache[word] = wordData;
    currentSearchData = wordData;
    renderDictionaryResult(currentSearchData);
    resultContainer.style.display = 'block';
  } catch (err) {
    console.error("Fetch error:", err);
    resultContainer.innerHTML = `
      <div class="glass-card text-center" style="text-align:center; padding: 2rem;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: var(--danger); margin-bottom: 1rem;"></i>
        <h3>Kelime Bulunamadı</h3>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">"${word}" kelimesi bulunamadı. Lütfen imlayı kontrol edin veya manuel ekleyin.</p>
      </div>
    `;
    resultContainer.style.display = 'block';
  } finally {
    btn.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Ara & Getir`;
    btn.disabled = false;
  }
}

async function fetchWordDetailsFast(word) {
  const dictPromise = fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, 3000)
    .then(r => (r && r.ok) ? r.json() : null);

  const trPromise = fetchWithTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(word)}`, 2500)
    .then(r => (r && r.ok) ? r.json() : null);

  const dmDefPromise = fetchWithTimeout(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`, 2500)
    .then(r => (r && r.ok) ? r.json() : null);

  const dmSynPromise = fetchWithTimeout(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=10`, 2500)
    .then(r => (r && r.ok) ? r.json() : null);

  const [dictResult, trResult, dmDefResult, dmSynResult] = await Promise.all([dictPromise, trPromise, dmDefPromise, dmSynPromise]);

  const dictData = Array.isArray(dictResult) ? dictResult[0] : null;

  // 1. Extract TR Translation
  let trTranslation = '';
  if (trResult && Array.isArray(trResult[0])) {
    trTranslation = trResult[0].map(item => item[0]).filter(Boolean).join(' ');
  }

  // 2. Extract Datamuse POS & Definition (Format: "adv\tIn a swift manner...")
  let dmPosTag = '';
  let dmDefinition = '';
  if (Array.isArray(dmDefResult) && dmDefResult.length > 0 && dmDefResult[0].defs && dmDefResult[0].defs.length > 0) {
    const rawDef = dmDefResult[0].defs[0];
    const splitIndex = rawDef.indexOf('\t');
    if (splitIndex !== -1) {
      dmPosTag = rawDef.substring(0, splitIndex).trim();
      dmDefinition = rawDef.substring(splitIndex + 1).trim();
    } else {
      dmDefinition = rawDef.trim();
    }
  }

  // 3. Extract Datamuse Synonyms
  let extraSynonyms = [];
  if (Array.isArray(dmSynResult)) {
    extraSynonyms = dmSynResult.map(item => item.word);
  }

  // 4. Extract Phonetics & Audio
  let phonetic = dictData?.phonetic || '';
  let audioUrl = '';
  if (dictData?.phonetics) {
    for (let p of dictData.phonetics) {
      if (p.text && !phonetic) phonetic = p.text;
      if (p.audio) {
        audioUrl = p.audio;
        break;
      }
    }
  }

  // 5. Extract Meanings, POS, Synonyms & Antonyms
  let rawPos = dictData?.meanings?.[0]?.partOfSpeech || dmPosTag || 'noun';
  let pos = normalizePosTag(rawPos);

  let definition = '';
  let example = '';
  let synonymsSet = new Set(extraSynonyms);
  let antonymsSet = new Set();

  if (dictData && dictData.meanings && dictData.meanings.length > 0) {
    const m = dictData.meanings[0];
    
    if (m.definitions && m.definitions.length > 0) {
      definition = m.definitions[0].definition || '';
      example = m.definitions[0].example || '';

      m.definitions.forEach(d => {
        if (d.synonyms) d.synonyms.forEach(s => synonymsSet.add(s));
        if (d.antonyms) d.antonyms.forEach(a => antonymsSet.add(a));
      });
    }

    if (m.synonyms) m.synonyms.forEach(s => synonymsSet.add(s));
    if (m.antonyms) m.antonyms.forEach(a => antonymsSet.add(a));
  }

  // Fallback Definition if DictionaryAPI didn't return one
  if (!definition && dmDefinition) {
    definition = dmDefinition.charAt(0).toUpperCase() + dmDefinition.slice(1);
  }

  if (!definition) {
    definition = trTranslation
      ? `Expresses being ${trTranslation.toLowerCase()}; denoting the quality, action, or state of ${word}.`
      : `The state, quality, or characteristic of ${word}.`;
  }

  // Fallback Example sentence
  if (!example || !example.toLowerCase().includes(word.toLowerCase())) {
    example = `Using "${word}" in sentence practice helps solidify your English mastery.`;
  }

  return {
    word: dictData?.word || word,
    phonetic: formatPhonetic(phonetic, word),
    audioUrl: audioUrl,
    pos: pos,
    synonyms: Array.from(synonymsSet).slice(0, 8),
    antonyms: Array.from(antonymsSet).slice(0, 5),
    definition: definition,
    example: example,
    trNote: trTranslation || ''
  };
}

function renderDictionaryResult(data) {
  const container = document.getElementById('dict-result-container');

  const synPillsHtml = data.synonyms.length > 0
    ? data.synonyms.map(s => `<span class="synonym-pill" onclick="searchSynonymDirectly('${s}')"><i class="fa-solid fa-tag"></i> ${s}</span>`).join('')
    : '<span style="color: var(--text-muted); font-size: 0.9rem;">Eş anlamlı otomatik bulunamadı.</span>';

  const antPillsHtml = data.antonyms.length > 0
    ? data.antonyms.map(a => `<span class="synonym-pill" style="border-color: rgba(239, 68, 68, 0.3); color: #fca5a5;"><i class="fa-solid fa-arrows-left-right"></i> ${a}</span>`).join('')
    : '';

  const isAlreadyInLib = vocabulary.some(v => v.word.toLowerCase() === data.word.toLowerCase());

  const interactiveExample = wrapTextWithClickableWords(data.example);
  const interactiveDefinition = wrapTextWithClickableWords(data.definition);

  container.innerHTML = `
    <div class="glass-card">
      <div class="word-header">
        <div class="word-title-group">
          <h2>${data.word}</h2>
        </div>
        ${data.audioUrl ? `
          <button class="audio-btn" onclick="playAudio('${data.audioUrl}')" title="Sesli Telaffuz Dinle">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        ` : `
          <button class="audio-btn" onclick="speakText('${data.word}')" title="Metinden Sese Telaffuz">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        `}
      </div>

      <!-- AUTOMATIC TURKISH MEANING BADGE -->
      ${data.trNote ? `
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
          <i class="fa-solid fa-language" style="font-size: 1.5rem; color: var(--success);"></i>
          <div>
            <div style="font-size: 0.78rem; text-transform: uppercase; font-weight: 700; color: var(--success);">Otomatik Türkçe Karşılığı:</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${data.trNote}</div>
          </div>
        </div>
      ` : ''}

      <!-- ACCURATE ENGLISH PART OF SPEECH TAG -->
      <span class="pos-tag"><i class="fa-solid fa-cube"></i> ${data.pos}</span>

      <div class="synonyms-section">
        <div class="section-label"><i class="fa-solid fa-diagram-project"></i> Otomatik Çekilen Eş Anlamlılar (Synonyms)</div>
        <div class="synonyms-grid">${synPillsHtml}</div>
      </div>

      ${data.antonyms.length > 0 ? `
        <div class="synonyms-section">
          <div class="section-label" style="color: #fca5a5;"><i class="fa-solid fa-hand-line"></i> Zıt Anlamlılar (Antonyms)</div>
          <div class="synonyms-grid">${antPillsHtml}</div>
        </div>
      ` : ''}

      <!-- REAL ENGLISH DEFINITION WITH CLICKABLE WORDS -->
      <div class="definition-box">
        <div style="font-weight: 700; margin-bottom: 0.3rem;"><i class="fa-solid fa-book-open"></i> İngilizce Tanım (Definition):</div>
        <div style="font-size: 1.05rem; font-weight: 500; color: var(--text-primary);">${interactiveDefinition}</div>
        <div class="example-sentence">
          "${interactiveExample}"
        </div>
      </div>

      <div class="custom-inputs">
        <div class="input-group">
          <label for="custom-tr-note"><i class="fa-solid fa-pen-nib"></i> Türkçe Anlamı / Özel Notunuz:</label>
          <input type="text" id="custom-tr-note" class="form-control" placeholder="Örn: titiz, özenli" value="${data.trNote}" />
        </div>
        <div class="input-group">
          <label for="custom-synonyms-input"><i class="fa-solid fa-plus"></i> İlaveten Eş Anlamlı Ekle (Virgülle Ayırın):</label>
          <input type="text" id="custom-synonyms-input" class="form-control" placeholder="Örn: reluctant, hesitant" />
        </div>
      </div>

      <div class="action-buttons">
        ${isAlreadyInLib ? `
          <button class="btn-secondary" disabled style="opacity: 0.7;">
            <i class="fa-solid fa-check"></i> Bu Kelime Zaten Listenizde Ekli
          </button>
          <button class="btn-secondary" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteWord(event, '${data.word}')">
            <i class="fa-solid fa-trash"></i> Kütüphaneden Sil
          </button>
        ` : `
          <button class="btn-secondary" onclick="addCurrentWordToLib(1)">
            <i class="fa-solid fa-plus"></i> Öğrenilmekte Olanlara Ekle (Kutu 1)
          </button>
          <button class="btn-primary" onclick="addCurrentWordToLib(5)">
            <i class="fa-solid fa-graduation-cap"></i> Doğrudan Öğrenilenlere Ekle
          </button>
        `}
      </div>
    </div>
  `;
}

function searchSynonymDirectly(synWord) {
  document.getElementById('word-search-input').value = synWord;
  handleWordSearch();
}

function playAudio(url) {
  const audio = new Audio(url);
  audio.play().catch(e => {
    console.warn("Audio play blocked, fallback to speech synth", e);
  });
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

// --- Add Word to Vocabulary ---
function addCurrentWordToLib(targetBox) {
  if (!currentSearchData) return;

  const customTr = document.getElementById('custom-tr-note').value.trim() || currentSearchData.trNote;
  const customSynsRaw = document.getElementById('custom-synonyms-input').value.trim();
  
  let finalSynonyms = [...currentSearchData.synonyms];
  if (customSynsRaw) {
    const extraSyns = customSynsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    finalSynonyms = Array.from(new Set([...finalSynonyms, ...extraSyns]));
  }

  const now = Date.now();
  const newWordItem = {
    id: `word_${currentSearchData.word.toLowerCase()}_${now}`,
    word: currentSearchData.word.toLowerCase(),
    phonetic: currentSearchData.phonetic,
    audioUrl: currentSearchData.audioUrl,
    pos: currentSearchData.pos,
    synonyms: finalSynonyms,
    antonyms: currentSearchData.antonyms,
    definition: currentSearchData.definition,
    example: currentSearchData.example,
    trNote: customTr,
    box: targetBox,
    isMastered: targetBox === 5,
    createdAt: now,
    lastReviewed: now,
    nextReviewDate: now,
    reviewCount: 0,
    successCount: 0
  };

  vocabulary.push(newWordItem);
  saveDataToStorage();

  renderDictionaryResult(currentSearchData);
  alert(`"${newWordItem.word}" (${newWordItem.pos}) başarıyla ${targetBox === 5 ? 'Öğrenilenler' : 'Öğrenilmekte Olanlar'} listesine eklendi!`);
}

// --- Update Summary Stats ---
function updateStats() {
  const total = vocabulary.length;
  const learning = vocabulary.filter(v => !v.isMastered).length;
  const mastered = vocabulary.filter(v => v.isMastered).length;
  const now = Date.now();
  const due = vocabulary.filter(v => !v.isMastered && v.nextReviewDate <= now).length;

  document.getElementById('stat-total-words').textContent = total;
  document.getElementById('stat-learning-words').textContent = learning;
  document.getElementById('stat-mastered-words').textContent = mastered;
  document.getElementById('stat-due-today').textContent = due;

  document.getElementById('count-learning-badge').textContent = learning;
  document.getElementById('count-mastered-badge').textContent = mastered;
}

// --- Words List State & Extended Controls ---
let wordViewMode = 'grid'; // 'grid' | 'list'
let activeAlphabetFilter = 'all'; // 'all' | 'A'..'Z'
let wordsCurrentPage = 1;
let wordsPerPage = 24;

function setWordViewMode(mode) {
  wordViewMode = mode;
  document.getElementById('view-mode-grid-btn')?.classList.toggle('active', mode === 'grid');
  document.getElementById('view-mode-list-btn')?.classList.toggle('active', mode === 'list');
  renderWordsGrid();
}

function handleWordsSearchInput() {
  const input = document.getElementById('words-filter-search');
  const clearBtn = document.getElementById('words-search-clear');
  if (clearBtn) {
    clearBtn.style.display = input.value.trim() ? 'block' : 'none';
  }
  wordsCurrentPage = 1;
  renderWordsGrid();
}

function clearWordsSearch() {
  const input = document.getElementById('words-filter-search');
  const clearBtn = document.getElementById('words-search-clear');
  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  wordsCurrentPage = 1;
  renderWordsGrid();
}

function selectAlphabetFilter(letter) {
  activeAlphabetFilter = letter;
  wordsCurrentPage = 1;
  renderWordsGrid();
}

function changeWordsPerPage(val) {
  wordsPerPage = val === 'all' ? 'all' : parseInt(val, 10);
  wordsCurrentPage = 1;
  renderWordsGrid();
}

function changeWordsPage(page) {
  wordsCurrentPage = page;
  renderWordsGrid();
  // Smooth scroll back to top of list
  const controlsEl = document.querySelector('.list-controls');
  if (controlsEl) {
    controlsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderAlphabetBar(availableLettersMap) {
  const barContainer = document.getElementById('words-alphabet-bar');
  if (!barContainer) return;

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let html = `
    <button class="alpha-btn ${activeAlphabetFilter === 'all' ? 'active' : ''}" onclick="selectAlphabetFilter('all')">
      Tümü
    </button>
  `;

  alphabet.forEach(letter => {
    const count = availableLettersMap[letter] || 0;
    const isActive = activeAlphabetFilter === letter;
    const disabledAttr = count === 0 ? 'style="opacity: 0.35;"' : '';
    html += `
      <button class="alpha-btn ${isActive ? 'active' : ''}" ${disabledAttr} onclick="selectAlphabetFilter('${letter}')" title="${letter} (${count} kelime)">
        ${letter}
      </button>
    `;
  });

  barContainer.innerHTML = html;
}

// --- Render Words Grid / List (My Words Tab - Optimized for 500+ words) ---
function renderWordsGrid() {
  updateStats();
  const gridContainer = document.getElementById('words-grid-container');
  const paginationContainer = document.getElementById('words-pagination-container');
  const countInfoEl = document.getElementById('words-count-info');
  
  const searchFilter = (document.getElementById('words-filter-search')?.value || '').toLowerCase().trim();
  const boxFilter = document.getElementById('words-filter-box')?.value || 'all';
  const posFilter = document.getElementById('words-filter-pos')?.value || 'all';
  const sortOption = document.getElementById('words-sort')?.value || 'az';

  // 1. Gather all words for active sub-tab to build alphabet map
  const subTabWords = vocabulary.filter(item => activeSubTab === 'mastered' ? item.isMastered : !item.isMastered);
  const letterCounts = {};
  subTabWords.forEach(w => {
    const firstChar = (w.word || '').charAt(0).toUpperCase();
    if (firstChar >= 'A' && firstChar <= 'Z') {
      letterCounts[firstChar] = (letterCounts[firstChar] || 0) + 1;
    }
  });
  renderAlphabetBar(letterCounts);

  // 2. Filter vocabulary
  let filtered = subTabWords.filter(item => {
    if (boxFilter !== 'all' && item.box != boxFilter) return false;

    if (posFilter !== 'all') {
      const itemPos = (item.pos || 'noun').toLowerCase().trim();
      if (itemPos !== posFilter) return false;
    }

    if (activeAlphabetFilter !== 'all') {
      const itemFirstChar = (item.word || '').charAt(0).toUpperCase();
      if (itemFirstChar !== activeAlphabetFilter) return false;
    }

    if (searchFilter) {
      const matchWord = item.word.toLowerCase().includes(searchFilter);
      const matchTr = (item.trNote || '').toLowerCase().includes(searchFilter);
      const matchSyn = item.synonyms && item.synonyms.some(s => s.toLowerCase().includes(searchFilter));
      const matchEx = (item.example || '').toLowerCase().includes(searchFilter);
      if (!matchWord && !matchTr && !matchSyn && !matchEx) return false;
    }

    return true;
  });

  // 3. Sort words
  filtered.sort((a, b) => {
    switch (sortOption) {
      case 'az':
        return a.word.localeCompare(b.word);
      case 'za':
        return b.word.localeCompare(a.word);
      case 'newest':
        return (b.id || 0) - (a.id || 0);
      case 'box-asc':
        return (a.box || 1) - (b.box || 1);
      case 'box-desc':
        return (b.box || 1) - (a.box || 1);
      default:
        return a.word.localeCompare(b.word);
    }
  });

  // 4. Update count info
  const totalCount = filtered.length;
  if (totalCount === 0) {
    if (countInfoEl) countInfoEl.innerHTML = `<strong>0</strong> kelime bulundu`;
    if (paginationContainer) paginationContainer.innerHTML = '';
    gridContainer.className = 'words-grid';
    gridContainer.innerHTML = `
      <div class="glass-card text-center" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <i class="fa-solid fa-filter-circle-xmark" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
        <h3>Aradığınız Kriterlere Uygun Kelime Bulunamadı</h3>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Filtreleri veya arama terimini temizleyerek tekrar deneyebilirsiniz.</p>
        <button class="btn-secondary" style="margin-top: 1rem;" onclick="clearWordsSearch(); selectAlphabetFilter('all');">
          <i class="fa-solid fa-rotate-left"></i> Filtreleri Sıfırla
        </button>
      </div>
    `;
    return;
  }

  // 5. Pagination calculation
  let paginatedList = filtered;
  let totalPages = 1;
  let startIndex = 0;
  let endIndex = totalCount;

  if (wordsPerPage !== 'all') {
    totalPages = Math.ceil(totalCount / wordsPerPage) || 1;
    if (wordsCurrentPage > totalPages) wordsCurrentPage = totalPages;
    if (wordsCurrentPage < 1) wordsCurrentPage = 1;

    startIndex = (wordsCurrentPage - 1) * wordsPerPage;
    endIndex = Math.min(startIndex + wordsPerPage, totalCount);
    paginatedList = filtered.slice(startIndex, endIndex);

    if (countInfoEl) {
      countInfoEl.innerHTML = `Toplam <strong>${totalCount}</strong> kelimeden <strong>${startIndex + 1} - ${endIndex}</strong> arası gösteriliyor (Sayfa ${wordsCurrentPage} / ${totalPages})`;
    }
  } else {
    wordsCurrentPage = 1;
    if (countInfoEl) {
      countInfoEl.innerHTML = `Toplam <strong>${totalCount}</strong> kelimenin tamamı gösteriliyor`;
    }
  }

  // 6. Render either Card Grid or Compact List View
  if (wordViewMode === 'list') {
    gridContainer.className = 'words-compact-list';
    gridContainer.innerHTML = paginatedList.map(item => {
      const topSyns = item.synonyms ? item.synonyms.slice(0, 3).map(s => `<span class="syn-pill">${s}</span>`).join('') : '';
      return `
        <div class="word-compact-item">
          <div class="compact-col-main">
            <div>
              <span class="compact-word-title">${item.word}</span>
            </div>
            <span class="pos-tag" style="font-size: 0.7rem; padding: 0.12rem 0.45rem;"><i class="fa-solid fa-cube"></i> ${item.pos}</span>
          </div>

          <div class="compact-col-tr">
            ${item.trNote ? `<i class="fa-solid fa-language"></i> ${item.trNote}` : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>'}
          </div>

          <div class="compact-col-syn">
            ${topSyns || '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
          </div>

          <div style="flex-shrink: 0;">
            <span class="box-badge b-${item.box}">
              ${item.isMastered ? '<i class="fa-solid fa-graduation-cap"></i>' : `<i class="fa-solid fa-box"></i> K${item.box}`}
            </span>
          </div>

          <div class="compact-col-actions">
            <button class="card-action-icon" onclick="speakText('${item.word}')" title="Dinle">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            ${item.isMastered ? `
              <button class="btn-secondary" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;" onclick="moveWordBox('${item.id}', 1)" title="Öğrenilmekte Olana Al">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            ` : `
              <button class="btn-secondary" style="font-size: 0.74rem; padding: 0.25rem 0.6rem;" onclick="moveWordBox('${item.id}', 5)" title="Öğrenildi İşaretle">
                <i class="fa-solid fa-check"></i>
              </button>
            `}
            <button class="card-action-icon delete" onclick="deleteWord(event, '${item.id}')" title="Sil">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    gridContainer.className = 'words-grid';
    gridContainer.innerHTML = paginatedList.map(item => {
      const synPills = item.synonyms && item.synonyms.length ? item.synonyms.slice(0, 4).map(s => `<span class="syn-pill">${s}</span>`).join('') : '<span style="font-size: 0.8rem; color: var(--text-muted);">Eş anlamlı yok</span>';
      const interactiveEx = wrapTextWithClickableWords(item.example);

      return `
        <div class="glass-card word-card glass-card-hover">
          <div class="word-card-top">
            <div>
              <div class="word-card-title">${item.word}</div>
            </div>
            <span class="box-badge b-${item.box}">
              ${item.isMastered ? '<i class="fa-solid fa-graduation-cap"></i> Öğrenildi' : `<i class="fa-solid fa-box"></i> Kutu ${item.box}`}
            </span>
          </div>

          <div style="margin-bottom: 0.5rem;">
            <span class="pos-tag" style="font-size: 0.72rem; padding: 0.15rem 0.5rem;"><i class="fa-solid fa-cube"></i> ${item.pos}</span>
          </div>

          <div class="word-card-synonyms">
            ${synPills}
          </div>

          ${item.trNote ? `<div class="word-card-tr"><i class="fa-solid fa-language"></i> ${item.trNote}</div>` : ''}

          <div style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic; margin-bottom: 1rem; line-height: 1.5;">
            "${interactiveEx}"
          </div>

          <div class="word-card-footer">
            <button class="card-action-icon" onclick="speakText('${item.word}')" title="Dinle">
              <i class="fa-solid fa-volume-high"></i>
            </button>

            <div style="display: flex; gap: 0.5rem;">
              ${item.isMastered ? `
                <button class="btn-secondary" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="moveWordBox('${item.id}', 1)">
                  <i class="fa-solid fa-arrow-rotate-left"></i> Öğrenilmekte Olana Al
                </button>
              ` : `
                <button class="btn-secondary" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="moveWordBox('${item.id}', 5)">
                  <i class="fa-solid fa-check"></i> Öğrenildi İşaretle
                </button>
              `}
              <button class="card-action-icon delete" onclick="deleteWord(event, '${item.id}')" title="Sil">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 7. Render Pagination Buttons
  if (paginationContainer) {
    if (wordsPerPage === 'all' || totalPages <= 1) {
      paginationContainer.innerHTML = '';
    } else {
      let pageButtonsHtml = `
        <button class="page-btn" ${wordsCurrentPage === 1 ? 'disabled' : ''} onclick="changeWordsPage(${wordsCurrentPage - 1})">
          <i class="fa-solid fa-chevron-left"></i> Önceki
        </button>
      `;

      // Smart page window: 1 ... current-1, current, current+1 ... totalPages
      const pageNumbers = [];
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= wordsCurrentPage - 2 && p <= wordsCurrentPage + 2)) {
          pageNumbers.push(p);
        } else if (pageNumbers[pageNumbers.length - 1] !== '...') {
          pageNumbers.push('...');
        }
      }

      pageNumbers.forEach(p => {
        if (p === '...') {
          pageButtonsHtml += `<span style="padding: 0.5rem 0.3rem; color: var(--text-muted);">...</span>`;
        } else {
          pageButtonsHtml += `
            <button class="page-btn ${p === wordsCurrentPage ? 'active' : ''}" onclick="changeWordsPage(${p})">
              ${p}
            </button>
          `;
        }
      });

      pageButtonsHtml += `
        <button class="page-btn" ${wordsCurrentPage === totalPages ? 'disabled' : ''} onclick="changeWordsPage(${wordsCurrentPage + 1})">
          Sonraki <i class="fa-solid fa-chevron-right"></i>
        </button>
      `;

      paginationContainer.innerHTML = pageButtonsHtml;
    }
  }
}

function moveWordBox(id, targetBox) {
  const item = vocabulary.find(v => v.id === id);
  if (!item) return;

  item.box = targetBox;
  item.isMastered = targetBox === 5;
  saveDataToStorage();

  if (targetBox === 5 && typeof confetti === 'function') {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  }

  renderWordsGrid();
}

let undoDeleteState = null;
let undoToastTimeout = null;

function deleteWord(e, targetIdOrWord) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (!targetIdOrWord) return;

  const targetStr = targetIdOrWord.toString().toLowerCase().trim();
  const itemIndex = vocabulary.findIndex(v => v.id.toLowerCase() === targetStr || v.word.toLowerCase() === targetStr);

  if (itemIndex === -1) return;

  const deletedItem = vocabulary[itemIndex];
  
  // Remove item immediately
  vocabulary.splice(itemIndex, 1);
  saveDataToStorage();
  updateStats();
  renderWordsGrid();

  if (currentSearchData && currentSearchData.word.toLowerCase() === targetStr) {
    renderDictionaryResult(currentSearchData);
  }

  // Show Undo Toast
  showUndoDeleteToast(deletedItem);
}

function showUndoDeleteToast(deletedItem) {
  undoDeleteState = deletedItem;
  if (undoToastTimeout) clearTimeout(undoToastTimeout);

  let toast = document.getElementById('delete-undo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'delete-undo-toast';
    toast.className = 'glass-card';
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 2rem;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border: 1px solid var(--danger);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div style="font-size: 0.92rem; color: var(--text-primary);">
      <i class="fa-solid fa-trash-can" style="color: var(--danger); margin-right: 0.4rem;"></i>
      <strong>"${deletedItem.word.toUpperCase()}"</strong> silindi.
    </div>
    <button class="btn-secondary" onclick="undoLastDelete()" style="padding: 0.35rem 0.75rem; font-size: 0.82rem; border-color: var(--accent-primary); color: var(--accent-secondary);">
      <i class="fa-solid fa-rotate-left"></i> Geri Al
    </button>
  `;
  toast.style.display = 'flex';

  undoToastTimeout = setTimeout(() => {
    toast.style.display = 'none';
    undoDeleteState = null;
  }, 4500);
}

function undoLastDelete() {
  if (!undoDeleteState) return;

  vocabulary.push(undoDeleteState);
  saveDataToStorage();
  updateStats();
  renderWordsGrid();

  if (currentSearchData && currentSearchData.word.toLowerCase() === undoDeleteState.word.toLowerCase()) {
    renderDictionaryResult(currentSearchData);
  }

  const toast = document.getElementById('delete-undo-toast');
  if (toast) toast.style.display = 'none';
  if (undoToastTimeout) clearTimeout(undoToastTimeout);
  undoDeleteState = null;
}

// --- Practice Modes Handler ---
let speedTimerInterval = null;

function startPracticeMode(mode) {
  const learningList = vocabulary.filter(v => !v.isMastered);
  if (learningList.length === 0) {
    alert("Pratik yapmak için önce 'Öğrenilmekte Olanlar' listenize birkaç kelime eklemelisiniz!");
    return;
  }

  currentPracticeMode = mode;
  document.getElementById('practice-selector-screen').style.display = 'none';
  document.getElementById('practice-active-screen').style.display = 'block';

  if (mode === 'flashcards') {
    initFlashcardsGame(learningList);
  } else if (mode === 'quiz') {
    initQuizGame(learningList);
  } else if (mode === 'spelling') {
    initSpellingGame(learningList);
  } else if (mode === 'matching') {
    initMatchingGame(learningList);
  } else if (mode === 'listening') {
    initListeningGame(learningList);
  } else if (mode === 'cloze') {
    initClozeGame(learningList);
  } else if (mode === 'speed') {
    initSpeedGame(learningList);
  }
}

function exitPracticeMode() {
  if (speedTimerInterval) {
    clearInterval(speedTimerInterval);
    speedTimerInterval = null;
  }
  document.getElementById('practice-active-screen').style.display = 'none';
  document.getElementById('practice-selector-screen').style.display = 'block';
  renderWordsGrid();
}

// --- Mode 1: Flashcards ---
function initFlashcardsGame(list) {
  practiceSession = { list: [...list].sort(() => Math.random() - 0.5), index: 0 };
  renderFlashcardCurrent();
}

function renderFlashcardCurrent() {
  const { list, index } = practiceSession;
  if (index >= list.length) {
    document.getElementById('active-game-container').innerHTML = `
      <div class="glass-card text-center" style="text-align: center; padding: 3rem;">
        <i class="fa-solid fa-trophy" style="font-size: 3.5rem; color: var(--warning); margin-bottom: 1rem;"></i>
        <h2>Harika! Tüm Kartları Tamamladınız</h2>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Bugünkü pratik seansınız bitti. Kelimeleriniz aralıklı tekrar algoritmasına göre güncellendi.</p>
        <button class="btn-primary" style="margin-top: 1.5rem;" onclick="exitPracticeMode()">Tamamla & Çık</button>
      </div>
    `;
    return;
  }

  const item = list[index];
  document.getElementById('practice-progress-text').textContent = `Kart ${index + 1} / ${list.length}`;

  const wordRegex = new RegExp(item.word, 'gi');
  const clozeSentence = item.example.replace(wordRegex, '_______');

  const container = document.getElementById('active-game-container');
  container.innerHTML = `
    <div class="flashcard-wrapper">
      <div class="flashcard-3d" id="flashcard-card" onclick="this.classList.toggle('flipped')">
        
        <!-- Front Side (Active Recall) -->
        <div class="card-face card-face-front">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="pos-tag" style="font-size: 0.78rem; padding: 0.18rem 0.55rem;"><i class="fa-solid fa-cube"></i> ${item.pos}</span>
            <span class="box-badge b-${item.box}"><i class="fa-solid fa-box"></i> Kutu ${item.box}</span>
          </div>

          <div style="text-align: center; margin: 1.25rem 0;">
            <div style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; line-height: 1.2;">${item.word}</div>
            <button class="audio-btn" style="margin: 0.75rem auto 0 auto;" onclick="event.stopPropagation(); speakText('${item.word}')" title="Dinle">
              <i class="fa-solid fa-volume-high"></i>
            </button>
          </div>

          <div class="example-sentence text-center" style="text-align: center; font-size: 0.95rem; line-height: 1.5; padding: 0.85rem 1rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border: 1px dashed var(--glass-border);">
            "${clozeSentence}"
          </div>

          <div style="text-align: center; font-size: 0.82rem; color: var(--text-muted); margin-top: 0.75rem;">
            <i class="fa-solid fa-rotate"></i> Çevirmek için karta dokunun
          </div>
        </div>

        <!-- Back Side (Answer Revealed) -->
        <div class="card-face card-face-back">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.6rem;">
            <span class="pos-tag" style="font-size: 0.78rem; padding: 0.18rem 0.55rem;"><i class="fa-solid fa-cube"></i> ${item.pos}</span>
            <span class="box-badge b-${item.box}"><i class="fa-solid fa-box"></i> Kutu ${item.box}</span>
          </div>

          <div style="margin-bottom: 0.6rem;">
            <div style="color: var(--accent-secondary); font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; line-height: 1.2;">${item.word}</div>
            ${item.trNote ? `<div style="font-size: 1.05rem; font-weight: 700; color: var(--success); margin-top: 0.25rem;"><i class="fa-solid fa-language"></i> ${item.trNote}</div>` : ''}
          </div>

          <div style="margin-bottom: 0.6rem;">
            <div style="font-weight: 700; font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Eş Anlamlıları (Synonyms):</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
              ${item.synonyms && item.synonyms.length ? item.synonyms.map(s => `<span class="synonym-pill" style="font-size: 0.8rem; padding: 0.15rem 0.5rem;">${s}</span>`).join('') : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>'}
            </div>
          </div>

          <div class="definition-box" style="margin-bottom: 0.6rem; padding: 0.75rem; font-size: 0.88rem; line-height: 1.45;">
            <strong>İngilizce Tanım:</strong> ${item.definition}
          </div>

          <div style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-secondary); line-height: 1.45;">
            "${item.example}"
          </div>
        </div>

      </div>

      <!-- Rating Controls -->
      <div class="flashcard-controls">
        <button class="btn-rate wrong" onclick="event.stopPropagation(); rateFlashcard(1)">
          <i class="fa-solid fa-rotate-left"></i> Unuttum (Kutu 1)
        </button>
        <button class="btn-rate hard" onclick="event.stopPropagation(); rateFlashcard(${item.box})">
          <i class="fa-solid fa-minus"></i> Zor (Kutu ${item.box})
        </button>
        <button class="btn-rate easy" onclick="event.stopPropagation(); rateFlashcard(${item.box + 1})">
          <i class="fa-solid fa-check"></i> Bildim (+1)
        </button>
      </div>
    </div>
  `;
}

function rateFlashcard(newBoxLevel) {
  const { list, index } = practiceSession;
  const item = vocabulary.find(v => v.id === list[index].id);

  if (item) {
    const cappedBox = Math.min(5, Math.max(1, newBoxLevel));
    item.box = cappedBox;
    item.isMastered = cappedBox === 5;
    item.reviewCount += 1;
    item.lastReviewed = Date.now();
    saveDataToStorage();

    if (cappedBox === 5 && typeof confetti === 'function') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  }

  practiceSession.index += 1;
  renderFlashcardCurrent();
}

// --- Mode 2: Quiz ---
function initQuizGame(list) {
  practiceSession = { list: [...list].sort(() => Math.random() - 0.5), index: 0, score: 0 };
  renderQuizCurrent();
}

function renderQuizCurrent() {
  const { list, index, score } = practiceSession;
  if (index >= list.length) {
    document.getElementById('active-game-container').innerHTML = `
      <div class="glass-card text-center" style="text-align: center; padding: 3rem; max-width: 500px; margin: 0 auto;">
        <i class="fa-solid fa-award" style="font-size: 3.5rem; color: var(--accent-secondary); margin-bottom: 1rem;"></i>
        <h2>Quiz Tamamlandı!</h2>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--success); margin: 1rem 0;">Skorunuz: ${score} / ${list.length}</div>
        <button class="btn-primary" onclick="exitPracticeMode()">Tamamla & Çık</button>
      </div>
    `;
    return;
  }

  const currentItem = list[index];
  document.getElementById('practice-progress-text').textContent = `Soru ${index + 1} / ${list.length}`;

  const correctOption = currentItem.synonyms.length > 0 ? currentItem.synonyms[0] : (currentItem.trNote || currentItem.word);
  
  let optionsPool = [correctOption];
  const allOtherSyns = vocabulary
    .filter(v => v.id !== currentItem.id)
    .flatMap(v => [v.word, ...v.synonyms, v.trNote])
    .filter(Boolean);

  while (optionsPool.length < 4 && allOtherSyns.length > 0) {
    const rand = allOtherSyns[Math.floor(Math.random() * allOtherSyns.length)];
    if (!optionsPool.includes(rand)) {
      optionsPool.push(rand);
    }
  }
  const fallbackWords = ["unwilling", "copious", "thorough", "practical", "credible", "vague"];
  for (let fw of fallbackWords) {
    if (optionsPool.length >= 4) break;
    if (!optionsPool.includes(fw)) optionsPool.push(fw);
  }

  optionsPool.sort(() => Math.random() - 0.5);

  const container = document.getElementById('active-game-container');
  container.innerHTML = `
    <div class="glass-card" style="max-width: 650px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span class="pos-tag"><i class="fa-solid fa-cube"></i> ${currentItem.pos}</span>
        <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin-top: 0.5rem;">"${currentItem.word}"</h2>
        <p style="color: var(--text-secondary); margin-top: 0.4rem;">Kelimesinin en uygun eş anlamlısı aşağıdakilerden hangisidir?</p>
      </div>

      <div class="quiz-options-grid">
        ${optionsPool.map((opt, i) => `
          <button class="quiz-option-btn" id="quiz-opt-${i}" onclick="checkQuizAnswer(this, '${opt}', '${correctOption}')">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function checkQuizAnswer(btnEl, selected, correct) {
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();
  const currentItem = practiceSession.list ? practiceSession.list[practiceSession.index] : null;
  
  if (isCorrect) {
    btnEl.classList.add('correct');
    practiceSession.score += 1;
    playChime(true);
  } else {
    btnEl.classList.add('wrong');
    playChime(false);
    if (currentItem) handleWrongAnswerPrompt(currentItem.word, currentItem.trNote);
  }

  document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);

  setTimeout(() => {
    practiceSession.index += 1;
    renderQuizCurrent();
  }, 1200);
}

function playChime(isSuccess) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(196, ctx.currentTime + 0.1);
    }

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

// --- Mode 3: Spelling Practice ---
function initSpellingGame(list) {
  practiceSession = { list: [...list].sort(() => Math.random() - 0.5), index: 0, score: 0 };
  renderSpellingCurrent();
}

function renderSpellingCurrent() {
  const { list, index } = practiceSession;
  if (index >= list.length) {
    document.getElementById('active-game-container').innerHTML = `
      <div class="glass-card text-center" style="text-align: center; padding: 3rem; max-width: 500px; margin: 0 auto;">
        <i class="fa-solid fa-keyboard" style="font-size: 3.5rem; color: var(--success); margin-bottom: 1rem;"></i>
        <h2>İmla Pratiği Tamamlandı!</h2>
        <button class="btn-primary" style="margin-top: 1.5rem;" onclick="exitPracticeMode()">Tamamla & Çık</button>
      </div>
    `;
    return;
  }

  const currentItem = list[index];
  document.getElementById('practice-progress-text').textContent = `Kelime ${index + 1} / ${list.length}`;

  const container = document.getElementById('active-game-container');
  container.innerHTML = `
    <div class="glass-card" style="max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="margin-bottom: 0.5rem;"><span class="pos-tag"><i class="fa-solid fa-cube"></i> ${currentItem.pos}</span></div>
        <div style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1rem;">
          <i class="fa-solid fa-lightbulb" style="color: var(--warning);"></i> <strong>Eş Anlamlıları:</strong> ${currentItem.synonyms.join(', ') || 'N/A'}
        </div>
        ${currentItem.trNote ? `<div style="font-weight: 700; color: var(--accent-secondary);"><i class="fa-solid fa-language"></i> Türkçe: ${currentItem.trNote}</div>` : ''}
      </div>

      <div class="definition-box" style="margin-bottom: 1.5rem;">
        <strong>İngilizce Tanım:</strong> ${currentItem.definition}
      </div>

      <form onsubmit="handleSpellingSubmit(event, '${currentItem.word}')">
        <div class="spelling-input-row" style="display: flex; gap: 0.75rem; align-items: stretch;">
          <input type="text" id="spelling-input" class="form-control" placeholder="İngilizce kelimeyi yazın..." autocomplete="off" required autofocus style="flex: 1; min-width: 0;" />
          <button type="submit" class="btn-primary" style="white-space: nowrap; flex-shrink: 0; padding: 0.85rem 1.5rem;">Kontrol Et</button>
        </div>
      </form>
      <div id="spelling-feedback" style="margin-top: 1rem; text-align: center; font-weight: 700;"></div>
    </div>
  `;
}

function handleSpellingSubmit(e, targetWord) {
  e.preventDefault();
  const inputEl = document.getElementById('spelling-input');
  const feedbackEl = document.getElementById('spelling-feedback');
  const userVal = inputEl.value.trim().toLowerCase();

  if (userVal === targetWord.toLowerCase()) {
    feedbackEl.innerHTML = `<span style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> TEBRİKLER! Doğru Yazdınız.</span>`;
    playChime(true);
    setTimeout(() => {
      practiceSession.index += 1;
      renderSpellingCurrent();
    }, 1000);
  } else {
    feedbackEl.innerHTML = `<span style="color: var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Yanlış. Doğru Cevap: "${targetWord}"</span>`;
    playChime(false);
    handleWrongAnswerPrompt(targetWord);
  }
}

// --- Mode 4: Fast Synonym Matching Game ---
function initMatchingGame(list) {
  const sampleWords = list.slice(0, 4);
  let cards = [];
  sampleWords.forEach((item, idx) => {
    const syn = item.synonyms[0] || item.trNote || item.word;
    cards.push({ id: idx, text: item.word, type: 'word' });
    cards.push({ id: idx, text: syn, type: 'syn' });
  });

  cards.sort(() => Math.random() - 0.5);
  practiceSession = { cards, selected: [], matches: 0, total: sampleWords.length };
  renderMatchingGrid();
}

function renderMatchingGrid() {
  const { cards } = practiceSession;
  const container = document.getElementById('active-game-container');
  
  container.innerHTML = `
    <div style="max-width: 650px; margin: 0 auto;">
      <h3 class="text-center" style="text-align: center; margin-bottom: 1.5rem;">
        Eşleşen Kelimeleri ve Eş Anlamlılarını Eşleştirin
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">
        ${cards.map((c, i) => `
          <button class="match-card-btn" id="match-card-${i}" onclick="handleMatchingCardClick(${i})">
            ${c.text}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function handleMatchingCardClick(index) {
  const { cards, selected } = practiceSession;
  const btn = document.getElementById(`match-card-${index}`);
  
  if (selected.length === 1 && selected[0].index === index) return;

  btn.style.borderColor = 'var(--accent-primary)';
  btn.style.background = 'rgba(139, 92, 246, 0.25)';
  btn.style.color = 'var(--accent-secondary)';
  selected.push({ index, card: cards[index] });

  if (selected.length === 2) {
    const [c1, c2] = selected;
    if (c1.card.id === c2.card.id && c1.card.type !== c2.card.type) {
      playChime(true);
      document.getElementById(`match-card-${c1.index}`).style.visibility = 'hidden';
      document.getElementById(`match-card-${c2.index}`).style.visibility = 'hidden';
      practiceSession.matches += 1;
      practiceSession.selected = [];

      if (practiceSession.matches >= practiceSession.total) {
        setTimeout(() => {
          document.getElementById('active-game-container').innerHTML = `
            <div class="glass-card text-center" style="text-align: center; padding: 3rem;">
              <i class="fa-solid fa-puzzle-piece" style="font-size: 3.5rem; color: var(--accent-secondary); margin-bottom: 1rem;"></i>
              <h2>Muazzam! Tüm Eşleşmeleri Buldunuz</h2>
              <button class="btn-primary" style="margin-top: 1.5rem;" onclick="exitPracticeMode()">Tamamla & Çık</button>
            </div>
          `;
        }, 500);
      }
    } else {
      playChime(false);
      setTimeout(() => {
        const b1 = document.getElementById(`match-card-${c1.index}`);
        const b2 = document.getElementById(`match-card-${c2.index}`);
        if (b1) {
          b1.style.borderColor = 'var(--glass-border)';
          b1.style.background = 'var(--bg-secondary)';
          b1.style.color = 'var(--text-primary)';
        }
        if (b2) {
          b2.style.borderColor = 'var(--glass-border)';
          b2.style.background = 'var(--bg-secondary)';
          b2.style.color = 'var(--text-primary)';
        }
        practiceSession.selected = [];
      }, 700);
    }
  }
}

// --- Mode 5: Listening & Speech Practice Game ---
function initListeningGame(list) {
  practiceSession = { list: [...list].sort(() => Math.random() - 0.5), index: 0, score: 0 };
  renderListeningCurrent();
}

function renderListeningCurrent() {
  const { list, index, score } = practiceSession;
  if (index >= list.length) {
    document.getElementById('active-game-container').innerHTML = `
      <div class="glass-card text-center" style="text-align: center; padding: 3rem; max-width: 500px; margin: 0 auto;">
        <i class="fa-solid fa-headphones" style="font-size: 3.5rem; color: #06b6d4; margin-bottom: 1rem;"></i>
        <h2>Dinleme Pratiği Tamamlandı!</h2>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--success); margin: 1rem 0;">Skorunuz: ${score} / ${list.length}</div>
        <button class="btn-primary" onclick="exitPracticeMode()">Tamamla & Çık</button>
      </div>
    `;
    return;
  }

  const item = list[index];
  document.getElementById('practice-progress-text').textContent = `Dinleme ${index + 1} / ${list.length}`;

  setTimeout(() => speakText(item.word), 300);

  const correctAnswer = item.word;
  let optionsPool = [correctAnswer];
  const distractors = vocabulary.filter(v => v.id !== item.id).map(v => v.word);
  while (optionsPool.length < 4 && distractors.length > 0) {
    const rand = distractors[Math.floor(Math.random() * distractors.length)];
    if (!optionsPool.includes(rand)) optionsPool.push(rand);
  }
  optionsPool.sort(() => Math.random() - 0.5);

  const container = document.getElementById('active-game-container');
  container.innerHTML = `
    <div class="glass-card text-center" style="max-width: 580px; margin: 0 auto; padding: 2.5rem 2rem;">
      <div style="margin-bottom: 1.5rem;">
        <button class="btn-primary" style="width: 80px; height: 80px; border-radius: 50%; font-size: 2rem; padding: 0; box-shadow: 0 0 25px rgba(6, 182, 212, 0.5);" onclick="speakText('${item.word}')">
          <i class="fa-solid fa-volume-high"></i>
        </button>
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.75rem;">Kelimeyi tekrar dinlemek için butona tıklayın</div>
      </div>

      <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--accent-secondary);">
        Duyduğunuz kelime aşağıdakilerden hangisidir?
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        ${optionsPool.map((opt) => `
          <button class="btn-secondary" style="padding: 1.1rem; font-size: 1.1rem; font-weight: 700; justify-content: center;" onclick="checkListeningAnswer(this, '${opt}', '${correctAnswer}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="listening-feedback" style="margin-top: 1.25rem; font-weight: 700; min-height: 24px;"></div>
    </div>
  `;
}

function checkListeningAnswer(btnEl, selected, correct) {
  const feedbackEl = document.getElementById('listening-feedback');
  if (selected === correct) {
    btnEl.style.background = 'var(--success-bg)';
    btnEl.style.borderColor = 'var(--success)';
    btnEl.style.color = 'var(--success)';
    feedbackEl.innerHTML = `<span style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> Harika! Doğru Telaffuz</span>`;
    playChime(true);
    practiceSession.score += 1;
    setTimeout(() => {
      practiceSession.index += 1;
      renderListeningCurrent();
    }, 1000);
  } else {
    btnEl.style.background = 'var(--danger-bg)';
    btnEl.style.borderColor = 'var(--danger)';
    btnEl.style.color = 'var(--danger)';
    feedbackEl.innerHTML = `<span style="color: var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Yanlış. Doğru Kelime: "${correct}"</span>`;
    playChime(false);
    handleWrongAnswerPrompt(correct);
  }
}

// --- Mode 6: Sentence Cloze Gap Fill Game ---
function initClozeGame(list) {
  practiceSession = { list: [...list].sort(() => Math.random() - 0.5), index: 0, score: 0 };
  renderClozeCurrent();
}

function renderClozeCurrent() {
  const { list, index, score } = practiceSession;
  if (index >= list.length) {
    document.getElementById('active-game-container').innerHTML = `
      <div class="glass-card text-center" style="text-align: center; padding: 3rem; max-width: 500px; margin: 0 auto;">
        <i class="fa-solid fa-pen-fancy" style="font-size: 3.5rem; color: #ec4899; margin-bottom: 1rem;"></i>
        <h2>Cümle İçi Boşluk Doldurma Tamamlandı!</h2>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--success); margin: 1rem 0;">Skorunuz: ${score} / ${list.length}</div>
        <button class="btn-primary" onclick="exitPracticeMode()">Tamamla & Çık</button>
      </div>
    `;
    return;
  }

  const item = list[index];
  document.getElementById('practice-progress-text').textContent = `Boşluk Doldurma ${index + 1} / ${list.length}`;

  const wordRegex = new RegExp(item.word, 'gi');
  const clozeSentence = item.example.replace(wordRegex, '_______');

  const correctAnswer = item.word;
  let optionsPool = [correctAnswer];
  const distractors = vocabulary.filter(v => v.id !== item.id).map(v => v.word);
  while (optionsPool.length < 4 && distractors.length > 0) {
    const rand = distractors[Math.floor(Math.random() * distractors.length)];
    if (!optionsPool.includes(rand)) optionsPool.push(rand);
  }
  optionsPool.sort(() => Math.random() - 0.5);

  const container = document.getElementById('active-game-container');
  container.innerHTML = `
    <div class="glass-card" style="max-width: 650px; margin: 0 auto; padding: 2.5rem 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span class="pos-tag"><i class="fa-solid fa-cube"></i> ${item.pos}</span>
        <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-lightbulb"></i> İpucu: ${item.trNote || item.synonyms[0] || ''}</span>
      </div>

      <div style="font-size: 1.25rem; font-weight: 600; line-height: 1.6; text-align: center; margin: 1.5rem 0; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border: 1px dashed var(--glass-border);">
        "${clozeSentence}"
      </div>

      <div style="font-size: 0.95rem; text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;">
        Cümledeki boşluğa uygun olan kelimeyi seçin:
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        ${optionsPool.map((opt) => `
          <button class="btn-secondary" style="padding: 1rem; font-size: 1.05rem; font-weight: 700; justify-content: center;" onclick="checkClozeAnswer(this, '${opt}', '${correctAnswer}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="cloze-feedback" style="margin-top: 1.25rem; text-align: center; font-weight: 700; min-height: 24px;"></div>
    </div>
  `;
}

function checkClozeAnswer(btnEl, selected, correct) {
  const feedbackEl = document.getElementById('cloze-feedback');
  if (selected === correct) {
    btnEl.style.background = 'var(--success-bg)';
    btnEl.style.borderColor = 'var(--success)';
    btnEl.style.color = 'var(--success)';
    feedbackEl.innerHTML = `<span style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> Doğru Seçenek! Cümle tamamlandı.</span>`;
    playChime(true);
    practiceSession.score += 1;
    setTimeout(() => {
      practiceSession.index += 1;
      renderClozeCurrent();
    }, 1000);
  } else {
    btnEl.style.background = 'var(--danger-bg)';
    btnEl.style.borderColor = 'var(--danger)';
    btnEl.style.color = 'var(--danger)';
    feedbackEl.innerHTML = `<span style="color: var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Yanlış. Doğru Kelime: "${correct}"</span>`;
    playChime(false);
    handleWrongAnswerPrompt(correct);
  }
}

// --- Mode 7: 30-Second Speed Challenge Game ---
function initSpeedGame(list) {
  if (speedTimerInterval) clearInterval(speedTimerInterval);
  practiceSession = {
    list: [...list].sort(() => Math.random() - 0.5),
    score: 0,
    total: 0,
    timeLeft: 30
  };
  
  speedTimerInterval = setInterval(() => {
    practiceSession.timeLeft -= 1;
    const timerEl = document.getElementById('speed-timer-count');
    if (timerEl) timerEl.textContent = practiceSession.timeLeft;

    if (practiceSession.timeLeft <= 0) {
      clearInterval(speedTimerInterval);
      speedTimerInterval = null;
      renderSpeedEndScreen();
    }
  }, 1000);

  renderSpeedCurrent();
}

function renderSpeedCurrent() {
  if (practiceSession.timeLeft <= 0) return;
  const { list, score, total, timeLeft } = practiceSession;

  const targetItem = list[Math.floor(Math.random() * list.length)];
  const isCorrectPair = Math.random() > 0.5;

  let proposedMeaning = targetItem.trNote || targetItem.synonyms[0] || 'açıklama';
  if (!isCorrectPair) {
    const wrongItems = vocabulary.filter(v => v.id !== targetItem.id);
    if (wrongItems.length > 0) {
      const randWrong = wrongItems[Math.floor(Math.random() * wrongItems.length)];
      proposedMeaning = randWrong.trNote || randWrong.synonyms[0] || 'farklı anlam';
    } else {
      proposedMeaning = 'farklı anlam';
    }
  }

  practiceSession.currentPair = { word: targetItem.word, isCorrect: isCorrectPair };
  document.getElementById('practice-progress-text').textContent = `Süre: ${timeLeft} sn | Skor: ${score}`;

  const container = document.getElementById('active-game-container');
  container.innerHTML = `
    <div class="glass-card text-center" style="max-width: 580px; margin: 0 auto; padding: 2.5rem 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div style="font-size: 1.25rem; font-weight: 800; color: #f59e0b;">
          <i class="fa-solid fa-clock"></i> <span id="speed-timer-count">${timeLeft}</span> sn
        </div>
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--success);">
          Skor: ${score} Puan
        </div>
      </div>

      <div style="padding: 2rem 1rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); margin-bottom: 2rem;">
        <div style="font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; color: var(--accent-secondary); margin-bottom: 0.75rem;">
          ${targetItem.word}
        </div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">
          = ${proposedMeaning}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <button class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); padding: 1.2rem; font-size: 1.2rem; font-weight: 800;" onclick="handleSpeedAnswer(true)">
          <i class="fa-solid fa-check-circle"></i> DOĞRU
        </button>
        <button class="btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 1.2rem; font-size: 1.2rem; font-weight: 800;" onclick="handleSpeedAnswer(false)">
          <i class="fa-solid fa-times-circle"></i> YANLIŞ
        </button>
      </div>
    </div>
  `;
}

function handleSpeedAnswer(userChoice) {
  const { currentPair } = practiceSession;
  if (!currentPair) return;

  if (userChoice === currentPair.isCorrect) {
    playChime(true);
    practiceSession.score += 100;
  } else {
    playChime(false);
    handleWrongAnswerPrompt(currentPair.word);
  }
  practiceSession.total += 1;
  renderSpeedCurrent();
}

function renderSpeedEndScreen() {
  const { score, total } = practiceSession;
  if (typeof confetti === 'function' && score > 300) {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
  }

  document.getElementById('active-game-container').innerHTML = `
    <div class="glass-card text-center" style="text-align: center; padding: 3rem; max-width: 500px; margin: 0 auto;">
      <i class="fa-solid fa-bolt" style="font-size: 3.5rem; color: #f59e0b; margin-bottom: 1rem;"></i>
      <h2>Zamana Karşı Hız Testi Bitti!</h2>
      <div style="font-size: 2.2rem; font-weight: 800; color: var(--success); margin: 1rem 0;">${score} Puan</div>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Toplam ${total} soru yanıtladınız.</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button class="btn-secondary" onclick="startPracticeMode('speed')"><i class="fa-solid fa-rotate-right"></i> Tekrar Oyna</button>
        <button class="btn-primary" onclick="exitPracticeMode()">Tamamla & Çık</button>
      </div>
    </div>
  `;
}

// --- PARAGRAPH & QUESTION GENERATOR ENGINE ---
let isStorySpeechPlaying = false;

function generateStoryFromVocabulary(sourceType = 'all') {
  let sourceList = [];
  
  if (sourceType === 'mastered') {
    sourceList = vocabulary.filter(v => v.isMastered);
    if (sourceList.length < 3) {
      sourceList = [...sourceList, ...vocabulary];
    }
  } else if (sourceType === 'learning') {
    sourceList = vocabulary.filter(v => !v.isMastered);
    if (sourceList.length < 3) {
      sourceList = [...sourceList, ...vocabulary];
    }
  } else {
    sourceList = [...vocabulary];
  }

  // Fallback to essential presets if user has very few words
  if (sourceList.length < 4) {
    sourceList = [...sourceList, ...PRESET_BUNDLES.essential];
  }

  // Stop any active speech
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isStorySpeechPlaying = false;
    const audioBtn = document.getElementById('story-audio-btn');
    if (audioBtn) audioBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Paragrafı Dinle`;
  }

  const targetWords = [...sourceList].sort(() => Math.random() - 0.5).slice(0, 4);

  const STORY_TEMPLATES = [
    {
      title: "The Inspiring Journey of Sarah",
      text: `Sarah was always {w0} when facing new challenges in her academic career. However, her mentor urged her to stay {w1} and maintain a high standard of work. Through continuous effort, she discovered an {w2} resource of knowledge that helped {w3} her understanding of modern science.`
    },
    {
      title: "Innovation in the Digital Age",
      text: `In today's fast-changing world, technology leaders must not be {w0} to adopt change. Being {w1} allows research teams to explore {w2} solutions that effectively {w3} potential risks.`
    },
    {
      title: "Secrets of Personal Growth",
      text: `Achieving true success requires a {w0} mindset. Even when faced with {w1} circumstances, a dedicated individual will find an {w2} way to learn and {w3} strong relationships with peers.`
    },
    {
      title: "Exploration of the Deep Ocean",
      text: `Marine biologists often encounter {w0} conditions during deep-sea expeditions. By remaining {w1} under pressure, the crew uncovered {w2} ecosystems that will significantly {w3} existing textbooks.`
    },
    {
      title: "Harmony in Sustainable Architecture",
      text: `Designing green cities is inherently {w0} yet profoundly rewarding. Architects strive to create {w1} spaces with {w2} materials to {w3} environmental balance.`
    },
    {
      title: "The Power of Creative Focus",
      text: `Great writers know that inspiration is not merely {w0}. Cultivating a {w1} habit provides {w2} clarity and enables thinkers to {w3} extraordinary breakthroughs.`
    }
  ];

  const template = STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
  
  // 1. Substitute target words with unique placeholders
  let rawText = template.text;
  targetWords.forEach((tw, i) => {
    rawText = rawText.replace(`{w${i}}`, `__TARGET_${i}__`);
  });

  // 2. Wrap all words with click-to-translate handler
  let wrappedText = wrapTextWithClickableWords(rawText);

  // 3. Replace placeholders with highlighted badges
  targetWords.forEach((tw, i) => {
    const highlightHtml = `<span class="word-highlight" onclick="handleWordClick(event, '${tw.word}')" title="Anlamı ve detaylar için tıklayın">${tw.word}</span>`;
    wrappedText = wrappedText.replace(`__TARGET_${i}__`, highlightHtml);
  });

  document.getElementById('story-empty-placeholder').style.display = 'none';
  document.getElementById('story-display-area').style.display = 'block';

  document.getElementById('story-title').textContent = template.title;
  document.getElementById('story-paragraph-text').innerHTML = wrappedText;

  generateStoryQuestions(targetWords, template.title);
}

function generateStoryQuestions(targetWords, storyTitle) {
  const qContainer = document.getElementById('story-questions-list');
  
  const q1 = {
    word: targetWords[0].word,
    q: `1. Paragrafta geçen "<span style="color: var(--accent-secondary); font-weight:700;">${targetWords[0].word}</span>" (${targetWords[0].pos}) kelimesinin Türkçe karşılığı/eş anlamlısı hangisidir?`,
    options: [targetWords[0].trNote || targetWords[0].synonyms[0] || 'doğru seçenek', 'hızlı / aceleci', 'geçici / kısa süreli', 'tamamen bilinmeyen'],
    correctIndex: 0
  };

  const q2 = {
    word: targetWords[0].word,
    q: `2. Metnin genel bağlamına göre, ana fikir nedir?`,
    options: [
      `${storyTitle} bağlamında zorlukların üstesinden gelmek ve başarıya ulaşmak.`,
      `Konudan tamamen uzak durmanın ve vazgeçmenin faydaları.`,
      `Her türlü planlamayı terk edip şansa odaklanmak.`,
      `Sadece teorik bilgiyle yetinip pratiği reddetmek.`
    ],
    correctIndex: 0
  };

  const q3 = {
    word: targetWords[1].word,
    q: `3. Paragrafta geçen "<span style="color: var(--accent-secondary); font-weight:700;">${targetWords[1].word}</span>" kelimesi hangi türdedir ve tanımı nedir?`,
    options: [
      `${targetWords[1].pos.toUpperCase()} türündedir: ${targetWords[1].definition}`,
      `Fiildir: Sadece geçmiş zamanı ifade eder.`,
      `Zarftır: Sadece miktar veya derece bildirir.`,
      `İsimdir: Coğrafi bir bölgeyi temsil eder.`
    ],
    correctIndex: 0
  };

  const questions = [q1, q2, q3];

  qContainer.innerHTML = questions.map((item, qIdx) => `
    <div class="glass-card" style="margin-bottom: 1.25rem; padding: 1.25rem;">
      <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.85rem; line-height: 1.5;">${item.q}</div>
      <div class="story-options-grid" id="story-q-${qIdx}-options">
        ${item.options.map((opt, oIdx) => `
          <button class="story-option-btn" onclick="checkStoryAnswer(this, ${oIdx}, ${item.correctIndex}, '${item.word}', ${qIdx})">
            <span style="font-weight: 800; margin-right: 0.5rem; color: var(--accent-secondary); flex-shrink: 0;">${String.fromCharCode(65 + oIdx)})</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function checkStoryAnswer(btnEl, selectedIdx, correctIdx, targetWord, qIdx) {
  const optionsContainer = document.getElementById(`story-q-${qIdx}-options`);
  if (!optionsContainer) return;

  if (selectedIdx === correctIdx) {
    btnEl.classList.add('correct');
    playChime(true);
    // Disable all buttons in this question once correct
    const allBtns = optionsContainer.querySelectorAll('.story-option-btn');
    allBtns.forEach(b => {
      b.style.pointerEvents = 'none';
      if (b !== btnEl) b.style.opacity = '0.6';
    });
  } else {
    btnEl.classList.add('wrong');
    playChime(false);
    if (targetWord) handleWrongAnswerPrompt(targetWord);
  }
}

function playStorySpeech() {
  const audioBtn = document.getElementById('story-audio-btn');
  if (!('speechSynthesis' in window)) return;

  if (window.speechSynthesis.speaking && isStorySpeechPlaying) {
    window.speechSynthesis.cancel();
    isStorySpeechPlaying = false;
    if (audioBtn) audioBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Paragrafı Dinle`;
    return;
  }

  const text = document.getElementById('story-paragraph-text').innerText;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95;

  utterance.onstart = () => {
    isStorySpeechPlaying = true;
    if (audioBtn) audioBtn.innerHTML = `<i class="fa-solid fa-stop"></i> Durdur`;
  };

  utterance.onend = () => {
    isStorySpeechPlaying = false;
    if (audioBtn) audioBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Paragrafı Dinle`;
  };

  utterance.onerror = () => {
    isStorySpeechPlaying = false;
    if (audioBtn) audioBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Paragrafı Dinle`;
  };

  window.speechSynthesis.speak(utterance);
}

// --- Preset Bundles Loading ---
function loadPresetBundle(bundleKey, showNotification = true) {
  const bundle = PRESET_BUNDLES[bundleKey];
  if (!bundle) return;

  let addedCount = 0;
  const now = Date.now();

  bundle.forEach(item => {
    const exists = vocabulary.some(v => v.word.toLowerCase() === item.word.toLowerCase());
    if (!exists) {
      vocabulary.push({
        id: `word_${item.word.toLowerCase()}_${now}_${Math.random()}`,
        word: item.word.toLowerCase(),
        phonetic: item.phonetic || formatPhonetic('', item.word),
        audioUrl: '',
        pos: item.pos,
        synonyms: item.synonyms,
        antonyms: [],
        definition: item.definition,
        example: item.example,
        trNote: item.trNote,
        box: 1,
        isMastered: false,
        createdAt: now,
        lastReviewed: now,
        nextReviewDate: now,
        reviewCount: 0,
        successCount: 0
      });
      addedCount++;
    }
  });

  saveDataToStorage();
  updateStats();

  if (showNotification) {
    alert(`${addedCount} adet yeni kelime başarıyla 'Öğrenilmekte Olanlar' listenize eklendi!`);
  }
}

// --- Data Export & Import ---
function exportUserData() {
  const jsonStr = JSON.stringify(vocabulary, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `vocabmaster_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importUserData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (Array.isArray(importedData)) {
        vocabulary = importedData;
        saveDataToStorage();
        updateStats();
        renderWordsGrid();
        alert("Kelime verileriniz başarıyla içeri aktarıldı!");
      }
    } catch (err) {
      alert("Hata: Geçersiz JSON dosyası!");
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm("Tüm kelime listenizi ve ilerlemenizi sıfırlamak istediğinize emin misiniz?")) {
    vocabulary = [];
    saveDataToStorage();
    updateStats();
    renderWordsGrid();
    alert("Tüm veriler sıfırlandı.");
  }
}

// --- Progressive Web App (PWA) & Service Worker Registration ---
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const desktopBtn = document.getElementById('btn-install-pwa');
  const mobileBtn = document.getElementById('btn-install-pwa-mobile');
  if (desktopBtn) desktopBtn.style.display = 'inline-flex';
  if (mobileBtn) mobileBtn.style.display = 'inline-flex';
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  const desktopBtn = document.getElementById('btn-install-pwa');
  const mobileBtn = document.getElementById('btn-install-pwa-mobile');
  if (desktopBtn) desktopBtn.style.display = 'none';
  if (mobileBtn) mobileBtn.style.display = 'none';
  alert('VocabMaster Pro başarıyla cihazınıza yüklendi! Artık ana ekranınızdan veya masaüstünüzden tek tıkla açabilirsiniz.');
});

async function triggerPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
  } else {
    showInstallInstructionsModal();
  }
}

function showInstallInstructionsModal() {
  const modal = document.getElementById('pwa-install-modal');
  const backdrop = document.getElementById('pwa-modal-backdrop');
  if (modal) modal.style.display = 'block';
  if (backdrop) backdrop.style.display = 'block';
}

function closeInstallInstructionsModal() {
  const modal = document.getElementById('pwa-install-modal');
  const backdrop = document.getElementById('pwa-modal-backdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.style.display = 'none';
}

// Register Service Worker for offline capability & PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker başarıyla kaydedildi:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker kaydı yapılamadı:', err);
      });
  });
}

