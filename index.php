<?php
/**
 * Name Weaver - Advanced Name Generator
 */

// --- Configuration ---
$upload_dir = 'uploads/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// --- Korean Initial Consonant Logic ---
function getInitialConsonant($word) {
    if (empty($word)) return '';
    $char = mb_substr($word, 0, 1, 'UTF-8');
    $ord = mb_ord($char, 'UTF-8');
    
    // Hangul Syllables: AC00 - D7A3
    if ($ord >= 0xAC00 && $ord <= 0xD7A3) {
        $initialIndex = floor(($ord - 0xAC00) / (21 * 28));
        $initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        return $initials[$initialIndex] ?? '';
    }
    
    // For English or other characters, return the character itself (uppercase)
    return mb_strtoupper($char, 'UTF-8');
}

// --- Logic ---
$message = '';
$generated_name = '';

// Handle File Upload
if (isset($_FILES['word_file'])) {
    $file = $_FILES['word_file'];
    if ($file['error'] === UPLOAD_ERR_OK) {
        $name = basename($file['name']);
        move_uploaded_file($file['tmp_name'], $upload_dir . $name);
        $message = "파일 $name 업로드 완료!";
    }
}

// Get uploaded files
$files = glob($upload_dir . '*.{txt,csv,md}', GLOB_BRACE);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['generate'])) {
    $rule_type = $_POST['rule_type'] ?? 'rule1';
    $file1 = '';
    $file2 = '';
    $is_alliteration = false;

    switch ($rule_type) {
        case 'rule2': // Sample Random
            $file1 = $upload_dir . 'pre-text.txt';
            $file2 = $upload_dir . 'post-text.txt';
            break;
        case 'rule3': // Sample Alliteration
            $file1 = $upload_dir . 'pre-text.txt';
            $file2 = $upload_dir . 'post-text.txt';
            $is_alliteration = true;
            break;
        case 'rule4': // Ubuntu Naming
            $file1 = $upload_dir . 'ubuntu-pre.txt';
            $file2 = $upload_dir . 'ubuntu-post.txt';
            $is_alliteration = true;
            break;
        case 'rule1': // Manual
        default:
            $file1 = $_POST['file1'] ?? '';
            $file2 = $_POST['file2'] ?? '';
            break;
    }

    if ($file1 && $file2 && file_exists($file1) && file_exists($file2)) {
        $lines1 = file($file1, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $lines2 = file($file2, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if (!empty($lines1) && !empty($lines2)) {
            $word1 = trim($lines1[array_rand($lines1)]);
            
            if ($is_alliteration) {
                $initial1 = getInitialConsonant($word1);
                $filtered2 = array_filter($lines2, function($word) use ($initial1) {
                    return getInitialConsonant(trim($word)) === $initial1;
                });
                
                if (!empty($filtered2)) {
                    $word2 = trim($filtered2[array_rand($filtered2)]);
                } else {
                    $word2 = trim($lines2[array_rand($lines2)]);
                }
            } else {
                $word2 = trim($lines2[array_rand($lines2)]);
            }
            
            $generated_name = $word1 . ' ' . $word2;
        } else {
            $message = "파일 내용이 비어있습니다.";
        }
    } else {
        $message = "사용 가능한 파일을 선택해주세요.";
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Name Weaver | Premium Identity Generator</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="container">
        <h1>Name Weaver</h1>
        <p class="subtitle">특별한 규칙으로 완벽한 이름을 만드세요</p>

        <?php if ($message): ?>
            <div class="message"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data" id="generatorForm">
            <div class="control-panel">
                <!-- 1. 생성 규칙 (Top) -->
                <div class="form-group">
                    <label>생성 규칙 선택</label>
                    <select name="rule_type" id="ruleType" onchange="updateFormState()">
                        <option value="">규칙을 선택하세요...</option>
                        <option value="rule1" <?php echo (isset($_POST['rule_type']) && $_POST['rule_type'] == 'rule1') ? 'selected' : ''; ?>>규칙 1: 수동 파일 업로드</option>
                        <option value="rule2" <?php echo (isset($_POST['rule_type']) && $_POST['rule_type'] == 'rule2') ? 'selected' : ''; ?>>규칙 2: 샘플 생성 (완전 무작위)</option>
                        <option value="rule3" <?php echo (isset($_POST['rule_type']) && $_POST['rule_type'] == 'rule3') ? 'selected' : ''; ?>>규칙 3: 샘플 생성 (초성 일치)</option>
                        <option value="rule4" <?php echo (isset($_POST['rule_type']) && $_POST['rule_type'] == 'rule4') ? 'selected' : ''; ?>>규칙 4: 우분투 버전 네이밍</option>
                    </select>
                </div>

                <!-- 2. 파일 업로드 (Conditional) -->
                <div class="upload-section" id="uploadSection">
                    <label style="cursor: pointer; display: block;">
                        <span style="display: block; margin-bottom: 8px; color: var(--text-dim); font-size: 0.9rem;">새 단어 파일 업로드 (.txt, .csv, .md)</span>
                        <input type="file" name="word_file" id="wordFile" onchange="this.form.submit()" style="font-size: 0.8rem;">
                    </label>
                </div>

                <!-- 3. 앞 단어, 뒤 단어 선택 (Conditional) -->
                <div id="fileSelectionArea" class="options-grid">
                    <div class="form-group">
                        <label>앞 단어 (Pre-text)</label>
                        <select name="file1" id="file1" onchange="updateFormState()">
                            <option value="">파일 선택...</option>
                            <?php foreach ($files as $f): ?>
                                <option value="<?php echo $f; ?>" <?php echo (isset($_POST['file1']) && $_POST['file1'] == $f) ? 'selected' : ''; ?>>
                                    <?php echo basename($f); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>뒤 단어 (Post-text)</label>
                        <select name="file2" id="file2" onchange="updateFormState()">
                            <option value="">파일 선택...</option>
                            <?php foreach ($files as $f): ?>
                                <option value="<?php echo $f; ?>" <?php echo (isset($_POST['file2']) && $_POST['file2'] == $f) ? 'selected' : ''; ?>>
                                    <?php echo basename($f); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <!-- 4. 생성 버튼 -->
                <button type="submit" name="generate" id="generateBtn" class="btn-generate" disabled>새 이름 생성하기 ✨</button>
            </div>

            <!-- 5. 결과 뷰 -->
            <div class="result-area">
                <?php if ($generated_name): ?>
                    <div class="generated-name" id="nameResult"><?php echo htmlspecialchars($generated_name); ?></div>
                    <p style="color: var(--text-dim); font-size: 0.9rem;">클릭하여 복사하세요</p>
                <?php endif; ?>
            </div>
        </form>
    </div>

    <script>
        function updateFormState() {
            const ruleType = document.getElementById('ruleType').value;
            const uploadSection = document.getElementById('uploadSection');
            const fileSelectionArea = document.getElementById('fileSelectionArea');
            const file1 = document.getElementById('file1');
            const file2 = document.getElementById('file2');
            const generateBtn = document.getElementById('generateBtn');

            // Reset states
            uploadSection.style.opacity = "1";
            uploadSection.style.pointerEvents = "auto";
            fileSelectionArea.style.opacity = "1";
            fileSelectionArea.style.pointerEvents = "auto";
            generateBtn.disabled = true;

            if (ruleType === 'rule1') {
                // Manual Upload: Everything active, but need files selected to enable button
                if (file1.value && file2.value) {
                    generateBtn.disabled = false;
                }
            } else if (ruleType === 'rule2' || ruleType === 'rule3' || ruleType === 'rule4') {
                // Fixed rules: Deactivate upload and manual selection
                uploadSection.style.opacity = "0.3";
                uploadSection.style.pointerEvents = "none";
                fileSelectionArea.style.opacity = "0.3";
                fileSelectionArea.style.pointerEvents = "none";
                generateBtn.disabled = false;
            } else {
                // No rule selected
                generateBtn.disabled = true;
            }
        }

        // Initialize state on load
        window.onload = updateFormState;

        // Copy to clipboard
        document.getElementById('nameResult')?.addEventListener('click', function() {
            const text = this.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.innerText;
                this.innerText = 'Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.innerText = originalText;
                    this.classList.remove('copied');
                }, 1000);
            });
        });
    </script>
</body>
</html>
