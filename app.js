// 1. Core State
let detectedColors = []; // [{ hex: '#...', rgb: 'rgb(...)', hsl: 'hsl(...)' }]
let savedPalettes = [];
let activeTab = 'css-vars';

// 2. DOM Elements
const aiTextInput = document.getElementById('ai-text-input');
const detectedCount = document.getElementById('detected-count');
const loadSampleBtn = document.getElementById('load-sample-btn');
const clearInputBtn = document.getElementById('clear-input-btn');
const noColorsMsg = document.getElementById('no-colors-msg');
const paletteGrid = document.getElementById('palette-grid');
const savePaletteBtn = document.getElementById('save-palette-btn');
const exportCodeBtn = document.getElementById('export-code-btn');
const savedPalettesList = document.getElementById('saved-palettes-list');
const noSavedMsg = document.getElementById('no-saved-msg');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const toastContainer = document.getElementById('toast-container');
const paletteToolBtn = document.getElementById('palette-tool-btn');
const nameToolBtn = document.getElementById('name-tool-btn');
const paletteToolPanel = document.getElementById('palette-tool-panel');
const nameToolPanel = document.getElementById('name-tool-panel');
const nameRuleType = document.getElementById('name-rule-type');
const nameFileUpload = document.getElementById('name-file-upload');
const nameFileOne = document.getElementById('name-file-one');
const nameFileTwo = document.getElementById('name-file-two');
const generateNameBtn = document.getElementById('generate-name-btn');
const generatedName = document.getElementById('generated-name');
const nameResultHint = document.getElementById('name-result-hint');
const nameGeneratorMessage = document.getElementById('name-generator-message');

const nameWordLists = {
  'pre-text.txt': ['푸른', '고요한', '빛나는', '새벽', '빠른', '작은', '따뜻한', '용감한'],
  'post-text.txt': ['파도', '여우', '별', '나무', '구름', '정원', '여행자', '고래'],
  'ubuntu-pre.txt': ['Brave', 'Clever', 'Curious', 'Daring', 'Elegant', 'Fuzzy', 'Happy', 'Jolly'],
  'ubuntu-post.txt': ['Badger', 'Beaver', 'Falcon', 'Fox', 'Koala', 'Lynx', 'Otter', 'Panda']
};
const customNameFiles = {};

// Mapping Selectors
const mapBgSelect = document.getElementById('map-bg');
const mapTextSelect = document.getElementById('map-text');
const mapPrimarySelect = document.getElementById('map-primary');
const mapAccentSelect = document.getElementById('map-accent');
const mapCardSelect = document.getElementById('map-card');
const mapNavBgSelect = document.getElementById('map-nav-bg');
const mapNavTextSelect = document.getElementById('map-nav-text');
const mapFootBgSelect = document.getElementById('map-foot-bg');
const mapFootTextSelect = document.getElementById('map-foot-text');
const blogPreviewContainer = document.getElementById('blog-preview-container');

// Contrast Badge
const contrastVal = document.getElementById('contrast-val');
const contrastStatus = document.getElementById('contrast-status');

