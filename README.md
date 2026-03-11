# Snake Sunburst Arcade

Modern browser-based Snake game with a polished UI, responsive layout, and straightforward controls.

## Features

- Stylish animated interface (gradient backdrop, glassmorphism cards, reveal animations)
- Classic Snake gameplay with collision-based game-over logic
- Controls via arrow keys or WASD
- Touch-friendly D-pad buttons
- Pause/resume, restart, and adjustable speed
- Persistent high score stored in `localStorage`

## Controls

- Move with arrow keys or `W`, `A`, `S`, `D`
- Press `Space` to pause or resume
- Press `Enter` to restart after a loss
- Use the on-screen D-pad on touch devices

## Setup

```bash
npm install
npm run dev
```

Then open the local URL shown in your browser.

## Build

```bash
npm run build
npm run preview
```

## Validation

Run the full local check suite before opening a PR:

```bash
npm run validate
```

This runs syntax checks, TypeScript verification, the Node test suite, and a production build.

## Architecture

The game is intentionally split into a few small browser modules:

- `src/main.js` wires DOM elements to the game engine and starts the animation loop
- `src/game.js` owns gameplay state, movement, collisions, scoring, and canvas rendering
- `src/ui.js` binds buttons, status labels, and the speed slider to the game instance
- `src/constants.js` keeps shared tuning values in one place

Tests mirror those boundaries:

- `tests/game.test.mjs` covers gameplay rules and state transitions
- `tests/ui.test.mjs` covers UI bindings and user interactions
- `tests/state.test.mjs` covers shared state and persistence behavior

## CI Notes

GitHub Actions runs the same basic health checks expected locally:

- dependency install and audit through `.github/workflows/ci.yml`
- project validation through the repository scripts in `package.json`

For the lowest-friction maintenance path, prefer changes that keep `npm run validate` green locally before pushing.
