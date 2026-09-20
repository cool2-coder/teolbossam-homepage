# 털보쌤 (TEOLBOSSAM)

어린이 자연탐험 교육 브랜드 **털보쌤**의 공식 홈페이지입니다.

핵심 브랜드 메시지: *"숲은 아이가 스스로 배우고, 도전하고, 감사하며 성장하는 가장 큰 교실이다."*
공식 태그라인: **LEARN · EXPLORE · GROW**

## 스택

빌드 도구 없이 순정 **HTML / CSS / JavaScript**로 구성되어 있습니다.
프레임워크 의존성이 없어 유지보수가 쉽고, 정적 파일 그대로 어떤 호스팅(GitHub Pages, Netlify, Vercel 등)에도 바로 배포할 수 있습니다.

```
index.html          메인 페이지 (1페이지형 브랜드 홈페이지)
css/style.css       디자인 시스템 (CSS 변수 기반 컬러/타이포/반응형)
js/main.js          헤더 스크롤 상태, 모바일 내비게이션, 스크롤 리빌 애니메이션,
                    브랜드 에셋 폴백 로직, 문의 폼
assets/favicon.svg  임시 파비콘 (brand-symbol.svg로 교체 예정)
assets/brand/       공식 BI 파일 교체 위치 — README.md 참고
```

## 로컬 실행

별도 빌드 과정이 없으므로 `index.html`을 브라우저로 열거나, 간단한 정적 서버로 실행하면 됩니다.

```bash
python3 -m http.server 8080
# http://localhost:8080 접속
```

## 구성 섹션

1. Hero — 공식 태그라인 + 메인 카피 + 향후 사진이 들어갈 자리
2. 교육철학 (Philosophy) — "숲은 놀이터이면서 동시에 인생학교입니다"
3. 교육방법 (Principles) — PLAY / EXPLORE / QUESTION / TOGETHER / GROW 5원칙
4. 교육목표 (Goals) — 신체 · 정서 · 사회성 · 인지 · 가치
5. 연령별 교육과정 (Growth) — 느끼기 → 탐험하기 → 이해하기
6. 프로그램 (Programs) — 털보쌤이랑 놀자: 아침숲 / 낮숲 / 초등숲탐험대
7. 사계절 교육 (Seasons) — 봄 · 여름 · 가을 · 겨울 티저
8. FIELD NOTE — 실제 수업 기록 아카이브
9. 기관 출강 안내 (Institutions)
10. 아이들의 한마디 (Voices)
11. 수업 문의 폼 (Contact)
12. 마지막 CTA
13. Footer — 태그라인 + 브랜드 엠블럼 자리

## 브랜드 에셋 (로고)

공식 BI 파일(Brand Signature / Symbol / Emblem)이 아직 없어서, 가짜 로고를 만들어 넣지
않고 텍스트 워드마크를 안전한 폴백으로 사용하고 있습니다. 정확한 파일 경로와 자동 교체
동작 방식은 [`assets/brand/README.md`](assets/brand/README.md)에 정리되어 있습니다.

## 프로그램 추가/수정하기

현재 프로그램명(아침숲 / 낮숲 / 초등숲탐험대)은 실제 운영·사용 이력이 확인된
공식 명칭입니다. 곤충관찰, 협동 미션, 자연물 놀이 같은 세부 활동은 별도
프로그램명으로 만들지 말고 각 카드 설명 문장 안의 활동 요소로만 표현하세요.

새 프로그램이 확정되면 `index.html`의 `.program-grid` 안 `.program-card` 블록
하나를 복사해 붙여넣으면 됩니다. 그리드가 `auto-fit`이라 카드 수가 늘어나거나
줄어도 CSS를 수정할 필요가 없습니다. 프로그램명이 바뀌면 문의 폼의
"관심 프로그램" `<select>`(`index.html`)와 `js/main.js`의 `PROGRAM_LABELS`도
함께 맞춰주세요.

## 문의 폼

현재는 백엔드 없이 `mailto:` 방식으로 동작합니다. `js/main.js`의 `FIELD_LABELS` /
`TYPE_LABELS` / `AUDIENCE_LABELS` / `PROGRAM_LABELS`에 필드와 표시 이름이 한 곳에
선언되어 있어서, 추후 Formspree 또는 서버 API로 교체할 때는 제출 핸들러 안의
"mailto swap point" 주석 부분만 `fetch(...)` 호출로 바꾸면 됩니다.

## 디자인 컨셉

어린이 자연탐험대 + FIELD NOTE + 자연도감 + 따뜻한 교육 브랜드를 모티프로 하며, 털보쌤
공식 BI 컬러를 그대로 디자인 토큰화했습니다. 모든 컬러는 `css/style.css`의 `:root`
변수에서 한 번에 관리하므로, BI가 업데이트되면 이 값들만 바꾸면 됩니다.

| 토큰 | 값 | 용도 · 사용 비율 |
| --- | --- | --- |
| `--bg-cream` | `#F8F6EF` | Warm Cream Background — 페이지 기본 배경 (~65-70%) |
| `--brand-brown` | `#8A6A2C` | Primary Brand Brown — 버튼 · 아이콘 · 강조 텍스트 (~20-25%) |
| `--bg-soft` | `#EFE9DB` | Soft Beige Background — 카드 · 타일 표면 (~7-10%) |
| `--brand-beige` | `#B8AA86` | Natural Beige — 테두리, 태그 강조 |
| `--brand-green` | `#80CD41` | Sprout Green — 아이콘 · 라벨 · hover 등 작은 포인트 전용 (~2-3%) |
| `--text-main` | `#342D22` | Main Text — 본문 텍스트 + 다크 섹션 배경 |
| `--text-muted` | `#756A58` | Muted Text — 보조 설명 텍스트 |
| `--brand-white` | `#FFFFFF` | 폼 입력창 등 순백 표면 |

연두색(Sprout Green)은 큰 면적의 배경이나 Primary CTA를 채우는 용도로 쓰지 않고,
아이콘, 라벨, hover 강조, 상태 텍스트 등 "새싹처럼 작은 포인트"로만 제한적으로
사용합니다. Primary 버튼은 항상 Brand Brown 배경 + Warm Cream 텍스트입니다.

공식 태그라인 **LEARN · EXPLORE · GROW**는 Hero의 스탬프형 배지와 Footer에 노출되며,
임의로 다른 영문 슬로건으로 대체하지 않습니다.