// Modal Elements
const exportModal = document.getElementById('export-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const copyCodeBtn = document.getElementById('copy-code-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Code blocks
const codeCssVars = document.getElementById('code-css-vars');
const codeTailwind = document.getElementById('code-tailwind');
const codeJson = document.getElementById('code-json');

// Sample Text
const SAMPLE_TEXT = `안녕하세요! 개발 중인 테크 블로그에 적용하면 좋을 현대적이고 신뢰감을 주는 컬러 팔레트 가이드를 제안해 드립니다.

1. 메인 브랜드 컬러 (Primary):
- 깊은 인디고 블루: #4F46E5
- 이 색상은 블로그의 헤더 링크나 주요 액션 단추에 사용하여 시각적 초점을 모읍니다.

2. 포인트 강조 컬러 (Accent):
- 에너지 넘치는 로즈 핑크: #F43F5E
- 카테고리 태그나 중요한 경고/강조 텍스트에 제격입니다.

3. 전체 웹페이지 배경 (Background):
- 아주 소프트하고 깨끗한 라벤더 그레이: #FAF5FF
- 독자들의 시각 피로도를 낮추는 이상적인 흰색 계열 배경입니다.

4. 기본 텍스트 서체 (Text):
- 가독성이 극대화된 딥 슬레이트 그레이: #1F2937
- 완전한 검은색(#000000)보다 훨씬 눈에 부담이 덜합니다.

5. 콘텐츠 카드 및 위젯 배경 (Card BG):
- 무결점 흰색: #FFFFFF
- 그림자 효과와 함께 사용하여 레이어에 깊이감을 선사합니다.`;

// 3. Helper Functions

// RGB to HEX conversion
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// HSL to RGB conversion
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

// Convert any CSS color string to HEX
function parseToHex(colorStr) {
  colorStr = colorStr.trim().toLowerCase();

  // 1. HEX Format (#FFF or #FFFFFF)
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 4) {
      return '#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3];
    }
    return colorStr.slice(0, 7).toUpperCase();
  }

  // 2. RGB / RGBA Format
  if (colorStr.startsWith('rgb')) {
    const parts = colorStr.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return rgbToHex(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
    }
  }

  // 3. HSL / HSLA Format
  if (colorStr.startsWith('hsl')) {
    const parts = colorStr.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const [r, g, b] = hslToRgb(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      return rgbToHex(r, g, b);
    }
  }

  // Standard CSS fallback names (minimal list)
  const dummy = document.createElement('div');
  dummy.style.color = colorStr;
  document.body.appendChild(dummy);
  const computed = getComputedStyle(dummy).color;
  document.body.removeChild(dummy);

  const parts = computed.match(/\d+/g);
  if (parts && parts.length >= 3) {
    return rgbToHex(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  }

  return '#000000';
}

// HEX to RGB Object
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// HEX to HSL String
function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Format RGB Object to CSS string
function formatRgbStr(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

// Calculate Relative Luminance
function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Color Contrast Ratio (L1 + 0.05) / (L2 + 0.05)
function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Determine if text should be light or dark based on background luminance
function getContrastTextColor(bgColorHex) {
  const luminance = getLuminance(bgColorHex);
  return luminance > 0.179 ? '#1F2937' : '#FFFFFF';
}

// Toast notification trigger
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>💬</span> ${message}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function getInitialConsonant(word) {
  const code = word.codePointAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    return ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'][Math.floor((code - 0xAC00) / 588)];
  }
  return (word[0] || '').toUpperCase();
}

function getNameFiles() {
  return { ...nameWordLists, ...customNameFiles };
}

function updateNameFileOptions() {
  const files = Object.keys(getNameFiles());
  [nameFileOne, nameFileTwo].forEach(select => {
    const current = select.value;
    select.innerHTML = '<option value="">파일 선택...</option>';
    files.forEach(file => select.add(new Option(file, file)));
    if (files.includes(current)) select.value = current;
  });
}

function updateNameFormState() {
  const rule = nameRuleType.value;
  const fixedRule = ['rule2', 'rule3', 'rule4'].includes(rule);
  nameFileUpload.closest('.name-upload').classList.toggle('is-disabled', fixedRule);
  nameFileOne.disabled = fixedRule;
  nameFileTwo.disabled = fixedRule;
  generateNameBtn.disabled = !fixedRule && !(rule === 'rule1' && nameFileOne.value && nameFileTwo.value);
}

function generateName() {
  const rule = nameRuleType.value;
  const files = getNameFiles();
  let firstFile = nameFileOne.value;
  let secondFile = nameFileTwo.value;
  let alliteration = false;
  if (rule === 'rule2' || rule === 'rule3') {
    firstFile = 'pre-text.txt';
    secondFile = 'post-text.txt';
    alliteration = rule === 'rule3';
  } else if (rule === 'rule4') {
    firstFile = 'ubuntu-pre.txt';
    secondFile = 'ubuntu-post.txt';
    alliteration = true;
  }
  const firstWords = files[firstFile] || [];
  const secondWords = files[secondFile] || [];
  if (!firstWords.length || !secondWords.length) {
    nameGeneratorMessage.textContent = '사용 가능한 단어 파일을 선택해주세요.';
    return;
  }
  const first = firstWords[Math.floor(Math.random() * firstWords.length)].trim();
  const matchingWords = alliteration ? secondWords.filter(word => getInitialConsonant(word.trim()) === getInitialConsonant(first)) : secondWords;
  const choices = matchingWords.length ? matchingWords : secondWords;
  const second = choices[Math.floor(Math.random() * choices.length)].trim();
  generatedName.textContent = `${first} ${second}`;
  generatedName.hidden = false;
  nameResultHint.hidden = true;
  nameGeneratorMessage.textContent = alliteration && !matchingWords.length ? '초성이 맞는 단어가 없어 무작위로 조합했습니다.' : '';
}

