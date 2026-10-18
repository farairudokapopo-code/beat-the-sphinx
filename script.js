/* ---------- Check that every project file loaded ---------- */
const missingFiles = [];
if (typeof RIDDLES === "undefined") missingFiles.push("riddles.js");
if (typeof drawSphinx === "undefined") missingFiles.push("sprites.js");
if (typeof paintArt === "undefined") missingFiles.push("art.js");
if (typeof GODS === "undefined") missingFiles.push("gods.js");
if (typeof SKINS === "undefined") missingFiles.push("skins.js");
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
function editDistance(a, b) { // number of single-letter edits between two words
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return row[b.length];
}
function isCorrect(guess, riddle, forgiveTypos) {
  const g = normalize(guess);
  if (!g) return false;
  return riddle.a.some((ans) => {
    const a = normalize(ans);
    if (g === a || g === a + "s" || g + "s" === a) return true;
    return forgiveTypos && a.length >= 4 && editDistance(g, a) <= 1;
  });
}

/* ---------- Saved data ---------- */
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function freshMods() {
  return { half: [false, false, false], zero: [false, false, false], hintShown: [false, false, false],
    hints: 0, reroll: -1, smite: false, forgiven: false, retryUsed: false };
}

const day = dayNumber();
let game = load("sphinx-game", null);
if (!game || game.day !== day) game = { day, results: [] };
if (!game.mods) game.mods = freshMods();
const riddles = TIERS.map((t, i) => pickRiddle(t, i, day));
if (game.mods.reroll >= 0) riddles[game.mods.reroll] = pickRiddle(TIERS[game.mods.reroll], game.mods.reroll, day + 1);
let stats = load("sphinx-stats", { played: 0, wins: 0, streak: 0, best: 0, lastWinDay: 0 });
let profile = Object.assign({ points: 0, lifetime: 0, games: 0, owned: [], equipped: null, seenTutorial: false,
  skinsOwned: ["classic"], look: { skin: "classic", primary: null, secondary: null } }, load("sphinx-profile", {}));
if (!profile.skinsOwned.includes("classic")) profile.skinsOwned.push("classic");
const saveGame = () => save("sphinx-game", game);
const saveProfile = () => save("sphinx-profile", profile);

/* ---------- Gods ---------- */
// The helper is locked in when you start today's riddles. Shop changes apply from tomorrow.
function activeGod() { return godById(game.god !== undefined ? game.god : profile.equipped); }
function lockGod() { if (game.god === undefined) { game.god = profile.equipped; saveGame(); } }

/* ---------- Points ---------- */
const POINTS = { correct: [10, 20, 30], survive: 20, streakEach: 5, streakCap: 7 };
function computeEarned(g, survived, streak) {
  const m = g.mods, res = g.results, god = g.god;
  const worth = (i) => POINTS.correct[i] * (m.half[i] ? 0.5 : 1);
  let riddlesPts = 0;
  res.forEach((ok, i) => { if (ok && !m.zero[i]) riddlesPts += worth(i); });
  const wrong = res.filter((ok) => !ok).length;
  let survive = survived ? POINTS.survive : 0;
  let streakPts = survived ? Math.min(streak, POINTS.streakCap) * POINTS.streakEach : 0;
  let perk = 0;
  if (god === "osiris" && survived) survive = POINTS.survive / 2;
  if (god === "ra") streakPts = 0;
  if (god === "thoth") perk = -5 * m.hints;
  if (god === "anubis" && m.forgiven) perk = -10;
  if (god === "zeus" && m.smite) perk = -15;
  if (god === "bastet" && res[0] && !m.zero[0]) perk = -worth(0);
  if (god === "athena") perk = Math.floor(riddlesPts / 2) - 10 * wrong;
  if (god === "hades") perk = (res[2] && !m.zero[2] ? worth(2) : 0) - (res[2] ? 0 : 20);
  const total = Math.max(0, riddlesPts + survive + streakPts + perk);
  return { riddles: riddlesPts, survive, streak: streakPts, perk, god: god || null, total };
}
function updatePoints(animate) {
  $("points").textContent = profile.points;
  $("shop-points").textContent = profile.points;
  $("look-points").textContent = profile.points;
  if (animate && !REDUCED_MOTION) restart($("points-pill"), "pop");
}
function updateHelper() {
  const g = activeGod();
  $("helper").textContent = g ? `Helper: ${g.name}` : "No helper equipped";
}
function renderEarn() {
  const box = $("earn"), e = game.earned;
  if (!e) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = "";
  const rows = [["Riddles", e.riddles]];
  if (e.survive) rows.push(["Survived", e.survive]);
  if (e.streak) rows.push(["Streak bonus", e.streak]);
  if (e.perk) rows.push([godById(e.god).name, e.perk]);
  rows.push(["Total", e.total, true]);
  rows.forEach(([label, value, isTotal]) => {
    const row = document.createElement("div");
    row.className = "earn-row" + (isTotal ? " total" : "");
    const a = document.createElement("span"); a.textContent = label;
    const b = document.createElement("span"); b.textContent = (value > 0 ? "+" : "") + value;
    row.append(a, b);
    box.appendChild(row);
  });
}

