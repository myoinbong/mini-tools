/**
 * Palette Inspector Pro - Client-Side Harmony Generator & Live Blog Inspector
 * Pure HTML5, CSS3, Vanilla JavaScript
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Application State
  // =========================================================================
  let slotCount = 6; // 6, 10, 12
  let harmonyRule = 'analogous'; // analogous, complementary, pastel, dark_modern, random
  let mockupTheme = 'light'; // light, dark
  let activeExportTab = 'css-vars';

  // Array of Color Objects: { id, hex, rgb, hsl, locked, activeFormat: 'hex' }
  let paletteColors = [];

  // Mappings for 12 blog mockup UI elements
  let blogMappings = {
    bg: '',
    text: '',
    primary: '',
    accent: '',
    card: '',
    cardText: '',
    mutedText: '',
    border: '',
    tag: '',
    tagText: '',
    codeBg: '',
    footerBg: ''
  };

  let savedPalettes = [];

  // =========================================================================
  // 2. DOM Elements Cache
  // =========================================================================
  // Controls
  const slotControls = document.getElementById('slot-controls');
  const harmonyRuleSelect = document.getElementById('harmony-rule-select');
  const generatePaletteBtn = document.getElementById('generate-palette-btn');
  const openPromptModalBtn = document.getElementById('open-prompt-modal-btn');
  const openImportModalBtn = document.getElementById('open-import-modal-btn');
  const savePaletteBtn = document.getElementById('save-palette-btn');
  const exportCodeBtn = document.getElementById('export-code-btn');

  // Palette Views
  const paletteStripBar = document.getElementById('palette-strip-bar');
  const activeCountLabel = document.getElementById('active-count-label');
  const paletteGrid = document.getElementById('palette-grid');
  const lockSummary = document.getElementById('lock-summary');
  const lockCountText = document.getElementById('lock-count-text');

  // Saved Palettes
  const savedPalettesList = document.getElementById('saved-palettes-list');
  const noSavedMsg = document.getElementById('no-saved-msg');

  // Preview Inspector
  const mockupLightBtn = document.getElementById('mockup-light-btn');
  const mockupDarkBtn = document.getElementById('mockup-dark-btn');
  const autoMapBtn = document.getElementById('auto-map-btn');
  const contrastRatioVal = document.getElementById('contrast-ratio-val');
  const contrastStatusBadge = document.getElementById('contrast-status-badge');
  const contrastGuideText = document.getElementById('contrast-guide-text');
  const blogPreviewCanvas = document.getElementById('blog-preview-canvas');

  // Mapping Selects (12 Manual Options)
  const mapBgSelect = document.getElementById('map-bg');
  const mapTextSelect = document.getElementById('map-text');
  const mapPrimarySelect = document.getElementById('map-primary');
  const mapAccentSelect = document.getElementById('map-accent');
  const mapCardSelect = document.getElementById('map-card');
  const mapCardTextSelect = document.getElementById('map-card-text');
  const mapMutedTextSelect = document.getElementById('map-muted-text');
  const mapBorderSelect = document.getElementById('map-border');
  const mapTagSelect = document.getElementById('map-tag');
  const mapTagTextSelect = document.getElementById('map-tag-text');
  const mapCodeBgSelect = document.getElementById('map-code-bg');
  const mapFooterBgSelect = document.getElementById('map-footer-bg');

  // Prompt Modal Elements
  const promptModal = document.getElementById('prompt-modal');
  const closePromptModalBtn = document.getElementById('close-prompt-modal-btn');
  const closePromptModalBtn2 = document.getElementById('close-prompt-modal-btn-2');
  const promptSlotCountBadge = document.getElementById('prompt-slot-count-badge');
  const presetPrompt1 = document.getElementById('preset-prompt-1');
  const presetPrompt2 = document.getElementById('preset-prompt-2');
  const presetPrompt3 = document.getElementById('preset-prompt-3');

  // Import Modal Elements
  const importModal = document.getElementById('import-modal');
  const closeImportModalBtn = document.getElementById('close-import-modal-btn');
  const cancelImportBtn = document.getElementById('cancel-import-btn');
  const importTextInput = document.getElementById('import-text-input');
  const importDetectedCount = document.getElementById('import-detected-count');
  const importPreviewStrip = document.getElementById('import-preview-strip');
  const importKeepLockedChk = document.getElementById('import-keep-locked-chk');
  const importLoadSampleBtn = document.getElementById('import-load-sample-btn');
  const applyImportBtn = document.getElementById('apply-import-btn');

  // Export Modal Elements
  const exportModal = document.getElementById('export-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const tabButtons = exportModal ? exportModal.querySelectorAll('.tab-btn') : [];
  const codeCssVars = document.getElementById('code-css-vars');
  const codeTailwind = document.getElementById('code-tailwind');
  const codeJson = document.getElementById('code-json');

  // =========================================================================
  // 3. Color Math & Conversion Helpers
  // =========================================================================
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = Math.round(clamp(c, 0, 255)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function hexToRgb(hex) {
    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(cleanHex, 16);
    if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function hslToRgb(h, s, l) {
    h = (h % 360 + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;

    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
  }

  function formatRgbStr(hex) {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function formatHslStr(hex) {
    const { h, s, l } = hexToHsl(hex);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function isValidHex(hex) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(hex.trim());
  }

  function normalizeHex(hex) {
    if (!hex) return '#000000';
    let clean = hex.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (clean.length === 4) {
      clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean.slice(0, 7).toUpperCase();
  }

  // Relative Luminance for WCAG (0 to 1)
  function getLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  // WCAG 2.1 Contrast Ratio (1:1 to 21:1)
  function getContrastRatio(hex1, hex2) {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  function parseAnyColorToHex(str) {
    str = str.trim().toLowerCase();
    if (str.startsWith('#')) {
      return normalizeHex(str);
    }
    if (str.startsWith('rgb')) {
      const m = str.match(/\d+/g);
      if (m && m.length >= 3) {
        return rgbToHex(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
      }
    }
    if (str.startsWith('hsl')) {
      const m = str.match(/\d+/g);
      if (m && m.length >= 3) {
        const [r, g, b] = hslToRgb(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
        return rgbToHex(r, g, b);
      }
    }
    return null;
  }

  // =========================================================================
  // 4. Color Harmony Generator Engine
  // =========================================================================
  function createColorObject(hex, locked = false) {
    const normalized = normalizeHex(hex);
    return {
      id: 'color_' + Math.random().toString(36).substring(2, 9),
      hex: normalized,
      rgb: formatRgbStr(normalized),
      hsl: formatHslStr(normalized),
      locked: locked,
      activeFormat: 'hex'
    };
  }

  /**
   * Generates harmony color array based on rule and slot count.
   * Preserves locked colors!
   */
  function generatePaletteSet() {
    // 1. Identify base color from locked colors or pick a vibrant random base
    const firstLocked = paletteColors.find(c => c.locked);
    let baseHsl = firstLocked
      ? hexToHsl(firstLocked.hex)
      : {
          h: Math.floor(Math.random() * 360),
          s: Math.floor(Math.random() * 35) + 60, // 60~95%
          l: Math.floor(Math.random() * 30) + 40  // 40~70%
        };

    const newSet = [];

    for (let i = 0; i < slotCount; i++) {
      // If current index is locked in existing palette, preserve it
      if (paletteColors[i] && paletteColors[i].locked) {
        newSet.push({ ...paletteColors[i] });
        continue;
      }

      let h = baseHsl.h;
      let s = baseHsl.s;
      let l = baseHsl.l;

      // Slot fraction (0 to 1)
      const step = i / Math.max(slotCount - 1, 1);

      switch (harmonyRule) {
        case 'analogous': {
          // Analogous tones within ±45 deg + balanced lightness for UI roles
          const spread = 70; // -35 to +35
          h = Math.round(baseHsl.h + (step - 0.5) * spread);
          s = Math.round(clamp(baseHsl.s + (Math.random() * 20 - 10), 45, 90));

          // Ensure slot 0 is very light (for light BG) and slot 1 is very dark (for high contrast text)
          if (i === 0) {
            l = 96;
            s = 20;
          } else if (i === 1) {
            l = 14;
            s = 35;
          } else if (i === 2) {
            l = 50; // vibrant primary
            s = 85;
          } else if (i === 3) {
            l = 60; // accent
            s = 90;
          } else {
            l = Math.round(25 + step * 55);
          }
          break;
        }

        case 'complementary': {
          // Strong complementary (180 deg) + split complementary (150/210 deg)
          if (i % 2 === 0) {
            h = baseHsl.h;
          } else {
            h = (baseHsl.h + 180 + (Math.floor(i / 2) * 20 - 10)) % 360;
          }
          if (i === 0) {
            l = 97;
            s = 15;
          } else if (i === 1) {
            l = 15;
            s = 40;
          } else if (i === 2) {
            l = 52;
            s = 88;
          } else if (i === 3) {
            l = 58;
            s = 92;
          } else {
            l = Math.round(30 + Math.random() * 45);
            s = Math.round(60 + Math.random() * 35);
          }
          break;
        }

        case 'pastel': {
          // Soft, dreamy pastel hues with high lightness, plus 1 dark anchor for readability
          h = Math.round((baseHsl.h + i * (360 / slotCount)) % 360);
          if (i === 1) {
            // Anchor contrast text color
            s = 30;
            l = 18;
          } else {
            s = Math.round(45 + (i * 7) % 35); // 45~80%
            l = Math.round(78 + (i * 4) % 18); // 78~96%
          }
          break;
        }

        case 'dark_modern': {
          // Deep modern dark tech palette (deep slate/indigo + vivid neon highlights)
          if (i === 0) {
            // Very dark canvas bg
            h = baseHsl.h;
            s = 35;
            l = 8;
          } else if (i === 1) {
            // Light readable text
            h = baseHsl.h;
            s = 15;
            l = 95;
          } else if (i === 2) {
            // Dark card surface
            h = baseHsl.h;
            s = 25;
            l = 16;
          } else if (i === 3) {
            // Neon Primary
            h = baseHsl.h;
            s = 95;
            l = 62;
          } else if (i === 4) {
            // Neon Accent (Cyan / Pink / Amber)
            h = (baseHsl.h + 150) % 360;
            s = 95;
            l = 60;
          } else {
            // Deep subtle auxiliary tones
            h = (baseHsl.h + i * 35) % 360;
            s = Math.round(40 + Math.random() * 40);
            l = Math.round(20 + Math.random() * 30);
          }
          break;
        }

        case 'random':
        default: {
          // Harmonious vibrant random
          h = Math.floor(Math.random() * 360);
          s = Math.floor(Math.random() * 45) + 50; // 50~95%
          if (i === 0) {
            l = 96;
            s = 20;
          } else if (i === 1) {
            l = 14;
            s = 30;
          } else {
            l = Math.floor(Math.random() * 55) + 30; // 30~85%
          }
          break;
        }
      }

      const [r, g, b] = hslToRgb(h, s, l);
      const generatedHex = rgbToHex(r, g, b);
      newSet.push(createColorObject(generatedHex, false));
    }

    paletteColors = newSet;
  }

  // =========================================================================
  // 5. Blog Mockup Auto-Mapping & Contrast Engine
  // =========================================================================
  /**
   * Automatically calculates optimal color assignments based on luminance
   * to guarantee high WCAG contrast and aesthetic appeal.
   */
  function autoMapColorsForMockup() {
    if (paletteColors.length === 0) return;

    // Sort colors by relative luminance (darkest to brightest)
    const sorted = [...paletteColors].sort((a, b) => getLuminance(a.hex) - getLuminance(b.hex));
    const darkest = sorted[0].hex;
    const brightest = sorted[sorted.length - 1].hex;

    // Find highest saturation colors for brand & accent
    const sortedBySat = [...paletteColors].sort((a, b) => {
      const satA = hexToHsl(a.hex).s;
      const satB = hexToHsl(b.hex).s;
      return satB - satA;
    });

    const primaryColor = sortedBySat[0] ? sortedBySat[0].hex : paletteColors[0].hex;
    let accentColor = sortedBySat[1] ? sortedBySat[1].hex : (paletteColors[1] ? paletteColors[1].hex : primaryColor);
    if (accentColor === primaryColor && paletteColors.length > 2) {
      accentColor = paletteColors[2].hex;
    }

    // Intermediate luminance levels for balanced UI
    const midDark = sorted[Math.floor(sorted.length * 0.25)].hex;
    const midBright = sorted[Math.floor(sorted.length * 0.75)].hex;
    const neutralLight = sorted.length > 2 ? sorted[sorted.length - 2].hex : '#FFFFFF';

    if (mockupTheme === 'light') {
      // Light Mode (High Contrast & Clean Hierarchy)
      blogMappings.bg = brightest;
      blogMappings.text = darkest;
      blogMappings.primary = primaryColor;
      blogMappings.accent = accentColor;
      blogMappings.card = getLuminance(neutralLight) > 0.65 ? neutralLight : '#FFFFFF';
      blogMappings.cardText = darkest;
      blogMappings.mutedText = midDark;
      blogMappings.border = neutralLight;
      blogMappings.tag = primaryColor;
      blogMappings.tagText = brightest;
      blogMappings.codeBg = neutralLight;
      blogMappings.footerBg = neutralLight;
    } else {
      // Dark Mode (Modern Deep Tones & Vivid Accents)
      blogMappings.bg = darkest;
      blogMappings.text = brightest;
      blogMappings.primary = primaryColor;
      blogMappings.accent = accentColor;
      blogMappings.card = getLuminance(midDark) < 0.3 ? midDark : '#1E293B';
      blogMappings.cardText = brightest;
      blogMappings.mutedText = midBright;
      blogMappings.border = midDark;
      blogMappings.tag = accentColor;
      blogMappings.tagText = darkest;
      blogMappings.codeBg = midDark;
      blogMappings.footerBg = midDark;
    }

    syncSelectsWithMappings();
    applyThemeToPreviewCanvas();
  }

  function syncSelectsWithMappings() {
    if (mapBgSelect) mapBgSelect.value = blogMappings.bg;
    if (mapTextSelect) mapTextSelect.value = blogMappings.text;
    if (mapPrimarySelect) mapPrimarySelect.value = blogMappings.primary;
    if (mapAccentSelect) mapAccentSelect.value = blogMappings.accent;
    if (mapCardSelect) mapCardSelect.value = blogMappings.card;
    if (mapCardTextSelect) mapCardTextSelect.value = blogMappings.cardText;
    if (mapMutedTextSelect) mapMutedTextSelect.value = blogMappings.mutedText;
    if (mapBorderSelect) mapBorderSelect.value = blogMappings.border;
    if (mapTagSelect) mapTagSelect.value = blogMappings.tag;
    if (mapTagTextSelect) mapTagTextSelect.value = blogMappings.tagText;
    if (mapCodeBgSelect) mapCodeBgSelect.value = blogMappings.codeBg;
    if (mapFooterBgSelect) mapFooterBgSelect.value = blogMappings.footerBg;
  }

  function applyThemeToPreviewCanvas() {
    if (!blogPreviewCanvas) return;

    const bg = blogMappings.bg || (mockupTheme === 'light' ? '#FAF5FF' : '#0F172A');
    const text = blogMappings.text || (mockupTheme === 'light' ? '#1F2937' : '#F8FAFC');
    const primary = blogMappings.primary || '#4F46E5';
    const accent = blogMappings.accent || '#F43F5E';
    const card = blogMappings.card || (mockupTheme === 'light' ? '#FFFFFF' : '#1E293B');
    const cardText = blogMappings.cardText || text;
    const mutedText = blogMappings.mutedText || (mockupTheme === 'light' ? 'rgba(31, 41, 55, 0.65)' : 'rgba(248, 250, 252, 0.65)');
    const border = blogMappings.border || (mockupTheme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)');
    const tag = blogMappings.tag || primary;
    const tagText = blogMappings.tagText || (getLuminance(tag) > 0.4 ? '#1F2937' : '#FFFFFF');
    const codeBg = blogMappings.codeBg || (mockupTheme === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.35)');
    const footerBg = blogMappings.footerBg || (mockupTheme === 'light' ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 0, 0, 0.25)');

    blogPreviewCanvas.style.setProperty('--preview-bg', bg);
    blogPreviewCanvas.style.setProperty('--preview-text', text);
    blogPreviewCanvas.style.setProperty('--preview-primary', primary);
    blogPreviewCanvas.style.setProperty('--preview-accent', accent);
    blogPreviewCanvas.style.setProperty('--preview-card-bg', card);
    blogPreviewCanvas.style.setProperty('--preview-card-text', cardText);
    blogPreviewCanvas.style.setProperty('--preview-muted-text', mutedText);
    blogPreviewCanvas.style.setProperty('--preview-border', border);
    blogPreviewCanvas.style.setProperty('--preview-tag-bg', tag);
    blogPreviewCanvas.style.setProperty('--preview-tag-text', tagText);
    blogPreviewCanvas.style.setProperty('--preview-code-bg', codeBg);
    blogPreviewCanvas.style.setProperty('--preview-footer-bg', footerBg);

    updateContrastBadge(bg, text);
  }

  function updateContrastBadge(bgHex, textHex) {
    if (!contrastRatioVal || !contrastStatusBadge) return;

    const ratio = getContrastRatio(bgHex, textHex);
    contrastRatioVal.textContent = `${ratio.toFixed(2)}:1`;

    contrastStatusBadge.className = 'wcag-status-badge';

    if (ratio >= 7.0) {
      contrastStatusBadge.textContent = 'AAA (최고)';
      contrastStatusBadge.classList.add('pass-aaa');
      contrastGuideText.textContent = '모든 크기의 텍스트와 UI 요소에 최적화된 최고 등급 가독성입니다.';
    } else if (ratio >= 4.5) {
      contrastStatusBadge.textContent = 'AA (적합)';
      contrastStatusBadge.classList.add('pass-aa');
      contrastGuideText.textContent = '웹 콘텐츠 접근성 지침(WCAG 2.1 AA)을 만족하는 표준 가독성입니다.';
    } else if (ratio >= 3.0) {
      contrastStatusBadge.textContent = 'AA Large (주의)';
      contrastStatusBadge.classList.add('warn');
      contrastGuideText.textContent = '대제목(18pt 이상)에는 적합하나, 본문 소형 텍스트에는 다소 흐릴 수 있습니다.';
    } else {
      contrastStatusBadge.textContent = 'Fail (가독성 불량)';
      contrastStatusBadge.classList.add('fail');
      contrastGuideText.textContent = '배경과 글자의 명도 차이가 적어 읽기 불편합니다. [⚡ 자동 매핑]을 눌러보세요.';
    }
  }

  // =========================================================================
  // 6. UI Rendering: Strip, Cards, Selects
  // =========================================================================
  function renderAllViews() {
    renderPaletteStrip();
    renderPaletteGrid();
    updateMappingSelectorsOptions();
    updateLockSummary();
    applyThemeToPreviewCanvas();
    updatePromptModalTexts();
  }

  function renderPaletteStrip() {
    paletteStripBar.replaceChildren();
    activeCountLabel.textContent = `${paletteColors.length}개 색상 활성화`;

    paletteColors.forEach((colorObj, index) => {
      const cell = document.createElement('div');
      cell.className = 'strip-cell';
      cell.style.backgroundColor = colorObj.hex;
      cell.setAttribute('data-hex', `${colorObj.hex} (${index + 1})`);
      cell.title = `${colorObj.hex} (클릭하여 복사)`;

      cell.addEventListener('click', () => {
        copyToClipboard(colorObj.hex, `${colorObj.hex} 복사 완료!`);
      });

      paletteStripBar.appendChild(cell);
    });
  }

  function renderPaletteGrid() {
    paletteGrid.replaceChildren();

    paletteColors.forEach((colorObj, index) => {
      const card = document.createElement('div');
      card.className = `color-card ${colorObj.locked ? 'is-locked' : ''}`;
      card.id = `card-${colorObj.id}`;

      // 1. Swatch Box
      const swatchBox = document.createElement('div');
      swatchBox.className = 'card-swatch-box';
      swatchBox.style.backgroundColor = colorObj.hex;

      const swatchTip = document.createElement('span');
      swatchTip.className = 'swatch-overlay-tip';
      swatchTip.textContent = '색상 피커 열기';
      swatchBox.appendChild(swatchTip);

      // Hidden native color picker
      const hiddenPicker = document.createElement('input');
      hiddenPicker.type = 'color';
      hiddenPicker.className = 'color-picker-hidden';
      hiddenPicker.value = colorObj.hex;

      hiddenPicker.addEventListener('input', (e) => {
        const newHex = normalizeHex(e.target.value);
        updateColorAtIndex(index, newHex);
      });

      swatchBox.appendChild(hiddenPicker);

      swatchBox.addEventListener('click', (e) => {
        if (e.target !== hiddenPicker) {
          hiddenPicker.click();
        }
      });

      // 2. Lock Button
      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.className = 'card-lock-btn';
      lockBtn.title = colorObj.locked ? '잠금 해제 (다시 생성 시 변경됨)' : '색상 잠금 (다시 생성 시 고정)';
      lockBtn.textContent = colorObj.locked ? '🔒' : '🔓';

      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorObj.locked = !colorObj.locked;
        card.classList.toggle('is-locked', colorObj.locked);
        lockBtn.textContent = colorObj.locked ? '🔒' : '🔓';
        lockBtn.title = colorObj.locked ? '잠금 해제' : '색상 잠금';
        updateLockSummary();
        showToast(colorObj.locked ? `#${index + 1} 색상이 잠겼습니다.` : `#${index + 1} 색상 잠금이 해제되었습니다.`, 'info');
      });

      // 3. Slot Number Badge
      const slotBadge = document.createElement('span');
      slotBadge.className = 'card-slot-badge';
      slotBadge.textContent = `#${index + 1}`;

      // 4. Card Body with Inline HEX & Formats
      const infoBody = document.createElement('div');
      infoBody.className = 'card-info-body';

      // Input Row
      const inputRow = document.createElement('div');
      inputRow.className = 'card-input-row';

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'card-hex-input';
      hexInput.value = colorObj[colorObj.activeFormat] || colorObj.hex;
      hexInput.maxLength = 25;

      hexInput.addEventListener('change', () => {
        const entered = hexInput.value.trim();
        const parsed = parseAnyColorToHex(entered);
        if (parsed && isValidHex(parsed)) {
          updateColorAtIndex(index, parsed);
        } else {
          showToast('올바른 색상 형식(HEX, RGB, HSL)을 입력하세요.', 'info');
          hexInput.value = colorObj[colorObj.activeFormat] || colorObj.hex;
        }
      });

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-mini-btn';
      copyBtn.title = '클립보드 복사';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', () => {
        const valToCopy = colorObj[colorObj.activeFormat] || colorObj.hex;
        copyToClipboard(valToCopy, `${valToCopy} 복사 완료!`);
      });

      inputRow.appendChild(hexInput);
      inputRow.appendChild(copyBtn);

      // Formats Bar (HEX / RGB / HSL)
      const formatsBar = document.createElement('div');
      formatsBar.className = 'card-formats-bar';

      ['hex', 'rgb', 'hsl'].forEach(fmt => {
        const fmtPill = document.createElement('button');
        fmtPill.type = 'button';
        fmtPill.className = `fmt-pill ${colorObj.activeFormat === fmt ? 'active' : ''}`;
        fmtPill.textContent = fmt.toUpperCase();

        fmtPill.addEventListener('click', () => {
          colorObj.activeFormat = fmt;
          formatsBar.querySelectorAll('.fmt-pill').forEach(b => b.classList.remove('active'));
          fmtPill.classList.add('active');
          hexInput.value = colorObj[fmt];
        });

        formatsBar.appendChild(fmtPill);
      });

      infoBody.appendChild(inputRow);
      infoBody.appendChild(formatsBar);

      card.appendChild(swatchBox);
      card.appendChild(lockBtn);
      card.appendChild(slotBadge);
      card.appendChild(infoBody);

      paletteGrid.appendChild(card);
    });
  }

  function updateColorAtIndex(index, newHex) {
    if (!paletteColors[index]) return;
    const norm = normalizeHex(newHex);
    paletteColors[index].hex = norm;
    paletteColors[index].rgb = formatRgbStr(norm);
    paletteColors[index].hsl = formatHslStr(norm);

    renderPaletteStrip();
    renderPaletteGrid();
    updateMappingSelectorsOptions();
    applyThemeToPreviewCanvas();
  }

  function updateLockSummary() {
    const count = paletteColors.filter(c => c.locked).length;
    lockCountText.textContent = `${count}개 잠김`;
    if (count > 0) {
      lockSummary.classList.add('has-locked');
      lockSummary.querySelector('.lock-icon-sm').textContent = '🔒';
    } else {
      lockSummary.classList.remove('has-locked');
      lockSummary.querySelector('.lock-icon-sm').textContent = '🔓';
    }
  }

  function updateMappingSelectorsOptions() {
    const selectors = [
      { el: mapBgSelect, key: 'bg' },
      { el: mapTextSelect, key: 'text' },
      { el: mapPrimarySelect, key: 'primary' },
      { el: mapAccentSelect, key: 'accent' },
      { el: mapCardSelect, key: 'card' },
      { el: mapCardTextSelect, key: 'cardText' },
      { el: mapMutedTextSelect, key: 'mutedText' },
      { el: mapBorderSelect, key: 'border' },
      { el: mapTagSelect, key: 'tag' },
      { el: mapTagTextSelect, key: 'tagText' },
      { el: mapCodeBgSelect, key: 'codeBg' },
      { el: mapFooterBgSelect, key: 'footerBg' }
    ];

    selectors.forEach(({ el, key }) => {
      if (!el) return;
      const prevVal = blogMappings[key] || el.value;
      el.replaceChildren();

      paletteColors.forEach((color, idx) => {
        const opt = document.createElement('option');
        opt.value = color.hex;
        opt.textContent = `#${idx + 1} : ${color.hex}`;
        el.appendChild(opt);
      });

      // Restore if valid
      if (paletteColors.some(c => c.hex === prevVal)) {
        el.value = prevVal;
        blogMappings[key] = prevVal;
      } else if (paletteColors[0]) {
        el.value = paletteColors[0].hex;
        blogMappings[key] = paletteColors[0].hex;
      }
    });
  }

  // =========================================================================
  // 7. Modals: AI Prompt, AI Import, Export Code
  // =========================================================================
  function updatePromptModalTexts() {
    if (promptSlotCountBadge) {
      promptSlotCountBadge.textContent = slotCount;
    }

    const p1 = `모던 미니멀 개발 블로그를 위한 ${slotCount}색 컬러 팔레트 추천해줘. 배경, 본문 텍스트, 코드블록, 포인트 버튼용 색상이 포함되어야 하고 각 색상의 HEX 코드와 용도를 적어줘.`;
    const p2 = `따뜻하고 감성적인 브런치/라이프스타일 블로그용 ${slotCount}색 테마 세트를 구성해주고, 가독성 좋은 본문 텍스트용 진한 색을 포함해 HEX 코드로 알려줘.`;
    const p3 = `다크 모드에 최적화된 사이버펑크/네온 스타일의 감각적인 IT 테크 블로그 ${slotCount}색 팔레트를 HEX 코드로 뽑아줘.`;

    if (presetPrompt1) presetPrompt1.textContent = p1;
    if (presetPrompt2) presetPrompt2.textContent = p2;
    if (presetPrompt3) presetPrompt3.textContent = p3;
  }

  // Regex Extraction for Import Modal
  function extractColorsFromRawText(text) {
    const hexPattern = /#[a-fA-F0-9]{3,8}\b/g;
    const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d\.]+)?\s*\)/gi;
    const hslPattern = /hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(?:\s*,\s*[\d\.]+)?\s*\)/gi;

    const matches = [
      ...(text.match(hexPattern) || []),
      ...(text.match(rgbPattern) || []),
      ...(text.match(hslPattern) || [])
    ];

    const uniqueList = [];
    const seen = new Set();

    matches.forEach(raw => {
      const hex = parseAnyColorToHex(raw);
      if (hex && !seen.has(hex)) {
        seen.add(hex);
        uniqueList.push(hex);
      }
    });

    return uniqueList;
  }

  function handleImportTextInput() {
    const text = importTextInput.value;
    const extracted = extractColorsFromRawText(text);

    importDetectedCount.textContent = `감지된 색상: ${extracted.length}개`;
    importPreviewStrip.replaceChildren();

    if (extracted.length > 0) {
      applyImportBtn.disabled = false;
      extracted.slice(0, 16).forEach(hex => {
        const dot = document.createElement('div');
        dot.className = 'import-dot-cell';
        dot.style.backgroundColor = hex;
        dot.title = hex;
        importPreviewStrip.appendChild(dot);
      });
    } else {
      applyImportBtn.disabled = true;
    }
  }

  function applyImportedColors() {
    const text = importTextInput.value;
    const extracted = extractColorsFromRawText(text);
    if (extracted.length === 0) return;

    const keepLocked = importKeepLockedChk.checked;
    const newColors = [];
    let extractedIdx = 0;

    for (let i = 0; i < slotCount; i++) {
      if (keepLocked && paletteColors[i] && paletteColors[i].locked) {
        newColors.push(paletteColors[i]);
      } else if (extractedIdx < extracted.length) {
        newColors.push(createColorObject(extracted[extractedIdx], false));
        extractedIdx++;
      } else {
        // Fill remaining with generated harmony
        const [r, g, b] = hslToRgb(Math.random() * 360, 65, 50);
        newColors.push(createColorObject(rgbToHex(r, g, b), false));
      }
    }

    paletteColors = newColors;
    renderAllViews();
    autoMapColorsForMockup();

    importModal.style.display = 'none';
    showToast(`${extracted.length}개의 색상을 팔레트에 성공적으로 적용했습니다!`, 'success');
  }

  // Export Codes (12 UI Mapping Tokens)
  function buildExportCodes() {
    // 1. CSS Variables
    let css = `:root {\n`;
    paletteColors.forEach((c, idx) => {
      css += `  --color-${idx + 1}: ${c.hex};\n`;
    });
    css += `\n  /* Blog Live Theme Mappings (12 Elements) */\n`;
    css += `  --blog-bg: ${blogMappings.bg || 'var(--color-1)'};\n`;
    css += `  --blog-text: ${blogMappings.text || 'var(--color-2)'};\n`;
    css += `  --blog-primary: ${blogMappings.primary || 'var(--color-3)'};\n`;
    css += `  --blog-accent: ${blogMappings.accent || 'var(--color-4)'};\n`;
    css += `  --blog-card-bg: ${blogMappings.card || '#ffffff'};\n`;
    css += `  --blog-card-text: ${blogMappings.cardText || blogMappings.text || 'var(--color-2)'};\n`;
    css += `  --blog-muted-text: ${blogMappings.mutedText || 'var(--color-2)'};\n`;
    css += `  --blog-border: ${blogMappings.border || 'rgba(0,0,0,0.1)'};\n`;
    css += `  --blog-tag-bg: ${blogMappings.tag || 'var(--color-3)'};\n`;
    css += `  --blog-tag-text: ${blogMappings.tagText || '#ffffff'};\n`;
    css += `  --blog-code-bg: ${blogMappings.codeBg || 'var(--color-1)'};\n`;
    css += `  --blog-footer-bg: ${blogMappings.footerBg || 'var(--color-1)'};\n`;
    css += `}`;
    codeCssVars.textContent = css;

    // 2. Tailwind Config
    const twColors = {};
    paletteColors.forEach((c, idx) => {
      twColors[`palette-${idx + 1}`] = c.hex;
    });
    twColors['theme-bg'] = blogMappings.bg;
    twColors['theme-text'] = blogMappings.text;
    twColors['theme-primary'] = blogMappings.primary;
    twColors['theme-accent'] = blogMappings.accent;
    twColors['theme-card'] = blogMappings.card;
    twColors['theme-card-text'] = blogMappings.cardText;
    twColors['theme-muted-text'] = blogMappings.mutedText;
    twColors['theme-border'] = blogMappings.border;
    twColors['theme-tag-bg'] = blogMappings.tag;
    twColors['theme-tag-text'] = blogMappings.tagText;
    twColors['theme-code-bg'] = blogMappings.codeBg;
    twColors['theme-footer-bg'] = blogMappings.footerBg;

    const twText = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(twColors, null, 8).replace('}', '      }')}\n    }\n  }\n};`;
    codeTailwind.textContent = twText;

    // 3. JSON Schema
    const jsonOutput = {
      paletteSize: slotCount,
      harmonyRule: harmonyRule,
      colors: paletteColors.map((c, i) => ({
        index: i + 1,
        hex: c.hex,
        rgb: c.rgb,
        hsl: c.hsl,
        locked: c.locked
      })),
      mappings: {
        background: blogMappings.bg,
        text: blogMappings.text,
        primary: blogMappings.primary,
        accent: blogMappings.accent,
        cardBackground: blogMappings.card,
        cardText: blogMappings.cardText,
        mutedText: blogMappings.mutedText,
        border: blogMappings.border,
        tagBackground: blogMappings.tag,
        tagText: blogMappings.tagText,
        codeBackground: blogMappings.codeBg,
        footerBackground: blogMappings.footerBg
      }
    };
    codeJson.textContent = JSON.stringify(jsonOutput, null, 2);
  }

  // =========================================================================
  // 8. LocalStorage Storage Management
  // =========================================================================
  function renderSavedPalettes() {
    savedPalettesList.replaceChildren();

    if (savedPalettes.length === 0) {
      noSavedMsg.style.display = 'block';
      return;
    }
    noSavedMsg.style.display = 'none';

    savedPalettes.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'saved-palette-card';

      const meta = document.createElement('div');
      meta.className = 'saved-info-meta';

      const name = document.createElement('span');
      name.className = 'saved-name-text';
      name.textContent = item.name;

      const date = document.createElement('span');
      date.className = 'saved-date-text';
      date.textContent = `${item.date} · ${item.colors.length}색`;

      meta.appendChild(name);
      meta.appendChild(date);

      const dots = document.createElement('div');
      dots.className = 'saved-color-dots';
      item.colors.slice(0, 6).forEach(c => {
        const dot = document.createElement('div');
        dot.className = 'saved-dot';
        dot.style.backgroundColor = c.hex;
        dots.appendChild(dot);
      });

      const actions = document.createElement('div');
      actions.className = 'saved-actions-btns';

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'action-btn sm primary';
      loadBtn.textContent = '적용';
      loadBtn.addEventListener('click', () => loadSavedPalette(index));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'action-btn sm secondary';
      delBtn.textContent = '✕';
      delBtn.title = '삭제';
      delBtn.addEventListener('click', () => deleteSavedPalette(index));

      actions.appendChild(loadBtn);
      actions.appendChild(delBtn);

      card.appendChild(meta);
      card.appendChild(dots);
      card.appendChild(actions);

      savedPalettesList.appendChild(card);
    });
  }

  function saveCurrentPalette() {
    const title = prompt('저장할 팔레트 이름을 입력하세요:', `팔레트 ${new Date().toLocaleDateString('ko-KR')}`);
    if (!title) return;

    const newEntry = {
      id: Date.now(),
      name: title.trim(),
      date: new Date().toLocaleDateString('ko-KR'),
      slotCount: slotCount,
      harmonyRule: harmonyRule,
      colors: paletteColors.map(c => ({ hex: c.hex, locked: c.locked })),
      mappings: { ...blogMappings }
    };

    savedPalettes.unshift(newEntry);
    localStorage.setItem('saved_palettes_pro', JSON.stringify(savedPalettes));
    renderSavedPalettes();
    showToast(`'${title}' 팔레트가 저장되었습니다!`, 'success');
  }

  function loadSavedPalette(index) {
    const item = savedPalettes[index];
    if (!item) return;

    slotCount = item.slotCount || item.colors.length;
    harmonyRule = item.harmonyRule || 'analogous';

    // Update controls
    slotControls.querySelectorAll('.segment-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-slots'), 10) === slotCount);
    });
    harmonyRuleSelect.value = harmonyRule;

    paletteColors = item.colors.map(c => createColorObject(c.hex, c.locked));

    if (item.mappings) {
      blogMappings = { ...item.mappings };
    }

    renderAllViews();
    applyThemeToPreviewCanvas();
    showToast(`'${item.name}' 팔레트가 로드되었습니다.`, 'success');
  }

  function deleteSavedPalette(index) {
    if (!confirm('이 팔레트를 삭제하시겠습니까?')) return;
    savedPalettes.splice(index, 1);
    localStorage.setItem('saved_palettes_pro', JSON.stringify(savedPalettes));
    renderSavedPalettes();
    showToast('팔레트가 삭제되었습니다.', 'info');
  }

  // =========================================================================
  // 9. Clipboard & Toast Helper
  // =========================================================================
  function copyToClipboard(text, successMsg = '복사 완료!') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => {
      showToast('복사에 실패했습니다.', 'info');
    });
  }

  // =========================================================================
  // 10. Event Listeners Setup
  // =========================================================================
  function setupEventListeners() {
    // 1. Slot Count Segments
    slotControls.querySelectorAll('.segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newSlots = parseInt(btn.getAttribute('data-slots'), 10);
        if (newSlots === slotCount) return;

        slotControls.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        slotCount = newSlots;
        generatePaletteSet();
        renderAllViews();
        autoMapColorsForMockup();
        showToast(`슬롯 크기가 ${slotCount}개로 변경되었습니다.`, 'info');
      });
    });

    // 2. Harmony Rule Change
    harmonyRuleSelect.addEventListener('change', () => {
      harmonyRule = harmonyRuleSelect.value;
      generatePaletteSet();
      renderAllViews();
      autoMapColorsForMockup();
      showToast(`조화 규칙이 적용되었습니다.`, 'info');
    });

    // 3. Generate Button
    generatePaletteBtn.addEventListener('click', () => {
      generatePaletteSet();
      renderAllViews();
      autoMapColorsForMockup();
      showToast('잠기지 않은 색상이 새롭게 생성되었습니다!', 'success');
    });

    // 4. Spacebar Shortcut
    window.addEventListener('keydown', (e) => {
      // Ignore if inside input/textarea/select or if any modal is open
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (['input', 'textarea', 'select'].includes(tag)) return;

      const isAnyModalOpen = [promptModal, importModal, exportModal].some(m => m && m.style.display === 'flex');
      if (isAnyModalOpen) return;

      if (e.code === 'Space') {
        e.preventDefault();
        generatePaletteBtn.click();
      }
    });

    // 5. Mockup Theme Switcher (Light / Dark)
    mockupLightBtn.addEventListener('click', () => {
      if (mockupTheme === 'light') return;
      mockupTheme = 'light';
      mockupLightBtn.classList.add('active');
      mockupDarkBtn.classList.remove('active');
      blogPreviewCanvas.classList.remove('dark-mode');
      blogPreviewCanvas.classList.add('light-mode');
      autoMapColorsForMockup();
    });

    mockupDarkBtn.addEventListener('click', () => {
      if (mockupTheme === 'dark') return;
      mockupTheme = 'dark';
      mockupDarkBtn.classList.add('active');
      mockupLightBtn.classList.remove('active');
      blogPreviewCanvas.classList.remove('light-mode');
      blogPreviewCanvas.classList.add('dark-mode');
      autoMapColorsForMockup();
    });

    // 6. Auto Map Button
    autoMapBtn.addEventListener('click', () => {
      autoMapColorsForMockup();
      showToast('가독성을 고려한 최적 배색으로 자동 매핑되었습니다!', 'success');
    });

    // 7. Manual Mapping Selects (12 UI Elements)
    [
      { el: mapBgSelect, key: 'bg' },
      { el: mapTextSelect, key: 'text' },
      { el: mapPrimarySelect, key: 'primary' },
      { el: mapAccentSelect, key: 'accent' },
      { el: mapCardSelect, key: 'card' },
      { el: mapCardTextSelect, key: 'cardText' },
      { el: mapMutedTextSelect, key: 'mutedText' },
      { el: mapBorderSelect, key: 'border' },
      { el: mapTagSelect, key: 'tag' },
      { el: mapTagTextSelect, key: 'tagText' },
      { el: mapCodeBgSelect, key: 'codeBg' },
      { el: mapFooterBgSelect, key: 'footerBg' }
    ].forEach(({ el, key }) => {
      if (!el) return;
      el.addEventListener('change', () => {
        blogMappings[key] = el.value;
        applyThemeToPreviewCanvas();
      });
    });

    // 8. Prompt Modal Triggers
    openPromptModalBtn.addEventListener('click', () => {
      updatePromptModalTexts();
      promptModal.style.display = 'flex';
    });

    [closePromptModalBtn, closePromptModalBtn2].forEach(btn => {
      if (btn) btn.addEventListener('click', () => promptModal.style.display = 'none');
    });

    promptModal.addEventListener('click', (e) => {
      if (e.target === promptModal) promptModal.style.display = 'none';
    });

    // Prompt Copy Buttons
    promptModal.querySelectorAll('.copy-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          copyToClipboard(targetEl.textContent, '프롬프트가 클립보드에 복사되었습니다!');
        }
      });
    });

    // 9. Import Modal Triggers
    openImportModalBtn.addEventListener('click', () => {
      importModal.style.display = 'flex';
    });

    [closeImportModalBtn, cancelImportBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => importModal.style.display = 'none');
    });

    importModal.addEventListener('click', (e) => {
      if (e.target === importModal) importModal.style.display = 'none';
    });

    importTextInput.addEventListener('input', handleImportTextInput);
    applyImportBtn.addEventListener('click', applyImportedColors);

    importLoadSampleBtn.addEventListener('click', () => {
      importTextInput.value = `안녕하세요! 요청하신 감각적인 블로그 컬러 팔레트입니다.
