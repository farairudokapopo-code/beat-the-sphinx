// Ten gods for the shop. Each has a power (perk) and a drawback tied to their myth.
// `power` is the effect id used in script.js. `active: true` powers show a button during riddles.
const GODS = [
  { id: "thoth", name: "Thoth", title: "Egyptian god of wisdom", cost: 40, power: "hint-length", active: true, powerLabel: "Thoth: reveal letters",
    perk: "Once per riddle, reveal how many letters the answer has.", drawback: "The scribe's toll: each hint costs you 5 points.",
    pal: { H: "#2f6fd0", A: "#6fb3e0", S: "#e8b86a" }, crown: ["...GG...", "..GWWG..", "...GG...", "..HHHH.."] },
  { id: "bastet", name: "Bastet", title: "Egyptian cat goddess", cost: 60, power: "typo", active: false,
    perk: "Small spelling mistakes are forgiven.", drawback: "Cat naps: the first riddle earns no points.",
    pal: { H: "#6b4a8a", A: "#e8b86a", S: "#c9892a" }, crown: ["HH....HH", "HAH..HAH", "HHHHHHHH", "HHHHHHHH"] },
  { id: "hermes", name: "Hermes", title: "Greek messenger god", cost: 80, power: "reroll", active: true, powerLabel: "Hermes: swap riddle",
    perk: "Once a day, swap the current riddle for a new one.", drawback: "The trickster's cut: the swapped riddle is worth half points.",
    pal: { H: "#c9892a", A: "#fdf3d0", S: "#e8b86a" }, crown: ["AA......AA", "AAA....AAA", ".AAHHHHAA.", "..HHHHHH.."] },
  { id: "ra", name: "Ra", title: "Egyptian sun god", cost: 100, power: "hint-first", active: true, powerLabel: "Ra: reveal first letter",
    perk: "Once per riddle, light up the first letter of the answer.", drawback: "The night journey: you earn no streak bonus.",
    pal: { H: "#d9453b", A: "#f2994a", S: "#e8b86a" }, crown: ["...RRRR...", "..RRGGRR..", "..RRGGRR..", "...RRRR..."] },
  { id: "isis", name: "Isis", title: "Egyptian goddess of magic", cost: 120, power: "retry", active: false,
    perk: "Once a day, a wrong answer gets a second try.", drawback: "Magic has a price: that riddle is worth half points.",
    pal: { H: "#2f9d8f", A: "#fdf3d0", S: "#e8b86a" }, crown: ["G..GGGG..G", "GG.GRRG.GG", ".GGGRRGGG.", "..HHHHHH.."] },
  { id: "osiris", name: "Osiris", title: "Egyptian lord of the dead", cost: 150, power: "rebirth", active: false,
    perk: "Rebirth: if the Sphinx eats you, your streak survives.", drawback: "Duty to the underworld: the survival bonus is halved.",
    pal: { H: "#5fa77a", A: "#fdf3d0", S: "#7fb39a" }, crown: ["...WW...", "..WWWW..", "..WWWW..", ".WWAAWW."] },
  { id: "anubis", name: "Anubis", title: "Egyptian god of judgment", cost: 180, power: "forgive", active: false,
    perk: "Once a day, he forgives one wrong answer as if it were right.", drawback: "Judgment is final: the forgiven riddle earns nothing and he takes 10 points.",
    pal: { H: "#2a2a3a", A: "#f2c14e", S: "#8a6a4a" }, crown: ["HH......HH", "HAH....HAH", "HAHHHHHHAH", "HHHHHHHHHH"] },
  { id: "athena", name: "Athena", title: "Greek goddess of wisdom", cost: 200, power: "bonus", active: false,
    perk: "Correct answers earn 50% more points.", drawback: "Pride: each wrong answer costs you 10 points.",
    pal: { H: "#8a8fa8", A: "#2f6fd0", S: "#f0c9a0" }, crown: ["....AA....", "...AAAA...", "..AAAAAA..", "GGGGGGGGGG"] },
  { id: "hades", name: "Hades", title: "Greek lord of the underworld", cost: 250, power: "gamble", active: false,
    perk: "The hard riddle is worth double points.", drawback: "A hard bargain: missing the hard riddle costs 20 points.",
    pal: { H: "#3b2a5c", A: "#7a2d63", S: "#b8a9d6" }, crown: ["A........A", "AA......AA", "AAA....AAA", "AAAAAAAAAA"] },
  { id: "zeus", name: "Zeus", title: "Greek king of the gods", cost: 300, power: "smite", active: true, powerLabel: "Zeus: strike a riddle",
    perk: "Once a day, a thunderbolt solves a riddle for you.", drawback: "Tribute: that riddle earns nothing and Zeus takes 15 points.",
    pal: { H: "#fdf3d0", A: "#f2c14e", S: "#e8b86a" }, crown: ["....GG....", "...GG.....", "....GG....", "GGGGGGGGGG"] }
];

const GOD_BODY = [
  "..HHSSSSSSSSHH..", "..HSSKSSSSKSSH..", "..HSSSSSSSSSSH..", "..HSSKKKKKKSSH..", "...HSSSSSSSSH...",
  "....AAAAAAAA....", "..AAGAAAAAAGAA..", ".AAAAAAAAAAAAAA.", ".AAGAAAAAAAAGAA.", ".AAAAAAAAAAAAAA.", "AAAAAAAAAAAAAAAA"
];

function godById(id) { return GODS.find((g) => g.id === id) || null; }
function godPalette(g) { return Object.assign({}, PAL, g.pal); }
function godRows(g) {
  const rows = g.crown.map((r) => {
    const left = Math.floor((16 - r.length) / 2);
    return ".".repeat(left) + r + ".".repeat(16 - r.length - left);
  });
  rows.push("..HHHHHHHHHHHH..");
  return rows.concat(GOD_BODY);
}
