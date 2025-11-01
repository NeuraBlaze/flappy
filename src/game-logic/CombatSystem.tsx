// ===== ⚔️ COMBAT SYSTEM =====
// Combat mechanics and bullet physics management
// Separated from main game component for modularity

import { useState, useCallback, useRef } from 'react';

// ===== INTERFACES =====
export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage?: number;
  type?: 'normal' | 'lightning' | 'laser';
  color?: string;
}

export interface CombatState {
  bullets: Bullet[];
  canShoot: boolean;
  shootCooldown: number;
  maxBullets: number;
  // Special abilities
  lightningCooldown: number;
  electricField: boolean;
  chainLightning: number;
  // Laser abilities
  laserVision: boolean;
  laserCooldown: number;
}

export interface CombatSystemConfig {
  // Bullet settings
  bulletSpeed: number;
  bulletLife: number; // frames
  bulletDamage: number;
  maxBullets: number;
  // Shooting settings
  shootCooldown: number; // frames
  // Performance settings
  enableBulletPhysics: boolean;
  enableCollisionDetection: boolean;
  // Special abilities
  lightningStrikeCooldown: number; // frames
  laserVisionCooldown: number; // frames
}

export interface CollisionTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: string;
  type?: 'pipe' | 'obstacle' | 'enemy';
}

export interface UseCombatSystemReturn {
  // State
  combatState: CombatState;
  
  // Actions
  shoot: (birdX: number, birdY: number) => boolean;
  updateBullets: (gameSpeed: number, worldWidth: number) => void;
  checkBulletCollisions: (targets: CollisionTarget[]) => CollisionTarget[];
  clearBullets: () => void;
  
  // Special abilities
  lightningStrike: (targets: CollisionTarget[], birdX: number, birdY: number) => CollisionTarget[];
  laserShoot: (birdX: number, birdY: number, targetX: number, targetY: number) => boolean;
  
  // Utilities
  getBulletCount: () => number;
  canShootNow: () => boolean;
  setShootingAbility: (canShoot: boolean) => void;
  updateCombatAbilities: (abilities: any) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<CombatSystemConfig>) => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: CombatSystemConfig = {
  bulletSpeed: 4,
  bulletLife: 180, // 3 seconds at 60fps
  bulletDamage: 1,
  maxBullets: 10,
  shootCooldown: 30, // 0.5 seconds
  enableBulletPhysics: true,
  enableCollisionDetection: true,
  lightningStrikeCooldown: 600, // 10 seconds
  laserVisionCooldown: 120, // 2 seconds
};

