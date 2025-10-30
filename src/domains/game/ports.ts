/**
 * Game Domain - Ports (Interfaces)
 * Defines contracts for core game operations
 */

import { GameStateType } from '../../shared/types';

// Core game state management
export interface GameStatePort {
  getCurrentState(): GameStateType;
  setState(state: GameStateType): void;
  isPlaying(): boolean;
  isPaused(): boolean;
  isGameOver(): boolean;
  startGame(): void;
  pauseGame(): void;
  resumeGame(): void;
  endGame(): void;
  restartGame(): void;
}

// Game loop management
export interface GameLoopPort {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  setTargetFPS(fps: number): void;
  getCurrentFPS(): number;
  getDeltaTime(): number;
}

// Collision detection
export interface CollisionPort {
  checkBirdCollisions(birdPosition: { x: number; y: number; radius: number }): CollisionResult;
  checkPowerUpCollisions(birdPosition: { x: number; y: number; radius: number }): PowerUpCollision[];
  checkCoinCollisions(birdPosition: { x: number; y: number; radius: number }): CoinCollision[];
}

// Game objects management
export interface GameObjectsPort {
  updatePipes(deltaTime: number): void;
  updatePowerUps(deltaTime: number): void;
  updateCoins(deltaTime: number): void;
  updateParticles(deltaTime: number): void;
  spawnPipe(): void;
  spawnPowerUp(): void;
  spawnCoin(): void;
  clearAllObjects(): void;
}

// Input handling
export interface InputPort {
  registerJumpHandler(handler: () => void): void;
  registerKeyHandler(key: string, handler: () => void): void;
  unregisterHandlers(): void;
  isKeyPressed(key: string): boolean;
}

// Types for collision results
export interface CollisionResult {
  hasCollision: boolean;
  type: 'pipe' | 'ground' | 'ceiling' | 'none';
  position?: { x: number; y: number };
}

export interface PowerUpCollision {
  type: 'shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow';
  position: { x: number; y: number };
  index: number;
}

export interface CoinCollision {
  value: number;
  position: { x: number; y: number };
  index: number;
}