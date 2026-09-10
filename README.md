# mini-tools

Palette Inspector와 Name Weaver를 한 페이지에서 제공하는 정적 미니 도구 모음입니다.

## 실행

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다.

## 포함된 도구

- **Palette Inspector (색상 팔레트)**: 자체 하모니 생성(유사색/보색/파스텔/다크/랜덤), 개별 컬러 잠금(Lock) 및 인라인/피커 편집, 슬롯 확장(6/10/12개), 실전 블로그 목업(라이트/다크 전환, 자동 가독성 매핑, WCAG 대비 검수) 및 외부 AI 프롬프트 연동/가져오기를 제공합니다.
- **Name Weaver**: 샘플 규칙 또는 사용자가 선택한 단어 파일을 조합해 이름을 생성합니다.

## 파일 구조

- `index.html`, `home.css`: 메인 홈 대시보드
- `common.css`, `common.js`: 공통 테마, 네비게이션 바 및 유틸리티
- `name-generator.html`, `name-generator.css`, `name-generator.js`: 이름 생성기 (Name Weaver)
- `color-palette.html`, `color-palette.css`, `color-palette.js`: 색상 팔레트 (Palette Inspector)
- `uploads/`: 단어 텍스트 데이터셋

각 도구는 완전히 독립된 HTML/CSS/JS 파일로 분리되어 있어, 특정 도구 수정 시 다른 도구에 영향을 주지 않고 안전하게 작업할 수 있습니다.

Name Weaver의 파일 업로드는 현재 브라우저 메모리에서만 처리됩니다. 서버 저장이 필요하면 PHP 업로드 기능을 별도로 다시 연결해야 합니다.

## 아이콘 검색
https://googlefonts.github.io/noto-emoji-animation/

https://fonts.google.com/noto/specimen/Noto+Color+Emoji?coloronly=true