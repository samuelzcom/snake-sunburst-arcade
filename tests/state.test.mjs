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

test("unavailable localStorage falls back to zero best score", () => {
  globalThis.window = {
    localStorage: {
      getItem() {
        throw new Error("storage disabled");
      },
      setItem() {
        throw new Error("storage disabled");
      },
    },
  };

  const game = new SnakeGame(createCanvas());

  assert.equal(game.getState().bestScore, 0);
});

test("storage write failures do not interrupt best score updates", () => {
  globalThis.window = {
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error("storage disabled");
      },
    },
  };

  const game = new SnakeGame(createCanvas());
  game.score = 30;

  assert.doesNotThrow(() => game.endGame());
  assert.equal(game.getState().bestScore, 30);
});

test("reverse direction changes are ignored", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.setDirection("left");

  assert.equal(game.nextDirection, "right");
});
