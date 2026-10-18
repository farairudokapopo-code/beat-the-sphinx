// Sphinx skins. Each skin's pixel art is built in art.js using the same id.
// `colors` are the default primary/secondary colours the player can change; `tone` is the skin/fur colour.
// `unlock` says how a skin is obtained. Only "free" and "points" exist so far; add new types
// (for example a secret code) in script.js where skins are unlocked.
const SKINS = [
  { id: "classic", name: "Classic Sphinx", blurb: "The original guardian.", unlock: { type: "free" },
    colors: { primary: "#f2c14e", secondary: "#2f6fd0" }, tone: "#d4915e" },
  { id: "tut", name: "King Tut's Mask", blurb: "The boy king's golden death mask.", unlock: { type: "points", cost: 150 },
    colors: { primary: "#f2c14e", secondary: "#2f6fd0" }, tone: "#d4915e" },
  { id: "cleopatra", name: "Cleopatra", blurb: "Queen of the Nile, with a golden headband.", unlock: { type: "points", cost: 200 },
    colors: { primary: "#f2c14e", secondary: "#2fb5a8" }, tone: "#f0c9a0" },
  { id: "griffin", name: "Griffin", blurb: "Eagle head, lion's pride.", unlock: { type: "points", cost: 300 },
    colors: { primary: "#f2c14e", secondary: "#2f6fd0" }, tone: "#f4ecd8" },
  { id: "medusa", name: "Medusa", blurb: "Snake-haired gorgon. Do not look directly.", unlock: { type: "points", cost: 350 },
    colors: { primary: "#5fd38a", secondary: "#f2c14e" }, tone: "#8fd4a0" },
  { id: "cerberus", name: "Cerberus", blurb: "Three heads guard the gates of the underworld.", unlock: { type: "points", cost: 400 },
    colors: { primary: "#b8b8c8", secondary: "#f2994a" }, tone: "#6b5a85" }
];

function skinById(id) { return SKINS.find((s) => s.id === id) || SKINS[0]; }

// look = { skin, primary, secondary }; null colours fall back to the skin's own colours
function lookColors(look) {
  const skin = skinById(look && look.skin);
  return { primary: (look && look.primary) || skin.colors.primary, secondary: (look && look.secondary) || skin.colors.secondary };
}

function drawSphinx(canvas, mood, look) {
  const skin = skinById(look && look.skin), c = lookColors(look);
  paintArt(canvas, skin.id, mood, { primary: c.primary, secondary: c.secondary, tone: skin.tone });
}
