import {
  CANVAS_SIZE,
  GRID_SIZE,
  INITIAL_SPEED,
  MAX_SPEED,
  MIN_SPEED,
  STORAGE_KEY_BEST_SCORE,
} from "./constants.js";

const DIRECTIONS = {
  up: { x: 0, y: -1, opposite: "down" },
  down: { x: 0, y: 1, opposite: "up" },
  left: { x: -1, y: 0, opposite: "right" },
  right: { x: 1, y: 0, opposite: "left" },
};

export const DIRECTION_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class SnakeGame {
  constructor(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context not available.");
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.listeners = {
      score: () => undefined,
      state: () => undefined,
    };

    this.bestScore = this.loadBestScore();
    this.speed = INITIAL_SPEED;
    this.elapsed = 0;

    this.reset();
  }

  onScoreChange(handler) {
    this.listeners.score = handler;
    this.emitScore();
  }

  onStateChange(handler) {
    this.listeners.state = handler;
    this.emitState();
  }

  setSpeed(value) {
    this.speed = clamp(Number(value), MIN_SPEED, MAX_SPEED);
    this.emitState();
  }

  setDirection(direction) {
    if (!this.alive) {
      return;
    }

    const nextVector = DIRECTIONS[direction];
    if (!nextVector) {
      return;
    }

    const currentVector = DIRECTIONS[this.direction];
    if (currentVector.opposite === direction) {
      return;
    }

    this.nextDirection = direction;
  }

  togglePause() {
    if (!this.alive) {
      return false;
    }

    this.paused = !this.paused;
    this.emitState();
    return this.paused;
  }

  reset() {
    const center = Math.floor(GRID_SIZE / 2);
    this.snake = [
      { x: center - 1, y: center },
      { x: center - 2, y: center },
      { x: center - 3, y: center },
    ];

    this.direction = "right";
    this.nextDirection = "right";
    this.score = 0;
    this.accumulator = 0;
    this.elapsed = 0;
    this.paused = false;
    this.alive = true;
    this.food = this.createFood();

    this.emitScore();
    this.emitState();
  }

  getState() {
    return {
      alive: this.alive,
      paused: this.paused,
      speed: this.speed,
      score: this.score,
      bestScore: this.bestScore,
    };
  }

  update(deltaSeconds) {
    if (!this.alive || this.paused) {
      return;
    }

    this.elapsed += deltaSeconds;
    this.accumulator += deltaSeconds;

    const stepInterval = 1 / this.speed;
    while (this.accumulator >= stepInterval) {
      this.accumulator -= stepInterval;
      this.step();

      if (!this.alive) {
        break;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const tile = CANVAS_SIZE / GRID_SIZE;

    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE);
    sky.addColorStop(0, "#fff7e6");
    sky.addColorStop(1, "#ffe5ca");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = "rgba(7, 89, 96, 0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i += 1) {
      const position = i * tile;
      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, position);
      ctx.lineTo(CANVAS_SIZE, position);
      ctx.stroke();
    }

    const pulse = 0.26 + Math.abs(Math.sin(this.elapsed * 4)) * 0.18;
    const foodX = this.food.x * tile + tile / 2;
    const foodY = this.food.y * tile + tile / 2;

    ctx.beginPath();
    ctx.fillStyle = "#ff6418";
    ctx.arc(foodX, foodY, tile * pulse, 0, Math.PI * 2);
    ctx.fill();

    this.snake.forEach((segment, index) => {
      const x = segment.x * tile;
      const y = segment.y * tile;
      const inset = index === 0 ? 1 : 2;

      ctx.fillStyle = index === 0 ? "#08565f" : "#0b7b81";
      ctx.fillRect(x + inset, y + inset, tile - inset * 2, tile - inset * 2);

      if (index === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        const eyeRadius = Math.max(1.5, tile * 0.06);
        const eyeOffset = tile * 0.22;
        ctx.beginPath();
        ctx.arc(x + tile * 0.35, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.arc(x + tile * 0.65, y + eyeOffset, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (!this.alive || this.paused) {
      this.renderOverlay(!this.alive ? "Game Over" : "Paused", !this.alive ? "Enter = Restart" : "Space = Resume");
    }
  }

  step() {
    this.direction = this.nextDirection;

    const vector = DIRECTIONS[this.direction];
    const head = this.snake[0];
    const nextHead = {
      x: head.x + vector.x,
      y: head.y + vector.y,
    };

    const hitsWall =
      nextHead.x < 0 ||
      nextHead.x >= GRID_SIZE ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_SIZE;

    if (hitsWall) {
      this.endGame();
      return;
    }

    const grows = nextHead.x === this.food.x && nextHead.y === this.food.y;
    const collisionBody = grows ? this.snake : this.snake.slice(0, -1);
    const hitsBody = collisionBody.some(
      (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
    );

    if (hitsBody) {
      this.endGame();
      return;
    }

    this.snake.unshift(nextHead);

    if (grows) {
      this.score += 10;
      this.food = this.createFood();
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        this.saveBestScore();
      }
      this.emitScore();
    } else {
      this.snake.pop();
    }

    this.emitState();
  }

  createFood() {
    const occupied = new Set(this.snake.map((segment) => String(segment.x) + ":" + String(segment.y)));

    let candidate = null;
    do {
      candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (occupied.has(String(candidate.x) + ":" + String(candidate.y)));

    return candidate;
  }

  endGame() {
    this.alive = false;
    this.paused = false;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
      this.emitScore();
    }

    this.emitState();
  }

  renderOverlay(headline, detail) {
    const ctx = this.ctx;

    ctx.fillStyle = "rgba(10, 28, 39, 0.55)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "700 42px Space Grotesk";
    ctx.fillText(headline, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

    ctx.font = "500 19px Space Grotesk";
    ctx.fillText(detail, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 28);
  }

  emitScore() {
    this.listeners.score({
      score: this.score,
      bestScore: this.bestScore,
    });
  }

  emitState() {
    this.listeners.state(this.getState());
  }

  loadBestScore() {
    const raw = window.localStorage.getItem(STORAGE_KEY_BEST_SCORE);
    if (!raw) {
      return 0;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  saveBestScore() {
    window.localStorage.setItem(STORAGE_KEY_BEST_SCORE, String(this.bestScore));
  }
}
