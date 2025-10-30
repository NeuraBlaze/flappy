/**
 * Bird Domain - Ports (Interfaces)
 * Defines contracts for bird-related operations
 */

import { BirdSkin, BirdAbilities } from '../../shared/types';

// Bird state management port
export interface BirdPort {
  getPosition(): { x: number; y: number };
  setPosition(x: number, y: number): void;
  getVelocity(): { vx: number; vy: number };
  setVelocity(vx: number, vy: number): void;
  jump(): void;
  applyGravity(): void;
  update(deltaTime: number): void;
  reset(): void;
}

// Bird skin management port
export interface BirdSkinPort {
  getCurrentSkin(): BirdSkin;
  setSkin(skinId: string): void;
  getAvailableSkins(): BirdSkin[];
  unlockSkin(skinId: string): void;
  isUnlocked(skinId: string): boolean;
}

// Bird abilities port
export interface BirdAbilitiesPort {
  getAbilities(): BirdAbilities;
  hasShield(): boolean;
  activateShield(duration: number): void;
  deactivateShield(): void;
  applySpeedModifier(modifier: number): void;
  resetModifiers(): void;
}