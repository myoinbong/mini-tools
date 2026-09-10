/**
 * Palette Inspector - AI Color Palette & Live Preview Module
 */

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

// 3. Color Helper Functions
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

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

  // Standard CSS fallback names
  const dummy = document.createElement('div');
  dummy.style.color = colorStr;
  document.body.appendChild(dummy);
  const computed = getComputedStyle(dummy).color;
  document.body.removeChild(dummy);

  const parts = computed.match(/\d+/g);
  if (parts && parts.length >= 3) {
    return rgbToHex(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  }
  return null;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function formatRgbStr(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
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

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getContrastTextColor(bgColorHex) {
  const luminance = getLuminance(bgColorHex);
  return luminance > 0.179 ? '#1F2937' : '#FFFFFF';
}

// 4. Color Extraction Logic
function extractColorsFromText(text) {
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
          activeFormat: 'hex'
        });
      }
    } catch (e) {
      console.warn('Failed to parse color:', colorStr, e);
    }
  });

  return parsedResults;
}

// 5. UI Rendering & Controls
function updateMappingSelectors() {
  const selectors = [
    mapBgSelect, mapTextSelect, mapPrimarySelect, mapAccentSelect, mapCardSelect,
    mapNavBgSelect, mapNavTextSelect, mapFootBgSelect, mapFootTextSelect
  ];

  selectors.forEach(select => {
    const currentVal = select.value;
    select.replaceChildren();

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '선택 안 함 (기본값)';
    select.appendChild(defaultOpt);

    detectedColors.forEach((color, idx) => {
      const option = document.createElement('option');
      option.value = color.hex;
      option.textContent = `${color.hex} (색상 ${idx + 1})`;
      select.appendChild(option);
    });

    if (detectedColors.some(c => c.hex === currentVal)) {
      select.value = currentVal;
    } else {
      select.value = '';
    }
  });
}

function updateContrastBadge() {
  const bgHex = mapBgSelect.value || '#FAF5FF';
  const textHex = mapTextSelect.value || '#1F2937';

  const ratio = getContrastRatio(bgHex, textHex);
  contrastVal.textContent = `${ratio.toFixed(2)}:1`;

  contrastStatus.className = 'contrast-status-badge';
  if (ratio >= 7.0) {
    contrastStatus.textContent = 'AAA 최상';
    contrastStatus.classList.add('contrast-pass');
  } else if (ratio >= 4.5) {
    contrastStatus.textContent = 'AA 양호';
    contrastStatus.classList.add('contrast-pass');
  } else if (ratio >= 3.0) {
    contrastStatus.textContent = 'AA Large (주의)';
    contrastStatus.classList.add('contrast-fail');
  } else {
    contrastStatus.textContent = '가독성 부족';
    contrastStatus.classList.add('contrast-fail');
  }
}

function applyThemeToPreview() {
  const mapping = {
    '--preview-bg': mapBgSelect.value || '#FAF5FF',
    '--preview-text': mapTextSelect.value || '#1F2937',
    '--preview-primary': mapPrimarySelect.value || '#4F46E5',
    '--preview-accent': mapAccentSelect.value || '#F43F5E',
    '--preview-card-bg': mapCardSelect.value || '#FFFFFF',
    '--preview-nav-bg': mapNavBgSelect.value || 'transparent',
    '--preview-nav-text': mapNavTextSelect.value || 'inherit',
    '--preview-foot-bg': mapFootBgSelect.value || 'transparent',
    '--preview-foot-text': mapFootTextSelect.value || 'inherit'
  };

  Object.entries(mapping).forEach(([varName, val]) => {
    blogPreviewContainer.style.setProperty(varName, val);
  });

  updateContrastBadge();
}

function attemptAutoMapping(text) {
  const lower = text.toLowerCase();
  const lines = text.split('\n');

  const findBestHex = (keywords) => {
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (keywords.some(kw => lineLower.includes(kw))) {
        const hexMatch = line.match(/#[a-fA-F0-9]{3,8}\b/);
        if (hexMatch) {
          const parsed = parseToHex(hexMatch[0]);
          if (parsed && detectedColors.some(c => c.hex === parsed)) return parsed;
        }
      }
    }
    return null;
  };

  const autoBg = findBestHex(['배경', 'background', 'bg']);
  const autoText = findBestHex(['텍스트', '글자', 'text', 'font']);
  const autoPrimary = findBestHex(['메인', 'primary', '주요', '브랜드']);
  const autoAccent = findBestHex(['포인트', 'accent', '강조', 'secondary']);
  const autoCard = findBestHex(['카드', 'card', '컨테이너']);

  if (autoBg) mapBgSelect.value = autoBg;
  else if (detectedColors.length > 2) mapBgSelect.value = detectedColors[2].hex;

  if (autoText) mapTextSelect.value = autoText;
  else if (detectedColors.length > 3) mapTextSelect.value = detectedColors[3].hex;

  if (autoPrimary) mapPrimarySelect.value = autoPrimary;
  else if (detectedColors.length > 0) mapPrimarySelect.value = detectedColors[0].hex;

  if (autoAccent) mapAccentSelect.value = autoAccent;
  else if (detectedColors.length > 1) mapAccentSelect.value = detectedColors[1].hex;

  if (autoCard) mapCardSelect.value = autoCard;
  else if (detectedColors.length > 4) mapCardSelect.value = detectedColors[4].hex;

  applyThemeToPreview();
}

