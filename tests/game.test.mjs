import test from "node:test";
import assert from "node:assert/strict";

import {
  GRID_SIZE,
  INITIAL_SPEED,
  MAX_SPEED,
  MIN_SPEED,
  STORAGE_KEY_BEST_SCORE,
} from "../src/constants.js";
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

test("moving into the previous tail cell does not count as a body collision", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.snake = [
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 1, y: 3 },
    { x: 1, y: 2 },
  ];
  game.direction = "up";
  game.nextDirection = "left";
  game.food = { x: 0, y: 0 };
  game.alive = true;
  game.paused = false;

  game.step();

  assert.equal(game.alive, true);
  assert.deepEqual(game.snake, [
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 1, y: 3 },
  ]);
});

test("createFood can select the final open cell without retry loops", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());
  const boardCells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) {
        continue;
      }

      boardCells.push({ x, y });
    }
  }

  game.snake = boardCells;

  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    assert.deepEqual(game.createFood(), { x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
  } finally {
    Math.random = originalRandom;
  }
});

test("update stops processing queued steps after a collision ends the run", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.snake = [
    { x: GRID_SIZE - 2, y: 4 },
    { x: GRID_SIZE - 3, y: 4 },
    { x: GRID_SIZE - 4, y: 4 },
  ];
  game.direction = "right";
  game.nextDirection = "right";
  game.food = { x: 0, y: 0 };
  game.alive = true;
  game.paused = false;
  game.accumulator = 0;

  game.update(0.35);

  assert.equal(game.alive, false);
  assert.deepEqual(game.snake, [
    { x: GRID_SIZE - 1, y: 4 },
    { x: GRID_SIZE - 2, y: 4 },
    { x: GRID_SIZE - 3, y: 4 },
  ]);
  assert.ok(game.accumulator >= 1 / game.speed);
});

test("update stops processing queued steps after filling the final open cell", () => {
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
  game.alive = true;
  game.paused = false;
  game.accumulator = 0;

  game.update(0.35);

  assert.equal(game.alive, false);
  assert.equal(game.won, true);
  assert.equal(game.food, null);
  assert.equal(game.snake.length, boardCells);
  assert.ok(game.accumulator >= 1 / game.speed);
});

test("update processes whole steps and preserves the fractional remainder", () => {
  globalThis.window = {
    localStorage: createStorage(),
  };

  const game = new SnakeGame(createCanvas());

  game.food = { x: 0, y: 0 };
  game.alive = true;
  game.paused = false;
  game.accumulator = 0;
  game.elapsed = 0;

  game.update(0.25);

  assert.deepEqual(game.snake, [
    { x: 13, y: 12 },
    { x: 12, y: 12 },
    { x: 11, y: 12 },
  ]);
  assert.equal(game.elapsed, 0.25);
  assert.ok(Math.abs(game.accumulator - 0.05) < Number.EPSILON);
});

test("wall collisions persist a newly earned best score", () => {
  const localStorage = createStorage();
  globalThis.window = { localStorage };

  const game = new SnakeGame(createCanvas());

  game.snake = [
    { x: GRID_SIZE - 1, y: 8 },
    { x: GRID_SIZE - 2, y: 8 },
    { x: GRID_SIZE - 3, y: 8 },
  ];
  game.direction = "right";
  game.nextDirection = "right";
  game.food = { x: 0, y: 0 };
  game.score = 40;
  game.bestScore = 30;
  game.alive = true;
  game.paused = false;

  game.step();

  assert.equal(game.alive, false);
  assert.equal(game.bestScore, 40);
  assert.equal(localStorage.getItem(STORAGE_KEY_BEST_SCORE), "40");
});
