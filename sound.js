// 8-bit sound effects made with the Web Audio API. No audio files needed.
let audioCtx = null;
let muted = false;
try { muted = localStorage.getItem("sphinx-muted") === "1"; } catch {}

function tone(freq, start, dur, type = "square", vol = 0.05) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch {}
}
const seq = (notes, step, dur, type) => notes.forEach((f, i) => tone(f, i * step, dur, type));

const SFX = {
  blip:    () => tone(700, 0, 0.03, "square", 0.025),
  click:   () => tone(440, 0, 0.05),
  correct: () => seq([523, 659, 784], 0.09, 0.1),
  wrong:   () => seq([220, 165], 0.15, 0.2, "sawtooth"),
  win:     () => seq([523, 659, 784, 1047, 784, 1047], 0.12, 0.13),
  lose:    () => seq([392, 311, 262, 196, 147], 0.18, 0.22, "sawtooth")
};
function playSfx(name) { if (SFX[name]) SFX[name](); }
function setMuted(value) {
  muted = value;
  try { localStorage.setItem("sphinx-muted", value ? "1" : "0"); } catch {}
}
