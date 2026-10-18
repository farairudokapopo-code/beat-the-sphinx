// Terraria-style pixel art engine. Characters are built from shapes on a 32x32 grid.
// Each shape is shaded from a top-left light (dark / base / light tones), speckled with grain
// where asked, and finally given a dark outline. Colours come from per-character materials.
const ART_N = 32;
const OUTLINE = "#120a26";

/* ---------- colour helpers ---------- */
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(a) { return "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function mixHex(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); }
const lighten = (c, t) => mixHex(c, "#ffffff", t);
const darken = (c, t) => mixHex(c, "#0d0620", t);
const ramp = (c) => [darken(c, 0.5), darken(c, 0.22), c, lighten(c, 0.28), lighten(c, 0.55)]; // deep, shade, base, light, shine

/* ---------- shape helpers (continuous coordinates, pixel i covers i..i+1) ---------- */
const E = (x, y, rx, ry, m, o) => Object.assign({ t: "e", x, y, rx, ry, m }, o);
const R = (x, y, w, h, m, o) => Object.assign({ t: "r", x, y, w, h, m }, o);
const P = (pts, m, o) => Object.assign({ t: "p", pts, m }, o);
const X = (pts, m, lv) => ({ t: "x", pts, m, lv });
function mir(s) {
  if (s.t === "e") return Object.assign({}, s, { x: 32 - s.x });
  if (s.t === "r") return Object.assign({}, s, { x: 32 - s.x - s.w });
  if (s.t === "p") return Object.assign({}, s, { pts: s.pts.map(([x, y]) => [32 - x, y]) });
  return Object.assign({}, s, { pts: s.pts.map(([x, y]) => [31 - x, y]) });
}
const S2 = (s) => [s, mir(s)];
function line(x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), pts = [];
  for (let i = 0; i <= n; i++) pts.push([Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n)]);
  return pts;
}
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/* ---------- rasteriser ---------- */
function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function bbox(s) {
  if (s.t === "r") return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
  if (s.t === "e") return { x0: s.x - s.rx, y0: s.y - s.ry, x1: s.x + s.rx, y1: s.y + s.ry };
  const xs = s.pts.map((p) => p[0]), ys = s.pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function lightAt(s, px, py, bb) {
  if (s.t === "e") {
    const nx = (px - s.x) / s.rx, ny = (py - s.y) / s.ry, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return -(0.5 * nx + 0.6 * ny) + 0.45 * nz;
  }
  const u = (px - bb.x0) / Math.max(1e-6, bb.x1 - bb.x0), v = (py - bb.y0) / Math.max(1e-6, bb.y1 - bb.y0);
  return 0.45 + (0.5 - u) * 0.9 + (0.5 - v) * 1.1;
}
function rasterize(shapes, mats) {
  const N = ART_N, grid = Array.from({ length: N }, () => Array(N).fill(null)), cache = {};
  const rp = (m) => cache[m] || (cache[m] = ramp(mats[m] || "#ff00ff"));
  shapes.forEach((s) => {
    if (s.t === "x") {
      s.pts.forEach(([x, y]) => { if (x >= 0 && x < N && y >= 0 && y < N) grid[y][x] = { m: s.m, c: rp(s.m)[s.lv == null ? 2 : s.lv] }; });
      return;
    }
    const bb = bbox(s);
    for (let y = Math.max(0, Math.floor(bb.y0)); y <= Math.min(N - 1, Math.ceil(bb.y1)); y++) {
      for (let x = Math.max(0, Math.floor(bb.x0)); x <= Math.min(N - 1, Math.ceil(bb.x1)); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside;
        if (s.t === "e") inside = ((px - s.x) / s.rx) ** 2 + ((py - s.y) / s.ry) ** 2 <= 1;
        else if (s.t === "r") inside = px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h;
        else inside = inPoly(px, py, s.pts);
        if (!inside) continue;
        if (s.o && !(grid[y][x] && grid[y][x].m === s.o)) continue; // only paint over a given material
        const L = lightAt(s, px, py, bb);
        let lv = L > 0.97 ? 4 : L > 0.62 ? 3 : L > 0.05 ? 2 : L > -0.4 ? 1 : 0;
        if (s.g && hash(x, y) < s.g) lv = Math.max(0, Math.min(3, lv + (hash(y, x + 7) < 0.5 ? -1 : 1))); // grain
        grid[y][x] = { m: s.m, c: rp(s.m)[s.flat ? 2 : lv] };
      }
    }
  });
  const out = grid.map((row) => row.map((cell) => cell && cell.c));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (grid[y][x]) continue;
    if ((y > 0 && grid[y - 1][x]) || (y < N - 1 && grid[y + 1][x]) || (x > 0 && grid[y][x - 1]) || (x < N - 1 && grid[y][x + 1])) out[y][x] = OUTLINE;
  }
  return out;
}

