/**
 * Environment Domain - Models
 * Core environment entities and effects
 */

import { Biome } from '../../shared/types';
import { WeatherType, WeatherState, ParticleType, EnvironmentParticle } from './ports';

// Environment particle model
export class EnvParticle implements EnvironmentParticle {
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public life: number,
    public maxLife: number,
    public color: string,
    public size: number,
    public type: ParticleType,
    public alpha: number = 1
  ) {}

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    this.alpha = Math.max(0, this.life / this.maxLife);

    // Apply gravity for certain particle types
    if (this.type === 'rain' || this.type === 'snow') {
      this.vy += (this.type === 'rain' ? 200 : 50) * deltaTime;
    }

    // Apply wind effects
    if (this.type === 'leaves' || this.type === 'fog') {
      this.vx += Math.sin(Date.now() * 0.001 + this.x * 0.01) * 10 * deltaTime;
    }
  }

  isAlive(): boolean {
    return this.life > 0;
  }
}

// Weather system model
export class Weather {
  private currentWeather: WeatherState;

  constructor(initialWeather: WeatherType = 'clear') {
    this.currentWeather = {
      type: initialWeather,
      intensity: 0.5,
      duration: 30000, // 30 seconds
      timeRemaining: 30000
    };
  }

  getCurrentWeather(): WeatherState {
    return { ...this.currentWeather };
  }

  setWeather(type: WeatherType, intensity: number = 0.5, duration: number = 30000): void {
    this.currentWeather = {
      type,
      intensity,
      duration,
      timeRemaining: duration
    };
  }

  update(deltaTime: number): void {
    this.currentWeather.timeRemaining -= deltaTime * 1000;
    
    // Fade out weather near the end
    if (this.currentWeather.timeRemaining < 5000) {
      this.currentWeather.intensity *= 0.99;
    }

    // Change to clear weather when time runs out
    if (this.currentWeather.timeRemaining <= 0) {
      this.setWeather('clear');
    }
  }

  getIntensity(): number {
    return this.currentWeather.intensity;
  }
}

// Biome model with enhanced visual properties
export class BiomeModel {
  private currentBiome: Biome;
  private transitionProgress: number = 1;
  private targetBiome: Biome | null = null;

  constructor(initialBiome: Biome) {
    this.currentBiome = initialBiome;
  }

  getCurrentBiome(): Biome {
    return this.currentBiome;
  }

  setBiome(biome: Biome): void {
    if (biome.id !== this.currentBiome.id) {
      this.targetBiome = biome;
      this.transitionProgress = 0;
    }
  }

  update(deltaTime: number): void {
    if (this.targetBiome && this.transitionProgress < 1) {
      this.transitionProgress += deltaTime * 0.5; // 2 second transition
      
      if (this.transitionProgress >= 1) {
        this.currentBiome = this.targetBiome;
        this.targetBiome = null;
        this.transitionProgress = 1;
      }
    }
  }

  getTransitionProgress(): number {
    return this.transitionProgress;
  }

  getTargetBiome(): Biome | null {
    return this.targetBiome;
  }

  // Get interpolated colors during transition
  getInterpolatedColors() {
    if (!this.targetBiome || this.transitionProgress >= 1) {
      return {
        skyGradient: this.currentBiome.skyGradient,
        groundColor: this.currentBiome.groundColor,
        pipeColor: this.currentBiome.pipeColor
      };
    }

    const t = this.transitionProgress;
    return {
      skyGradient: {
        top: this.interpolateColor(this.currentBiome.skyGradient.top, this.targetBiome.skyGradient.top, t),
        bottom: this.interpolateColor(this.currentBiome.skyGradient.bottom, this.targetBiome.skyGradient.bottom, t)
      },
      groundColor: this.interpolateColor(this.currentBiome.groundColor, this.targetBiome.groundColor, t),
      pipeColor: this.interpolateColor(this.currentBiome.pipeColor, this.targetBiome.pipeColor, t)
    };
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    // Simple color interpolation (could be enhanced)
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Background element model
export class BackgroundElement {
  constructor(
    public x: number,
    public y: number,
    public type: 'cloud' | 'star' | 'mountain' | 'tree' | 'coral',
    public size: number,
    public speed: number,
    public color: string = '#FFFFFF',
    public alpha: number = 1
  ) {}

  update(deltaTime: number, gameSpeed: number): void {
    this.x -= this.speed * gameSpeed * deltaTime;
  }

  isOffScreen(_canvasWidth: number): boolean {
    return this.x + this.size < 0;
  }
}