// 4. Color Extraction Logic
function extractColorsFromText(text) {
  // Regex pattern for HEX, RGB, HSL
  const hexPattern = /#[a-fA-F0-9]{3,8}\b/g;
  const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d\.]+)?\s*\)/gi;
  const hslPattern = /hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(?:\s*,\s*[\d\.]+)?\s*\)/gi;

  const foundHex = text.match(hexPattern) || [];
  const foundRgb = text.match(rgbPattern) || [];
  const foundHsl = text.match(hslPattern) || [];

  const rawColors = [...foundHex, ...foundRgb, ...foundHsl];
  const uniqueHexs = new Set();
  const parsedResults = [];

  rawColors.forEach(colorStr => {
    try {
      const hex = parseToHex(colorStr);
      if (hex && !uniqueHexs.has(hex)) {
        uniqueHexs.add(hex);
        parsedResults.push({
          hex: hex,
          rgb: formatRgbStr(hex),
          hsl: hexToHsl(hex),
          activeFormat: 'hex' // 'hex' | 'rgb' | 'hsl'
        });
      }
    } catch (e) {
      console.warn('Failed to parse color:', colorStr, e);
    }
  });

  return parsedResults;
}

// 5. UI Rendering

// Update the select options for mapping
function updateMappingSelectors() {
  const selectors = [
    mapBgSelect, mapTextSelect, mapPrimarySelect, mapAccentSelect, mapCardSelect,
    mapNavBgSelect, mapNavTextSelect, mapFootBgSelect, mapFootTextSelect
  ];

  selectors.forEach(select => {
    const currentVal = select.value;
    select.innerHTML = '<option value="">선택 안 함 (기본값)</option>';

    detectedColors.forEach((color, idx) => {
      const option = document.createElement('option');
      option.value = color.hex;
      option.textContent = `${color.hex} (색상 ${idx + 1})`;
      select.appendChild(option);
    });

    // Restore value if it still exists
    if (detectedColors.some(c => c.hex === currentVal)) {
      select.value = currentVal;
    } else {
      select.value = '';
    }
  });
}

// Auto map colors based on heuristic keywords
function attemptAutoMapping(text) {
  const bgKeywords = ['배경색', 'background', 'bg'];
  const textKeywords = ['본문 텍스트', 'text', '글자색', '폰트색'];
  const primaryKeywords = ['메인', 'primary', '브랜드', 'indigo'];
  const accentKeywords = ['포인트', 'accent', 'rose', '핑크', '강조'];
  const cardKeywords = ['카드', 'card', 'white', '흰색'];
  const navBgKeywords = ['헤더 배경', 'header bg', 'header background', 'nav bg'];
  const navTextKeywords = ['헤더 텍스트', 'header text', '헤더 글자', 'header color', 'nav text'];
  const footBgKeywords = ['푸터 배경', 'footer bg', 'footer background'];
  const footTextKeywords = ['푸터 텍스트', 'footer text', '푸터 글자', 'footer color'];

  // Helper to find a color linked to keywords in text
  const lines = text.split('\n');

  const findColorForKeywords = (keywords) => {
    for (const line of lines) {
      const containsKeyword = keywords.some(kw => line.toLowerCase().includes(kw));
      if (containsKeyword) {
        const found = extractColorsFromText(line);
        if (found.length > 0) return found[0].hex;
      }
    }
    return null;
  };

  const bgCol = findColorForKeywords(bgKeywords);
  const textCol = findColorForKeywords(textKeywords);
  const primCol = findColorForKeywords(primaryKeywords);
  const accCol = findColorForKeywords(accentKeywords);
  const cardCol = findColorForKeywords(cardKeywords);
  const navBgCol = findColorForKeywords(navBgKeywords);
  const navTextCol = findColorForKeywords(navTextKeywords);
  const footBgCol = findColorForKeywords(footBgKeywords);
  const footTextCol = findColorForKeywords(footTextKeywords);

  if (bgCol) mapBgSelect.value = bgCol;
  if (textCol) mapTextSelect.value = textCol;
  if (primCol) mapPrimarySelect.value = primCol;
  if (accCol) mapAccentSelect.value = accCol;
  if (cardCol) mapCardSelect.value = cardCol;
  if (navBgCol) mapNavBgSelect.value = navBgCol;
  if (navTextCol) mapNavTextSelect.value = navTextCol;
  if (footBgCol) mapFootBgSelect.value = footBgCol;
  if (footTextCol) mapFootTextSelect.value = footTextCol;

  applyThemeToPreview();
}

