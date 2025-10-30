/**
 * Environment Domain - Adapters (Implementations)
 * Concrete implementations for environmental systems
 */

import { 
  BiomePort, 
  WeatherPort, 
  ParticleSystemPort, 
  BackgroundPort,
  WeatherType,
  WeatherState,
  ParticleType,
  EnvironmentParticle
} from './ports';
import { EnvParticle, Weather, BiomeModel, BackgroundElement } from './models';
import { Biome } from '../../shared/types';
import { randomBetween, randomIntBetween } from '../../shared/utils';
import { getPerformanceConfig } from '../../shared/utils';

// Biome management adapter
export class BiomeAdapter implements BiomePort {
  private biomeModel: BiomeModel;
  private availableBiomes: Biome[];

  constructor(biomes: Biome[], initialBiome: Biome) {
    this.availableBiomes = biomes;
    this.biomeModel = new BiomeModel(initialBiome);
  }

  getCurrentBiome(): Biome {
    return this.biomeModel.getCurrentBiome();
  }

  setBiome(biomeId: string): void {
    const biome = this.availableBiomes.find(b => b.id === biomeId);
    if (biome) {
      this.biomeModel.setBiome(biome);
    }
  }

  getAvailableBiomes(): Biome[] {
    return this.availableBiomes;
  }

  updateBiome(deltaTime: number): void {
    this.biomeModel.update(deltaTime);
  }

  getBiomeModel(): BiomeModel {
    return this.biomeModel;
  }
}

// Weather system adapter
export class WeatherAdapter implements WeatherPort {
  private weather: Weather;

  constructor(initialWeather: WeatherType = 'clear') {
    this.weather = new Weather(initialWeather);
  }

  getCurrentWeather(): WeatherState {
    return this.weather.getCurrentWeather();
  }

  setWeather(weather: WeatherType): void {
    this.weather.setWeather(weather);
  }

  updateWeather(deltaTime: number): void {
    this.weather.update(deltaTime);
  }

  getWeatherIntensity(): number {
    return this.weather.getIntensity();
  }
}

// Particle system adapter
export class ParticleSystemAdapter implements ParticleSystemPort {
  private particles: EnvParticle[] = [];
  private maxParticles: number;

  constructor() {
    this.maxParticles = getPerformanceConfig().maxParticles;
  }

  addParticles(type: ParticleType, count: number, origin: { x: number; y: number }): void {
    const adjustedCount = Math.min(count, this.maxParticles - this.particles.length);
    
    for (let i = 0; i < adjustedCount; i++) {
      const particle = this.createParticle(type, origin);
      this.particles.push(particle);
    }
  }

  private createParticle(type: ParticleType, origin: { x: number; y: number }): EnvParticle {
    switch (type) {
      case 'rain':
        return new EnvParticle(
          origin.x + randomBetween(-50, 50),
          origin.y - randomBetween(0, 100),
          randomBetween(-20, 20),
          randomBetween(300, 500),
          randomBetween(2, 4),
          3,
          '#87CEEB',
          randomBetween(1, 3),
          'rain'
        );
      
      case 'snow':
        return new EnvParticle(
          origin.x + randomBetween(-100, 100),
          origin.y - randomBetween(0, 200),
          randomBetween(-30, 30),
          randomBetween(50, 150),
          randomBetween(5, 10),
          8,
          '#FFFFFF',
          randomBetween(2, 6),
          'snow'
        );
      
      case 'sparkle':
        return new EnvParticle(
          origin.x + randomBetween(-20, 20),
          origin.y + randomBetween(-20, 20),
          randomBetween(-50, 50),
          randomBetween(-100, 50),
          randomBetween(1, 2),
          1.5,
          '#FFD700',
          randomBetween(1, 4),
          'sparkle'
        );
      
      case 'explosion':
        const angle = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(100, 300);
        return new EnvParticle(
          origin.x,
          origin.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          randomBetween(0.5, 1.5),
          1,
          `hsl(${randomIntBetween(0, 60)}, 100%, 60%)`,
          randomBetween(2, 8),
          'explosion'
        );
      
      case 'bubbles':
        return new EnvParticle(
          origin.x + randomBetween(-30, 30),
          origin.y + randomBetween(-30, 30),
          randomBetween(-20, 20),
          randomBetween(-100, -50),
          randomBetween(3, 8),
          6,
          'rgba(173, 216, 230, 0.7)',
          randomBetween(3, 12),
          'bubbles'
        );
      
      case 'aurora':
        return new EnvParticle(
          origin.x + randomBetween(-200, 200),
          origin.y + randomBetween(-50, 50),
          randomBetween(-10, 10),
          randomBetween(-20, 20),
          randomBetween(8, 15),
          12,
          `hsl(${randomIntBetween(120, 300)}, 70%, 60%)`,
          randomBetween(5, 15),
          'aurora'
        );
      
      default:
        return new EnvParticle(
          origin.x,
          origin.y,
          0,
          0,
          1,
          1,
          '#FFFFFF',
          2,
          'sparkle'
        );
    }
  }

