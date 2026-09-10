/**
 * Name Weaver - Identity & Name Generator Module
 */

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
  const uploadContainer = nameFileUpload.closest('.name-upload');
  if (uploadContainer) {
    uploadContainer.classList.toggle('is-disabled', fixedRule);
  }
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

function initNameGenerator() {
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
        if (typeof showToast === 'function') {
          showToast(`'${file.name}' 파일이 추가되었습니다!`, 'success');
        }
      });
      reader.readAsText(file);
    });
    event.target.value = '';
  });

  generateNameBtn.addEventListener('click', generateName);

  generatedName.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedName.textContent).then(() => {
      if (typeof showToast === 'function') {
        showToast('생성된 이름이 복사되었습니다!', 'success');
      }
    });
  });

  updateNameFileOptions();
  nameRuleType.value = 'rule2';
  updateNameFormState();
}

document.addEventListener('DOMContentLoaded', initNameGenerator);