// Apply Selected Colors to the Live Blog
function applyThemeToPreview() {
  const bg = mapBgSelect.value || '#FAF5FF';
  const text = mapTextSelect.value || '#1F2937';
  const primary = mapPrimarySelect.value || '#4F46E5';
  const accent = mapAccentSelect.value || '#F43F5E';
  const card = mapCardSelect.value || '#FFFFFF';

  const navBg = mapNavBgSelect.value || 'transparent';
  const navText = mapNavTextSelect.value || '';
  const footBg = mapFootBgSelect.value || 'transparent';
  const footText = mapFootTextSelect.value || '';

  blogPreviewContainer.style.setProperty('--preview-bg', bg);
  blogPreviewContainer.style.setProperty('--preview-text', text);
  blogPreviewContainer.style.setProperty('--preview-primary', primary);
  blogPreviewContainer.style.setProperty('--preview-accent', accent);
  blogPreviewContainer.style.setProperty('--preview-card-bg', card);

  // 헤더/푸터 가독성 자동 보정 적용
  let resolvedNavText = navText;
  if (!resolvedNavText) {
    if (navBg && navBg !== 'transparent') {
      resolvedNavText = getContrastTextColor(navBg);
    } else {
      resolvedNavText = text;
    }
  }

  let resolvedFootText = footText;
  if (!resolvedFootText) {
    if (footBg && footBg !== 'transparent') {
      resolvedFootText = getContrastTextColor(footBg);
    } else {
      resolvedFootText = text;
    }
  }

  blogPreviewContainer.style.setProperty('--preview-nav-bg', navBg);
  blogPreviewContainer.style.setProperty('--preview-nav-text', resolvedNavText);
  blogPreviewContainer.style.setProperty('--preview-foot-bg', footBg);
  blogPreviewContainer.style.setProperty('--preview-foot-text', resolvedFootText);

  // Update contrast ratio
  updateContrastAnalysis(bg, text);
}

// Update Contrast Ratio Badge
function updateContrastAnalysis(bgHex, textHex) {
  const ratio = getContrastRatio(bgHex, textHex);
  const formatted = ratio.toFixed(2);
  contrastVal.textContent = `${formatted}:1`;

  if (ratio >= 7) {
    contrastStatus.textContent = '최우수 (AAA)';
    contrastStatus.className = 'contrast-status-badge contrast-pass';
  } else if (ratio >= 4.5) {
    contrastStatus.textContent = '우수 (AA)';
    contrastStatus.className = 'contrast-status-badge contrast-pass';
  } else if (ratio >= 3) {
    contrastStatus.textContent = '보통 (Large Text)';
    contrastStatus.className = 'contrast-status-badge contrast-pass';
  } else {
    contrastStatus.textContent = '부족 (Fail)';
    contrastStatus.className = 'contrast-status-badge contrast-fail';
  }
}

