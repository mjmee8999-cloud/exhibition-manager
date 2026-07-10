# 부스 시뮬레이터 (한국어판)

승균님(Dennis Cho)이 만든 부스 시뮬레이터를 우리가 한국어로 번역해 직접 호스팅하는 버전입니다.
원본: https://github.com/letsavetheworld0711/homedant-booth-simulator-app (Vite + React + three.js)

- **화면에 실제로 뜨는 것**은 빌드 결과물인 `../public/booth/` 폴더예요.
- 이 `booth-sim/` 폴더는 그걸 만드는 **원본 소스**입니다. (수정·재빌드용)

## 수정하고 다시 반영하는 법

```bash
cd booth-sim
npm install          # 처음 한 번
# src/BoothSimulator.jsx 등을 수정
npm run build        # dist/ 생성
# 빌드 결과를 웹에 반영
rm -rf ../public/booth && cp -r dist ../public/booth
```

그 후 평소처럼 git commit / push 하면 Vercel에 반영됩니다.

## 번역 규칙
- `translate.py` 에 UI 한국어 번역 매핑이 정리돼 있어요. (원본을 새로 받았을 때 재적용용)
- 카테고리: SPEEDRACK→스피드랙, HOMEDANT HOUSE→홈던트하우스, Exhibition→전시회 물품
- 내부 로직 키(`brand`, `type`, `===` 비교값)는 절대 바꾸지 않습니다. 화면 표시 문구만 번역.

## 주의
- Vite `base` 는 `/booth/` 로 맞춰져 있어요 (우리 Next 앱의 public/booth/ 아래에서 열리도록).
