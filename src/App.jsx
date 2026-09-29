import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownRight, ArrowUpRight, Check, CircleHelp, Copy,
  ExternalLink, Grip, GripVertical, LayoutGrid, Link2, Maximize2,
  Minimize2, MonitorPlay, Pause, Play, Plus,
  RotateCcw, Search, Shuffle, Sparkles, Upload, Volume2, VolumeX, X,
} from 'lucide-react';
import { presets } from './presets.js';
import { rotations } from './rotations.js';
import YouTubePlayer from './YouTubePlayer.jsx';

const MAX_TILES = 12;
const STORAGE_KEY = 'dopamine-wall-v1';
const initialTiles = ['sand', 'minecraft', 'subway', 'paint', 'otter'].map((id, i) => ({
  uid: `${id}-${i}`, presetId: id,
}));

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tiles)) {
      return {
        tiles: saved.tiles.filter((tile) => tile && tile.uid && (tile.presetId || tile.custom)).slice(0, MAX_TILES),
        columns: [2, 3, 4].includes(saved.columns) ? saved.columns : 3,
        muted: saved.muted !== false,
      };
    }
  } catch { /* ignore corrupt saved settings */ }
  return { tiles: initialTiles, columns: 3, muted: true };
}

function getSource(tile) {
  return tile.custom || presets.find((preset) => preset.id === tile.presetId) || presets[0];
}

function isPacificCamHours() {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23',
  }).format(new Date()));
  return hour >= 7 && hour < 19;
}

function youtubeIdFromUrl(raw) {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0];
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
      return match?.[1] || null;
    }
  } catch { /* invalid URL */ }
  return null;
}

function safeCustomSource(raw, title) {
  const value = raw.trim();
  const id = youtubeIdFromUrl(value);
  if (id && /^[\w-]{11}$/.test(id)) {
    return {
      id: 'custom-youtube', title: title.trim() || 'YouTube video', subtitle: 'your pick',
      type: 'youtube', videoId: id, portrait: new URL(value).pathname.startsWith('/shorts/'), category: 'YOUR VIDEO', tint: 'custom', emoji: '▶',
      credit: 'YouTube', sourceUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!/\.(mp4|webm|ogg)(\?.*)?$/i.test(url.href)) return null;
    return {
      id: 'custom-video', title: title.trim() || 'My video', subtitle: 'your pick',
      type: 'video', src: url.href, category: 'YOUR VIDEO', tint: 'custom', emoji: '▶',
      credit: url.hostname, sourceUrl: url.href,
    };
  } catch { return null; }
}