/* ---------- shared pieces ---------- */
function baseMats(c) {
  return { skin: c.tone, rim: darken(c.tone, 0.55), skinD: darken(c.tone, 0.35), skinL: lighten(c.tone, 0.4), lip: mixHex(c.tone, "#b0344a", 0.5), brow: darken(c.tone, 0.7),
    gold: c.primary, blue: c.secondary, white: "#f3ead2", black: "#0d0818", dark: "#1d1233", red: "#e04a3a", amber: "#f2a31b", pink: "#e88aa0", jade: "#8ad34a" };
}
// Front-facing human face: eyes, brows, nose, mouth. o: white, pupil, brow, slit, nose
function humanFace(mood, o = {}) {
  const s = [], hungry = mood === "hungry" || mood === "hungry2";
  const eyes = [[12, 14], [13, 14], [14, 14], [17, 14], [18, 14], [19, 14]];
  if (mood === "blink") s.push(X(eyes, "dark"));
  else if (mood === "happy") s.push(X([[12, 14], [13, 13], [14, 14], [17, 14], [18, 13], [19, 14]], "dark"));
  else {
    s.push(X(eyes, o.white || "white"));
    s.push(X([[12, 13], [13, 13], [14, 13], [17, 13], [18, 13], [19, 13]], "dark"));
    s.push(X(o.slit ? [[13, 13], [13, 14], [18, 13], [18, 14]] : [[13, 14], [18, 14]], hungry ? "red" : o.pupil || "dark"));
  }
  s.push(X(hungry ? [[12, 11], [13, 12], [14, 12], [17, 12], [18, 12], [19, 11]] : [[12, 12], [13, 12], [14, 12], [17, 12], [18, 12], [19, 12]], o.brow || "brow"));
  if (o.nose !== false) s.push(X([[15, 15], [15, 16], [15, 17], [16, 17]], "skinD"));
  if (mood === "happy") s.push(X([[13, 19], [14, 20], [15, 20], [16, 20], [17, 20], [18, 19]], "lip"));
  else if (mood === "hungry") {
    const open = []; for (let y = 20; y <= 21; y++) for (let x = 13; x <= 18; x++) open.push([x, y]);
    s.push(X(open.concat([[14, 22], [15, 22], [16, 22], [17, 22]]), "black"), X([[13, 20], [15, 20], [16, 20], [18, 20]], "white"), X([[15, 22], [16, 22]], "red"));
  } else s.push(X([[14, 20], [15, 20], [16, 20], [17, 20]], "lip"));
  return s;
}
const HEAD = (m = "skin", o) => [E(16, 15.4, 7.5, 8.9, "rim", { flat: true }), E(16, 15.2, 6.6, 8.2, m, o), ...S2(E(9.6, 16.2, 1.3, 2.2, m, o))];
const COLLAR = (a, b) => [E(16, 31, 13, 8, a), E(16, 31, 10.6, 6.2, b), E(16, 31, 8.2, 4.4, a), E(16, 31, 5.8, 2.6, b)];
const KOHL = () => X([[11, 14], [10, 13], [20, 14], [21, 13]], "dark");
const ROBE = (m, trim) => [E(16, 34, 14.5, 10, m, { g: 0.08 }), E(16, 33, 9, 6, trim || m)];

