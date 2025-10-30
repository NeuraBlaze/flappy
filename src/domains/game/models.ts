/**
 * Game Domain - Models
 * Core game entities and value objects
 */

import { GameStateType, GameState } from '../../shared/types';
import { WORLD_CONFIG } from '../../shared/constants';

// Game state model
export class GameStateModel {
  private currentState: GameStateType = GameState.MENU;
  private score: number = 0;
  private lives: number = 1;
  private level: number = 1;

  getCurrentState(): GameStateType {
    return this.currentState;
  }

  setState(state: GameStateType): void {
    this.currentState = state;
  }

  isPlaying(): boolean {
    return this.currentState === GameState.RUN;
  }

  isPaused(): boolean {
    return this.currentState === GameState.PAUSE;
  }

  isGameOver(): boolean {
    return this.currentState === GameState.GAMEOVER;
  }

  getScore(): number {
    return this.score;
  }

  setScore(score: number): void {
    this.score = Math.max(0, score);
  }

  incrementScore(points: number = 1): void {
    this.score += points;
  }

  getLives(): number {
    return this.lives;
  }

  setLives(lives: number): void {
    this.lives = Math.max(0, lives);
  }

  loseLife(): boolean {
    this.lives--;
    return this.lives <= 0;
  }

  getLevel(): number {
    return this.level;
  }

  setLevel(level: number): void {
    this.level = Math.max(1, level);
  }

  reset(): void {
    this.currentState = GameState.MENU;
    this.score = 0;
    this.lives = 1;
    this.level = 1;
  }
}

// Pipe model
export class Pipe {
  constructor(
    public x: number,
    public topHeight: number,
    public bottomY: number,
    public passed: boolean = false
  ) {}

  update(speed: number): void {
    this.x -= speed;
  }

  isOffScreen(): boolean {
    return this.x + WORLD_CONFIG.PIPE_WIDTH < 0;
  }

  getTopBounds() {
    return {
      x: this.x,
      y: 0,
      width: WORLD_CONFIG.PIPE_WIDTH,
      height: this.topHeight
    };
  }

  getBottomBounds() {
    return {
      x: this.x,
      y: this.bottomY,
      width: WORLD_CONFIG.PIPE_WIDTH,
      height: WORLD_CONFIG.CANVAS_HEIGHT - this.bottomY
    };
  }

  canScore(birdX: number): boolean {
    return !this.passed && birdX > this.x + WORLD_CONFIG.PIPE_WIDTH;
  }

  markAsPassed(): void {
    this.passed = true;
  }
}

// Power-up model
export class PowerUp {
  constructor(
    public x: number,
    public y: number,
    public type: 'shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow',
    public collected: boolean = false,
    public animTime: number = 0
  ) {}

  update(speed: number, deltaTime: number): void {
    this.x -= speed;
    this.animTime += deltaTime;
  }

  isOffScreen(): boolean {
    return this.x < -50;
  }

  getBounds() {
    return {
      x: this.x - 20,
      y: this.y - 20,
      width: 40,
      height: 40
    };
  }

  getCollisionCircle() {
    return {
      x: this.x,
      y: this.y,
      radius: 20
    };
  }
}

// Coin model
export class Coin {
  constructor(
    public x: number,
    public y: number,
    public value: number = 1,
    public collected: boolean = false,
    public animTime: number = 0
  ) {}

  update(speed: number, deltaTime: number): void {
    this.x -= speed;
    this.animTime += deltaTime;
  }

  isOffScreen(): boolean {
    return this.x < -30;
  }

  getBounds() {
    return {
      x: this.x - 15,
      y: this.y - 15,
      width: 30,
      height: 30
    };
  }

  getCollisionCircle() {
    return {
      x: this.x,
      y: this.y,
      radius: 15
    };
  }
}

// Particle model
export class Particle {
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public life: number,
    public maxLife: number,
    public color: string,
    public size: number,
    public type: 'rain' | 'snow' | 'fog' | 'sparkle' | 'explosion' | 'trail' | 'aurora' = 'sparkle'
  ) {}

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    
    // Apply gravity for certain particle types
    if (this.type === 'explosion' || this.type === 'sparkle') {
      this.vy += 0.1 * deltaTime;
    }
  }

  isAlive(): boolean {
    return this.life > 0;
  }

  getAlpha(): number {
    return Math.max(0, this.life / this.maxLife);
  }
}