---
description: How to add new images, videos, or audio and deploy the changes
---

# 새 작품 추가하고 배포하기

## 쉬운 방법 (권장): `npm run add`

터미널에서 한 줄이면 됩니다:

```bash
npm run add
```

질문에 답하면 나머지는 자동입니다:

1. **파일 경로** — Finder에서 파일을 터미널 창으로 드래그하면 경로가 입력됩니다. 영상은 CDN URL을 붙여넣어도 됩니다.
2. **연도 / 장소** — 입력 (연도는 Enter만 누르면 올해)
3. 영상·음악이면 **제목**, 필요하면 **grid 썸네일 이미지**도 지정 가능

스크립트가 자동으로:
- 사진 → `public/images/imageNNNNN.jpg`로 번호 매겨 저장 (HEIC/PNG도 JPEG로 변환) + 480px 썸네일 생성
- 영상 → `assets/videos/`, 음악 → `assets/audio/`로 복사
- `projects.json`에 메타데이터 추가

확인하고 올리기:

```bash
npm run dev     # localhost:3000 에서 확인
git add -A && git commit -m "add: new work" && git push
```

push하면 GitHub Actions가 자동 빌드·배포합니다 (2~3분 뒤 gongillee.com 반영).

## grid 썸네일 (영상·음악)

- **영상**: 아무것도 안 해도 프리뷰 클립의 첫 프레임이 grid에 자동 표시됩니다. 다른 장면을 쓰고 싶으면 `npm run add`에서 썸네일 이미지를 지정하거나, `projects.json` 항목에 `"thumbSrc": "파일명.jpg"`를 넣고 그 이미지를 `public/thumbs/`에 두세요.
- **음악**: 썸네일이 없으면 grid에 파형 아이콘이 표시됩니다. 이미지를 쓰려면 위와 같이 `thumbSrc`를 지정하세요.

---

## 수동 방법 (참고)

1. 파일 넣기: 사진 `public/images/` · 영상 `assets/videos/` · 음악 `assets/audio/`
2. 사진이면 썸네일 생성: `npm run thumbs` (없는 것만 새로 생성, 재실행 안전)
3. `projects.json`에 항목 추가:

```json
{
  "title": "", "client": "", "year": "2024", "type": "seoul, south korea",
  "description": "", "mediaType": "image", "src": "image00118.jpg"
}
```

영상은 `"previewSrc"`(가벼운 프리뷰 클립), 영상·음악은 `"thumbSrc"`(grid 썸네일)를 선택적으로 추가할 수 있습니다.

4. 커밋 & 푸시 → 자동 배포

## 브랜치 (FAQ)

- **`main`**: 작업 공간. 항상 여기에 push.
- **`gh-pages`**: 배포용 자동 생성 브랜치. 신경 쓰지 않아도 됩니다.

---

# 부록: 영상 압축 가이드

모바일 로딩을 위해 **20MB 이하** 권장. (ffmpeg 필요: `brew install ffmpeg`)

### 웹 최적화 (권장)

```bash
ffmpeg -i input.mp4 -vf scale=1280:-2 -c:v libx264 -crf 23 -preset slow -c:a copy -movflags +faststart output.mp4
```

- `-movflags +faststart`: 다 받기 전에 재생 시작 (웹 필수)
- `-crf 23`: 품질 (18~28, 낮을수록 고품질)

### 고압축 (모바일/배경용)

```bash
ffmpeg -i input.mp4 -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -c:a copy -movflags +faststart output.mp4
```

### 프리뷰 클립 만들기 (grid 자동 썸네일용)

```bash
ffmpeg -i input.mp4 -vf scale=640:-2 -t 5 -an -c:v libx264 -crf 28 -movflags +faststart name_preview.mp4
```