/* ---------- characters ---------- */
const BUILD = {};

// Pharaoh-style striped headdress (Classic Sphinx, King Tut, Thoth)
function nemes(c, mood, v) {
  const sh = [E(16, 10, 10.2, 8.4, "neme"), ...COLLAR("c1", "c2"),
    ...S2(P([[6.4, 8], [11, 8], [11.6, 25], [7.5, 29], [3.8, 27], [5, 16]], "neme")), ...HEAD(),
    R(9.6, 6.8, 12.8, 2.4, "neme")];
  [3, 5].forEach((y) => sh.push(R(6, y, 20, 1, "stripe", { o: "neme" })));
  [12, 15, 18, 21, 24, 27].forEach((y) => sh.push(...S2(R(3, y, 9, 1, "stripe", { o: "neme" }))));
  sh.push(...humanFace(mood), KOHL());
  if (v.cobra) sh.push(R(15, 2.6, 2, 4.6, "red"), X([[15, 2], [16, 2]], "gold"));
  if (v.beard) sh.push(R(14.4, 23, 3.2, 7, "stripe"), R(14.4, 25, 3.2, 1, "gold"), R(14.4, 28, 3.2, 1, "gold"));
  if (v.crown === "moon") sh.push(E(16, 5.4, 6.4, 3, "gold"), E(16, 2.6, 3.4, 3.4, "white"));
  return { shapes: sh, mats: Object.assign({ neme: c.primary, stripe: c.secondary, c1: c.primary, c2: c.secondary }, v.mats) };
}
BUILD.classic = (c, m) => nemes(c, m, {});
BUILD.tut = (c, m) => nemes(c, m, { cobra: true, beard: true });
BUILD.thoth = (c, m) => nemes(c, m, { crown: "moon", beard: true, mats: { c1: "#f2c14e", c2: c.primary, neme: c.primary, stripe: c.secondary } });

BUILD.cleopatra = (c, m) => ({ shapes: [E(16, 13.5, 11, 11.5, "hair", { g: 0.12 }), ...S2(R(5, 14, 5, 12, "hair", { g: 0.12 })),
  ...COLLAR("c2", "c1"), ...HEAD(), R(9.4, 6.6, 13.2, 3.4, "hair", { g: 0.12 }), R(9, 5, 14, 1.6, "gold"),
  ...humanFace(m), KOHL(), X([[9, 19], [22, 19], [9, 20], [22, 20]], "gold"), R(15, 2.8, 2, 3.2, "gold"), X([[15, 2], [16, 2]], "red")],
  mats: { hair: "#2b2250", c1: c.primary, c2: c.secondary } });

