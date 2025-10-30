/**
 * Game Domain - Adapters (Implementations)
 * Concrete implementations of game ports
 */

import { 
  GameStatePort, 
  GameLoopPort, 
  CollisionPort, 
  GameObjectsPort, 
  InputPort,
  CollisionResult,
  PowerUpCollision,
  CoinCollision
} from './ports';
import { GameStateModel, Pipe, PowerUp, Coin, Particle } from './models';
import { GameStateType } from '../../shared/types';
import { circleRectIntersect, circleIntersect } from '../../shared/utils';
import { WORLD_CONFIG, PHYSICS_CONFIG } from '../../shared/constants';

// Game state adapter
export class GameStateAdapter implements GameStatePort {
  private gameState: GameStateModel;

  constructor() {
    this.gameState = new GameStateModel();
  }

  getCurrentState(): GameStateType {
    return this.gameState.getCurrentState();
  }

  setState(state: GameStateType): void {
    this.gameState.setState(state);
  }

  isPlaying(): boolean {
    return this.gameState.isPlaying();
  }

  isPaused(): boolean {
    return this.gameState.isPaused();
  }

  isGameOver(): boolean {
    return this.gameState.isGameOver();
  }

  startGame(): void {
    this.gameState.setState('run');
  }

  pauseGame(): void {
    if (this.gameState.isPlaying()) {
      this.gameState.setState('pause');
    }
  }

  resumeGame(): void {
    if (this.gameState.isPaused()) {
      this.gameState.setState('run');
    }
  }

  endGame(): void {
    this.gameState.setState('gameover');
  }

  restartGame(): void {
    this.gameState.reset();
    this.gameState.setState('run');
  }

  getGameState(): GameStateModel {
    return this.gameState;
  }
}

// Game loop adapter
export class GameLoopAdapter implements GameLoopPort {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private targetFPS: number = PHYSICS_CONFIG.TARGET_FPS;
  private currentFPS: number = 0;
  private deltaTime: number = 0;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private updateCallback?: (deltaTime: number) => void;

  setUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  start(): void {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
  }

  getCurrentFPS(): number {
    return this.currentFPS;
  }

