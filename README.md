# mini-tools

Palette Inspector와 Name Weaver를 한 페이지에서 제공하는 정적 미니 도구 모음입니다.

## 실행

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다.

## 포함된 도구

- **Palette Inspector**: 텍스트에서 HEX/RGB/HSL 색상을 추출하고, 블로그 미리보기와 CSS/Tailwind/JSON 내보내기를 제공합니다.
- **Name Weaver**: 샘플 규칙 또는 사용자가 선택한 단어 파일을 조합해 이름을 생성합니다.

## 파일 구조

- `index.html`: 통합 화면
- `app.js`: 팔레트 검사기와 이름 생성기 동작
- `style.css`: 통합 스타일

Name Weaver의 파일 업로드는 현재 브라우저 메모리에서만 처리됩니다. 서버 저장이 필요하면 PHP 업로드 기능을 별도로 다시 연결해야 합니다.

## 아이콘 검색
https://googlefonts.github.io/noto-emoji-animation/