// Bird-headed bust (Griffin, Ra)
function bird(c, mood, v) {
  const hungry = mood === "hungry" || mood === "hungry2", sh = [];
  if (v.sun) sh.push(E(16, 3.8, 6.6, 6.6, "gold"), E(16, 3.8, 5, 5, "red"));
  if (v.mane) sh.push(E(16, 32, 15, 10, "mane", { g: 0.15 }), ...S2(E(5.5, 27, 4.6, 6, "blue")));
  else sh.push(...COLLAR("gold", "blue"));
  if (v.tufts) sh.push(...S2(P([[9, 9.5], [5.5, 1], [12.5, 7]], "blue")), P([[13, 7.5], [16, 0.5], [19, 7.5]], "feather"));
  sh.push(E(16, 14.2, 7.5, 8.5, "feather", { g: 0.1 }), ...S2(R(9.2, 10.8, 6, 1.6, "feather2")));
  if (mood === "blink") sh.push(...S2(R(10.6, 13, 4, 1, "dark")));
  else if (mood === "happy") sh.push(X([[11, 14], [12, 13], [13, 13], [14, 14], [17, 14], [18, 13], [19, 13], [20, 14]], "dark"));
  else sh.push(...S2(E(12.6, 13.4, 2.2, 1.8, hungry ? "red" : "amber")), X([[12, 13], [19, 13]], "dark"), X([[10, 13], [21, 13]], "dark", 0));
  sh.push(P([[13, 15], [19, 15], [18.2, 20.6], [16, 24.6], [13.8, 20.6]], "beak"), X([[15, 17], [16, 17]], "dark"));
  if (hungry && mood === "hungry") {
    const gap = []; for (let y = 21; y <= 22; y++) for (let x = 14; x <= 17; x++) gap.push([x, y]);
    sh.push(X(gap, "black"), X([[15, 22], [16, 22]], "red"), P([[14, 23], [18, 23], [17, 26.5], [15, 26.5]], "beak"));
  } else sh.push(X([[14, 21], [15, 21], [16, 21], [17, 21]], "dark"));
  return { shapes: sh, mats: { feather: v.feather, feather2: darken(v.feather, 0.3), beak: v.beak, mane: darken(c.primary, 0.12) } };
}
BUILD.griffin = (c, m) => bird(c, m, { feather: "#f4ecd8", beak: c.primary, tufts: true, mane: true });
BUILD.ra = (c, m) => bird(c, m, { feather: "#7a5232", beak: "#f2c14e", sun: true });

BUILD.medusa = (c, m) => {
  const snakes = [[[10, 5], [9, 4], [9, 3], [8, 2], [8, 1], [7, 1]], [[7, 8], [5, 7], [4, 6], [3, 6], [2, 7], [1, 7]],
    [[5, 13], [4, 13], [3, 14], [3, 16], [4, 18], [5, 19], [6, 19]], [[6, 21], [5, 22], [5, 24], [6, 25]]];
  const sh = [E(16, 11, 12, 10, "snake", { g: 0.18 })];
  snakes.forEach((pts) => sh.push(...S2(X(pts, "snake")), ...S2(X([pts[pts.length - 1]], "amber"))));
  sh.push(X([[15, 3], [16, 3], [16, 2], [15, 1], [16, 0]], "snake"), ...COLLAR("gold", "blue"), ...HEAD(),
    R(9.6, 7, 12.8, 2.6, "snake", { g: 0.18 }), ...humanFace(m, { white: "amber", slit: true }), KOHL());
  return { shapes: sh, mats: { snake: c.primary } };
};

BUILD.cerberus = (c, m) => {
  const hungry = m === "hungry" || m === "hungry2", eye = hungry ? "amber" : "red";
  const sh = [P([[10, 6], [11, 0], [13, 5], [16, -2], [19, 5], [21, 0], [22, 6]], "ember"), P([[13, 6], [16, 1], [19, 6]], "amber"),
    E(16, 32, 14, 9, "fur", { g: 0.2 }), E(16, 26.2, 10, 2.6, "spike"), X([[8, 25], [11, 27], [16, 28], [20, 27], [23, 25]], "black"),
    ...S2(P([[3, 15], [2, 8], [8, 13]], "fur")), ...S2(E(7.4, 18.5, 4.7, 5.4, "fur", { g: 0.2 })), ...S2(R(3.2, 20, 5, 3.6, "fur", { g: 0.2 })),
    ...S2(X([[6, 17]], "red")), ...S2(R(4, 20, 2.4, 1.6, "black")),
    ...S2(P([[9.4, 10], [8, 0], [14.6, 8]], "fur")), ...S2(P([[10, 8.6], [9.2, 2.6], [12.6, 7.4]], "earIn")),
    E(16, 14.6, 7.4, 8, "fur", { g: 0.2 }), R(12.4, 16.4, 7.2, 6.4, "fur", { g: 0.2 }), R(14, 16.4, 4, 2.2, "black"),
  ];
  sh.push(...(m === "blink" ? S2(R(10.8, 12.4, 3.2, 1, "dark")) : [...S2(E(12.4, 12.8, 2, 1.5, eye)), ...S2(X([[12, 12]], "dark"))]), X(hungry ? [[11, 10], [12, 10], [19, 10], [20, 10]] : [[11, 11], [12, 11], [19, 11], [20, 11]], "dark"));
  if (m === "hungry") { const g = []; for (let y = 20; y <= 22; y++) for (let x = 13; x <= 18; x++) g.push([x, y]);
    sh.push(X(g, "black"), X([[13, 20], [14, 20], [17, 20], [18, 20]], "white"), X([[15, 22], [16, 22]], "red")); }
  else if (m === "happy") sh.push(X([[13, 20], [14, 21], [15, 21], [16, 21], [17, 21], [18, 20]], "dark"), X([[15, 22], [16, 22]], "red"));
  else sh.push(X([[13, 21], [14, 21], [15, 21], [16, 21], [17, 21], [18, 21]], "dark"), X([[14, 22], [17, 22]], "white"));
  return { shapes: sh, mats: { fur: c.tone, ember: c.secondary, spike: c.primary, earIn: "#c25a6e" } };
};

