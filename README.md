# 털보쌤 (TEOLBOSSAM)

어린이 자연탐험 교육 브랜드 **털보쌤**의 공식 홈페이지입니다.

## 스택

빌드 도구 없이 순정 **HTML / CSS / JavaScript**로 구성되어 있습니다.
프레임워크 의존성이 없어 유지보수가 쉽고, 정적 파일 그대로 어떤 호스팅(GitHub Pages, Netlify, Vercel 등)에도 바로 배포할 수 있습니다.

```
index.html      메인 페이지 (1페이지형 브랜드 홈페이지)
css/style.css   디자인 시스템 (CSS 변수 기반 컬러/타이포/반응형)
js/main.js      헤더 스크롤 상태, 모바일 내비게이션, 스크롤 리빌 애니메이션, 문의 폼
assets/         파비콘 등 정적 리소스
```

## 로컬 실행

별도 빌드 과정이 없으므로 `index.html`을 브라우저로 열거나, 간단한 정적 서버로 실행하면 됩니다.

```bash
python3 -m http.server 8080
# http://localhost:8080 접속
```

## 구성 섹션

1. Hero
2. 털보쌤 수업의 특징 (직접 발견하기 / 진짜 자연에서 배우기 / 탐험하듯 경험하기)
3. 털보쌤 소개
4. 프로그램 (숲 탐험대 / 곤충 탐험대 / 환경특공대 / 자연 탐구교실)
5. FIELD NOTE — 실제 수업 기록 갤러리
6. 기관 출강 안내
7. 아이들의 한마디
8. 수업 문의 폼
9. 마지막 CTA

## 문의 폼

현재는 백엔드 없이 `mailto:` 방식으로 동작합니다. 추후 실제 접수 처리가 필요하면
`js/main.js`의 제출 핸들러를 Formspree, EmailJS, 또는 자체 서버리스 함수 호출로
교체하면 됩니다.

## 디자인 컨셉

어린이 자연탐험대 + 필드노트 + 자연도감을 모티프로 하며, 털보쌤 공식 BI 컬러를 그대로
디자인 토큰화했습니다. 모든 컬러는 `css/style.css`의 `:root` 변수에서 한 번에 관리하므로,
BI가 업데이트되면 이 값들만 바꾸면 됩니다.

| 토큰 | 값 | 용도 · 사용 비율 |
| --- | --- | --- |
| `--color-cream` | `#F6F3EB` | Warm Cream Background — 배경 (~65%) |
| `--color-brown` | `#8E7243` | Primary Brand Brown — 본문 강조, 버튼, 아이콘 (~25%) |
| `--color-beige` | `#DDD5BE` | Soft Beige — 태그/칩 배경 (~7%) |
| `--color-sand` | `#BAAF95` | Sand Beige — 테두리, 보조 뉴트럴 |
| `--color-green` | `#96C565` | Sprout Green — 아이콘·라벨·hover 등 작은 포인트 전용 (~3%) |
| `--color-ink` | `#332D24` | Deep Brown Text — 본문 텍스트 + 다크 섹션 배경 |

브랜드 영문 슬로건 **LEARN · EXPLORE · GROW**는 Hero의 스탬프형 배지와 푸터에 공식
tagline으로 노출됩니다. 연두색(Sprout Green)은 큰 면적의 CTA를 채우는 용도가 아니라
아이콘, 라벨, hover 강조, 상태 텍스트 등 "새싹처럼 작은 포인트"로만 제한적으로 사용합니다.
