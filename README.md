# teolbossam-homepage

털보쌤 브랜드 홈페이지 (정적 사이트: HTML + CSS + JS, 빌드 도구 없음)

## 미리보기

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 구성

| 파일 | 설명 |
| --- | --- |
| `index.html` | 페이지 내용 (소개 · 강의 · 콘텐츠 · 후기 · 문의) |
| `styles.css` | 디자인 (색상은 상단 `:root` 변수에서 변경) |
| `script.js` | 모바일 메뉴, 스크롤 애니메이션, 문의 폼 |
| `assets/logo.svg` | 털보쌤 캐릭터 로고 |

## 꼭 바꿔야 할 내용

- `index.html`의 문구, 통계 숫자(`data-count`), 강의 정보, 후기
- 유튜브/인스타/블로그 링크 (`href="#"` 부분)
- 이메일 주소: `index.html`과 `script.js`의 `CONTACT_EMAIL`

## 배포 (GitHub Pages)

Settings → Pages → Source: `Deploy from a branch` → `main` / `(root)` 선택.