BUILD.bastet = (c, m) => {
  const hungry = m === "hungry" || m === "hungry2", sh = [...COLLAR("c1", "c2"),
    ...S2(P([[8.5, 11], [8, 2], [14.5, 7.5]], "skin")), ...S2(P([[9.8, 9.6], [9.6, 4.4], [12.6, 7.8]], "pink")),
    E(16, 15.5, 7.8, 7.2, "skin", { g: 0.1 }), E(16, 19.4, 3.8, 2.8, "skinL")];
  if (m === "blink") sh.push(X([[11, 14], [12, 14], [13, 14], [18, 14], [19, 14], [20, 14]], "dark"));
  else if (m === "happy") sh.push(X([[11, 14], [12, 13], [13, 14], [18, 14], [19, 13], [20, 14]], "dark"));
  else sh.push(...S2(E(12.5, 14, 2.1, 1.8, hungry ? "red" : "jade")), X([[12, 13], [12, 14], [19, 13], [19, 14]], "dark"));
  sh.push(P([[15, 17], [17, 17], [16, 18.6]], "pink"), X(m === "hungry" ? [[16, 19], [13, 20], [14, 21], [15, 21], [16, 21], [17, 21], [18, 21], [18, 20]] : [[16, 19], [15, 20], [14, 20], [17, 20], [18, 20]], "dark"));
  if (m === "hungry") sh.push(X([[14, 20], [17, 20]], "white"), X([[15, 20], [16, 20]], "black"));
  sh.push(...S2(X(line(2, 17, 9, 18), "white")), ...S2(X(line(2, 21, 9, 20), "white")));
  return { shapes: sh, mats: { skin: c.tone, c1: c.primary, c2: c.secondary } };
};

BUILD.hermes = (c, m) => {
  const sh = [E(16, 10.5, 9, 8, "hair", { g: 0.3 }), ...S2(E(8.6, 15, 2.6, 3.2, "hair", { g: 0.3 })),
    ...ROBE("tunic", "tunic"), E(16, 28.6, 1.9, 1.9, "gold"), ...HEAD(), P([[10, 8], [16, 6], [22, 8], [21, 10.5], [16, 8.6], [11, 10.5]], "hair", { g: 0.3 }),
    ...humanFace(m), E(16, 6.8, 9.6, 2.2, "gold"), E(16, 4.8, 6, 3.8, "gold"), R(10.2, 6, 11.6, 1.1, "blue")];
  // feathered wings on the hat, three feathers each
  sh.push(...S2(P([[7, 6], [1.5, 0.5], [3, 3.4]], "white")), ...S2(P([[7, 7], [0.5, 3.6], [2.6, 5.6]], "white")), ...S2(P([[7, 8], [1, 6.6], [3, 8.4]], "white")));
  sh.push(...S2(X(line(6, 6, 3, 3), "wingD")), ...S2(X(line(6, 7, 2, 5), "wingD")));
  return { shapes: sh, mats: { hair: "#7a4a22", tunic: "#e8dcc0", wingD: "#b9c3d6" } };
};

