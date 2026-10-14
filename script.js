/* ---------- Check that every project file loaded ---------- */
const missingFiles = [];
if (typeof RIDDLES === "undefined") missingFiles.push("riddles.js");
if (typeof drawSphinx === "undefined") missingFiles.push("sprites.js");
if (typeof playSfx === "undefined") missingFiles.push("sound.js");
if (missingFiles.length) {
  document.querySelector("main").insertAdjacentHTML("beforeend",
    `<p class="box">Missing file: ${missingFiles.join(", ")}. Keep all project files in the same folder as index.html.</p>`);
  throw new Error("Missing files: " + missingFiles.join(", "));
}

const TIERS = ["easy", "medium", "hard"];
const START_DATE = new Date(2026, 9, 14); // Puzzle #1
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

/* ---------- Daily puzzle selection ---------- */
function dayNumber() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.round((today - START_DATE) / 864e5) + 1);
}
function seededRng(seed) { // mulberry32
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Shuffle each tier once per cycle so riddles never repeat until all are used.
function pickRiddle(tier, tierIndex, day) {
  const list = RIDDLES[tier];
  const cycle = Math.floor((day - 1) / list.length);
  const order = list.map((_, i) => i);
  const rng = seededRng(cycle * 10 + tierIndex + 1);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return list[order[(day - 1) % list.length]];
}

/* ---------- Answer checking ---------- */
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/^(a|an|the)\s+/, "").replace(/\s+/g, " ").trim();
}
function isCorrect(guess, riddle) {
  const g = normalize(guess);
  if (!g) return false;
  return riddle.a.some((ans) => {
    const a = normalize(ans);
    return g === a || g === a + "s" || g + "s" === a;
  });
}

/* ---------- Saved data ---------- */
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const day = dayNumber();
const riddles = TIERS.map((t, i) => pickRiddle(t, i, day));
let game = load("sphinx-game", null);
if (!game || game.day !== day) game = { day, results: [] };
let stats = load("sphinx-stats", { played: 0, wins: 0, streak: 0, best: 0, lastWinDay: 0 });

/* ---------- Sprites and animation ---------- */
const sphinx = $("sphinx");
let mood = "watch", chompTimer = null, typer = null;

function setMood(m) { mood = m; drawSphinx(sphinx, m); }
function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

// The Sphinx blinks every few seconds while watching
setInterval(() => {
  if (mood !== "watch" || REDUCED_MOTION) return;
  drawSphinx(sphinx, "blink");
  setTimeout(() => mood === "watch" && drawSphinx(sphinx, "watch"), 180);
}, 3200);

function typeText(el, text) {
  clearInterval(typer);
  if (REDUCED_MOTION) { el.textContent = text; return; }
  let i = 0;
  el.textContent = "";
  typer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i % 3 === 0) playSfx("blip");
    if (i >= text.length) clearInterval(typer);
  }, 28);
}

function renderProgress(el, popIndex = -1) {
  el.innerHTML = "";
  TIERS.forEach((_, i) => {
    const icon = document.createElement("canvas");
    let sprite = ICONS.empty;
    if (i < game.results.length) sprite = game.results[i] ? ICONS.ankh : ICONS.skull;
    else if (i === game.results.length) { sprite = ICONS.now; icon.className = "now"; }
    drawSprite(icon, sprite);
    if (i === popIndex) icon.classList.add("pop");
    el.appendChild(icon);
  });
}

/* ---------- Screens ---------- */
function showRiddle() {
  const i = game.results.length;
  $("riddle-view").hidden = false;
  $("result-view").hidden = true;
  $("feedback").hidden = true;
  $("answer-form").hidden = false;
  $("tier").textContent = `Riddle ${i + 1} of 3: ${TIERS[i]}`;
  typeText($("riddle"), riddles[i].q);
  $("answer").value = "";
  renderProgress($("progress"));
  setMood("watch");
  $("answer").focus();
}