function IconButton({ icon: Icon, label, onClick, active = false, className = '', disabled = false }) {
  return <button type="button" className={`icon-button ${active ? 'active' : ''} ${className}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}><Icon size={17} strokeWidth={1.9} /></button>;
}

function Tile({ tile, index, muted, playing, immersive = false, onRemove, onDuplicate, onDragStart, onDrop, onDragOver }) {
  const baseSource = getSource(tile);
  const clips = tile.custom ? [baseSource] : [baseSource, ...(rotations[tile.presetId] || []).map((clip) => ({ ...baseSource, ...clip }))];
  const [clipIndex, setClipIndex] = useState(0);
  const [camLive, setCamLive] = useState(isPacificCamHours);
  const selectedClip = clips[clipIndex % clips.length];
  const source = selectedClip.offHoursVideoId && !camLive
    ? { ...selectedClip, videoId: selectedClip.offHoursVideoId, subtitle: 'after-hours replay' }
    : selectedClip;
  const videoRef = useRef(null);
  const [error, setError] = useState(false);
  const [fade, setFade] = useState('visible');
  const fadeRef = useRef('visible');
  const transitioningRef = useRef(false);
  const swapTimerRef = useRef(null);
  const readyTimerRef = useRef(null);
  const revealTimerRef = useRef(null);

  function revealNext() {
    if (fadeRef.current !== 'hidden' || revealTimerRef.current) return;
    clearTimeout(readyTimerRef.current);
    revealTimerRef.current = setTimeout(() => {
      revealTimerRef.current = null;
      fadeRef.current = 'visible';
      setFade('visible');
      transitioningRef.current = false;
    }, 40);
  }

  function advance() {
    if (clips.length < 2 || transitioningRef.current) return;
    transitioningRef.current = true;
    fadeRef.current = 'fading-out';
    setFade('fading-out');
    swapTimerRef.current = setTimeout(() => {
      fadeRef.current = 'hidden';
      setFade('hidden');
      setError(false);
      setClipIndex((current) => (current + 1) % clips.length);
      readyTimerRef.current = setTimeout(revealNext, 4000);
    }, 450);
  }

  useEffect(() => () => {
    clearTimeout(swapTimerRef.current);
    clearTimeout(readyTimerRef.current);
    clearTimeout(revealTimerRef.current);
  }, []);
  useEffect(() => {
    if (!baseSource.offHoursVideoId) return undefined;
    const timer = setInterval(() => setCamLive(isPacificCamHours()), 60_000);
    return () => clearInterval(timer);
  }, [baseSource.offHoursVideoId]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      if (playing) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [muted, playing, source.src, source.type]);

  return <article className={`tile tile-${source.tint} ${source.portrait ? 'tile-portrait' : ''}`} draggable={!immersive} onDragStart={!immersive ? (event) => onDragStart(event, index) : undefined} onDragOver={!immersive ? onDragOver : undefined} onDrop={!immersive ? (event) => onDrop(event, index) : undefined}>
    <div className="tile-media">
      <div className={`tile-player ${fade}`}>
      {source.type === 'youtube' ?
        <YouTubePlayer key={source.videoId} videoId={source.videoId} title={source.title} muted={muted} playing={playing} immersive={immersive} loop={clips.length < 2} onEnded={advance} onReady={revealNext} /> :
        error ? <div className="video-error"><CircleHelp size={23} /><span>Couldn’t load this video</span></div> :
          <video ref={videoRef} src={source.src} autoPlay={playing} muted={muted} loop={clips.length < 2} playsInline preload="metadata" controls={false} onCanPlay={revealNext} onEnded={advance} onError={() => { setError(true); advance(); }} />}
      </div>
      {!immersive && <><div className="tile-vignette" /><div className="tile-number">{String(index + 1).padStart(2, '0')}</div>{source.offHoursVideoId && <div className={`cam-badge ${camLive ? 'cam-badge-live' : ''}`}>{camLive ? 'LIVE' : 'REPLAY'}</div>}{source.type === 'video' && !playing && <div className="paused-badge">PAUSED</div>}</>}
    </div>
    {!immersive && <div className="tile-footer">
      <span className="tile-drag" aria-hidden="true"><GripVertical size={15} /></span>
      <div className="tile-identity"><span className={`tile-dot dot-${source.tint}`} /><div><strong>{source.title}</strong><small>{source.subtitle}</small></div></div>
      <div className="tile-actions">
        <IconButton icon={Copy} label={`Duplicate ${source.title}`} onClick={() => onDuplicate(tile)} />
        <IconButton icon={X} label={`Remove ${source.title}`} onClick={() => onRemove(tile.uid)} />
      </div>
    </div>}
  </article>;
}

function AddModal({ onClose, onAdd, onFile }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  function submit(event) {
    event.preventDefault();
    const source = safeCustomSource(url, title);
    if (!source) { setError('Paste a YouTube link or a direct .mp4, .webm, or .ogg link.'); return; }
    onAdd(source); onClose();
  }
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h2 id="add-modal-title">Add your own video</h2></div><IconButton icon={X} label="Close" onClick={onClose} /></div>
      <p>Paste a YouTube link or direct video file URL, or choose a file from your computer.</p>
      <form onSubmit={submit}>
        <label htmlFor="video-url">VIDEO LINK</label>
        <div className="field-wrap"><Link2 size={17} /><input ref={inputRef} id="video-url" type="url" placeholder="https://youtube.com/watch?v=..." value={url} onChange={(event) => { setUrl(event.target.value); setError(''); }} /></div>
        <label htmlFor="video-title">NAME <span>OPTIONAL</span></label>
        <div className="field-wrap"><Sparkles size={17} /><input id="video-title" type="text" maxLength={32} placeholder="Give this one a name" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button modal-submit" type="submit"><Plus size={17} /> Add to wall</button>
      </form>
      <div className="modal-divider"><span>OR</span></div>
      <label className="upload-button"><Upload size={18} /><span>Choose a video file</span><input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) { onFile(file); onClose(); } }} /></label>
      <small className="modal-note">Files from your computer stay in this browser tab. Links and layout are saved for next time.</small>
    </div>
  </div>;
}

function App() {
  const [saved] = useState(loadSaved);
  const [tiles, setTiles] = useState(saved.tiles);
  const [columns, setColumns] = useState(saved.columns);
  const [muted, setMuted] = useState(saved.muted);
  const [playing, setPlaying] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showCredits, setShowCredits] = useState(false);
  const [notice, setNotice] = useState('');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenFallback, setFullscreenFallback] = useState(false);
  const dragRef = useRef(null);
  const tileDragRef = useRef(null);
  const uidRef = useRef(0);
  const windowRef = useRef(null);
  const isPopout = new URLSearchParams(location.search).has('popout');
  const filteredPresets = presets.filter((preset) =>
    `${preset.title} ${preset.subtitle} ${preset.category}`.toLowerCase().includes(libraryQuery.trim().toLowerCase())
  );
  const fullscreenTiles = isFullscreen ? [
    ...tiles,
    ...presets
      .filter((preset) => !tiles.some((tile) => tile.presetId === preset.id))
      .slice(0, MAX_TILES - tiles.length)
      .map((preset) => ({ uid: `fullscreen-${preset.id}`, presetId: preset.id })),
  ] : tiles;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tiles: tiles.filter((tile) => !tile.custom?.temporary), columns, muted,
    }));
  }, [tiles, columns, muted]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => () => { tiles.forEach((tile) => { if (tile.custom?.temporary) URL.revokeObjectURL(tile.custom.src); }); }, []);
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === windowRef.current || fullscreenFallback);
    document.addEventListener('fullscreenchange', syncFullscreen);
    const handleEscape = (event) => {
      if (event.key === 'Escape' && fullscreenFallback) setFullscreenFallback(false);
    };
    document.addEventListener('keydown', handleEscape);
    syncFullscreen();
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [fullscreenFallback]);

  function addTile(source) {
    if (tiles.length >= MAX_TILES) { setNotice('Your wall is full — remove a tile first.'); return; }
    const tile = typeof source === 'string' ? { presetId: source } : { custom: source };
    setTiles((current) => [...current, { ...tile, uid: `tile-${Date.now()}-${uidRef.current++}` }]);
  }
  function addFile(file) {
    addTile({
      id: 'local-file', title: file.name.replace(/\.[^.]+$/, '').slice(0, 32), subtitle: 'local file',
      type: 'video', src: URL.createObjectURL(file), category: 'YOUR VIDEO', tint: 'custom', emoji: '▶',
      credit: 'Your computer', temporary: true,
    });
  }
  function removeTile(uid) {
    setTiles((current) => { const removed = current.find((tile) => tile.uid === uid); if (removed?.custom?.temporary) URL.revokeObjectURL(removed.custom.src); return current.filter((tile) => tile.uid !== uid); });
  }
  function duplicateTile(tile) {
    if (tiles.length >= MAX_TILES) { setNotice('Your wall is full — remove a tile first.'); return; }
    setTiles((current) => [...current, { ...tile, uid: `tile-${Date.now()}-${uidRef.current++}` }]);
  }
  function shuffleTiles() { setTiles((current) => [...current].sort(() => Math.random() - 0.5)); }
  function resetWall() { setTiles(initialTiles); setColumns(3); setMuted(true); setPlaying(true); setNotice('Wall reset to the starter mix.'); }
  function dragStart(event, index) { tileDragRef.current = index; event.dataTransfer.effectAllowed = 'move'; }
  function drop(event, index) {
    event.preventDefault();
    const from = tileDragRef.current;
    if (from == null || from === index) return;
    setTiles((current) => { const next = [...current]; const [moved] = next.splice(from, 1); next.splice(index, 0, moved); return next; });
    tileDragRef.current = null;
  }
  function startPanelDrag(event) {
    if (event.target.closest('button, a, input')) return;
    dragRef.current = { x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePanel(event) {
    if (!dragRef.current) return;
    setOffset({ x: dragRef.current.startX + event.clientX - dragRef.current.x, y: dragRef.current.startY + event.clientY - dragRef.current.y });
  }
  function stopPanelDrag() { dragRef.current = null; }

  async function toggleFullscreen() {
    if (fullscreenFallback) {
      setFullscreenFallback(false);
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (windowRef.current?.requestFullscreen) await windowRef.current.requestFullscreen();
      else setFullscreenFallback(true);
    } catch { setFullscreenFallback(true); }
  }

  async function openPiP() {
    if (pipWindow) { pipWindow.focus(); return; }
    if ('documentPictureInPicture' in window) {
      try {
        const pip = await window.documentPictureInPicture.requestWindow({ width: 980, height: 680 });
        document.querySelectorAll('link[rel="stylesheet"], style').forEach((style) => pip.document.head.append(style.cloneNode(true)));
        pip.document.title = 'Dopamine Wall';
        pip.document.body.className = 'pip-body';
        pip.addEventListener('pagehide', () => setPipWindow(null), { once: true });
        setPipWindow(pip);
        return;
      } catch { /* browser may deny PiP; use a pop-out */ }
    }
    const url = new URL(location.href);
    url.searchParams.set('popout', '1');
    const popup = window.open(url, 'dopamine-wall-popout', 'popup,width=980,height=680');
    if (!popup) setNotice('Please allow pop-ups for this site, then try again.');
    else setNotice('Opened a draggable pop-out window.');
  }

  function Dashboard({ compact = false }) {
    return <div ref={windowRef} className={`app-window ${compact ? 'compact-window' : ''} ${fullscreenFallback ? 'fullscreen-fallback' : ''} ${isFullscreen ? 'immersive' : ''}`} style={!compact ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined} onDoubleClick={isFullscreen ? toggleFullscreen : undefined}>
      <div className="window-bar" onPointerDown={!compact ? startPanelDrag : undefined} onPointerMove={!compact ? movePanel : undefined} onPointerUp={!compact ? stopPanelDrag : undefined}>
        <div className="window-dots"><i /><i /><i /></div>
        <span className="window-label"><Grip size={13} /> DRAG ME ANYWHERE</span>
        <span className="window-end"><span className="live-pulse" /> YOUR LITTLE CHAOS CORNER</span>
      </div>
      <div className="app-body">
        <aside className="sidebar">
          <div className="brand"><div className="brand-mark"><span>✳</span></div><div><strong>dopamine<span>.</span></strong><small>the wall</small></div></div>
          <div className="sidebar-divider" />
          <div className="side-section-label"><span>YOUR LIBRARY</span><span className="side-count">{String(presets.length).padStart(2, '0')}</span></div>
          <label className="library-search"><Search size={14} /><input type="search" aria-label="Search videos" placeholder="Find a vibe..." value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} /></label>
          <div className="library-list">{filteredPresets.map((preset) => <button key={preset.id} type="button" className="library-item" onClick={() => addTile(preset.id)} disabled={tiles.length >= MAX_TILES}>
            <span className={`library-thumb thumb-${preset.tint}`}>
              {preset.type === 'youtube' ? <img src={`https://i.ytimg.com/vi/${preset.videoId}/mqdefault.jpg`} alt="" /> : <span>{preset.emoji}</span>}
            </span>
            <span className="library-copy"><strong>{preset.title}</strong><small>{preset.category}</small></span>
            <Plus size={16} className="library-plus" />
          </button>)}{!filteredPresets.length && <div className="library-empty">No videos match “{libraryQuery}”.</div>}</div>
          <button className="add-own" type="button" onClick={() => setModalOpen(true)} disabled={tiles.length >= MAX_TILES}><span className="add-own-icon"><Plus size={17} /></span><span>Add your own video</span><ArrowUpRight size={15} /></button>
          <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={16} /><span>Clips rotate as they finish. The otter cam stays on.</span></div><button className="credits-link" type="button" onClick={() => setShowCredits(true)}>Video credits <ArrowUpRight size={13} /></button></div>
        </aside>
        <main className="workspace">
          <header className="workspace-header"><div className="breadcrumb">YOUR SPACE <span>/</span> THE WALL</div><div className="header-actions"><span className="saved-indicator"><Check size={13} /> Auto-saved</span><IconButton icon={RotateCcw} label="Reset wall" onClick={resetWall} /></div></header>
          <div className="workspace-content">
            <div className="hero-row"><div><div className="hero-kicker"><span className="hero-kicker-line" /> INFINITE SCROLL, FINITE SPACE</div><h1>More is <em>more.</em><span className="sparkle-inline">✳</span></h1><p>Your favorite brain candy, all in one place. Drag tiles around and make it yours.</p></div><div className="tile-count"><strong>{String(tiles.length).padStart(2, '0')}<span> / {MAX_TILES}</span></strong><small>VIDEOS ON YOUR WALL</small></div></div>
            <div className="toolbar"><div className="toolbar-left"><span className="toolbar-label"><LayoutGrid size={16} /> YOUR WALL</span><span className="toolbar-separator" /><span className="video-count-pill">{tiles.length} {playing ? 'playing' : 'paused'}</span></div><div className="toolbar-right"><div className="layout-switch" aria-label="Grid columns">{[2, 3, 4].map((number) => <button key={number} type="button" className={columns === number ? 'selected' : ''} onClick={() => setColumns(number)} title={`${number} columns`} aria-label={`${number} columns`}>{number}</button>)}</div><IconButton icon={Shuffle} label="Shuffle tiles" onClick={shuffleTiles} disabled={tiles.length < 2} /><IconButton icon={playing ? Pause : Play} label={playing ? 'Pause all videos' : 'Play all videos'} onClick={() => setPlaying(!playing)} /><IconButton icon={muted ? VolumeX : Volume2} label={muted ? 'Unmute videos' : 'Mute videos'} onClick={() => setMuted(!muted)} active={!muted} />{!pipWindow && <button className="fullscreen-button" type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}>{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}<span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span></button>}<button className="pip-button" type="button" onClick={openPiP}><MonitorPlay size={17} /><span>Pop out</span><ArrowUpRight size={14} /></button></div></div>
            {fullscreenTiles.length ? <div className="tile-grid" style={{ '--columns': columns }}>{fullscreenTiles.map((tile, index) => <Tile key={tile.uid} tile={tile} index={index} muted={muted} playing={playing} immersive={isFullscreen} onRemove={removeTile} onDuplicate={duplicateTile} onDragStart={dragStart} onDragOver={(event) => event.preventDefault()} onDrop={drop} />)}{!isFullscreen && tiles.length < MAX_TILES && <button type="button" className="empty-tile" onClick={() => setModalOpen(true)}><span><Plus size={23} /></span><strong>Room for more</strong><small>Add another video</small></button>}</div> : <div className="empty-wall"><div><Sparkles size={28} /></div><h2>Your wall is waiting.</h2><p>Pick a video from the library to get started.</p><button type="button" className="primary-button" onClick={() => addTile('sand')}><Plus size={17} /> Add a video</button></div>}
            <footer className="workspace-footer"><span><span className="footer-dot" /> ALL YOUR FAVES, ONE WINDOW</span><span>Drag the title bar to move this app <ArrowDownRight size={14} /></span></footer>
          </div>
        </main>
      </div>
    </div>;
  }

  return <><div className={`page ${isPopout ? 'popout-page' : ''}`}>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="page-grid" />
    {pipWindow ? <div className="pip-launcher"><div className="brand-mark"><span>✳</span></div><h1>Your wall is floating.</h1><p>Move the picture-in-picture window anywhere on your screen.</p><button className="primary-button" onClick={() => pipWindow.close()}><Minimize2 size={17} /> Return to this tab</button></div> : Dashboard({ compact: isPopout })}
    {!isPopout && !pipWindow && <div className="page-caption"><span className="caption-line" /> A LITTLE WINDOW OF EVERYTHING <span className="caption-line" /></div>}
  </div>
  {pipWindow && createPortal(Dashboard({ compact: true }), pipWindow.document.body)}
  {modalOpen && createPortal(<AddModal onClose={() => setModalOpen(false)} onAdd={addTile} onFile={addFile} />, pipWindow?.document.body || document.body)}
  {showCredits && createPortal(<div className="modal-backdrop" onMouseDown={() => setShowCredits(false)}><div className="modal credits-modal" role="dialog" aria-modal="true" aria-labelledby="credits-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">THANKS TO THE CREATORS</span><h2 id="credits-title">Video credits</h2></div><IconButton icon={X} label="Close" onClick={() => setShowCredits(false)} /></div><div className="credit-list">{presets.flatMap((preset) => [preset, ...(rotations[preset.id] || []), ...(preset.offHoursSourceUrl ? [{ clipTitle: `${preset.title} after hours`, credit: preset.credit, sourceUrl: preset.offHoursSourceUrl }] : [])].map((clip, clipIndex) => <a key={`${preset.id}-${clipIndex}`} href={clip.sourceUrl} target="_blank" rel="noreferrer"><span>{clip.clipTitle || preset.title}<small>{clip.credit}</small></span><ExternalLink size={16} /></a>))}</div><p className="credit-note">The bundled kinetic sand clip is by Serenity In sand, licensed under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</p></div></div>, pipWindow?.document.body || document.body)}
  {notice && createPortal(<div className="toast"><Check size={16} />{notice}</div>, pipWindow?.document.body || document.body)}
  </>;
}

export default App;
