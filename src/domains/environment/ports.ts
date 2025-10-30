/**
 * Environment Domain - Ports (Interfaces)
 * Handles biomes, weather, and visual effects
 */

import { Biome } from '../../shared/types';

// Biome management
export interface BiomePort {
  getCurrentBiome(): Biome;
  setBiome(biomeId: string): void;
  getAvailableBiomes(): Biome[];
  updateBiome(deltaTime: number): void;
}

// Weather system
export interface WeatherPort {
  getCurrentWeather(): WeatherState;
  setWeather(weather: WeatherType): void;
  updateWeather(deltaTime: number): void;
  getWeatherIntensity(): number;
}

// Particle system for visual effects
export interface ParticleSystemPort {
  addParticles(type: ParticleType, count: number, origin: { x: number; y: number }): void;
  updateParticles(deltaTime: number): void;
  getParticles(): EnvironmentParticle[];
  clearParticles(): void;
}

// Background rendering
export interface BackgroundPort {
  renderBackground(ctx: CanvasRenderingContext2D, time: number): void;
  renderParallax(ctx: CanvasRenderingContext2D, speed: number): void;
  renderAtmosphere(ctx: CanvasRenderingContext2D): void;
}

// Types
export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'aurora';

export interface WeatherState {
  type: WeatherType;
  intensity: number;
  duration: number;
  timeRemaining: number;
}

export type ParticleType = 'rain' | 'snow' | 'fog' | 'sparkle' | 'explosion' | 'trail' | 'aurora' | 'bubbles' | 'leaves';

export interface EnvironmentParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  alpha: number;
}