// Render Palette Cards
function renderColorCards() {
  paletteGrid.innerHTML = '';

  if (detectedColors.length === 0) {
    noColorsMsg.style.display = 'flex';
    paletteGrid.style.display = 'none';
    savePaletteBtn.disabled = true;
    exportCodeBtn.disabled = true;
    return;
  }

  noColorsMsg.style.display = 'none';
  paletteGrid.style.display = 'grid';
  savePaletteBtn.disabled = false;
  exportCodeBtn.disabled = false;

  detectedColors.forEach((color, index) => {
    const card = document.createElement('div');
    card.className = 'color-card';

    // Toggle showing code format
    let displayCode = color.hex;
    if (color.activeFormat === 'rgb') displayCode = color.rgb;
    if (color.activeFormat === 'hsl') displayCode = color.hsl;

    const textColor = getContrastTextColor(color.hex);

    card.innerHTML = `
      <div class="color-swatch" style="background-color: ${color.hex}; color: ${textColor};" title="복사하려면 클릭">
        ${displayCode}
      </div>
      <div class="color-info">
        <div class="color-code-row">
          <span class="color-hex">${color.hex}</span>
          <span class="color-type-badge">색상 ${index + 1}</span>
        </div>
        <div class="color-controls">
          <button class="color-card-btn format-toggle" title="색상 포맷 변경">🔄 포맷</button>
          <button class="color-card-btn apply-btn" title="요소에 바로 적용">⚡ 매핑</button>
          <button class="color-card-btn delete-btn" title="제거">❌</button>
        </div>
      </div>
    `;

    // Swatch Copy Click Event
    card.querySelector('.color-swatch').addEventListener('click', () => {
      navigator.clipboard.writeText(displayCode).then(() => {
        showToast(`${displayCode} 코드가 복사되었습니다!`, 'success');
      });
    });

    // Format Toggle Button Event
    card.querySelector('.format-toggle').addEventListener('click', () => {
      const formats = ['hex', 'rgb', 'hsl'];
      const nextIdx = (formats.indexOf(color.activeFormat) + 1) % formats.length;
      color.activeFormat = formats[nextIdx];
      renderColorCards();
    });

    // Quick Mapping Menu Event
    card.querySelector('.apply-btn').addEventListener('click', (e) => {
      openQuickMapMenu(e, color.hex);
    });

    // Delete Event
    card.querySelector('.delete-btn').addEventListener('click', () => {
      detectedColors.splice(index, 1);
      renderColorCards();
      updateMappingSelectors();
      applyThemeToPreview();
      detectedCount.textContent = `추출된 색상: ${detectedColors.length}개`;
    });

    paletteGrid.appendChild(card);
  });
}

// Context/Dropdown mapping menu
function openQuickMapMenu(event, colorHex) {
  // Remove existing quick map menu if open
  const existing = document.querySelector('.quick-map-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.className = 'glass-panel quick-map-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = '500';
  menu.style.padding = '0.5rem';
  menu.style.display = 'flex';
  menu.style.flexDirection = 'column';
  menu.style.gap = '0.25rem';
  menu.style.boxShadow = 'var(--shadow)';

  // positioning
  const rect = event.target.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;

  const options = [
    { label: '배경색에 할당', selectEl: mapBgSelect },
    { label: '글자색에 할당', selectEl: mapTextSelect },
    { label: '주요색에 할당', selectEl: mapPrimarySelect },
    { label: '포인트색에 할당', selectEl: mapAccentSelect },
    { label: '카드 배경에 할당', selectEl: mapCardSelect },
    { label: '헤더 배경에 할당', selectEl: mapNavBgSelect },
    { label: '헤더 글자색에 할당', selectEl: mapNavTextSelect },
    { label: '푸터 배경에 할당', selectEl: mapFootBgSelect },
    { label: '푸터 글자색에 할당', selectEl: mapFootTextSelect },
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'text-btn';
    btn.style.padding = '0.35rem 0.75rem';
    btn.style.textAlign = 'left';
    btn.style.fontSize = '0.8rem';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      opt.selectEl.value = colorHex;
      applyThemeToPreview();
      menu.remove();
      showToast(`${opt.label.split('에')[0]}이 ${colorHex}로 설정되었습니다.`, 'success');
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  // Close when click elsewhere
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== event.target) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 50);
}

