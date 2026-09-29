import React, { useEffect, useRef } from 'react';

const MAX_CLIP_SECONDS = 600;
const apiByDocument = new WeakMap();
let nextPlayerId = 0;

function loadYouTubeAPI(doc) {
  const win = doc.defaultView;
  if (win.YT?.Player) return Promise.resolve(win.YT);
  if (!apiByDocument.has(doc)) {
    apiByDocument.set(doc, new Promise((resolve, reject) => {
      const previousReady = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve(win.YT);
      };
      const script = doc.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('YouTube player API could not load'));
      doc.head.append(script);
    }));
  }
  return apiByDocument.get(doc);
}

export default function YouTubePlayer({ videoId, title, playing, muted, immersive, loop = false, onEnded, onReady }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const latest = useRef({ playing, muted, onEnded, onReady });
  latest.current = { playing, muted, onEnded, onReady };

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) player.mute();
    else player.unMute();
    if (playing) player.playVideo();
    else player.pauseVideo();
  }, [playing, muted]);

  useEffect(() => {
    const mount = mountRef.current;
    const doc = mount.ownerDocument;
    const win = doc.defaultView;
    const frame = doc.createElement('iframe');
    const params = new URLSearchParams({
      autoplay: '1', mute: latest.current.muted ? '1' : '0', playsinline: '1',
      rel: '0', controls: immersive ? '0' : '1', iv_load_policy: '3',
      fs: '0', enablejsapi: '1', origin: location.origin,
    });
    if (loop) { params.set('loop', '1'); params.set('playlist', videoId); }
    else params.set('end', String(MAX_CLIP_SECONDS));
    frame.id = `dopamine-youtube-${++nextPlayerId}`;
    frame.title = title;
    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    mount.append(frame);

    let disposed = false;
    let player;
    let progressTimer;
    let previousTime = 0;
    loadYouTubeAPI(doc).then((YT) => {
      if (disposed) return;
      player = new YT.Player(frame, {
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            if (latest.current.muted) event.target.mute();
            else event.target.unMute();
            if (latest.current.playing) event.target.playVideo();
            else { event.target.pauseVideo(); latest.current.onReady?.(); }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) latest.current.onReady?.();
            if (event.data === YT.PlayerState.ENDED) {
              if (loop) event.target.playVideo();
              else latest.current.onEnded?.();
            }
          },
          onError: () => latest.current.onEnded?.(),
        },
      });
      progressTimer = win.setInterval(() => {
        try {
          if (player.getPlayerState() !== YT.PlayerState.PLAYING) return;
          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();
          // Some Shorts jump back to zero without reporting the ENDED state.
          const shortLooped = duration > 0 && previousTime >= duration - 1.5 && currentTime < 2;
          if (!loop && (currentTime >= MAX_CLIP_SECONDS || shortLooped)) latest.current.onEnded?.();
          previousTime = currentTime;
        } catch { /* the player may be between embeds */ }
      }, 500);
    }).catch(() => { /* the iframe can still play without API controls */ });

    return () => {
      disposed = true;
      win.clearInterval(progressTimer);
      playerRef.current = null;
      try { player?.destroy(); } catch { /* the iframe may already be gone */ }
      frame.remove();
    };
  }, [videoId, title, immersive, loop]);

  return <div className="youtube-mount" ref={mountRef} />;
}
