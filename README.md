# Gong Il Lee

종이 위에 인쇄된 인덱스를 컨셉으로, 모든 작품이 번호(no.001–)를 달고 두 가지 화면으로 열립니다.

## 화면

### dot — 점묘 캔버스

작품 한 점이 수천 개의 잉크 점으로 그려집니다. 어두운 곳은 굵은 점, 밝은 곳은 가는 점.

- **커서를 움직이면** 지나간 자리의 점들이 부풀었다가 서서히 가라앉습니다 (멈춘 커서는 아무 일도 하지 않음)
- **사진**: 썸네일을 점묘로 렌더링
- **영상**: 프리뷰 클립을 매 프레임 샘플링 — 점들이 영상을 재생
- **음악**: 파형(waveform) 모양의 점묘
- **← → 키 / 스와이프**: 작품 순환 (점들이 이전 그림에서 다음 그림으로 모핑)
- **클릭 / 탭**: 작품 크게 보기
- 첫 진입 시 랜덤 작품에서 시작

### grid — 밀착 인화 + 루페

필름 콘택트 시트 위를 루페로 들여다보는 화면.

- 화면 가득 작은 인화 컷이 깔리고, **커서를 따라다니는 원형 루페**(2.4×) 안에서만 크게 보임
- 루페 아래에 `no.047 · 2019 · berlin, germany` 캡션 태그가 따라붙음
- **All / Image / Video / Audio** 필터
- 영상은 프리뷰 첫 프레임이 자동 썸네일로, 음악은 파형 아이콘 (`thumbSrc`로 커스텀 가능)
- 모바일: 드래그 스크롤, **길게 누르면 손가락이 루페**, 탭으로 열기
- 모바일에서는 grid가 기본 화면

### 상세 보기

- 하단 캡션 스트립: `no.047 · 2019 · berlin, germany · 사진` + `047 / 119` 카운터
- ← → 키, 스와이프, prev/next 버튼으로 앞뒤 작품 이동
- 영상·음악은 같은 틀에서 재생

### 그 외

- 하단에 청람색 티커가 오른쪽→왼쪽으로 흐름 ([Marquee.tsx](components/Marquee.tsx)의 `TICKER`로 문구 수정)
- 우클릭·드래그 저장 방지

## 새 작품 추가

```bash
npm run add
```

파일을 터미널로 드래그하고 연도·장소만 입력하면 저장·번호 부여·썸네일 생성·메타데이터 등록까지 자동. 이후 `git push`만 하면 배포됩니다. 자세한 내용은 [WORKFLOW.md](WORKFLOW.md).

## 개발

```bash
npm install
npm run dev      # localhost:3000
npm run build    # 프로덕션 빌드 (dist/)
npm run thumbs   # 누락된 480px 썸네일 일괄 생성
```

`main`에 push하면 GitHub Actions가 빌드해서 gh-pages로 자동 배포합니다 (2–3분).

## 구조

```
projects.json          작품 메타데이터 (source of truth)
public/images/         사진 원본 (imageNNNNN.jpg)
public/thumbs/         480px 썸네일 (호버·grid용, 원본은 모달에서만 로드)
assets/videos/         영상 (프리뷰는 previews/), 대용량은 CDN URL 사용
assets/audio/          음악
components/
  StippleCanvas.tsx    dot 뷰 — 점묘 렌더링 + 커서 스웰
  IndexView.tsx        grid 뷰 — 콘택트 시트 + 루페
  Modal.tsx            상세 보기
  Marquee.tsx          하단 티커
scripts/add-media.mjs  npm run add
```

## 스택 & 디자인 토큰

React 19 · Vite 6 · Tailwind CSS v4 · Canvas 2D

| 토큰 | 값 | 용도 |
|---|---|---|
| paper | `#f9f8f5` | 바탕 |
| ink | `#2b2a27` | 글·점 |
| accent | `#0000d2` | 번호·활성·티커 |
| mono | JetBrains Mono | 메타데이터·UI |
| sans | IBM Plex Sans KR | 한글 본문 |

점묘 질감은 [StippleCanvas.tsx](components/StippleCanvas.tsx) 상단의 `SWELL_*` 상수로, 루페는 [IndexView.tsx](components/IndexView.tsx)의 `LOUPE_*` 상수로 조정합니다.