// 6. LocalStorage Library & Save
function savePalette() {
  if (detectedColors.length === 0) return;

  const paletteName = prompt('저장할 컬러 팔레트의 이름을 입력하세요:', `블로그 테마 ${savedPalettes.length + 1}`);
  if (paletteName === null) return; // cancel

  const cleanName = paletteName.trim() || `블로그 테마 ${savedPalettes.length + 1}`;

  const newPalette = {
    id: Date.now().toString(),
    name: cleanName,
    date: new Date().toLocaleDateString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    colors: detectedColors.map(c => ({ hex: c.hex, rgb: c.rgb, hsl: c.hsl })),
    mappings: {
      bg: mapBgSelect.value,
      text: mapTextSelect.value,
      primary: mapPrimarySelect.value,
      accent: mapAccentSelect.value,
      card: mapCardSelect.value,
      navBg: mapNavBgSelect.value,
      navText: mapNavTextSelect.value,
      footBg: mapFootBgSelect.value,
      footText: mapFootTextSelect.value
    }
  };

  savedPalettes.push(newPalette);
  localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
  renderSavedPalettes();
  showToast(`팔레트 "${cleanName}"가 저장되었습니다.`, 'success');
}

function loadSavedPalette(id) {
  const palette = savedPalettes.find(p => p.id === id);
  if (!palette) return;

  detectedColors = palette.colors.map(c => ({ ...c, activeFormat: 'hex' }));
  renderColorCards();
  updateMappingSelectors();

  // Restore mappings
  if (palette.mappings) {
    mapBgSelect.value = palette.mappings.bg || '';
    mapTextSelect.value = palette.mappings.text || '';
    mapPrimarySelect.value = palette.mappings.primary || '';
    mapAccentSelect.value = palette.mappings.accent || '';
    mapCardSelect.value = palette.mappings.card || '';
    mapNavBgSelect.value = palette.mappings.navBg || '';
    mapNavTextSelect.value = palette.mappings.navText || '';
    mapFootBgSelect.value = palette.mappings.footBg || '';
    mapFootTextSelect.value = palette.mappings.footText || '';
  }

  applyThemeToPreview();
  detectedCount.textContent = `추출된 색상: ${detectedColors.length}개`;
  showToast(`팔레트 "${palette.name}"을 불러왔습니다.`, 'success');
}

function deleteSavedPalette(id, event) {
  event.stopPropagation(); // prevent loading when clicking delete

  if (!confirm('정말로 이 팔레트를 삭제하시겠습니까?')) return;

  savedPalettes = savedPalettes.filter(p => p.id !== id);
  localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
  renderSavedPalettes();
  showToast('팔레트가 삭제되었습니다.', 'info');
}

function renderSavedPalettes() {
  savedPalettesList.innerHTML = '';

  if (savedPalettes.length === 0) {
    noSavedMsg.style.display = 'flex';
    savedPalettesList.style.display = 'none';
    return;
  }

  noSavedMsg.style.display = 'none';
  savedPalettesList.style.display = 'flex';

  savedPalettes.forEach(palette => {
    const item = document.createElement('div');
    item.className = 'saved-palette-item';
    item.addEventListener('click', () => loadSavedPalette(palette.id));

    // Create color preview bar
    let swatchesHtml = '';
    palette.colors.slice(0, 5).forEach(c => {
      swatchesHtml += `<div class="saved-swatch-dot" style="background-color: ${c.hex};"></div>`;
    });

    item.innerHTML = `
      <div class="saved-meta">
        <span class="saved-name" title="${palette.name}">${palette.name}</span>
        <span class="saved-date">${palette.date}</span>
      </div>
      <div class="saved-preview-colors">
        ${swatchesHtml}
      </div>
      <div class="saved-actions">
        <button class="icon-btn delete-saved-btn" style="width: 28px; height: 28px; border-radius: 6px;" title="삭제">🗑️</button>
      </div>
    `;

    item.querySelector('.delete-saved-btn').addEventListener('click', (e) => deleteSavedPalette(palette.id, e));
    savedPalettesList.appendChild(item);
  });
}

