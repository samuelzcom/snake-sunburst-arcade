import { DIRECTION_KEYS, SnakeGame } from "./game.js";
import { bindUI } from "./ui.js";

const canvas = document.querySelector("#board");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas element #board not found.");
}

const game = new SnakeGame(canvas);

bindUI(game, {
  score: document.querySelector("#score"),
  bestScore: document.querySelector("#best-score"),
  status: document.querySelector("#status"),
  speed: document.querySelector("#speed"),
  speedLabel: document.querySelector("#speed-label"),
  pauseButton: document.querySelector("#pause-btn"),
  restartButton: document.querySelector("#restart-btn"),
  padButtons: document.querySelectorAll(".pad button"),
});

let previousTime = performance.now();

const tick = (now) => {
  const deltaSeconds = (now - previousTime) / 1000;
  previousTime = now;

  game.update(deltaSeconds);
  game.render();

  window.requestAnimationFrame(tick);
};

window.requestAnimationFrame(tick);

window.addEventListener("keydown", (event) => {
  const direction = DIRECTION_KEYS[event.key];
  if (direction) {
    event.preventDefault();
    game.setDirection(direction);
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    game.togglePause();
    return;
  }

  if (event.code === "Enter") {
    game.reset();
  }
});