  getDeltaTime(): number {
    return this.deltaTime;
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Calculate FPS
    this.currentFPS = 1 / this.deltaTime;

    // Fixed time step for consistent physics
    const fixedDeltaTime = 1 / this.targetFPS;

    if (!this.isPaused && this.updateCallback) {
      this.updateCallback(fixedDeltaTime);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
}

// Collision detection adapter
export class CollisionAdapter implements CollisionPort {
  private pipes: Pipe[] = [];
  private powerUps: PowerUp[] = [];
  private coins: Coin[] = [];

  setPipes(pipes: Pipe[]): void {
    this.pipes = pipes;
  }

  setPowerUps(powerUps: PowerUp[]): void {
    this.powerUps = powerUps;
  }

  setCoins(coins: Coin[]): void {
    this.coins = coins;
  }

  checkBirdCollisions(birdPosition: { x: number; y: number; radius: number }): CollisionResult {
    // Check ground collision
    if (birdPosition.y + birdPosition.radius >= WORLD_CONFIG.CANVAS_HEIGHT - WORLD_CONFIG.GROUND_HEIGHT) {
      return {
        hasCollision: true,
        type: 'ground',
        position: { x: birdPosition.x, y: WORLD_CONFIG.CANVAS_HEIGHT - WORLD_CONFIG.GROUND_HEIGHT }
      };
    }

    // Check ceiling collision
    if (birdPosition.y - birdPosition.radius <= 0) {
      return {
        hasCollision: true,
        type: 'ceiling',
        position: { x: birdPosition.x, y: 0 }
      };
    }

    // Check pipe collisions
    for (const pipe of this.pipes) {
      // Check collision with top pipe
      if (circleRectIntersect(birdPosition, pipe.getTopBounds())) {
        return {
          hasCollision: true,
          type: 'pipe',
          position: { x: pipe.x, y: pipe.topHeight }
        };
      }

      // Check collision with bottom pipe
      if (circleRectIntersect(birdPosition, pipe.getBottomBounds())) {
        return {
          hasCollision: true,
          type: 'pipe',
          position: { x: pipe.x, y: pipe.bottomY }
        };
      }
    }

    return { hasCollision: false, type: 'none' };
  }

  checkPowerUpCollisions(birdPosition: { x: number; y: number; radius: number }): PowerUpCollision[] {
    const collisions: PowerUpCollision[] = [];

    this.powerUps.forEach((powerUp, index) => {
      if (!powerUp.collected && circleIntersect(birdPosition, powerUp.getCollisionCircle())) {
        collisions.push({
          type: powerUp.type,
          position: { x: powerUp.x, y: powerUp.y },
          index
        });
      }
    });

    return collisions;
  }

  checkCoinCollisions(birdPosition: { x: number; y: number; radius: number }): CoinCollision[] {
    const collisions: CoinCollision[] = [];

    this.coins.forEach((coin, index) => {
      if (!coin.collected && circleIntersect(birdPosition, coin.getCollisionCircle())) {
        collisions.push({
          value: coin.value,
          position: { x: coin.x, y: coin.y },
          index
        });
      }
    });

    return collisions;
  }
}

// Game objects management adapter
export class GameObjectsAdapter implements GameObjectsPort {
  private pipes: Pipe[] = [];
  private powerUps: PowerUp[] = [];
  private coins: Coin[] = [];
  private particles: Particle[] = [];
  private lastPipeSpawn: number = 0;
  private gameSpeed: number = 2;

  updatePipes(_deltaTime: number): void {
    // Update existing pipes
    this.pipes.forEach(pipe => pipe.update(this.gameSpeed));
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => !pipe.isOffScreen());
  }

  updatePowerUps(deltaTime: number): void {
    this.powerUps.forEach(powerUp => powerUp.update(this.gameSpeed, deltaTime));
    this.powerUps = this.powerUps.filter(powerUp => !powerUp.isOffScreen() && !powerUp.collected);
  }

  updateCoins(deltaTime: number): void {
    this.coins.forEach(coin => coin.update(this.gameSpeed, deltaTime));
    this.coins = this.coins.filter(coin => !coin.isOffScreen() && !coin.collected);
  }

  updateParticles(deltaTime: number): void {
    this.particles.forEach(particle => particle.update(deltaTime));
    this.particles = this.particles.filter(particle => particle.isAlive());
  }

  spawnPipe(): void {
    const now = Date.now();
    if (now - this.lastPipeSpawn > WORLD_CONFIG.PIPE_SPAWN_INTERVAL) {
      const gapSize = WORLD_CONFIG.PIPE_GAP;
      const minHeight = 50;
      const maxHeight = WORLD_CONFIG.CANVAS_HEIGHT - WORLD_CONFIG.GROUND_HEIGHT - gapSize - minHeight;
      
      const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
      const bottomY = topHeight + gapSize;
      
      this.pipes.push(new Pipe(WORLD_CONFIG.CANVAS_WIDTH, topHeight, bottomY));
      this.lastPipeSpawn = now;
    }
  }

  spawnPowerUp(): void {
    if (this.powerUps.length < 3 && Math.random() < 0.001) {
      const types: PowerUp['type'][] = ['shield', 'slow', 'score', 'magnet', 'double', 'rainbow'];
      const type = types[Math.floor(Math.random() * types.length)];
      const x = WORLD_CONFIG.CANVAS_WIDTH + 50;
      const y = 100 + Math.random() * (WORLD_CONFIG.CANVAS_HEIGHT - WORLD_CONFIG.GROUND_HEIGHT - 200);
      
      this.powerUps.push(new PowerUp(x, y, type));
    }
  }

  spawnCoin(): void {
    if (this.coins.length < 5 && Math.random() < 0.002) {
      const x = WORLD_CONFIG.CANVAS_WIDTH + 50;
      const y = 100 + Math.random() * (WORLD_CONFIG.CANVAS_HEIGHT - WORLD_CONFIG.GROUND_HEIGHT - 200);
      
      this.coins.push(new Coin(x, y));
    }
  }

  clearAllObjects(): void {
    this.pipes = [];
    this.powerUps = [];
    this.coins = [];
    this.particles = [];
  }

  // Getters
  getPipes(): Pipe[] {
    return this.pipes;
  }

  getPowerUps(): PowerUp[] {
    return this.powerUps;
  }

  getCoins(): Coin[] {
    return this.coins;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
  }

  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  collectPowerUp(index: number): void {
    if (this.powerUps[index]) {
      this.powerUps[index].collected = true;
    }
  }

  collectCoin(index: number): void {
    if (this.coins[index]) {
      this.coins[index].collected = true;
    }
  }
}

// Input handling adapter
export class InputAdapter implements InputPort {
  private keyHandlers: Map<string, () => void> = new Map();
  private jumpHandler: (() => void) | null = null;
  private pressedKeys: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
  }

  registerJumpHandler(handler: () => void): void {
    this.jumpHandler = handler;
  }

  registerKeyHandler(key: string, handler: () => void): void {
    this.keyHandlers.set(key.toLowerCase(), handler);
  }

  unregisterHandlers(): void {
    this.keyHandlers.clear();
    this.jumpHandler = null;
  }

  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Mouse/touch events for jumping
    document.addEventListener('click', this.handleJump);
    document.addEventListener('touchstart', this.handleJump);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.pressedKeys.add(key);
    
    // Handle jump keys
    if (key === ' ' || key === 'spacebar' || key === 'arrowup' || key === 'w') {
      e.preventDefault();
      this.handleJump();
      return;
    }
    
    // Handle other registered keys
    const handler = this.keyHandlers.get(key);
    if (handler) {
      e.preventDefault();
      handler();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.pressedKeys.delete(key);
  };

  private handleJump = (): void => {
    if (this.jumpHandler) {
      this.jumpHandler();
    }
  };

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('click', this.handleJump);
    document.removeEventListener('touchstart', this.handleJump);
  }
}