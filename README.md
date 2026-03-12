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

## Dependency Maintenance

When updating build-time tooling such as `@cloudflare/vite-plugin`, keep the change narrow:

- update the declared version in `package.json`
- refresh `package-lock.json` with `npm install`
- rerun `npm run validate` before opening or refreshing the PR

That sequence keeps dependency-only changes easy to review and makes it safer to supersede stalled automation PRs with a fully validated branch update.

## Stalled Dependency PR Triage

If an automated dependency PR sits idle, review the diff before rebasing or merging it:

- confirm the PR is still open before doing any follow-up work
- major toolchain bumps should usually change `package.json` and `package-lock.json` only
- if the PR also edits application code or removes tests, treat it as unsafe to merge without a human-authored follow-up
- prefer superseding the stalled PR with a small replacement branch that documents the risk or carries a fully validated dependency-only update

For example, if a bot-generated Vite upgrade touches `src/` or `tests/`, close or supersede that branch explicitly instead of folding unrelated behavior changes into routine dependency maintenance.

Use this lightweight checklist before taking action on any stalled dependency PR:

```bash
gh pr view <number> --repo samuelzcom/snake-sunburst-arcade --json state,mergedAt,baseRefName,headRefName,url
gh pr diff <number> --repo samuelzcom/snake-sunburst-arcade
npm run validate
```

Interpret the PR state before deciding what to do next:

- `OPEN`: continue with merge-or-supersede review
- `MERGED`: stop and document that no superseding action is needed
- `CLOSED` without merge: either reopen with a clear reason or replace it with a new narrow PR

Treat the PR as mergeable only when all of the following stay true:

- the diff is limited to dependency manifests or lockfiles, plus any generated metadata that the package manager refreshes automatically
- local validation passes without requiring source, test, or CI rewrites
- the PR body still describes the same narrow maintenance change it actually contains

Choose `supersede` instead of `merge` when any of the following show up:

- `src/`, `tests/`, `scripts/`, or workflow files change alongside the dependency bump
- the branch silently mixes behavior fixes, refactors, or expanded test coverage into the maintenance update
- reviewers would need a code-level design review rather than a dependency-risk review

When superseding, open a fresh narrow PR and state why the original branch was not merged. That preserves review clarity and keeps routine maintenance from carrying hidden product changes.
