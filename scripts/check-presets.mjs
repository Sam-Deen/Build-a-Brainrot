import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { presets } from '../src/presets.js';
import { rotations } from '../src/rotations.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = new Set();
const videoIds = new Set();
let failures = 0;

if (presets.length !== 21) {
  console.error(`Expected 21 presets, found ${presets.length}.`);
  failures++;
}
if (Object.keys(rotations).length !== presets.filter((preset) => !preset.live).length) {
  console.error('Every non-live library theme needs its own rotation pool.');
  failures++;
}

for (const preset of presets) {
  if (ids.has(preset.id)) {
    console.error(`Duplicate ID: ${preset.id}`);
    failures++;
  }
  ids.add(preset.id);

  const variants = rotations[preset.id] || [];
  if (preset.live ? variants.length !== 0 || !preset.offHoursVideoId : variants.length < 2 || variants.length > 3) {
    console.error(`${preset.id}: expected ${preset.live ? 'an off-hours video and no rotation' : '2–3 rotating alternatives'}.`);
    failures++;
    continue;
  }

  const offHoursClip = preset.offHoursVideoId && {
    type: 'youtube', videoId: preset.offHoursVideoId,
    clipTitle: `${preset.title} after hours`,
  };
  for (const clip of [preset, ...variants, ...(offHoursClip ? [offHoursClip] : [])]) {
    if (clip.type === 'video') {
      if (!clip.src?.startsWith('/videos/')) {
        console.error(`${preset.id}: bundled video path is missing.`);
        failures++;
        continue;
      }
      const file = path.join(root, 'public', clip.src.slice(1));
      try {
        const [info, bytes] = await Promise.all([stat(file), readFile(file)]);
        const isWebM = clip.src.endsWith('.webm') && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
        const isMp4 = clip.src.endsWith('.mp4') && bytes.toString('ascii', 4, 8) === 'ftyp';
        if (!info.size || (!isWebM && !isMp4)) throw new Error('Missing data or unexpected video header');
        console.log(`OK bundled  ${preset.title} (${(info.size / 1048576).toFixed(1)} MiB)`);
      } catch (error) {
        console.error(`FAIL bundled ${preset.title}: ${error.message}`);
        failures++;
      }
    } else if (clip.type === 'youtube') {
      try {
        if (videoIds.has(clip.videoId)) throw new Error('Duplicate YouTube video ID');
        videoIds.add(clip.videoId);
        const url = new URL('https://www.youtube.com/oembed');
        url.searchParams.set('url', `https://www.youtube.com/watch?v=${clip.videoId}`);
        url.searchParams.set('format', 'json');
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const info = await response.json();
        if (!info.title || !info.html?.includes(clip.videoId)) throw new Error('Missing embed metadata');
        console.log(`OK YouTube  ${clip.clipTitle || preset.title} — ${info.author_name}`);
      } catch (error) {
        console.error(`FAIL YouTube ${clip.clipTitle || preset.title}: ${error.message}`);
        failures++;
      }
    } else {
      console.error(`Unknown source type for ${preset.id}`);
      failures++;
    }
  }
}

const clipCount = presets.reduce((count, preset) => count + 1 + (rotations[preset.id]?.length || 0) + Number(Boolean(preset.offHoursVideoId)), 0);
console.log(`\n${presets.length} themes, ${clipCount} clips checked${failures ? ` with ${failures} failures` : ' successfully'}.`);
if (failures) process.exitCode = 1;
