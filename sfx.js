/* ==========================================================================
   Pharmaceutics Mastery Matrix 3 (PMM 3) – Web Audio SFX Synthesizer (sfx.js)
   Zero external audio files required. Uses Web Audio API oscillator synthesis.
   ========================================================================== */

(function (global) {
  "use strict";

  let audioCtx = null;
  let soundEnabled = true; // enabled by default
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("pmm3-sound") === "0") {
      soundEnabled = false;
    }
  } catch (_) {}

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, type = "sine", duration = 0.15, gainVal = 0.12, delay = 0) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      // Audio context may be restricted before user gesture
    }
  }

  const SFX = {
    isEnabled: () => soundEnabled,
    toggle: () => {
      soundEnabled = !soundEnabled;
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("pmm3-sound", soundEnabled ? "1" : "0");
        }
      } catch (_) {}
      if (soundEnabled) {
        SFX.bid();
      }
      return soundEnabled;
    },

    /* Placed Bid: Crisp ascending dual chime */
    bid: () => {
      playTone(587.33, "sine", 0.12, 0.15, 0);       // D5
      playTone(880.00, "triangle", 0.18, 0.14, 0.08); // A5
    },

    /* Outbid Alert: Soft descending caution tone */
    outbid: () => {
      playTone(493.88, "triangle", 0.14, 0.12, 0);   // B4
      playTone(392.00, "sine", 0.20, 0.10, 0.10);     // G4
    },

    /* Correct Answer: Harmonious Major Triad (C5 - E5 - G5 - C6) */
    correct: () => {
      playTone(523.25, "sine", 0.25, 0.15, 0);       // C5
      playTone(659.25, "sine", 0.25, 0.15, 0.08);    // E5
      playTone(783.99, "sine", 0.28, 0.15, 0.16);    // G5
      playTone(1046.50, "triangle", 0.40, 0.18, 0.24); // C6
    },

    /* Wrong Answer / Timeout: Low Dissonant Minor Thud */
    wrong: () => {
      playTone(220.00, "sawtooth", 0.22, 0.14, 0);   // A3
      playTone(207.65, "sawtooth", 0.35, 0.12, 0.12); // G#3
    },

    /* Countdown Warning: Gentle clock pulse */
    tick: () => {
      playTone(800, "sine", 0.04, 0.06, 0);
    },

    /* Option Selection: Crisp subtle haptic click */
    select: () => {
      playTone(659.25, "sine", 0.05, 0.09, 0);
    }
  };

  // Resume audio context on first user interaction for mobile Safari / Chrome compliance
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    const unlockAudio = () => {
      getAudioContext();
      if (typeof document.removeEventListener === "function") {
        document.removeEventListener("pointerdown", unlockAudio);
        document.removeEventListener("keydown", unlockAudio);
      }
    };
    document.addEventListener("pointerdown", unlockAudio, { passive: true });
    document.addEventListener("keydown", unlockAudio, { passive: true });
  }

  global.PMM_SFX = SFX;
})(typeof window !== "undefined" ? window : global);
