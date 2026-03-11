import test from "node:test";
import assert from "node:assert/strict";

import { SnakeGame } from "../src/game.js";

const createStorage = (initialEntries = []) => {
  const store = new Map(initialEntries);
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
};

const createThrowingStorage = () => ({
  getItem() {
    throw new Error("read blocked");
  },
  setItem() {
    throw new Error("write blocked");
  },
});

const createCanvas = () => ({
  getContext(kind) {
    assert.equal(kind, "2d");
    return {
      createLinearGradient() {
        return { addColorStop() {} };
      },
      fillRect() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      arc() {},
      fill() {},
      fillText() {},
      set fillStyle(value) {},
      set strokeStyle(value) {},
      set lineWidth(value) {},
      set textAlign(value) {},
      set font(value) {},
    };
  },
});

test("invalid stored best score falls back to zero", () => {
  globalThis.window = {
    localStorage: createStorage([["snake.sunburst.bestScore", "not-a-number"]]),
  };

  const game = new SnakeGame(createCanvas());

  assert.equal(game.getState().bestScore, 0);
});

test("best score loading tolerates storage read failures", () => {
  globalThis.window = {
    localStorage: createThrowingStorage(),
  };

  const game = new SnakeGame(createCanvas());

  assert.equal(game.getState().bestScore, 0);
});

test("reverse direction changes are ignored", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.setDirection("left");

  assert.equal(game.nextDirection, "right");
});

test("best score saving tolerates storage write failures", () => {
  globalThis.window = {
    localStorage: createThrowingStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.score = 10;

  assert.doesNotThrow(() => game.endGame());
  assert.equal(game.getState().bestScore, 10);
});

test("togglePause is ignored after the run has ended", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.endGame();

  assert.equal(game.getState().paused, false);
  assert.equal(game.togglePause(), false);
  assert.equal(game.getState().paused, false);
});
