const isElement = (node) => node instanceof HTMLElement;
const isInput = (node) => node instanceof HTMLInputElement;
const isNodeList = (node) => node instanceof NodeList;

export function bindUI(game, elements) {
  const {
    score,
    bestScore,
    status,
    speed,
    speedLabel,
    pauseButton,
    restartButton,
    padButtons,
  } = elements;

  if (!isElement(score) || !isElement(bestScore) || !isElement(status)) {
    throw new Error("Score/status elements missing.");
  }

  if (!isInput(speed) || !isElement(speedLabel) || !isElement(pauseButton) || !isElement(restartButton)) {
    throw new Error("Control elements missing.");
  }

  if (!isNodeList(padButtons)) {
    throw new Error("Pad buttons missing.");
  }

  const updateStatus = (state) => {
    if (!state.alive) {
      status.textContent = "Game Over";
      pauseButton.textContent = "Pause";
      return;
    }

    status.textContent = state.paused ? "Pausiert" : "Aktiv";
    pauseButton.textContent = state.paused ? "Weiter" : "Pause";
  };

  game.onScoreChange((snapshot) => {
    score.textContent = String(snapshot.score);
    bestScore.textContent = String(snapshot.bestScore);
  });

  game.onStateChange((state) => {
    updateStatus(state);
    speedLabel.textContent = String(state.speed);
  });

  speed.value = String(game.getState().speed);
  speedLabel.textContent = speed.value;

  speed.addEventListener("input", () => {
    game.setSpeed(Number(speed.value));
  });

  pauseButton.addEventListener("click", () => {
    game.togglePause();
  });

  restartButton.addEventListener("click", () => {
    game.reset();
  });

  padButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.direction;
      if (direction) {
        game.setDirection(direction);
      }
    });
  });
}