BUILD.isis = (c, m) => {
  const sh = [...S2(P([[1, 31], [0, 18], [3, 12], [6.5, 17], [9, 23], [10, 31]], "wing"))];
  [16, 19, 22, 25, 28].forEach((y) => sh.push(...S2(R(0, y, 11, 1, "wingD", { o: "wing" }))));
  sh.push(E(16, 13.5, 10.5, 11, "hair", { g: 0.1 }), ...S2(R(5.5, 14, 4.6, 13, "hair", { g: 0.1 })), ...COLLAR("gold", "white"),
    ...HEAD(), R(9.5, 6.8, 13, 3, "hair"), ...humanFace(m), KOHL(),
    ...S2(P([[10, 5.5], [8.6, 2], [11.4, 0.6], [13.4, 3.6]], "gold")), E(16, 2.6, 2.6, 2.6, "red"));
  return { shapes: sh, mats: { hair: "#231a3a", wing: c.primary, wingD: darken(c.primary, 0.3) } };
};

BUILD.osiris = (c, m) => {
  const sh = [...ROBE("wrap")];
  [25, 27, 29, 31].forEach((y) => sh.push(R(3, y, 26, 1, "wrapD", { o: "wrap" })));
  sh.push(...HEAD(), ...humanFace(m), KOHL(), R(14.6, 22.6, 2.8, 6.4, "blue"), R(14.6, 24.4, 2.8, 1, "gold"), R(14.6, 27, 2.8, 1, "gold"),
    X(line(8, 24, 21, 31), "gold"), X(line(8, 25, 21, 32), "gold"), X(line(24, 24, 11, 31), "gold"), X(line(24, 25, 11, 32), "gold"),
    R(10, 7.2, 12, 1.4, "gold"), P([[12, 8], [12.6, 2.6], [19.4, 2.6], [20, 8]], "white"),
    ...S2(P([[11.4, 7.6], [8.4, 4], [10, 2], [12.6, 3.4], [12.8, 7.6]], "white")), E(16, 2, 1.7, 1.7, "red"));
  return { shapes: sh, mats: { wrap: "#e9e0c8", wrapD: "#bfb496" } };
};

BUILD.anubis = (c, m) => {
  const hungry = m === "hungry" || m === "hungry2", sh = [...COLLAR("gold", "blue"),
    ...S2(P([[6.4, 10], [10.6, 10], [10.8, 26], [7, 29], [4, 27], [5, 17]], "blue")),
    ...S2(P([[9.5, 12], [8, 0], [14, 8]], "skin")), ...S2(P([[10, 10.6], [9.2, 3], [12.6, 8]], "gold")),
    E(16, 14.5, 6.6, 7.6, "skin", { g: 0.12 }), R(13, 16.6, 6, 6, "skin", { g: 0.12 }), R(14, 16.6, 4, 2, "black")];
  [12, 15, 18, 21, 24, 27].forEach((y) => sh.push(...S2(R(3, y, 9, 1, "gold", { o: "blue" }))));
  if (m === "blink") sh.push(X([[11, 13], [12, 13], [13, 13], [18, 13], [19, 13], [20, 13]], "dark"));
  else if (m === "happy") sh.push(X([[11, 13], [12, 12], [13, 13], [18, 13], [19, 12], [20, 13]], "dark"));
  else sh.push(...S2(E(12.6, 13, 1.9, 1.4, hungry ? "red" : "amber")), X([[12, 13], [19, 13]], "dark"), ...S2(X([[9, 13], [10, 13]], "dark")));
  if (m === "hungry") { const g = []; for (let y = 21; y <= 22; y++) for (let x = 14; x <= 17; x++) g.push([x, y]);
    sh.push(X(g, "black"), X([[14, 21], [17, 21]], "white"), X([[15, 22], [16, 22]], "red")); }
  else sh.push(X([[14, 21], [15, 21], [16, 21], [17, 21]], "dark"));
  return { shapes: sh, mats: { skin: c.tone } };
};