// ===== CUSTOM HOOK =====
export function useCombatSystem(
  config: Partial<CombatSystemConfig> = {}
): UseCombatSystemReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  
  // ===== STATE =====
  const combatStateRef = useRef<CombatState>({
    bullets: [],
    canShoot: false,
    shootCooldown: 0,
    maxBullets: finalConfig.current.maxBullets,
    lightningCooldown: 0,
    electricField: false,
    chainLightning: 0,
    laserVision: false,
    laserCooldown: 0,
  });
  
  const [combatState, setCombatState] = useState<CombatState>(combatStateRef.current);
  
  // ===== ACTIONS =====
  const shoot = useCallback((birdX: number, birdY: number): boolean => {
    const state = combatStateRef.current;
    const config = finalConfig.current;
    
    if (!state.canShoot || state.shootCooldown > 0 || state.bullets.length >= state.maxBullets) {
      return false;
    }
    
    // Create bullet
    const bullet: Bullet = {
      x: birdX + 15,
      y: birdY,
      vx: config.bulletSpeed,
      vy: 0,
      life: config.bulletLife,
      damage: config.bulletDamage,
      type: 'normal',
      color: '#FFFF00'
    };
    
    state.bullets.push(bullet);
    state.shootCooldown = config.shootCooldown;
    
    combatStateRef.current = { ...state };
    setCombatState({ ...state });
    
    return true;
  }, []);
  
  const updateBullets = useCallback((gameSpeed: number, worldWidth: number) => {
    const state = combatStateRef.current;
    const config = finalConfig.current;
    
    if (!config.enableBulletPhysics) return;
    
    // Update shooting cooldown
    if (state.shootCooldown > 0) {
      state.shootCooldown--;
    }
    
    // Update lightning cooldown
    if (state.lightningCooldown > 0) {
      state.lightningCooldown--;
    }
    
    // Update laser cooldown
    if (state.laserCooldown > 0) {
      state.laserCooldown--;
    }
    
    // Update bullets
    state.bullets.forEach(bullet => {
      bullet.x += bullet.vx * gameSpeed;
      bullet.y += bullet.vy * gameSpeed;
      bullet.life--;
    });
    
    // Remove expired bullets
    state.bullets = state.bullets.filter(
      bullet => bullet.life > 0 && bullet.x < worldWidth + 50 && bullet.x > -50
    );
    
    combatStateRef.current = { ...state };
    setCombatState({ ...state });
  }, []);
  
  const checkBulletCollisions = useCallback((targets: CollisionTarget[]): CollisionTarget[] => {
    const state = combatStateRef.current;
    const config = finalConfig.current;
    
    if (!config.enableCollisionDetection) return [];
    
    const hitTargets: CollisionTarget[] = [];
    
    state.bullets.forEach(bullet => {
      targets.forEach(target => {
        // Simple AABB collision detection
        if (bullet.x + 3 > target.x && 
            bullet.x - 3 < target.x + target.width &&
            bullet.y + 3 > target.y && 
            bullet.y - 3 < target.y + target.height) {
          
          // Hit detected
          hitTargets.push(target);
          bullet.life = 0; // Mark bullet for removal
        }
      });
    });
    
    // Remove dead bullets
    state.bullets = state.bullets.filter(bullet => bullet.life > 0);
    
    combatStateRef.current = { ...state };
    setCombatState({ ...state });
    
    return hitTargets;
  }, []);
  
  const clearBullets = useCallback(() => {
    combatStateRef.current.bullets = [];
    setCombatState({ ...combatStateRef.current });
  }, []);
  
  // ===== SPECIAL ABILITIES =====
  const lightningStrike = useCallback((targets: CollisionTarget[], birdX: number, birdY: number): CollisionTarget[] => {
    const state = combatStateRef.current;
    const config = finalConfig.current;
    
    if (state.lightningCooldown > 0 || targets.length === 0) {
      return [];
    }
    
    // Find closest target
    let closestTarget = targets[0];
    let closestDistance = Math.hypot(closestTarget.x - birdX, closestTarget.y - birdY);
    
    targets.forEach(target => {
      const distance = Math.hypot(target.x - birdX, target.y - birdY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });
    
    // Set cooldown
    state.lightningCooldown = config.lightningStrikeCooldown;
    
    // Chain lightning effect
    const hitTargets = [closestTarget];
    if (state.chainLightning > 1) {
      const remainingTargets = targets.filter(t => t !== closestTarget);
      const chainTargets = remainingTargets
        .sort((a, b) => 
          Math.hypot(a.x - closestTarget.x, a.y - closestTarget.y) - 
          Math.hypot(b.x - closestTarget.x, b.y - closestTarget.y)
        )
        .slice(0, state.chainLightning - 1);
      
      hitTargets.push(...chainTargets);
    }
    
    combatStateRef.current = { ...state };
    setCombatState({ ...state });
    
    return hitTargets;
  }, []);
  
  const laserShoot = useCallback((birdX: number, birdY: number, targetX: number, targetY: number): boolean => {
    const state = combatStateRef.current;
    const config = finalConfig.current;
    
    if (!state.laserVision || state.laserCooldown > 0) {
      return false;
    }
    
    // Create laser bullet
    const dx = targetX - birdX;
    const dy = targetY - birdY;
    const distance = Math.hypot(dx, dy);
    
    if (distance === 0) return false;
    
    const bullet: Bullet = {
      x: birdX + 15,
      y: birdY,
      vx: (dx / distance) * config.bulletSpeed * 2, // Laser is faster
      vy: (dy / distance) * config.bulletSpeed * 2,
      life: config.bulletLife / 2, // Shorter life but faster
      damage: config.bulletDamage * 2, // More damage
      type: 'laser',
      color: '#FF0000'
    };
    
    state.bullets.push(bullet);
    state.laserCooldown = config.laserVisionCooldown;
    
    combatStateRef.current = { ...state };
    setCombatState({ ...state });
    
    return true;
  }, []);
  
  // ===== UTILITIES =====
  const getBulletCount = useCallback((): number => {
    return combatStateRef.current.bullets.length;
  }, []);
  
  const canShootNow = useCallback((): boolean => {
    const state = combatStateRef.current;
    return state.canShoot && state.shootCooldown === 0 && state.bullets.length < state.maxBullets;
  }, []);
  
  const setShootingAbility = useCallback((canShoot: boolean) => {
    combatStateRef.current.canShoot = canShoot;
    setCombatState({ ...combatStateRef.current });
  }, []);
  
  const updateCombatAbilities = useCallback((abilities: any) => {
    const state = combatStateRef.current;
    
    // Update combat abilities from bird skin
    state.canShoot = abilities.canShoot || false;
    state.lightningCooldown = Math.max(0, state.lightningCooldown);
    state.electricField = abilities.electricField || false;
    state.chainLightning = abilities.chainLightning || 0;
    state.laserVision = abilities.laserVision || false;
    
    combatStateRef.current = { ...state };
    setCombatState({ ...state });
  }, []);
  
  const updateConfig = useCallback((newConfig: Partial<CombatSystemConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
  }, []);
  
  return {
    // State
    combatState: combatState,
    
    // Actions
    shoot,
    updateBullets,
    checkBulletCollisions,
    clearBullets,
    
    // Special abilities
    lightningStrike,
    laserShoot,
    
    // Utilities
    getBulletCount,
    canShootNow,
    setShootingAbility,
    updateCombatAbilities,
    
    // Configuration
    updateConfig,
  };
}

// ===== COMPONENT EXPORT =====
export default useCombatSystem;