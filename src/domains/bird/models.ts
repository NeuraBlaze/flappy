/**
 * Bird Domain - Models
 * Core bird entity and value objects
 */

import { BirdSkin, BirdAbilities } from '../../shared/types';
import { PHYSICS_CONFIG } from '../../shared/constants';

export class Bird {
  private x: number = 100;
  private y: number = 300;
  private vx: number = 0;
  private vy: number = 0;
  private radius: number = PHYSICS_CONFIG.BIRD_RADIUS;
  private abilities: BirdAbilities;
  private skin: BirdSkin;

  constructor(skin: BirdSkin, abilities: BirdAbilities) {
    this.skin = skin;
    this.abilities = abilities;
  }

  // Position management
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  // Velocity management
  getVelocity(): { vx: number; vy: number } {
    return { vx: this.vx, vy: this.vy };
  }

  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  // Physics
  jump(): void {
    this.vy = PHYSICS_CONFIG.JUMP_FORCE * (this.abilities.jumpPower || 1);
  }

  applyGravity(): void {
    this.vy += PHYSICS_CONFIG.GRAVITY;
    
    // Apply max velocity limit
    if (this.vy > PHYSICS_CONFIG.MAX_VELOCITY) {
      this.vy = PHYSICS_CONFIG.MAX_VELOCITY;
    }
  }

  update(deltaTime: number): void {
    // Apply gravity
    this.applyGravity();
    
    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  // Getters
  getRadius(): number {
    return this.radius;
  }

  getSkin(): BirdSkin {
    return this.skin;
  }

  setSkin(skin: BirdSkin): void {
    this.skin = skin;
  }

  getAbilities(): BirdAbilities {
    return this.abilities;
  }

  setAbilities(abilities: BirdAbilities): void {
    this.abilities = abilities;
  }

  // Reset to initial state
  reset(): void {
    this.x = 100;
    this.y = 300;
    this.vx = 0;
    this.vy = 0;
  }

  // Collision bounds
  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  // Get collision circle
  getCollisionCircle() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }
}