// 7. Code Export Logic
function buildExportCodes() {
  if (detectedColors.length === 0) return;

  // 1. CSS Variables Code
  let cssCode = `/* CSS Variables Palette Export */\n:root {\n`;
  detectedColors.forEach((c, i) => {
    cssCode += `  --color-palette-${i + 1}: ${c.hex}; /* RGB: ${c.rgb} */\n`;
  });

  // mappings in CSS
  cssCode += `\n  /* Blog Theme Mappings */\n`;
  cssCode += `  --blog-bg: ${mapBgSelect.value || 'var(--color-palette-3)'};\n`;
  cssCode += `  --blog-text: ${mapTextSelect.value || 'var(--color-palette-4)'};\n`;
  cssCode += `  --blog-primary: ${mapPrimarySelect.value || 'var(--color-palette-1)'};\n`;
  cssCode += `  --blog-accent: ${mapAccentSelect.value || 'var(--color-palette-2)'};\n`;
  cssCode += `  --blog-card-bg: ${mapCardSelect.value || 'var(--color-palette-5)'};\n`;
  cssCode += `  --blog-nav-bg: ${mapNavBgSelect.value || 'transparent'};\n`;
  cssCode += `  --blog-nav-text: ${mapNavTextSelect.value || 'var(--blog-text)'};\n`;
  cssCode += `  --blog-foot-bg: ${mapFootBgSelect.value || 'transparent'};\n`;
  cssCode += `  --blog-foot-text: ${mapFootTextSelect.value || 'var(--blog-text)'};\n`;
  cssCode += `}`;

  codeCssVars.textContent = cssCode;

  // 2. Tailwind CSS Config Code
  let twCode = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n`;
  detectedColors.forEach((c, i) => {
    twCode += `          'color-${i + 1}': '${c.hex}',\n`;
  });
  twCode += `        },\n        // Mapped UI colors\n`;
  twCode += `        blog: {\n`;
  twCode += `          bg: '${mapBgSelect.value || '#FAF5FF'}',\n`;
  twCode += `          text: '${mapTextSelect.value || '#1F2937'}',\n`;
  twCode += `          primary: '${mapPrimarySelect.value || '#4F46E5'}',\n`;
  twCode += `          accent: '${mapAccentSelect.value || '#F43F5E'}',\n`;
  twCode += `          card: '${mapCardSelect.value || '#FFFFFF'}',\n`;
  twCode += `          navBg: '${mapNavBgSelect.value || 'transparent'}',\n`;
  twCode += `          navText: '${mapNavTextSelect.value || 'inherit'}',\n`;
  twCode += `          footBg: '${mapFootBgSelect.value || 'transparent'}',\n`;
  twCode += `          footText: '${mapFootTextSelect.value || 'inherit'}',\n`;
  twCode += `        }\n      }\n    }\n  }\n}`;

  codeTailwind.textContent = twCode;

  // 3. JSON Code
  const jsonObject = {
    name: 'AI Generated Palette',
    exportedAt: new Date().toISOString(),
    colors: detectedColors.map((c, i) => ({
      name: `color-${i + 1}`,
      hex: c.hex,
      rgb: c.rgb,
      hsl: c.hsl
    })),
    themeMapping: {
      background: mapBgSelect.value,
      text: mapTextSelect.value,
      primary: mapPrimarySelect.value,
      accent: mapAccentSelect.value,
      cardBackground: mapCardSelect.value,
      headerBackground: mapNavBgSelect.value,
      headerText: mapNavTextSelect.value,
      footerBackground: mapFootBgSelect.value,
      footerText: mapFootTextSelect.value
    }
  };
  codeJson.textContent = JSON.stringify(jsonObject, null, 2);
}

function handleTabClick(e) {
  const selectedTab = e.target.getAttribute('data-tab');
  activeTab = selectedTab;

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanes.forEach(pane => pane.classList.remove('active'));

  e.target.classList.add('active');
  document.getElementById(`pane-${selectedTab}`).classList.add('active');
}

