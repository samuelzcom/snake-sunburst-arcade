import test from "node:test";
import assert from "node:assert/strict";

import { GRID_SIZE, INITIAL_SPEED, MAX_SPEED, MIN_SPEED } from "../src/constants.js";
import { SnakeGame } from "../src/game.js";

const createStorage = () => {
  const store = new Map();
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

test("winning on the final food ends the game without creating impossible food", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());
  const boardCells = GRID_SIZE * GRID_SIZE;
  const fullBoard = [];

  for (let index = 0; index < boardCells; index += 1) {
    fullBoard.push({ x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) });
  }

  game.snake = fullBoard.slice(1);
  game.direction = "left";
  game.nextDirection = "left";
  game.food = { x: 0, y: 0 };
  game.score = 50;
  game.bestScore = 50;
  game.alive = true;
  game.paused = false;
  game.won = false;

  game.step();

  assert.equal(game.alive, false);
  assert.equal(game.won, true);
  assert.equal(game.food, null);
  assert.equal(game.score, 60);
  assert.equal(game.bestScore, 60);
  assert.equal(game.snake.length, boardCells);
});

test("setSpeed ignores invalid values and clamps valid ones", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  assert.equal(game.getState().speed, INITIAL_SPEED);

  game.setSpeed("fast");
  assert.equal(game.getState().speed, INITIAL_SPEED);

  game.setSpeed(MIN_SPEED - 10);
  assert.equal(game.getState().speed, MIN_SPEED);

  game.setSpeed(MAX_SPEED + 10);
  assert.equal(game.getState().speed, MAX_SPEED);
});
