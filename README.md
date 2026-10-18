# Beat the Sphinx

A daily riddle game with a pixel-art Sphinx. Answer three riddles of rising difficulty. Get at least two right to walk free, or the Sphinx eats you.

**Play it:** _(https://farairudokapopo-code.github.io/beat-the-sphinx/)_

## How it works

- Every player gets the same three riddles each day (easy, medium, hard).
- You get one try per riddle. Answer matching ignores case, punctuation, "a/the", and simple plurals.
- Your streak and stats are saved in your browser, and you can copy a spoiler-free result to share.
- You earn points every day (10/20/30 per riddle, a survival bonus, and a streak bonus). Points are saved in a player profile and will be spent on characters in the shop.

## Features

- Daily puzzle chosen from the date with a seeded shuffle, so riddles don't repeat until a tier is used up
- A shop with 10 mythology gods (Egyptian and Greek). Each gives a power and has a drawback tied to its myth, and one helper can be brought to each day's riddles
- A short how-to-play tutorial that appears before the first game
- Pixel-art Sphinx and icons drawn from text grids onto a canvas (`sprites.js`)
- Frame-stepped animation: bobbing, blinking, shaking, chomping, typewriter text
- 8-bit sound effects generated with the Web Audio API, with a saved mute toggle (`sound.js`)
- Respects `prefers-reduced-motion`
- No frameworks, no build step, no dependencies

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Pixel-art styling and animations |
| `script.js` | Game logic, daily selection, stats, screens |
| `riddles.js` | Riddle data by difficulty |
| `sprites.js` | Pixel sprite grids and canvas drawing |
| `art.js` | Pixel-art engine and the shape recipes for every character |
| `skins.js` | Sphinx skin list and colors |
| `gods.js` | The ten gods: powers, drawbacks, and colors |
| `sound.js` | Synthesized sound effects |

## Ideas for later

- A countdown to the next riddles
- More Sphinx moods and a pixel background that changes with the score
- A hint button that costs a point