function showResult() {
  const score = game.results.filter(Boolean).length;
  const survived = score >= 2;
  $("riddle-view").hidden = true;
  $("result-view").hidden = false;
  $("result-view").className = survived ? "survived" : "eaten";
  $("verdict").textContent = survived ? "You walk free!" : "The Sphinx eats you!";
  $("verdict-sub").textContent = survived
    ? `${score} of 3 correct. You may pass.`
    : `${score} of 3 correct. You needed 2.`;
  renderProgress($("result-progress"));
  playSfx(survived ? "win" : "lose");
  clearInterval(chompTimer);
  if (survived) {
    setMood("happy");
  } else {
    setMood("hungry");
    if (!REDUCED_MOTION) {
      sphinx.classList.add("chomp");
      let open = true;
      chompTimer = setInterval(() => { open = !open; setMood(open ? "hungry" : "hungry2"); }, 300);
    }
  }
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  $("stats").innerHTML = "";
  [["Played", stats.played], ["Win %", winRate], ["Streak", stats.streak], ["Best", stats.best]].forEach(([label, value]) => {
    const box = document.createElement("div");
    const dd = document.createElement("dd"); dd.textContent = value;
    const dt = document.createElement("dt"); dt.textContent = label;
    box.append(dd, dt);
    $("stats").appendChild(box);
  });
}

function finishGame() {
  if (game.counted) return;
  game.counted = true;
  save("sphinx-game", game);
  const survived = game.results.filter(Boolean).length >= 2;
  stats.played++;
  if (survived) {
    stats.wins++;
    stats.streak = stats.lastWinDay === day - 1 ? stats.streak + 1 : 1;
    stats.lastWinDay = day;
    stats.best = Math.max(stats.best, stats.streak);
  } else {
    stats.streak = 0;
  }
  save("sphinx-stats", stats);
}

/* ---------- Events ---------- */
$("answer-form").addEventListener("submit", (e) => {
  e.preventDefault();
  clearInterval(typer);
  const i = game.results.length;
  $("riddle").textContent = riddles[i].q;
  const correct = isCorrect($("answer").value, riddles[i]);
  game.results.push(correct);
  save("sphinx-game", game);
  renderProgress($("progress"), i);
  $("answer-form").hidden = true;
  $("feedback-text").textContent = correct ? "Correct!" : `Wrong! The answer was "${riddles[i].a[0]}".`;
  $("feedback").className = correct ? "right" : "wrong";
  $("next-btn").textContent = game.results.length === 3 ? "Face your fate" : "Next riddle";
  $("feedback").hidden = false;
  playSfx(correct ? "correct" : "wrong");
  setMood(correct ? "happy" : "hungry");
  if (!correct) restart(sphinx, "shake");
  $("next-btn").focus();
});

$("next-btn").addEventListener("click", () => {
  playSfx("click");
  if (game.results.length === 3) { finishGame(); showResult(); }
  else showRiddle();
});

$("share-btn").addEventListener("click", async () => {
  playSfx("click");
  const score = game.results.filter(Boolean).length;
  const grid = game.results.map((r) => (r ? "🟢" : "🔴")).join("");
  const text = `Beat the Sphinx #${day} ${score}/3\n${grid}\n${score >= 2 ? "Survived" : "Eaten"}`;
  try { await navigator.clipboard.writeText(text); $("share-btn").textContent = "Copied!"; }
  catch { $("share-btn").textContent = "Copy failed"; }
  setTimeout(() => ($("share-btn").textContent = "Copy result"), 2000);
});

$("mute").addEventListener("click", () => {
  const nowMuted = !$("mute").classList.contains("off");
  setMuted(nowMuted);
  $("mute").classList.toggle("off", nowMuted);
  $("mute").textContent = nowMuted ? "Sound: off" : "Sound: on";
  $("mute").setAttribute("aria-pressed", String(nowMuted));
  if (!nowMuted) playSfx("click");
});

/* ---------- Start ---------- */
(function init() {
  // Starfield
  for (let i = 0; i < 36; i++) {
    const s = document.createElement("div");
    s.className = "star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = Math.random() * 2 + "s";
    $("stars").appendChild(s);
  }
  try { if (localStorage.getItem("sphinx-muted") === "1") { $("mute").classList.add("off"); $("mute").textContent = "Sound: off"; $("mute").setAttribute("aria-pressed", "true"); } } catch {}
  $("puzzle-no").textContent = `Daily challenge #${day}`;
  if (game.results.length === 3) { finishGame(); showResult(); }
  else showRiddle();
})();
