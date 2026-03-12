import test from "node:test";
import assert from "node:assert/strict";

import { bindUI } from "../src/ui.js";

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

const installDomGlobals = () => {
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.HTMLInputElement = FakeHTMLInputElement;
  globalThis.HTMLButtonElement = FakeHTMLButtonElement;
  globalThis.NodeList = FakeNodeList;
};

const createGameStub = (initialState = {}) => {
  const state = {
    alive: true,
    paused: false,
    won: false,
    speed: 10,
    score: 7,
    bestScore: 15,
    ...initialState,
  };

  const calls = {
    setSpeed: [],
    setDirection: [],
    togglePause: 0,
    reset: 0,
  };

  return {
    calls,
    getState() {
      return { ...state };
    },
    onScoreChange(handler) {
      handler({ score: state.score, bestScore: state.bestScore });
    },
    onStateChange(handler) {
      handler({ ...state });
    },
    setSpeed(value) {
      calls.setSpeed.push(value);
    },
    setDirection(direction) {
      calls.setDirection.push(direction);
    },
    togglePause() {
      calls.togglePause += 1;
    },
    reset() {
      calls.reset += 1;
    },
  };
};

const createElements = () => {
  const upButton = new FakeHTMLButtonElement();
  upButton.dataset.direction = "up";

  const leftButton = new FakeHTMLButtonElement();
  leftButton.dataset.direction = "left";

  return {
    score: new FakeHTMLElement(),
    bestScore: new FakeHTMLElement(),
    status: new FakeHTMLElement(),
    speed: new FakeHTMLInputElement("12"),
    speedLabel: new FakeHTMLElement(),
    pauseButton: new FakeHTMLButtonElement(),
    restartButton: new FakeHTMLButtonElement(),
    padButtons: new FakeNodeList(upButton, leftButton),
  };
};

test("bindUI initializes visible state and wires control interactions", () => {
  installDomGlobals();

  const game = createGameStub();
  const elements = createElements();

  bindUI(game, elements);

  assert.equal(elements.score.textContent, "7");
  assert.equal(elements.bestScore.textContent, "15");
  assert.equal(elements.status.textContent, "Running");
  assert.equal(elements.pauseButton.textContent, "Pause");
  assert.equal(elements.speed.value, "10");
  assert.equal(elements.speedLabel.textContent, "10");

  elements.speed.value = "18";
  elements.speed.dispatch("input");
  elements.pauseButton.dispatch("click");
  elements.restartButton.dispatch("click");
  elements.padButtons[0].dispatch("click");
  elements.padButtons[1].dispatch("click");

  assert.deepEqual(game.calls.setSpeed, [18]);
  assert.equal(game.calls.togglePause, 1);
  assert.equal(game.calls.reset, 1);
  assert.deepEqual(game.calls.setDirection, ["up", "left"]);
});

test("bindUI reflects paused and won states from the game", () => {
  installDomGlobals();

  const pausedGame = createGameStub({ paused: true });
  const pausedElements = createElements();
  bindUI(pausedGame, pausedElements);
  assert.equal(pausedElements.status.textContent, "Paused");
  assert.equal(pausedElements.pauseButton.textContent, "Resume");

  const wonGame = createGameStub({ alive: false, won: true });
  const wonElements = createElements();
  bindUI(wonGame, wonElements);
  assert.equal(wonElements.status.textContent, "You Win");
  assert.equal(wonElements.pauseButton.textContent, "Pause");
});

test("bindUI ignores non-button pad nodes", () => {
  installDomGlobals();

  const game = createGameStub();
  const elements = createElements();
  const strayNode = new FakeHTMLElement();
  strayNode.dataset.direction = "down";
  elements.padButtons.push(strayNode);

  assert.doesNotThrow(() => bindUI(game, elements));

  strayNode.dispatch("click");
  elements.padButtons[0].dispatch("click");

  assert.deepEqual(game.calls.setDirection, ["up"]);
});

test("bindUI rejects missing required DOM elements", () => {
  installDomGlobals();

  const game = createGameStub();
  const elements = createElements();
  elements.speed = new FakeHTMLElement();

  assert.throws(() => bindUI(game, elements), /Control elements missing/);
});

test("bindUI rejects non-button pause and restart controls", () => {
  installDomGlobals();

  const game = createGameStub();
  const elements = createElements();
  elements.pauseButton = new FakeHTMLElement();

  assert.throws(() => bindUI(game, elements), /Control elements missing/);

  elements.pauseButton = new FakeHTMLButtonElement();
  elements.restartButton = new FakeHTMLElement();

  assert.throws(() => bindUI(game, elements), /Control elements missing/);
});
