/* =========================================================================
   AUDIO — WebAudio synth (bell, chime, soft swell) + YouTube ambient track.
   The header sound toggle plays/pauses a looping YouTube video instead of a
   synth pad. WebAudio context is created lazily and resumed on the first user
   gesture (browsers block autoplay otherwise). Every method no-ops gracefully
   if WebAudio / the YT player is unavailable.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const AC = window.AudioContext || window.webkitAudioContext;

  let ctx = null;
  let master = null;
  let ambientOn = false;

  /* ============== YouTube ambient track ==============
     Loads the IFrame Player API once, then lazily builds a hidden,
     audio-only player. playVideo/pauseVideo are driven by the ambient
     toggle so the existing sound button works unchanged. */
  const YT_VIDEO_ID = "lmYlOxyOESw";
  const YT_HOST = "https://www.youtube.com";
  let ytPlayer = null;
  let ytReady = false;
  let ytWantPlaying = false;

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = YT_HOST + "/iframe_api";
      document.head.appendChild(tag);
    }
    return new Promise(function (resolve) {
      if (window.YT && window.YT.Player) return resolve();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === "function") prev();
        resolve();
      };
    });
  }

  function buildYouTubePlayer() {
    if (ytPlayer) return Promise.resolve(ytPlayer);
    let host = document.getElementById("yt-ambient-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "yt-ambient-host";
      // Off-screen, audio-only — never visible, never interactive.
      host.style.cssText =
        "position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
      document.body.appendChild(host);
      const inner = document.createElement("div");
      inner.id = "yt-ambient-player";
      host.appendChild(inner);
    }
    return loadYouTubeApi().then(
      function () {
        return new Promise(function (resolve) {
          ytPlayer = new window.YT.Player("yt-ambient-player", {
            videoId: YT_VIDEO_ID,
            // loop the single track: loop=1 requires playlist=<same id>
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              loop: 1,
              playlist: YT_VIDEO_ID,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              onReady: function (e) {
                ytReady = true;
                try {
                  e.target.setVolume(55);
                } catch (err) {
                  /* volume unsupported — ignore */
                }
                if (ytWantPlaying) e.target.playVideo();
                resolve(ytPlayer);
              },
              onStateChange: function (e) {
                // Restart cleanly if the track ever ends despite the loop.
                if (e.data === window.YT.PlayerState.ENDED) {
                  try {
                    e.target.seekTo(0);
                    e.target.playVideo();
                  } catch (err) {
                    /* ignore */
                  }
                }
              },
              onError: function () {
                ytReady = false;
              },
            },
          });
        });
      }
    );
  }

  function ensure() {
    if (ctx) return ctx;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    const c = ensure();
    if (c && c.state === "suspended") c.resume();
    return c;
  }

  /* A single decaying partial. */
  function partial(freq, start, dur, peak, type) {
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(master);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /* Short filtered noise burst for the strike transient. */
  function noiseBurst(dur, peak) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1700;
    filt.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = peak;
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    const t0 = ctx.currentTime;
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* Warm bronze temple bell built from inharmonic partials. */
  function bell(centerFreq) {
    const c = resume();
    if (!c) return;
    const f = centerFreq || 196;
    const partials = [
      { m: 1.0,  g: 0.50, d: 3.4 },
      { m: 2.01, g: 0.26, d: 2.5 },
      { m: 2.76, g: 0.18, d: 1.9 },
      { m: 4.07, g: 0.12, d: 1.3 },
      { m: 5.43, g: 0.06, d: 0.9 },
    ];
    for (const p of partials) partial(f * p.m, 0, p.d, p.g * 0.5);
    noiseBurst(0.18, 0.1);
  }

  /* Bright ascending two-note chime (prayer offered). */
  function chime() {
    const c = resume();
    if (!c) return;
    [523.25, 783.99].forEach((freq, i) => {
      const t0 = c.currentTime + i * 0.12;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      osc.start(t0);
      osc.stop(t0 + 1.7);
    });
  }

  /* Gentle single swell (incense lit, lantern released). */
  function soft() {
    const c = resume();
    if (!c) return;
    partial(392, 0, 1.8, 0.14, "sine");
    partial(587.33, 0.04, 1.4, 0.07, "sine");
  }

  /* Ambient background music — the YouTube track, looping. The player is
     built lazily on the first call (after a user gesture, so autoplay is
     allowed). Until it is ready, the toggle still flips its on/off state. */
  function startAmbient() {
    if (ambientOn) return;
    ambientOn = true;
    ytWantPlaying = true;
    buildYouTubePlayer().then(function (player) {
      if (player && ytReady && ytWantPlaying) {
        try {
          player.playVideo();
        } catch (err) {
          /* player not ready — onReady will start it */
        }
      }
    });
  }

  function stopAmbient() {
    if (!ambientOn) return;
    ambientOn = false;
    ytWantPlaying = false;
    if (ytPlayer && ytReady) {
      try {
        ytPlayer.pauseVideo();
      } catch (err) {
        /* ignore */
      }
    }
  }

  Chua.audio = {
    bell: bell,
    chime: chime,
    soft: soft,
    startAmbient: startAmbient,
    stopAmbient: stopAmbient,
    get isAmbient() {
      return ambientOn;
    },
  };
})(window.Chua);
