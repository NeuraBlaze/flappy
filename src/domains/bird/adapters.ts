/**
 * Bird Domain - Adapters (Implementations)
 * Concrete implementations of bird ports
 */

import { BirdPort, BirdSkinPort, BirdAbilitiesPort } from './ports';
import { Bird } from './models';
import { BirdSkin, BirdAbilities } from '../../shared/types';

// Bird adapter implementation
export class BirdAdapter implements BirdPort {
  private bird: Bird;

  constructor(skin: BirdSkin, abilities: BirdAbilities) {
    this.bird = new Bird(skin, abilities);
  }

  getPosition(): { x: number; y: number } {
    return this.bird.getPosition();
  }

  setPosition(x: number, y: number): void {
    this.bird.setPosition(x, y);
  }

  getVelocity(): { vx: number; vy: number } {
    return this.bird.getVelocity();
  }

  setVelocity(vx: number, vy: number): void {
    this.bird.setVelocity(vx, vy);
  }

  jump(): void {
    this.bird.jump();
  }

  applyGravity(): void {
    this.bird.applyGravity();
  }

  update(deltaTime: number): void {
    this.bird.update(deltaTime);
  }

  reset(): void {
    this.bird.reset();
  }

  // Additional methods for accessing bird properties
  getBird(): Bird {
    return this.bird;
  }

  getCollisionCircle() {
    return this.bird.getCollisionCircle();
  }

  getBounds() {
    return this.bird.getBounds();
  }
}

// Bird skin management adapter
export class BirdSkinAdapter implements BirdSkinPort {
  private currentSkin: BirdSkin;
  private availableSkins: BirdSkin[];
  private unlockedSkins: Set<string>;

  constructor(skins: BirdSkin[], defaultSkinId: string) {
    this.availableSkins = skins;
    this.unlockedSkins = new Set(['default']); // Default skin always unlocked
    this.currentSkin = skins.find(s => s.id === defaultSkinId) || skins[0];
  }

  getCurrentSkin(): BirdSkin {
    return this.currentSkin;
  }

  setSkin(skinId: string): void {
    if (this.isUnlocked(skinId)) {
      const skin = this.availableSkins.find(s => s.id === skinId);
      if (skin) {
        this.currentSkin = skin;
      }
    }
  }

  getAvailableSkins(): BirdSkin[] {
    return this.availableSkins;
  }

  unlockSkin(skinId: string): void {
    this.unlockedSkins.add(skinId);
  }

  isUnlocked(skinId: string): boolean {
    return this.unlockedSkins.has(skinId);
  }

  getUnlockedSkins(): BirdSkin[] {
    return this.availableSkins.filter(skin => this.isUnlocked(skin.id));
  }
}

// Bird abilities adapter
export class BirdAbilitiesAdapter implements BirdAbilitiesPort {
  private abilities: BirdAbilities;
  private shieldActive: boolean = false;
  private shieldEndTime: number = 0;
  private speedModifier: number = 1;

  constructor(abilities: BirdAbilities) {
    this.abilities = { ...abilities };
  }

  getAbilities(): BirdAbilities {
    return { ...this.abilities };
  }

  hasShield(): boolean {
    return this.shieldActive && Date.now() < this.shieldEndTime;
  }

  activateShield(duration: number): void {
    this.shieldActive = true;
    this.shieldEndTime = Date.now() + duration * 1000;
  }

  deactivateShield(): void {
    this.shieldActive = false;
    this.shieldEndTime = 0;
  }

  applySpeedModifier(modifier: number): void {
    this.speedModifier = modifier;
  }

  resetModifiers(): void {
    this.speedModifier = 1;
    this.deactivateShield();
  }

  getSpeedModifier(): number {
    return this.speedModifier;
  }

  // Update abilities based on current modifiers
  getEffectiveAbilities(): BirdAbilities {
    return {
      ...this.abilities,
      jumpPower: (this.abilities.jumpPower || 1) * this.speedModifier
    };
  }
}