/* ---------- Sprites and animation ---------- */
const sphinx = $("sphinx");
let mood = "watch", chompTimer = null, typer = null;

function setMood(m) { mood = m; drawSphinx(sphinx, m, profile.look); }
function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

setInterval(() => { // the Sphinx blinks every few seconds while watching
  if (mood !== "watch" || REDUCED_MOTION) return;
  drawSphinx(sphinx, "blink", profile.look);
  setTimeout(() => mood === "watch" && drawSphinx(sphinx, "watch", profile.look), 180);
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

/* ---------- Hints and powers ---------- */
function renderHint(i) {
  const el = $("hint"), g = activeGod();
  if (!game.mods.hintShown[i] || !g) { el.hidden = true; return; }
  const word = riddles[i].a[0];
  const blanks = [...word].map((ch) => (ch === " " ? " " : "_"));
  if (g.power === "hint-first") blanks[0] = word[0].toUpperCase();
  el.textContent = (g.power === "hint-first" ? "Starts with: " : "Letters: ") + blanks.join(" ");
  el.hidden = false;
}
function refreshPower() {
  const g = activeGod(), m = game.mods, i = game.results.length, btn = $("power-btn");
  let show = false;
  if (g && g.active && i < 3 && !$("answer-form").hidden) {
    if (g.power === "reroll") show = m.reroll < 0;
    else if (g.power === "smite") show = !m.smite;
    else show = !m.hintShown[i];
  }
  btn.hidden = !show;
  if (show) btn.textContent = g.powerLabel;
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
  renderHint(i);
  refreshPower();
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
  renderEarn();
  updatePoints(true);
  playSfx(survived ? "win" : "lose");
  if (game.earned && game.earned.total > 0) setTimeout(() => playSfx("coin"), 1000);
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
  if (game.god === undefined) game.god = profile.equipped;
  const survived = game.results.filter(Boolean).length >= 2;
  stats.played++;
  if (survived) {
    stats.wins++;
    stats.streak = stats.lastWinDay === day - 1 ? stats.streak + 1 : 1;
    stats.lastWinDay = day;
    stats.best = Math.max(stats.best, stats.streak);
  } else if (game.god === "osiris") {
    stats.lastWinDay = day; // Osiris: rebirth keeps the streak alive
  } else {
    stats.streak = 0;
  }
  game.earned = computeEarned(game, survived, stats.streak);
  profile.points += game.earned.total;
  profile.lifetime += game.earned.total;
  profile.games++;
  save("sphinx-stats", stats);
  saveProfile();
  saveGame();
}

function recordResult(correct, message) {
  const i = game.results.length;
  game.results.push(correct);
  saveGame();
  renderProgress($("progress"), i);
  $("answer-form").hidden = true;
  $("hint").hidden = true;
  $("power-btn").hidden = true;
  $("feedback-text").textContent = message;
  $("feedback").className = correct ? "right" : "wrong";
  $("next-btn").textContent = game.results.length === 3 ? "Face your fate" : "Next riddle";
  $("feedback").hidden = false;
  playSfx(correct ? "correct" : "wrong");
  setMood(correct ? "happy" : "hungry");
  if (!correct) restart(sphinx, "shake");
  $("next-btn").focus();
}

/* ---------- Shop and tutorial ---------- */
function renderShop() {
  const list = $("shop-list");
  list.innerHTML = "";
  $("shop-note").textContent = game.god !== undefined
    ? "Today's helper is locked in. Changes apply tomorrow."
    : "Pick one helper to bring to today's riddles.";
  GODS.forEach((g) => {
    const owned = profile.owned.includes(g.id), equipped = profile.equipped === g.id;
    const card = document.createElement("div");
    card.className = "shop-card" + (equipped ? " equipped" : "");
    const art = document.createElement("canvas");
    art.className = "sprite god-canvas";
    drawGod(art, g);
    const info = document.createElement("div");
    const title = document.createElement("h3"); title.textContent = `${g.name}: ${g.title}`;
    const perk = document.createElement("p"); perk.className = "perk"; perk.textContent = "Power: " + g.perk;
    const drawback = document.createElement("p"); drawback.className = "drawback"; drawback.textContent = "Drawback: " + g.drawback;
    const btn = document.createElement("button");
    btn.type = "button";
    if (!owned) {
      btn.textContent = `Buy for ${g.cost}`;
      btn.disabled = profile.points < g.cost;
      btn.addEventListener("click", () => buyGod(g));
    } else {
      btn.textContent = equipped ? "Unequip" : "Equip";
      btn.addEventListener("click", () => equipGod(g));
    }
    info.append(title, perk, drawback, btn);
    card.append(art, info);
    list.appendChild(card);
  });
}
function buyGod(g) {
  if (profile.owned.includes(g.id) || profile.points < g.cost) return;
  profile.points -= g.cost;
  profile.owned.push(g.id);
  saveProfile();
  updatePoints(true);
  playSfx("coin");
  renderShop();
}
function equipGod(g) {
  profile.equipped = profile.equipped === g.id ? null : g.id;
  saveProfile();
  playSfx("click");
  updateHelper();
  renderShop();
  if (!$("riddle-view").hidden && game.god === undefined) { renderHint(game.results.length); refreshPower(); }
}

/* ---------- Customize: skins and colours ---------- */
const SWATCHES = ["#f2c14e", "#2f6fd0", "#d9453b", "#5fd38a", "#2fb5a8", "#8a4bd6", "#ff7fb0", "#f2994a", "#fdf3d0", "#6b6b7b"];
function redrawSphinx() { drawSphinx(sphinx, mood, profile.look); drawSphinx($("look-preview"), "watch", profile.look); }
function unlockSkin(skin) {
  // New unlock types (for example a secret code) can be added here later.
  if (skin.unlock.type !== "points" || profile.points < skin.unlock.cost) return false;
  profile.points -= skin.unlock.cost;
  return true;
}
function buySkin(skin) {
  if (profile.skinsOwned.includes(skin.id) || !unlockSkin(skin)) return;
  profile.skinsOwned.push(skin.id);
  profile.look = { skin: skin.id, primary: null, secondary: null };
  saveProfile(); updatePoints(true); playSfx("coin"); renderLook();
}
function selectSkin(skin) {
  profile.look = { skin: skin.id, primary: null, secondary: null };
  saveProfile(); playSfx("click"); renderLook();
}
function setColor(which, hex) {
  profile.look[which] = hex;
  saveProfile(); redrawSphinx(); syncColorInputs();
}
function syncColorInputs() {
  const colors = lookColors(profile.look);
  $("color-primary").value = colors.primary;
  $("color-secondary").value = colors.secondary;
}
function renderLook() {
  syncColorInputs();
  redrawSphinx();
  const list = $("skin-list");
  list.innerHTML = "";
  SKINS.forEach((skin) => {
    const owned = profile.skinsOwned.includes(skin.id), selected = profile.look.skin === skin.id;
    const card = document.createElement("div");
    card.className = "shop-card" + (selected ? " equipped" : "");
    const art = document.createElement("canvas");
    art.className = "sprite god-canvas";
    drawSphinx(art, "watch", { skin: skin.id, primary: null, secondary: null });
    const info = document.createElement("div");
    const title = document.createElement("h3"); title.textContent = skin.name;
    const blurb = document.createElement("p"); blurb.textContent = skin.blurb;
    const btn = document.createElement("button");
    btn.type = "button";
    if (!owned) {
      btn.textContent = `Unlock for ${skin.unlock.cost}`;
      btn.disabled = profile.points < skin.unlock.cost;
      btn.addEventListener("click", () => buySkin(skin));
    } else {
      btn.textContent = selected ? "Selected" : "Select";
      btn.disabled = selected;
      btn.addEventListener("click", () => selectSkin(skin));
    }
    info.append(title, blurb, btn);
    card.append(art, info);
    list.appendChild(card);
  });
}
function openLook() { renderLook(); $("look").hidden = false; $("look-close").focus(); }
function closeLook() { $("look").hidden = true; }

let tutorialDone = null;
function openTutorial(onClose) {
  tutorialDone = onClose || null;
  $("tut-start").textContent = profile.seenTutorial ? "Got it" : "Start";
  $("tutorial").hidden = false;
  $("tut-start").focus();
}
function closeShop() { $("shop").hidden = true; }

/* ---------- Events ---------- */
$("answer-form").addEventListener("submit", (e) => {
  e.preventDefault();
  clearInterval(typer);
  lockGod();
  const g = activeGod(), m = game.mods, i = game.results.length;
  $("riddle").textContent = riddles[i].q;
  const correct = isCorrect($("answer").value, riddles[i], g && g.power === "typo");
  const answer = riddles[i].a[0];
  if (!correct && g && g.power === "retry" && !m.retryUsed) {
    m.retryUsed = true; m.half[i] = true; saveGame();
    $("hint").textContent = "Isis grants a second try! It is worth half points.";
    $("hint").hidden = false;
    $("answer").value = "";
    $("answer").focus();
    playSfx("wrong");
    return;
  }
  if (!correct && g && g.power === "forgive" && !m.forgiven) {
    m.forgiven = true; m.zero[i] = true;
    recordResult(true, `Wrong! The answer was "${answer}". Anubis weighs your heart and forgives you. No points for this one.`);
    return;
  }
  recordResult(correct, correct ? "Correct!" : `Wrong! The answer was "${answer}".`);
});

$("power-btn").addEventListener("click", () => {
  const g = activeGod();
  if (!g) return;
  lockGod();
  const m = game.mods, i = game.results.length;
  playSfx("click");
  if (g.power === "hint-length" || g.power === "hint-first") {
    m.hintShown[i] = true; m.hints++; saveGame();
    renderHint(i); refreshPower(); $("answer").focus();
  } else if (g.power === "reroll") {
    m.reroll = i; m.half[i] = true;
    riddles[i] = pickRiddle(TIERS[i], i, day + 1);
    saveGame();
    typeText($("riddle"), riddles[i].q);
    renderHint(i); refreshPower(); $("answer").focus();
  } else if (g.power === "smite") {
    m.smite = true; m.zero[i] = true;
    recordResult(true, `Zeus strikes the riddle down! The answer was "${riddles[i].a[0]}". No points for this one.`);
  }
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
  const god = godById(game.god);
  const text = `Beat the Sphinx #${day} ${score}/3\n${grid}\n${score >= 2 ? "Survived" : "Eaten"}${god ? " with " + god.name : ""}`;
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

$("shop-btn").addEventListener("click", () => { playSfx("click"); renderShop(); $("shop").hidden = false; $("shop-close").focus(); });
$("shop-close").addEventListener("click", () => { playSfx("click"); closeShop(); });
$("look-btn").addEventListener("click", () => { playSfx("click"); openLook(); });
$("look-close").addEventListener("click", () => { playSfx("click"); closeLook(); });
$("color-primary").addEventListener("input", (e) => setColor("primary", e.target.value));
$("color-secondary").addEventListener("input", (e) => setColor("secondary", e.target.value));
$("color-reset").addEventListener("click", () => { profile.look.primary = null; profile.look.secondary = null; saveProfile(); playSfx("click"); renderLook(); });
["primary", "secondary"].forEach((which) => SWATCHES.forEach((hex) => {
  const sw = document.createElement("button");
  sw.type = "button"; sw.className = "swatch"; sw.style.background = hex; sw.setAttribute("aria-label", `${which} ${hex}`);
  sw.addEventListener("click", () => setColor(which, hex));
  $("swatches-" + which).appendChild(sw);
}));
$("help-btn").addEventListener("click", () => { playSfx("click"); openTutorial(null); });
$("tut-start").addEventListener("click", () => {
  playSfx("click");
  $("tutorial").hidden = true;
  if (!profile.seenTutorial) { profile.seenTutorial = true; saveProfile(); }
  const next = tutorialDone; tutorialDone = null;
  if (next) next();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("look").hidden) closeLook();
  else if (!$("shop").hidden) closeShop();
  else if (!$("tutorial").hidden) $("tut-start").click();
});

/* ---------- Start ---------- */
function beginGame() {
  if (game.results.length === 3) { finishGame(); showResult(); }
  else showRiddle();
}
(function init() {
  for (let i = 0; i < 36; i++) { // starfield
    const s = document.createElement("div");
    s.className = "star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = Math.random() * 2 + "s";
    $("stars").appendChild(s);
  }
  try { if (localStorage.getItem("sphinx-muted") === "1") { $("mute").classList.add("off"); $("mute").textContent = "Sound: off"; $("mute").setAttribute("aria-pressed", "true"); } } catch {}
  drawSprite($("coin"), ICONS.coin);
  drawSprite($("shop-coin"), ICONS.coin);
  drawSprite($("look-coin"), ICONS.coin);
  updatePoints(false);
  updateHelper();
  $("puzzle-no").textContent = `Daily challenge #${day}`;
  if (!profile.seenTutorial) openTutorial(beginGame);
  else beginGame();
})();
