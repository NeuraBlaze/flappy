/**
 * Bird-related types and interfaces
 */

// Bird unlock requirements
export interface UnlockRequirement {
  type: 'coins' | 'achievement' | 'score';
  value: number | string;
}

// Bird abilities configuration
export interface BirdAbilities {
  jumpPower?: number; // 1.0 = normal
  gravity?: number; // 1.0 = normal  
  magnetBonus?: number; // 1.0 = normal
  shieldDuration?: number; // 1.0 = normal
  coinValue?: number; // 1.0 = normal
  extraLives?: number; // Extra lives count
  canShoot?: boolean; // Can shoot projectiles
  autoShield?: number; // Auto shield recharge (sec)
  
  // Demon Bird abilities
  lifeSteal?: boolean; // Life steal on collision
  darkAura?: number; // Dark aura range
  shadowTeleport?: number; // Shadow teleport uses count
  
  // Lightning Bird abilities
  lightningStrike?: number; // Lightning strike cooldown (sec)
  electricField?: boolean; // Electric field
  chainLightning?: number; // Chain lightning max targets
  
  // Super Bird abilities  
  flyThroughWalls?: number; // How many times can fly through obstacles
  superStrength?: boolean; // Destroy obstacles on collision
  laserVision?: boolean; // Laser vision
  
  // UFO Bird abilities
  antiGravity?: boolean; // Anti-gravity
  abductionBeam?: boolean; // Abduction beam
  warpSpeed?: number; // Warp jump uses
  
  // Retro Gamer Bird abilities
  pixelMode?: boolean; // Pixel art mode
  powerUpMagnet?: boolean; // Automatic power-up attraction
  
  // Unicorn Bird abilities
  magicHorn?: boolean; // Magic horn for obstacle breakthrough
  hornCooldown?: number; // Horn cooldown (sec)
}

// Bird skin definition
export interface BirdSkin {
  id: string;
  name: string;
  emoji: string;
  bodyColor: string;
  wingColor: string;
  unlockRequirement: UnlockRequirement;
  abilities: BirdAbilities;
  description: string;
}

// Bird instance (runtime state)
export interface Bird {
  x: number;
  y: number;
  velocity: number;
  r: number; // radius for collision
  angle: number;
  
  // Ability-related state
  maxLives: number;
  lives: number;
  shieldTime: number;
  magnetTime: number;
  slowTime: number;
  doubleTime: number;
  rainbowTime: number;
  shootCooldown: number;
  lastShotTime: number;
  
  // Teleport state
  shadowTeleportUses: number;
  warpSpeedUses: number;
  flyThroughWallsUses: number;
  
  // Bullets for shooting birds
  bullets: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }>;
  
  // Current skin and abilities
  skin: BirdSkin;
  canShoot: boolean;
}