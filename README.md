# Beat the Sphinx

A daily riddle game with a pixel-art Sphinx. Answer three riddles of rising difficulty. Get at least two right to walk free, or the Sphinx eats you.

**Play it:** _add your GitHub Pages link here_

## How it works

- Every player gets the same three riddles each day (easy, medium, hard).
- You get one try per riddle. Answer matching ignores case, punctuation, "a/the", and simple plurals.
- Your streak and stats are saved in your browser, and you can copy a spoiler-free result to share.

## Features

- Daily puzzle chosen from the date with a seeded shuffle, so riddles don't repeat until a tier is used up
- Pixel-art Sphinx and icons drawn from text grids onto a canvas (`sprites.js`)
- Frame-stepped animation: bobbing, blinking, shaking, chomping, typewriter text
- 8-bit sound effects generated with the Web Audio API, with a saved mute toggle (`sound.js`)
- Respects `prefers-reduced-motion`
- No frameworks, no build step, no dependencies

## Run it locally

Open the folder in VS Code and use the Live Server extension, or run:

```
python -m http.server 8000
```

Then visit http://localhost:8000. To replay the same day, clear `sphinx-game` and `sphinx-stats` in your browser's localStorage.

## Deploy

Push to GitHub, then go to Settings, then Pages, and deploy from the `main` branch root.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Pixel-art styling and animations |
| `script.js` | Game logic, daily selection, stats, screens |
| `riddles.js` | Riddle data by difficulty |
| `sprites.js` | Pixel sprite grids and canvas drawing |
| `sound.js` | Synthesized sound effects |

## Adding riddles

Edit `riddles.js`. Each riddle looks like `{ q: "Question?", a: ["answer", "other accepted answer"] }`. The first answer is shown when a player gets it wrong.

## Ideas for later

- A countdown to the next riddles
- More Sphinx moods and a pixel background that changes with the score
- A hint button that costs a point
