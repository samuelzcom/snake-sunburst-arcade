import test from "node:test";
import assert from "node:assert/strict";

import { SnakeGame } from "../src/game.js";

class FakeHTMLElement {
  constructor() {
    this.textContent = "";
    this.listeners = new Map();
    this.dataset = {};
  }

  addEventListener(type, handler) {
    this.listeners.set(type, handler);
  }

  dispatch(type) {
    const handler = this.listeners.get(type);
    if (handler) {
      handler();
    }
  }
}

class FakeHTMLInputElement extends FakeHTMLElement {
  constructor(value = "") {
    super();
    this.value = value;
  }
}

class FakeHTMLButtonElement extends FakeHTMLElement {}

class FakeHTMLCanvasElement extends FakeHTMLElement {
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
  }
}

class FakeNodeList extends Array {}

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

const createElements = () => {
  const upButton = new FakeHTMLButtonElement();
  upButton.dataset.direction = "up";

  const leftButton = new FakeHTMLButtonElement();
  leftButton.dataset.direction = "left";

  return {
    board: new FakeHTMLCanvasElement(),
    score: new FakeHTMLElement(),
    bestScore: new FakeHTMLElement(),
    status: new FakeHTMLElement(),
    speed: new FakeHTMLInputElement("10"),
    speedLabel: new FakeHTMLElement(),
    pauseButton: new FakeHTMLButtonElement(),
    restartButton: new FakeHTMLButtonElement(),
    padButtons: new FakeNodeList(upButton, leftButton),
  };
};

const installBrowserGlobals = (elements) => {
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.HTMLInputElement = FakeHTMLInputElement;
  globalThis.HTMLButtonElement = FakeHTMLButtonElement;
  globalThis.HTMLCanvasElement = FakeHTMLCanvasElement;
  globalThis.NodeList = FakeNodeList;

  const lookup = new Map([
    ["#board", elements.board],
    ["#score", elements.score],
    ["#best-score", elements.bestScore],
    ["#status", elements.status],
    ["#speed", elements.speed],
    ["#speed-label", elements.speedLabel],
    ["#pause-btn", elements.pauseButton],
    ["#restart-btn", elements.restartButton],
  ]);

  globalThis.document = {
    querySelector(selector) {
      return lookup.get(selector) ?? null;
    },
    querySelectorAll(selector) {
      return selector === ".pad button" ? elements.padButtons : new FakeNodeList();
    },
  };

  const listeners = new Map();
  let animationFrame = null;

  globalThis.window = {
    localStorage: createStorage(),
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    requestAnimationFrame(handler) {
      animationFrame = handler;
      return 1;
    },
  };

  return {
    dispatchKeydown(event) {
      const handler = listeners.get("keydown");
      assert.ok(handler, "expected keydown listener");
      handler(event);
    },
    getAnimationFrame() {
      return animationFrame;
    },
  };
};

test("main wires keyboard controls to the game lifecycle", async () => {
  const elements = createElements();
  const browser = installBrowserGlobals(elements);

  const originalSetDirection = SnakeGame.prototype.setDirection;
  const originalTogglePause = SnakeGame.prototype.togglePause;
  const originalReset = SnakeGame.prototype.reset;

  const calls = {
    setDirection: [],
    togglePause: 0,
    reset: 0,
  };

  SnakeGame.prototype.setDirection = function setDirection(direction) {
    calls.setDirection.push(direction);
    return originalSetDirection.call(this, direction);
  };

  SnakeGame.prototype.togglePause = function togglePause() {
    calls.togglePause += 1;
    return originalTogglePause.call(this);
  };

  SnakeGame.prototype.reset = function reset() {
    calls.reset += 1;
    return originalReset.call(this);
  };

  try {
    await import(`../src/main.js?test=${Date.now()}`);

    assert.equal(typeof browser.getAnimationFrame(), "function");
    assert.equal(calls.reset, 1);
    assert.equal(elements.status.textContent, "Running");

    let prevented = false;
    browser.dispatchKeydown({
      key: "ArrowUp",
      code: "ArrowUp",
      preventDefault() {
        prevented = true;
      },
    });

    assert.equal(prevented, true);
    assert.deepEqual(calls.setDirection, ["up"]);

    prevented = false;
    browser.dispatchKeydown({
      key: " ",
      code: "Space",
      preventDefault() {
        prevented = true;
      },
    });

    assert.equal(prevented, true);
    assert.equal(calls.togglePause, 1);
    assert.equal(elements.status.textContent, "Paused");
    assert.equal(elements.pauseButton.textContent, "Resume");

    browser.dispatchKeydown({
      key: "Enter",
      code: "Enter",
      preventDefault() {},
    });

    assert.equal(calls.reset, 2);
    assert.equal(elements.status.textContent, "Running");
    assert.equal(elements.pauseButton.textContent, "Pause");
  } finally {
    SnakeGame.prototype.setDirection = originalSetDirection;
    SnakeGame.prototype.togglePause = originalTogglePause;
    SnakeGame.prototype.reset = originalReset;

    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.HTMLElement;
    delete globalThis.HTMLInputElement;
    delete globalThis.HTMLButtonElement;
    delete globalThis.HTMLCanvasElement;
    delete globalThis.NodeList;
  }
});