  updateParticles(deltaTime: number): void {
    // Update existing particles
    this.particles.forEach(particle => particle.update(deltaTime));
    
    // Remove dead particles
    this.particles = this.particles.filter(particle => particle.isAlive());
  }

  getParticles(): EnvironmentParticle[] {
    return this.particles;
  }

  clearParticles(): void {
    this.particles = [];
  }
}

// Background rendering adapter
export class BackgroundAdapter implements BackgroundPort {
  private backgroundElements: BackgroundElement[] = [];
  private lastSpawnTime: number = 0;

  renderBackground(ctx: CanvasRenderingContext2D, time: number): void {
    const canvas = ctx.canvas;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#98FB98'); // Light green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animate background elements
    this.spawnBackgroundElements(canvas.width, canvas.height, time);
    this.updateBackgroundElements(0.016, 2); // Approximate 60fps, speed 2
    this.renderBackgroundElements(ctx);
  }

  renderParallax(ctx: CanvasRenderingContext2D, speed: number): void {
    // Simple parallax clouds
    const time = Date.now() * 0.0001;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FFFFFF';
    
    for (let i = 0; i < 5; i++) {
      const x = (time * (20 + i * 10) * speed) % (ctx.canvas.width + 100) - 100;
      const y = 50 + i * 30 + Math.sin(time + i) * 20;
      this.drawCloud(ctx, x, y, 40 + i * 10);
    }
    
    ctx.restore();
  }

  renderAtmosphere(ctx: CanvasRenderingContext2D): void {
    // Add atmospheric effects
    const gradient = ctx.createRadialGradient(
      ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
      ctx.canvas.width / 2, ctx.canvas.height / 2, Math.max(ctx.canvas.width, ctx.canvas.height)
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 100, 200, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private spawnBackgroundElements(canvasWidth: number, canvasHeight: number, time: number): void {
    if (time - this.lastSpawnTime > 3000 && this.backgroundElements.length < 8) {
      this.backgroundElements.push(new BackgroundElement(
        canvasWidth + 50,
        randomBetween(50, canvasHeight - 150),
        'cloud',
        randomBetween(30, 80),
        randomBetween(10, 30),
        `rgba(255, 255, 255, ${randomBetween(0.3, 0.8)})`
      ));
      this.lastSpawnTime = time;
    }
  }

  private updateBackgroundElements(deltaTime: number, gameSpeed: number): void {
    this.backgroundElements.forEach(element => element.update(deltaTime, gameSpeed));
    this.backgroundElements = this.backgroundElements.filter(element => !element.isOffScreen(800));
  }

  private renderBackgroundElements(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    this.backgroundElements.forEach(element => {
      ctx.globalAlpha = element.alpha;
      ctx.fillStyle = element.color;
      
      if (element.type === 'cloud') {
        this.drawCloud(ctx, element.x, element.y, element.size);
      }
    });
    
    ctx.restore();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw cloud using circles
    const circles = [
      { x: 0, y: 0, r: size * 0.6 },
      { x: size * 0.4, y: 0, r: size * 0.5 },
      { x: -size * 0.4, y: 0, r: size * 0.5 },
      { x: 0, y: -size * 0.3, r: size * 0.4 },
    ];
    
    ctx.beginPath();
    circles.forEach(circle => {
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    });
    ctx.fill();
    
    ctx.restore();
  }
}