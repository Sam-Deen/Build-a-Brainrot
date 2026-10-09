import { createHash } from 'node:crypto';
import { open, readdir, stat, writeFile } from 'node:fs/promises';
import { presets } from '../src/presets.js';
import { rotations } from '../src/rotations.js';

// Keep the expected build outside the web root: a missing file or SPA fallback
// must never be accepted just because Nginx returns HTTP 200.
async function resource(url) {
  const file = `dist${url}`;
  const info = await stat(file);
  if (!info.isFile() || info.size === 0) throw new Error(`Empty build resource: ${url}`);
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(Math.min(info.size, 64));
    await handle.read(buffer, 0, buffer.length, 0);
    return { path: url, size: info.size, prefixHash: createHash('sha256').update(buffer).digest('hex') };
  } finally {
    await handle.close();
  }
}

const assets = (await readdir('dist/assets')).filter((name) => /\.(js|css)$/.test(name));
if (!assets.some((name) => name.endsWith('.js'))) throw new Error('Missing application bundle');
const videos = [...new Set([...presets, ...Object.values(rotations).flat()]
  .filter((clip) => clip.type === 'video').map((clip) => clip.src))];
const manifest = {
  application: [{ ...await resource('/index.html'), path: '/' }],
  assets: await Promise.all(assets.map((name) => resource(`/assets/${name}`))),
  bundledVideos: await Promise.all(videos.map(resource)),
};
await writeFile('health-manifest.json', JSON.stringify(manifest));
