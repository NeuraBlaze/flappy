/**
 * Core game types and interfaces
 */

// Game state management
export const GameState = {
  MENU: "menu",
  RUN: "run", 
  GAMEOVER: "gameover",
  PAUSE: "pause",
} as const;

export type GameStateType = typeof GameState[keyof typeof GameState];

// Performance and optimization types
export interface PerformanceConfig {
  maxParticles: number;
  maxPowerUps: number;
  maxCoins: number;
  reducedEffects: boolean;
  simplifiedRendering: boolean;
  weatherIntensity: number;
}

export type PerformanceLevel = 'high' | 'medium' | 'low' | 'minimal';

// Biome system types
export interface Biome {
  id: 'forest' | 'city' | 'space' | 'ocean'; 
  name: string;
  backgroundColors: string[];
  skyGradient: {
    top: string;
    bottom: string;
  };
  groundColor: string;
  pipeColor: string;
  obstacleTypes: ('pipe' | 'tree' | 'building' | 'asteroid' | 'satellite' | 'coral' | 'shipwreck')[];
  weatherTypes: ('clear' | 'rain' | 'snow' | 'fog' | 'aurora' | 'current' | 'storm')[];
  powerUpBonus: number; // power-up spawn rate multiplier
  musicTheme: string;
  particleColor: string;
}

// Animation and sprite types
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimationData {
  frames: SpriteFrame[];
  frameRate: number;
  loop: boolean;
}

// Particle system types
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'rain' | 'snow' | 'fog' | 'sparkle' | 'explosion' | 'trail' | 'aurora';
}

// Game object types
export interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow';
  collected: boolean;
  animTime: number;
}

export interface Coin {
  x: number;
  y: number;
  collected: boolean;
  animTime: number;
  value: number;
}

export interface BackgroundObj {
  x: number;
  y: number;
  type: 'cloud' | 'star';
  size: number;
  speed: number;
}

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

// Speed settings
export interface SpeedSettings {
  normal: number;
  slowMotion: number;
  rainbow: number;
  super: number;
  godMode: number;
}

// Error tracking
export interface GameError {
  timestamp: string;
  error: string;
  birdSkin: string;
  gameState: string;
  score: number;
  biome: string;
  abilities: any;
  stackTrace?: string;
}