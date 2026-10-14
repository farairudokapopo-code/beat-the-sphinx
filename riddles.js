// Each riddle: q = question, a = accepted answers (lowercase, no leading "a/an/the").
// Add more riddles to any tier. The game rotates through them without repeats.
const RIDDLES = {
  easy: [
    { q: "What has keys but can't open locks?", a: ["piano", "keyboard"] },
    { q: "What gets wetter the more it dries?", a: ["towel"] },
    { q: "What has hands but cannot clap?", a: ["clock", "watch"] },
    { q: "What can you catch but never throw?", a: ["cold", "breath"] },
    { q: "What has a neck but no head?", a: ["bottle"] },
    { q: "What runs but never walks?", a: ["river", "water", "stream"] }
  ],
  medium: [
    { q: "The more you take, the more you leave behind. What am I?", a: ["footsteps", "steps", "footprints"] },
    { q: "I speak without a mouth and hear without ears. Wind brings me to life. What am I?", a: ["echo"] },
    { q: "What can travel around the world while staying in a corner?", a: ["stamp", "postage stamp"] },
    { q: "What has many teeth but cannot bite?", a: ["comb", "zipper", "saw"] },
    { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: ["m", "letter m"] },
    { q: "What belongs to you but is used more by others?", a: ["name", "your name"] }
  ],
  hard: [
    { q: "What walks on four legs in the morning, two at noon, and three in the evening?", a: ["man", "human", "person", "humans", "mankind", "human being"] },
    { q: "I am not alive, but I grow. I have no lungs, but I need air. Water kills me. What am I?", a: ["fire", "flame"] },
    { q: "What is so fragile that saying its name breaks it?", a: ["silence"] },
    { q: "The one who makes it sells it. The one who buys it never uses it. The one who uses it never knows. What is it?", a: ["coffin", "casket"] },
    { q: "I have cities but no houses, mountains but no trees, and water but no fish. What am I?", a: ["map"] },
    { q: "What can fill a room but takes up no space?", a: ["light"] }
  ]
};
