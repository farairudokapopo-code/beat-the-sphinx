const TIERS = ["easy", "medium", "hard"];
const START_DATE = new Date(2026, 9, 14); // Puzzle #1
const $ = (id) => document.getElementById(id);

/* ---------- Daily puzzle selection ---------- */
function dayNumber() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.round((today - START_DATE) / 864e5) + 1);
}

// Small seeded random number generator (mulberry32)
function seededRng(seed) {
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

/* ---------- Saved data (localStorage) ---------- */
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

/* ---------- Rendering ---------- */
function renderProgress(el) {
  el.innerHTML = "";
  TIERS.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    if (i < game.results.length) dot.classList.add(game.results[i] ? "right" : "wrong");
    else if (i === game.results.length) dot.classList.add("current");
    el.appendChild(dot);
  });
}

function showRiddle() {
  const i = game.results.length;
  $("riddle-view").hidden = false;
  $("result-view").hidden = true;
  $("feedback").hidden = true;
  $("answer-form").hidden = false;
  $("tier").textContent = `Riddle ${i + 1} of 3: ${TIERS[i]}`;
  $("riddle").textContent = riddles[i].q;
  $("answer").value = "";
  renderProgress($("progress"));
  $("answer").focus();
}

function showResult() {
  const score = game.results.filter(Boolean).length;
  const survived = score >= 2;
  $("riddle-view").hidden = true;
  $("result-view").hidden = false;
  $("verdict").textContent = survived ? "You walk free." : "The Sphinx eats you.";
  $("verdict-sub").textContent = survived
    ? `${score} of 3 correct. The Sphinx lets you pass.`
    : `${score} of 3 correct. You needed at least 2.`;
  $("result-view").className = survived ? "survived" : "eaten";
  renderProgress($("result-progress"));
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  $("stats").innerHTML = "";
  [["Played", stats.played], ["Win rate", winRate + "%"], ["Streak", stats.streak], ["Best", stats.best]].forEach(([label, value]) => {
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
  const i = game.results.length;
  const correct = isCorrect($("answer").value, riddles[i]);
  game.results.push(correct);
  save("sphinx-game", game);
  renderProgress($("progress"));
  $("answer-form").hidden = true;
  $("feedback-text").textContent = correct
    ? "Correct."
    : `Wrong. The answer was "${riddles[i].a[0]}".`;
  $("feedback").className = correct ? "right" : "wrong";
  $("next-btn").textContent = game.results.length === 3 ? "Face your fate" : "Next riddle";
  $("feedback").hidden = false;
  $("next-btn").focus();
});

$("next-btn").addEventListener("click", () => {
  if (game.results.length === 3) {
    finishGame();
    showResult();
  } else {
    showRiddle();
  }
});

$("share-btn").addEventListener("click", async () => {
  const score = game.results.filter(Boolean).length;
  const grid = game.results.map((r) => (r ? "🟢" : "🔴")).join("");
  const text = `Beat the Sphinx #${day} ${score}/3\n${grid}\n${score >= 2 ? "Survived" : "Eaten"}`;
  try {
    await navigator.clipboard.writeText(text);
    $("share-btn").textContent = "Copied";
  } catch {
    $("share-btn").textContent = "Copy failed";
  }
  setTimeout(() => ($("share-btn").textContent = "Copy result"), 2000);
});

/* ---------- Start ---------- */
$("puzzle-no").textContent = `Daily challenge #${day}`;
if (game.results.length === 3) { finishGame(); showResult(); }
else showRiddle();
