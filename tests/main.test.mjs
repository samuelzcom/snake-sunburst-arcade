import test from "node:test";
import assert from "node:assert/strict";

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

class FakeNodeList extends Array {}

class FakeCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = "";
    this.strokeStyle = "";
    this.lineWidth = 0;
    this.textAlign = "";
    this.font = "";
    this.fillRectCalls = [];
  }

  createLinearGradient() {
    return { addColorStop() {} };
  }

  fillRect(x, y, width, height) {
    this.fillRectCalls.push({
      fillStyle: this.fillStyle,
      x,
      y,
      width,
      height,
    });
  }

  beginPath() {}

  moveTo() {}

  lineTo() {}

  stroke() {}

  arc() {}

  fill() {}

  fillText() {}
}

class FakeHTMLCanvasElement extends FakeHTMLElement {
  constructor() {
    super();
    this.context = new FakeCanvasRenderingContext2D();
  }

  getContext(kind) {
    assert.equal(kind, "2d");
    return this.context;
  }
}

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

const installDomGlobals = () => {
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.HTMLInputElement = FakeHTMLInputElement;
  globalThis.HTMLButtonElement = FakeHTMLButtonElement;
  globalThis.HTMLCanvasElement = FakeHTMLCanvasElement;
  globalThis.NodeList = FakeNodeList;
};

const importMainModule = async (suffix) => {
  return import(new URL(`../src/main.js?${suffix}`, import.meta.url).href);
};

test("main bootstraps the game loop and wires keyboard controls", async () => {
  installDomGlobals();

  const canvas = new FakeHTMLCanvasElement();
  const score = new FakeHTMLElement();
  const bestScore = new FakeHTMLElement();
  const status = new FakeHTMLElement();
  const speed = new FakeHTMLInputElement("10");
  const speedLabel = new FakeHTMLElement();
  const pauseButton = new FakeHTMLButtonElement();
  const restartButton = new FakeHTMLButtonElement();
  const upButton = new FakeHTMLButtonElement();
  upButton.dataset.direction = "up";
  const padButtons = new FakeNodeList(upButton);

  const selectors = new Map([
    ["#board", canvas],
    ["#score", score],
    ["#best-score", bestScore],
    ["#status", status],
    ["#speed", speed],
    ["#speed-label", speedLabel],
    ["#pause-btn", pauseButton],
    ["#restart-btn", restartButton],
  ]);

  const keyListeners = new Map();
  const animationFrames = [];

  globalThis.document = {
    querySelector(selector) {
      return selectors.get(selector) ?? null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, ".pad button");
      return padButtons;
    },
  };

  globalThis.performance = {
    now() {
      return 0;
    },
  };

  globalThis.window = {
    localStorage: createStorage(),
    requestAnimationFrame(callback) {
      animationFrames.push(callback);
      return animationFrames.length;
    },
    addEventListener(type, handler) {
      keyListeners.set(type, handler);
    },
  };

  await importMainModule(`bootstrap=${Date.now()}`);

  assert.equal(status.textContent, "Running");
  assert.equal(score.textContent, "0");
  assert.equal(bestScore.textContent, "0");
  assert.equal(speed.value, "10");
  assert.equal(speedLabel.textContent, "10");
  assert.equal(animationFrames.length, 1);
  assert.ok(keyListeners.has("keydown"));

  const keydown = keyListeners.get("keydown");
  const directionEvent = {
    key: "ArrowUp",
    code: "ArrowUp",
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  keydown(directionEvent);
  assert.equal(directionEvent.defaultPrevented, true);

  animationFrames.shift()(150);

  const headDraw = canvas.context.fillRectCalls.findLast(
    (call) => call.fillStyle === "#08565f",
  );
  assert.deepEqual(headDraw, {
    fillStyle: "#08565f",
    x: 265,
    y: 265,
    width: 22,
    height: 22,
  });
  assert.equal(animationFrames.length, 1);

  const pauseEvent = {
    key: " ",
    code: "Space",
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  keydown(pauseEvent);
  assert.equal(pauseEvent.defaultPrevented, true);
  assert.equal(status.textContent, "Paused");

  const restartEvent = {
    key: "Enter",
    code: "Enter",
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  keydown(restartEvent);
  assert.equal(restartEvent.defaultPrevented, false);
  assert.equal(status.textContent, "Paused");
  assert.equal(score.textContent, "0");
});

test("main only restarts from Enter after the run has ended", async () => {
  installDomGlobals();

  const canvas = new FakeHTMLCanvasElement();
  const score = new FakeHTMLElement();
  const bestScore = new FakeHTMLElement();
  const status = new FakeHTMLElement();
  const speed = new FakeHTMLInputElement("10");
  const speedLabel = new FakeHTMLElement();
  const pauseButton = new FakeHTMLButtonElement();
  const restartButton = new FakeHTMLButtonElement();
  const upButton = new FakeHTMLButtonElement();
  upButton.dataset.direction = "up";
  const padButtons = new FakeNodeList(upButton);

  const selectors = new Map([
    ["#board", canvas],
    ["#score", score],
    ["#best-score", bestScore],
    ["#status", status],
    ["#speed", speed],
    ["#speed-label", speedLabel],
    ["#pause-btn", pauseButton],
    ["#restart-btn", restartButton],
  ]);

  const keyListeners = new Map();
  const animationFrames = [];

  globalThis.document = {
    querySelector(selector) {
      return selectors.get(selector) ?? null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, ".pad button");
      return padButtons;
    },
  };

  globalThis.performance = {
    now() {
      return 0;
    },
  };

  globalThis.window = {
    localStorage: createStorage(),
    requestAnimationFrame(callback) {
      animationFrames.push(callback);
      return animationFrames.length;
    },
    addEventListener(type, handler) {
      keyListeners.set(type, handler);
    },
  };

  await importMainModule(`restart-guard=${Date.now()}`);

  const keydown = keyListeners.get("keydown");

  keydown({ key: "Enter", code: "Enter", preventDefault() {} });
  assert.equal(status.textContent, "Running");

  const moveEvent = {
    key: "ArrowUp",
    code: "ArrowUp",
    preventDefault() {},
  };
  keydown(moveEvent);
  animationFrames.shift()(150);

  for (let frame = 0; frame < 12; frame += 1) {
    animationFrames.shift()(150 + (frame + 1) * 100);
  }

  assert.equal(status.textContent, "Game Over");
  assert.equal(score.textContent, "0");

  keydown({ key: "Enter", code: "Enter", preventDefault() {} });
  assert.equal(status.textContent, "Running");
  assert.equal(score.textContent, "0");
});

test("main throws when the board canvas is missing", async () => {
  installDomGlobals();

  globalThis.document = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return new FakeNodeList();
    },
  };

  globalThis.performance = {
    now() {
      return 0;
    },
  };

  globalThis.window = {
    localStorage: createStorage(),
    requestAnimationFrame() {
      throw new Error("should not schedule animation frames");
    },
    addEventListener() {},
  };

  await assert.rejects(
    importMainModule(`missing-canvas=${Date.now()}`),
    /Canvas element #board not found/,
  );
});