function renderColorCards() {
  paletteGrid.replaceChildren();

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

  detectedColors.forEach((colorObj, index) => {
    const card = document.createElement('div');
    card.className = 'color-card';

    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = colorObj.hex;
    swatch.addEventListener('click', () => {
      let text = colorObj.hex;
      if (colorObj.activeFormat === 'rgb') text = colorObj.rgb;
      if (colorObj.activeFormat === 'hsl') text = colorObj.hsl;
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${text} 복사 완료!`, 'success');
      });
    });

    const info = document.createElement('div');
    info.className = 'color-info';

    const codeRow = document.createElement('div');
    codeRow.className = 'color-code-row';

    const hexSpan = document.createElement('span');
    hexSpan.className = 'color-hex';
    hexSpan.textContent = colorObj[colorObj.activeFormat] || colorObj.hex;

    const badge = document.createElement('span');
    badge.className = 'color-type-badge';
    badge.textContent = `#${index + 1}`;

    codeRow.appendChild(hexSpan);
    codeRow.appendChild(badge);

    const controls = document.createElement('div');
    controls.className = 'color-controls';

    ['hex', 'rgb', 'hsl'].forEach(fmt => {
      const btn = document.createElement('button');
      btn.className = 'color-card-btn';
      btn.textContent = fmt.toUpperCase();
      btn.addEventListener('click', () => {
        colorObj.activeFormat = fmt;
        hexSpan.textContent = colorObj[fmt];
      });
      controls.appendChild(btn);
    });

    info.appendChild(codeRow);
    info.appendChild(controls);

    card.appendChild(swatch);
    card.appendChild(info);
    paletteGrid.appendChild(card);
  });
}

// 6. LocalStorage Palette Management
function renderSavedPalettes() {
  savedPalettesList.replaceChildren();

  if (savedPalettes.length === 0) {
    noSavedMsg.style.display = 'block';
    return;
  }
  noSavedMsg.style.display = 'none';

  savedPalettes.forEach((palette, idx) => {
    const item = document.createElement('div');
    item.className = 'saved-palette-item';

    const meta = document.createElement('div');
    meta.className = 'saved-meta';

    const name = document.createElement('span');
    name.className = 'saved-name';
    name.textContent = palette.name || `팔레트 #${idx + 1}`;

    const date = document.createElement('span');
    date.className = 'saved-date';
    date.textContent = palette.date;

    meta.appendChild(name);
    meta.appendChild(date);

    const previews = document.createElement('div');
    previews.className = 'saved-preview-colors';
    palette.colors.slice(0, 5).forEach(c => {
      const dot = document.createElement('div');
      dot.className = 'saved-swatch-dot';
      dot.style.backgroundColor = c.hex;
      previews.appendChild(dot);
    });

    const actions = document.createElement('div');
    actions.className = 'saved-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'action-btn sm';
    loadBtn.textContent = '적용';
    loadBtn.addEventListener('click', () => loadPalette(idx));

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn sm';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => deletePalette(idx));

    actions.appendChild(loadBtn);
    actions.appendChild(delBtn);

    item.appendChild(meta);
    item.appendChild(previews);
    item.appendChild(actions);

    savedPalettesList.appendChild(item);
  });
}

function savePalette() {
  if (detectedColors.length === 0) return;

  const title = prompt('저장할 팔레트 이름을 입력하세요:', `팔레트 ${new Date().toLocaleDateString('ko-KR')}`);
  if (!title) return;

  const newPalette = {
    id: Date.now(),
    name: title,
    date: new Date().toLocaleDateString('ko-KR'),
    colors: detectedColors,
    mapping: {
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

  savedPalettes.unshift(newPalette);
  localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
  renderSavedPalettes();
  showToast('팔레트가 브라우저에 저장되었습니다!', 'success');
}

function deletePalette(index) {
  if (!confirm('이 팔레트를 삭제하시겠습니까?')) return;
  savedPalettes.splice(index, 1);
  localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
  renderSavedPalettes();
  showToast('팔레트가 삭제되었습니다.', 'info');
}

function loadPalette(index) {
  const p = savedPalettes[index];
  if (!p) return;

  detectedColors = p.colors;
  detectedCount.textContent = `추출된 색상: ${detectedColors.length}개`;
  renderColorCards();
  updateMappingSelectors();

  if (p.mapping) {
    mapBgSelect.value = p.mapping.bg || '';
    mapTextSelect.value = p.mapping.text || '';
    mapPrimarySelect.value = p.mapping.primary || '';
    mapAccentSelect.value = p.mapping.accent || '';
    mapCardSelect.value = p.mapping.card || '';
    mapNavBgSelect.value = p.mapping.navBg || '';
    mapNavTextSelect.value = p.mapping.navText || '';
    mapFootBgSelect.value = p.mapping.footBg || '';
    mapFootTextSelect.value = p.mapping.footText || '';
  }
  applyThemeToPreview();
  showToast(`'${p.name}' 팔레트가 로드되었습니다!`, 'success');
}

// 7. Code Export Builder
function buildExportCodes() {
  // CSS Vars
  let cssText = `:root {\n`;
  detectedColors.forEach((c, idx) => {
    cssText += `  --color-${idx + 1}: ${c.hex};\n`;
  });
  cssText += `\n  /* Blog Element Mappings */\n`;
  cssText += `  --blog-bg: ${mapBgSelect.value || 'var(--color-3)'};\n`;
  cssText += `  --blog-text: ${mapTextSelect.value || 'var(--color-4)'};\n`;
  cssText += `  --blog-primary: ${mapPrimarySelect.value || 'var(--color-1)'};\n`;
  cssText += `  --blog-accent: ${mapAccentSelect.value || 'var(--color-2)'};\n`;
  cssText += `  --blog-card: ${mapCardSelect.value || '#FFFFFF'};\n`;
  cssText += `  --blog-nav-bg: ${mapNavBgSelect.value || 'transparent'};\n`;
  cssText += `  --blog-nav-text: ${mapNavTextSelect.value || 'inherit'};\n`;
  cssText += `  --blog-foot-bg: ${mapFootBgSelect.value || 'transparent'};\n`;
  cssText += `  --blog-foot-text: ${mapFootTextSelect.value || 'inherit'};\n`;
  cssText += `}`;
  codeCssVars.textContent = cssText;

  // Tailwind Config
  let twColors = {};
  detectedColors.forEach((c, idx) => {
    twColors[`palette-${idx + 1}`] = c.hex;
  });
  twColors['blog-bg'] = mapBgSelect.value || '#FAF5FF';
  twColors['blog-text'] = mapTextSelect.value || '#1F2937';
  twColors['blog-primary'] = mapPrimarySelect.value || '#4F46E5';
  twColors['blog-accent'] = mapAccentSelect.value || '#F43F5E';
  twColors['blog-card'] = mapCardSelect.value || '#FFFFFF';

  let twText = `module.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(twColors, null, 8).replace('}', '      }')}\n    }\n  }\n}`;
  codeTailwind.textContent = twText;

  // JSON
  const jsonObject = {
    colors: detectedColors.map(c => ({ hex: c.hex, rgb: c.rgb, hsl: c.hsl })),
    mappings: {
      background: mapBgSelect.value,
      text: mapTextSelect.value,
      primary: mapPrimarySelect.value,
      accent: mapAccentSelect.value,
      card: mapCardSelect.value,
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
  const activePane = document.getElementById(`pane-${selectedTab}`);
  if (activePane) activePane.classList.add('active');
}

// 8. Event Setup
function initPaletteEvents() {
  aiTextInput.addEventListener('input', () => {
    const text = aiTextInput.value;
    detectedColors = extractColorsFromText(text);
    detectedCount.textContent = `추출된 색상: ${detectedColors.length}개`;
    renderColorCards();
    updateMappingSelectors();
    attemptAutoMapping(text);
  });

  clearInputBtn.addEventListener('click', () => {
    aiTextInput.value = '';
    detectedColors = [];
    detectedCount.textContent = '추출된 색상: 0개';
    renderColorCards();
    updateMappingSelectors();
    applyThemeToPreview();
  });

  loadSampleBtn.addEventListener('click', () => {
    aiTextInput.value = SAMPLE_TEXT;
    aiTextInput.dispatchEvent(new Event('input'));
    showToast('샘플 테마 데이터가 로드되었습니다!', 'success');
  });

  [mapBgSelect, mapTextSelect, mapPrimarySelect, mapAccentSelect, mapCardSelect,
    mapNavBgSelect, mapNavTextSelect, mapFootBgSelect, mapFootTextSelect].forEach(select => {
      select.addEventListener('change', applyThemeToPreview);
    });

  savePaletteBtn.addEventListener('click', savePalette);

  exportCodeBtn.addEventListener('click', () => {
    buildExportCodes();
    exportModal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    exportModal.style.display = 'none';
  });

  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
      exportModal.style.display = 'none';
    }
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', handleTabClick);
  });

  copyCodeBtn.addEventListener('click', () => {
    let textToCopy = '';
    if (activeTab === 'css-vars') textToCopy = codeCssVars.textContent;
    if (activeTab === 'tailwind') textToCopy = codeTailwind.textContent;
    if (activeTab === 'json') textToCopy = codeJson.textContent;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('코드가 클립보드에 복사되었습니다!', 'success');
    });
  });
}

// 9. Init Application
function initPaletteApp() {
  const rawSaved = localStorage.getItem('saved_palettes');
  if (rawSaved) {
    try {
      savedPalettes = JSON.parse(rawSaved);
    } catch (e) {
      console.error('Failed to parse saved palettes', e);
      savedPalettes = [];
    }
  }

  initPaletteEvents();
  renderSavedPalettes();

  // Load sample text by default
  loadSampleBtn.click();
}

document.addEventListener('DOMContentLoaded', initPaletteApp);
