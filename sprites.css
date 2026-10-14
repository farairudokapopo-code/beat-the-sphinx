// Pixel sprites are plain text grids. Each letter maps to a colour in PAL; "." is transparent.
const PAL = { G: "#f2c14e", Y: "#b9792a", B: "#2f6fd0", K: "#150c2b", W: "#fdf3d0", R: "#d9453b", S: "#e8b86a", D: "#a8662a", g: "#5fd38a" };

const SPHINX_BASE = [
  "....GGGGGGGG....",
  "...GBGBGBGBGB...",
  "..GGGGGGGGGGGG..",
  ".GGBGGGGGGGGBGG.",
  ".GGSSSSSSSSSSGG.",
  ".GBSKKSSSSKKSBG.",
  ".GBSWKSSSSWKSBG.",
  ".GBSSSSDDSSSSBG.",
  ".GBSSSSSSSSSSBG.",
  ".GBSSKKKKKKSSBG.",
  "..GBSSSSSSSSBG..",
  "..GGBSSSSSSBGG..",
  ".GGGGBBBBBBGGGG.",
  ".GYGGGGGGGGGGYG.",
  "GYYGBGBGBGBGBYYG",
  "YYYYYYYYYYYYYYYY"
];

// Each mood replaces a few rows of the base sprite.
const SPHINX_MOODS = {
  watch:   {},
  blink:   { 5: ".GBSSSSSSSSSSBG.", 6: ".GBSKKSSSSKKSBG." },
  happy:   { 5: ".GBSSSSSSSSSSBG.", 6: ".GBSKKSSSSKKSBG.", 9: ".GBSKSSSSSSKSBG.", 10: "..GBSKKKKKKSBG.." },
  hungry:  { 6: ".GBSRRSSSSRRSBG.", 8: ".GBSWSWSWSWSSBG.", 9: ".GBSKKKKKKKKSBG.", 10: "..GBSKRRRRKSBG.." },
  hungry2: { 6: ".GBSRRSSSSRRSBG." }
};

const ICONS = {
  ankh:  ["..gggg..", ".g....g.", ".g....g.", "..gggg..", ".gggggg.", "...gg...", "...gg...", "...gg..."],
  skull: [".WWWWWW.", "WWWWWWWW", "WKKWWKKW", "WKKWWKKW", "WWWKKWWW", ".WWWWWW.", ".WKWKWK.", ".WWWWWW."],
  empty: ["GGGGGGGG", "G......G", "G......G", "G......G", "G......G", "G......G", "G......G", "GGGGGGGG"],
  now:   ["GGGGGGGG", "GGGGGGGG", "GGGGGGGG", "GGGGGGGG", "GGGGGGGG", "GGGGGGGG", "GGGGGGGG", "GGGGGGGG"]
};

function drawSprite(canvas, rows) {
  canvas.width = rows[0].length;
  canvas.height = rows.length;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (PAL[ch]) { ctx.fillStyle = PAL[ch]; ctx.fillRect(x, y, 1, 1); }
  }));
}

function drawSphinx(canvas, mood) {
  const rows = SPHINX_BASE.slice();
  Object.entries(SPHINX_MOODS[mood] || {}).forEach(([i, row]) => (rows[i] = row));
  drawSprite(canvas, rows);
}
