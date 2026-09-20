# Brand Assets — 공식 BI 파일 교체 위치

이 폴더에 아래 공식 BI 파일을 넣으면 홈페이지가 자동으로 실제 로고를 사용합니다.
파일이 없는 동안에는 안전한 텍스트 폴백이 대신 표시되므로 깨진 이미지 아이콘이
보이지 않고, 가짜 로고 이미지도 만들어 넣지 않았습니다.

| 파일 경로 | BI 유형 | 사용 위치 | 권장 형식 |
| --- | --- | --- | --- |
| `assets/brand/brand-signature.svg` | Brand Signature (심볼 + 로고타입) | 헤더 (데스크톱 · 모바일 공용) | SVG, 투명 배경, 가로형, 높이 약 34px 기준 |
| `assets/brand/brand-symbol.svg` | Brand Symbol (단독 심볼) | 파비콘 재생성용 원본 (아래 참고) | SVG, 정사각형 |
| `assets/brand/brand-emblem.svg` | Brand Emblem (브라운 배경 + 흰 로고 + LEARN · EXPLORE · GROW) | 푸터 브랜드 강조 영역 | SVG, 정사각형 또는 세로형, 너비 약 96px 기준 |

## 적용 방법 (자동)

- `brand-signature.svg`를 이 폴더에 넣으면 헤더의 텍스트 워드마크("털보쌤 TEOLBOSSAM")가
  자동으로 이 파일로 교체됩니다. 코드 수정이 필요 없습니다.
- `brand-emblem.svg`를 이 폴더에 넣으면 푸터의 텍스트 브랜드 블록이 자동으로
  이 파일로 교체됩니다. (엠블럼 안에 태그라인이 이미 포함되어 있으므로 하단의
  별도 "LEARN · EXPLORE · GROW" 텍스트도 함께 숨겨집니다.)
- 동작 원리는 `js/main.js` 상단의 브랜드 에셋 로딩 로직과
  `css/style.css`의 `.brand-slot` 규칙을 참고하세요. `<img data-brand-asset>`가
  성공적으로 로드되면 `.is-loaded` 클래스가 붙어 실제 이미지가 보이고 텍스트
  폴백은 숨겨집니다. 로드에 실패하면(파일이 없으면) `<img>`가 제거되고
  원래 있던 텍스트만 그대로 남습니다.

## 적용 방법 (수동)

- `brand-symbol.svg`는 코드에서 자동으로 불러오지 않습니다. 아래 두 곳에 직접
  적용해주세요.
  1. `assets/favicon.svg`를 이 심볼 기반으로 다시 만들어 교체 (현재는 임시 파비콘)
  2. 모바일 전용 헤더 아이콘으로 별도로 쓰고 싶다면, `index.html` 헤더의
     `.brand-slot` 안에 `brand-symbol.svg`용 `<img data-brand-asset>`를 하나 더
     추가하고, `css/style.css`에 `@media (max-width: 959px)` 규칙으로
     시그니처 대신 심볼을 보여주도록 CSS를 추가하면 됩니다.

## 왜 지금은 아이콘 없이 텍스트만 보이나요?

실제 BI 파일이 없는 동안 임의로 로고 비슷한 그래픽을 만들어 넣지 않기로 했습니다.
로고타입은 별도로 제작된 브랜드 자산이므로, 대신 브랜드명 텍스트("털보쌤
TEOLBOSSAM")만 안전한 폴백으로 노출하고 있습니다. 위 파일들을 넣는 즉시
실제 BI로 자동 전환됩니다.
