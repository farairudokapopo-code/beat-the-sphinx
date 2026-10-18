// Ten gods for the shop. Each has a power (perk) and a drawback tied to their myth.
// `colors` feed the pixel portrait in art.js. `power` is the effect id used in script.js. `active: true` powers show a button during riddles.
const GODS = [
  { id: "thoth", name: "Thoth", title: "Egyptian god of wisdom", cost: 40, power: "hint-length", active: true, powerLabel: "Thoth: reveal letters",
    perk: "Once per riddle, reveal how many letters the answer has.", drawback: "The scribe's toll: each hint costs you 5 points.",
    colors: { primary: "#2f6fd0", secondary: "#6fb3e0", tone: "#b98a5a" } },
  { id: "bastet", name: "Bastet", title: "Egyptian cat goddess", cost: 60, power: "typo", active: false,
    perk: "Small spelling mistakes are forgiven.", drawback: "Cat naps: the first riddle earns no points.",
    colors: { primary: "#6b4a8a", secondary: "#e8b86a", tone: "#c9892a" } },
  { id: "hermes", name: "Hermes", title: "Greek messenger god", cost: 80, power: "reroll", active: true, powerLabel: "Hermes: swap riddle",
    perk: "Once a day, swap the current riddle for a new one.", drawback: "The trickster's cut: the swapped riddle is worth half points.",
    colors: { primary: "#c9892a", secondary: "#fdf3d0", tone: "#e8b88a" } },
  { id: "ra", name: "Ra", title: "Egyptian sun god", cost: 100, power: "hint-first", active: true, powerLabel: "Ra: reveal first letter",
    perk: "Once per riddle, light up the first letter of the answer.", drawback: "The night journey: you earn no streak bonus.",
    colors: { primary: "#d9453b", secondary: "#f2c14e", tone: "#8a5a3a" } },
  { id: "isis", name: "Isis", title: "Egyptian goddess of magic", cost: 120, power: "retry", active: false,
    perk: "Once a day, a wrong answer gets a second try.", drawback: "Magic has a price: that riddle is worth half points.",
    colors: { primary: "#2f9d8f", secondary: "#f2c14e", tone: "#d9a066" } },
  { id: "osiris", name: "Osiris", title: "Egyptian lord of the dead", cost: 150, power: "rebirth", active: false,
    perk: "Rebirth: if the Sphinx eats you, your streak survives.", drawback: "Duty to the underworld: the survival bonus is halved.",
    colors: { primary: "#5fa77a", secondary: "#2f6fd0", tone: "#7fb39a" } },
  { id: "anubis", name: "Anubis", title: "Egyptian god of judgment", cost: 180, power: "forgive", active: false,
    perk: "Once a day, he forgives one wrong answer as if it were right.", drawback: "Judgment is final: the forgiven riddle earns nothing and he takes 10 points.",
    colors: { primary: "#f2c14e", secondary: "#2f6fd0", tone: "#3a3a52" } },
  { id: "athena", name: "Athena", title: "Greek goddess of wisdom", cost: 200, power: "bonus", active: false,
    perk: "Correct answers earn 50% more points.", drawback: "Pride: each wrong answer costs you 10 points.",
    colors: { primary: "#8a8fa8", secondary: "#2f6fd0", tone: "#f0c9a0" } },
  { id: "hades", name: "Hades", title: "Greek lord of the underworld", cost: 250, power: "gamble", active: false,
    perk: "The hard riddle is worth double points.", drawback: "A hard bargain: missing the hard riddle costs 20 points.",
    colors: { primary: "#7a2d63", secondary: "#3b2a5c", tone: "#b8a9d6" } },
  { id: "zeus", name: "Zeus", title: "Greek king of the gods", cost: 300, power: "smite", active: true, powerLabel: "Zeus: strike a riddle",
    perk: "Once a day, a thunderbolt solves a riddle for you.", drawback: "Tribute: that riddle earns nothing and Zeus takes 15 points.",
    colors: { primary: "#fdf3d0", secondary: "#f2c14e", tone: "#e8b88a" } }
];

function godById(id) { return GODS.find((g) => g.id === id) || null; }
// Draws a god's pixel portrait (see art.js). mood: watch, blink, happy, hungry
function drawGod(canvas, g, mood = "watch") { paintArt(canvas, g.id, mood, g.colors); }