- 메인 배경: #0F172A (다크 슬레이트)
- 본문 텍스트: #F8FAFC (소프트 화이트)
- 메인 브랜드 (Primary): #6366F1 (모던 인디고)
- 포인트 액션 (Accent): #F43F5E (에너제틱 로즈)
- 카드 배경: #1E293B (다크 카드)
- 서브 엑센트: #10B981 (에메랄드 민트)
- 보조 톤: #A855F7, #38BDF8, #F59E0B, #E2E8F0`;
      handleImportTextInput();
      showToast('샘플 답변이 입력되었습니다.', 'info');
    });

    // 10. Save Palette
    savePaletteBtn.addEventListener('click', saveCurrentPalette);

    // 11. Code Export Modal
    exportCodeBtn.addEventListener('click', () => {
      buildExportCodes();
      exportModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
      exportModal.style.display = 'none';
    });

    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) exportModal.style.display = 'none';
    });

    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.getAttribute('data-tab');
        activeExportTab = tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        exportModal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        e.target.classList.add('active');
        const pane = document.getElementById(`pane-${tab}`);
        if (pane) pane.classList.add('active');
      });
    });

    copyCodeBtn.addEventListener('click', () => {
      let textToCopy = '';
      if (activeExportTab === 'css-vars') textToCopy = codeCssVars.textContent;
      if (activeExportTab === 'tailwind') textToCopy = codeTailwind.textContent;
      if (activeExportTab === 'json') textToCopy = codeJson.textContent;

      copyToClipboard(textToCopy, '코드가 클립보드에 복사되었습니다!');
    });
  }

  // =========================================================================
  // 11. Initialization
  // =========================================================================
  function init() {
    // Load saved palettes from LocalStorage
    const rawSaved = localStorage.getItem('saved_palettes_pro') || localStorage.getItem('saved_palettes');
    if (rawSaved) {
      try {
        savedPalettes = JSON.parse(rawSaved);
      } catch (e) {
        console.error('Failed to parse saved palettes', e);
        savedPalettes = [];
      }
    }

    // Generate initial vibrant palette
    generatePaletteSet();
    setupEventListeners();
    renderAllViews();
    autoMapColorsForMockup();
    renderSavedPalettes();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
