#!/usr/bin/env node
/**
 * npm run add — 새 작품(사진/영상/음악)을 대화형으로 추가합니다.
 *
 * 하는 일:
 *  1. 파일을 올바른 폴더로 복사 (사진은 imageNNNNN.jpg로 자동 이름 부여)
 *  2. 썸네일 자동 생성 (sips)
 *  3. projects.json에 메타데이터 추가
 *
 * 파일 경로는 Finder에서 터미널 창으로 드래그하면 자동 입력됩니다.
 */
import { createInterface } from 'node:readline/promises';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'projects.json');
const IMAGES_DIR = path.join(ROOT, 'public/images');
const THUMBS_DIR = path.join(ROOT, 'public/thumbs');
const VIDEOS_DIR = path.join(ROOT, 'assets/videos');
const AUDIO_DIR = path.join(ROOT, 'assets/audio');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, fallback = '') => {
  const a = (await rl.question(fallback ? `${q} [${fallback}]: ` : `${q}: `)).trim();
  return a || fallback;
};

// Finder 드래그 시 붙는 이스케이프/따옴표 제거
const cleanPath = (raw) =>
  raw.trim().replace(/^['"]|['"]$/g, '').replace(/\\(.)/g, '$1');

const hasCmd = (cmd) => {
  try { execFileSync('which', [cmd], { stdio: 'pipe' }); return true; } catch { return false; }
};

const sips = (args) => execFileSync('sips', args, { stdio: 'pipe' });

const makeThumb = (srcFile, outName) => {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
  const out = path.join(THUMBS_DIR, outName);
  sips(['-s', 'format', 'jpeg', '-s', 'formatOptions', '75', '-Z', '480', srcFile, '--out', out]);
  return outName;
};

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '_').replace(/^_+|_+$/g, '') || 'untitled';

const main = async () => {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`\n현재 아카이브: ${data.length}개 작품\n`);

  const input = cleanPath(await ask('파일 경로 또는 영상 URL (Finder에서 드래그 가능)'));
  if (!input) { console.log('입력이 없어 종료합니다.'); rl.close(); return; }

  const isUrl = /^https?:\/\//.test(input);
  if (!isUrl && !fs.existsSync(input)) {
    console.error(`파일을 찾을 수 없습니다: ${input}`);
    rl.close();
    process.exit(1);
  }

  // 미디어 타입 판별
  const ext = (isUrl ? input.split('?')[0] : input).split('.').pop().toLowerCase();
  let mediaType;
  if (['jpg', 'jpeg', 'png', 'heic', 'tiff', 'webp'].includes(ext)) mediaType = 'image';
  else if (['mp4', 'mov', 'webm', 'm4v'].includes(ext)) mediaType = 'video';
  else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) mediaType = 'audio';
  else {
    mediaType = await ask('종류를 알 수 없습니다. image / video / audio 중 입력');
    if (!['image', 'video', 'audio'].includes(mediaType)) { console.error('잘못된 타입'); rl.close(); process.exit(1); }
  }
  console.log(`→ 종류: ${mediaType}\n`);

  const year = await ask('연도', String(new Date().getFullYear()));
  const location = await ask('장소 (예: seoul, south korea)');

  const entry = {
    title: '', client: '', year, type: location, description: '', mediaType, src: '',
  };

  if (mediaType === 'image') {
    // 다음 번호 계산
    const nums = fs.readdirSync(IMAGES_DIR)
      .map(f => /^image(\d{5})\.jpg$/.exec(f)?.[1])
      .filter(Boolean)
      .map(Number);
    const nextNo = (nums.length ? Math.max(...nums) : 0) + 1;
    const name = `image${String(nextNo).padStart(5, '0')}.jpg`;
    const dest = path.join(IMAGES_DIR, name);

    if (['jpg', 'jpeg'].includes(ext)) {
      fs.copyFileSync(input, dest);
    } else {
      sips(['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', input, '--out', dest]); // HEIC/PNG → JPEG
    }
    makeThumb(dest, name);
    entry.src = name;
    console.log(`\n✓ ${name} 저장 + 썸네일 생성`);
  } else {
    entry.title = await ask('제목 (grid/모달에 표시됨)');
    const slug = slugify(entry.title);

    if (mediaType === 'video') {
      if (isUrl) {
        entry.src = input; // CDN URL 그대로 사용
      } else {
        fs.mkdirSync(VIDEOS_DIR, { recursive: true });
        const name = `${slug}.${ext}`;
        fs.copyFileSync(input, path.join(VIDEOS_DIR, name));
        entry.src = name;
        console.log(`✓ assets/videos/${name} 저장`);
        if (fs.statSync(input).size > 20 * 1024 * 1024) {
          console.log('⚠ 20MB 초과 — WORKFLOW.md의 ffmpeg 압축 가이드를 참고하거나 CDN 업로드를 권장합니다.');
        }
      }
      // 프리뷰 클립 (grid 자동 썸네일 + 가벼운 재생용)
      const preview = cleanPath(await ask('프리뷰 클립 파일 경로 (없으면 Enter)', ''));
      if (preview && fs.existsSync(preview)) {
        const pname = `${slug}_preview.${preview.split('.').pop().toLowerCase()}`;
        fs.mkdirSync(path.join(VIDEOS_DIR, 'previews'), { recursive: true });
        fs.copyFileSync(preview, path.join(VIDEOS_DIR, 'previews', pname));
        entry.previewSrc = pname;
        console.log(`✓ 프리뷰 저장: ${pname}`);
      }
    } else {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
      const name = `${slug}.${ext}`;
      fs.copyFileSync(input, path.join(AUDIO_DIR, name));
      entry.src = name;
      console.log(`✓ assets/audio/${name} 저장`);
    }

    // grid 썸네일 (선택)
    const thumb = cleanPath(await ask('grid 썸네일용 이미지 경로 (없으면 Enter — 영상은 프리뷰 첫 프레임 자동 사용)', ''));
    if (thumb && fs.existsSync(thumb)) {
      entry.thumbSrc = makeThumb(thumb, `${slug}_thumb.jpg`);
      console.log(`✓ 썸네일 저장: ${entry.thumbSrc}`);
    }
  }

  data.push(entry);
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
  const no = String(data.length).padStart(3, '0');
  console.log(`\n✓ projects.json에 no.${no} 추가 완료:\n  ${JSON.stringify(entry)}\n`);
  console.log('다음 단계:');
  console.log('  1. npm run dev     → localhost:3000 에서 확인');
  console.log('  2. git add -A && git commit -m "add: new work" && git push');
  console.log('     (push하면 2~3분 뒤 gongillee.com에 반영)\n');
  rl.close();
};

main().catch((e) => { console.error(e); rl.close(); process.exit(1); });