// 8. Event Listeners Setup
function initEvents() {
  const switchTool = (tool) => {
    const showNameTool = tool === 'name';
    paletteToolPanel.hidden = showNameTool;
    nameToolPanel.hidden = !showNameTool;
    paletteToolBtn.classList.toggle('active', !showNameTool);
    nameToolBtn.classList.toggle('active', showNameTool);
    paletteToolBtn.setAttribute('aria-selected', String(!showNameTool));
    nameToolBtn.setAttribute('aria-selected', String(showNameTool));
  };

  paletteToolBtn.addEventListener('click', () => switchTool('palette'));
  nameToolBtn.addEventListener('click', () => switchTool('name'));

  nameRuleType.addEventListener('change', updateNameFormState);
  nameFileOne.addEventListener('change', updateNameFormState);
  nameFileTwo.addEventListener('change', updateNameFormState);
  nameFileUpload.addEventListener('change', (event) => {
    Array.from(event.target.files).forEach(file => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const words = String(reader.result).split(/[,\n\r]+/).map(word => word.trim()).filter(Boolean);
        if (words.length) customNameFiles[file.name] = words;
        updateNameFileOptions();
        updateNameFormState();
      });
      reader.readAsText(file);
    });
    event.target.value = '';
  });
  generateNameBtn.addEventListener('click', generateName);
  generatedName.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedName.textContent).then(() => {
      showToast('생성된 이름이 복사되었습니다!', 'success');
    });
  });

  // Input tracking
  aiTextInput.addEventListener('input', () => {
    const text = aiTextInput.value;
    detectedColors = extractColorsFromText(text);
    detectedCount.textContent = `추출된 색상: ${detectedColors.length}개`;

    renderColorCards();
    updateMappingSelectors();
    attemptAutoMapping(text);
  });

  // Clear button
  clearInputBtn.addEventListener('click', () => {
    aiTextInput.value = '';
    detectedColors = [];
    detectedCount.textContent = '추출된 색상: 0개';
    renderColorCards();
    updateMappingSelectors();
    applyThemeToPreview();
  });

  // Sample Load button
  loadSampleBtn.addEventListener('click', () => {
    aiTextInput.value = SAMPLE_TEXT;
    // trigger input logic
    aiTextInput.dispatchEvent(new Event('input'));
    showToast('샘플 테마 데이터가 로드되었습니다!', 'success');
  });

  // Theme Selectors change
  [mapBgSelect, mapTextSelect, mapPrimarySelect, mapAccentSelect, mapCardSelect,
    mapNavBgSelect, mapNavTextSelect, mapFootBgSelect, mapFootTextSelect].forEach(select => {
      select.addEventListener('change', applyThemeToPreview);
    });

  // LocalStorage Save button
  savePaletteBtn.addEventListener('click', savePalette);

  // Export Code Modal opening
  exportCodeBtn.addEventListener('click', () => {
    buildExportCodes();
    exportModal.style.display = 'flex';
  });

  // Close modal
  closeModalBtn.addEventListener('click', () => {
    exportModal.style.display = 'none';
  });

  // Click outside modal content to close
  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
      exportModal.style.display = 'none';
    }
  });

  // Code Tab clicks
  tabButtons.forEach(btn => {
    btn.addEventListener('click', handleTabClick);
  });

  // Copy code inside modal
  copyCodeBtn.addEventListener('click', () => {
    let textToCopy = '';
    if (activeTab === 'css-vars') textToCopy = codeCssVars.textContent;
    if (activeTab === 'tailwind') textToCopy = codeTailwind.textContent;
    if (activeTab === 'json') textToCopy = codeJson.textContent;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('코드가 클립보드에 복사되었습니다!', 'success');
    });
  });

  // Dark/Light Theme toggle
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');

    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('ui_theme', isLight ? 'light' : 'dark');
    showToast(`${isLight ? '라이트' : '다크'} 모드로 전환되었습니다.`, 'info');
  });
}

// 9. Init Application
function initApp() {
  // Load UI Theme from LocalStorage
  const savedTheme = localStorage.getItem('ui_theme');
  if (savedTheme === 'light') {
    document.body.className = 'light-theme';
  } else {
    document.body.className = 'dark-theme';
  }

  // Load Saved Palettes
  const rawSaved = localStorage.getItem('saved_palettes');
  if (rawSaved) {
    try {
      savedPalettes = JSON.parse(rawSaved);
    } catch (e) {
      console.error('Failed to parse saved palettes', e);
      savedPalettes = [];
    }
  }

  initEvents();
  updateNameFileOptions();
  nameRuleType.value = 'rule2';
  updateNameFormState();
  renderSavedPalettes();

  // Pre-load with sample text so user sees it in action immediately
  loadSampleBtn.click();
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
