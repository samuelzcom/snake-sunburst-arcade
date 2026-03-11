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

globalThis.HTMLElement = FakeHTMLElement;
globalThis.HTMLInputElement = FakeHTMLInputElement;
globalThis.HTMLButtonElement = FakeHTMLButtonElement;
globalThis.NodeList = FakeNodeList;

const { bindUI } = await import("../src/ui.js");

const createGameStub = () => {
  const state = {
    alive: true,
    paused: false,
    won: false,
    speed: 10,
    score: 0,
    bestScore: 0,
  };

  return {
    state,
    scoreListener: null,
    stateListener: null,
    directions: [],
    toggles: 0,
    resets: 0,
    speeds: [],
    onScoreChange(handler) {
      this.scoreListener = handler;
    },
    onStateChange(handler) {
      this.stateListener = handler;
    },
    getState() {
      return { ...state };
    },
    setSpeed(value) {
      this.speeds.push(value);
      state.speed = value;
    },
    togglePause() {
      this.toggles += 1;
    },
    reset() {
      this.resets += 1;
    },
    setDirection(direction) {
      this.directions.push(direction);
    },
  };
};

const createElements = () => {
  const score = new FakeHTMLElement();
  const bestScore = new FakeHTMLElement();
  const status = new FakeHTMLElement();
  const speed = new FakeHTMLInputElement("10");
  const speedLabel = new FakeHTMLElement();
  const pauseButton = new FakeHTMLButtonElement();
  const restartButton = new FakeHTMLButtonElement();
  const upButton = new FakeHTMLButtonElement();
  upButton.dataset.direction = "up";
  const inertButton = new FakeHTMLButtonElement();
  const padButtons = new FakeNodeList(upButton, inertButton, {});

  return {
    score,
    bestScore,
    status,
    speed,
    speedLabel,
    pauseButton,
    restartButton,
    padButtons,
  };
};

test("bindUI syncs initial state and wires control events", () => {
  const game = createGameStub();
  const elements = createElements();

  bindUI(game, elements);

  assert.equal(elements.speed.value, "10");
  assert.equal(elements.speedLabel.textContent, "10");

  game.scoreListener({ score: 30, bestScore: 80 });
  assert.equal(elements.score.textContent, "30");
  assert.equal(elements.bestScore.textContent, "80");

  game.state.paused = true;
  game.stateListener({ ...game.state });
  assert.equal(elements.status.textContent, "Paused");
  assert.equal(elements.pauseButton.textContent, "Resume");

  elements.speed.value = "14";
  elements.speed.dispatch("input");
  assert.deepEqual(game.speeds, [14]);

  elements.pauseButton.dispatch("click");
  assert.equal(game.toggles, 1);

  elements.restartButton.dispatch("click");
  assert.equal(game.resets, 1);

  elements.padButtons[0].dispatch("click");
  elements.padButtons[1].dispatch("click");
  assert.deepEqual(game.directions, ["up"]);
});

test("bindUI throws when required score or status elements are missing", () => {
  const game = createGameStub();
  const elements = createElements();
  elements.status = null;

  assert.throws(() => bindUI(game, elements), /Score\/status elements missing/);
});

test("bindUI throws when required controls are missing", () => {
  const game = createGameStub();
  const elements = createElements();
  elements.speed = null;

  assert.throws(() => bindUI(game, elements), /Control elements missing/);
});