BUILD.athena = (c, m) => ({ shapes: [...ROBE("robe", "robe"), E(16, 30.6, 6, 3.4, "metalD"), E(16, 30.6, 2, 2, "gold"), ...S2(R(7, 12, 3.6, 12, "hair", { g: 0.15 })),
  ...HEAD(), E(16, 9, 8.8, 7.2, "metal"), ...S2(P([[8.2, 11], [10.8, 11], [11, 19], [9.4, 22.5], [7.8, 17]], "metal")),
  R(15.2, 10.5, 1.6, 8.2, "metal"), P([[8.5, 5], [13, 1.5], [19, 1.5], [23.5, 5], [22.5, 8], [16, 4.5], [9.5, 8]], "plume", { g: 0.15 }),
  ...humanFace(m, { nose: false, pupil: "gray" })],
  mats: { metal: c.primary, metalD: darken(c.primary, 0.3), plume: c.secondary, robe: "#e8e4f0", hair: "#6b4426", gray: "#6b7fa8" } });

BUILD.hades = (c, m) => {
  const sh = [...ROBE("robe", "robe2"), E(16, 10, 9, 8.4, "hair", { g: 0.2 }), ...S2(R(6.5, 10, 4.2, 17, "hair", { g: 0.2 })), ...HEAD(),
    P([[10.6, 22.4], [21.4, 22.4], [20.6, 27.5], [16, 31], [11.4, 27.5]], "hair", { g: 0.2 }), ...humanFace(m, { pupil: "amber" }), R(9.6, 6.4, 12.8, 1.6, "metal")];
  [10.5, 13.2, 16, 18.8, 21.5].forEach((x) => sh.push(P([[x - 1.2, 6.4], [x, 0.8], [x + 1.2, 6.4]], "spike")));
  return { shapes: sh, mats: { robe: c.secondary, robe2: lighten(c.secondary, 0.1), hair: "#17102a", metal: "#6b6b7b", spike: lighten(c.primary, 0.45) } };
};

BUILD.zeus = (c, m) => {
  const sh = [...ROBE("robe", "robe2"), P([[22, 20], [26, 20], [24.6, 24.4], [28, 24.4], [20.4, 32], [22.4, 26.6], [19.6, 26.6]], "bolt", { flat: true }),
    E(16, 9.5, 9.6, 8.5, "hairW", { g: 0.15 }), ...S2(R(5.8, 10, 4.6, 15, "hairW", { g: 0.15 })), ...HEAD(),
    P([[9.6, 18.5], [22.4, 18.5], [22, 27], [16, 31], [10, 27]], "hairW", { g: 0.15 }), ...humanFace(m, { brow: "hairW" }),
    R(9.2, 6.2, 13.6, 1.3, "gold"), ...S2(X([[9, 6], [8, 7], [9, 8], [10, 5], [11, 4], [12, 5]], "gold"))];
  return { shapes: sh, mats: { robe: "#9ec1e8", robe2: "#d4e4f7", hairW: "#f1ecdf", bolt: "#ffe45c" } };
};

/* ---------- drawing ---------- */
// colors = { primary, secondary, tone }
function renderArt(id, mood, colors) {
  const built = (BUILD[id] || BUILD.classic)(colors, mood);
  return rasterize(built.shapes, Object.assign(baseMats(colors), built.mats));
}
function paintArt(canvas, id, mood, colors) {
  canvas.width = ART_N;
  canvas.height = ART_N;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, ART_N, ART_N);
  renderArt(id, mood, colors).forEach((row, y) => row.forEach((color, x) => {
    if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
  }));
}
