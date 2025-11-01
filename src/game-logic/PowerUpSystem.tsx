import { useCallback } from 'react';

export interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow';
  collected: boolean;
  animTime: number;
}

interface Bird {
  x: number;
  y: number;
  shield: number;
  slowMotion: number;
  magnet: number;
  doublePoints: number;
  rainbow: number;
  superMode: number;
  megaMode: number;
  godMode: number;
  comboWindow: number;
  lastPowerUp: string;
  powerUpsUsed: number;
  shieldsUsed: number;
}

interface World {
  w: number;
  h: number;
  groundH: number;
}

interface Biome {
  powerUpBonus: number;
}

interface PerfConfig {
  maxPowerUps: number;
}

interface BirdSkin {
  abilities: {
    shieldDuration?: number;
    magnetBonus?: number;
    coinValue?: number;
  };
}

interface PowerUpSystemProps {
  powerUps: React.MutableRefObject<PowerUp[]>;
  bird: React.MutableRefObject<Bird>;
  world: React.MutableRefObject<World>;
  currentBiome: React.MutableRefObject<Biome>;
  time: React.MutableRefObject<{ cameraShake: number }>;
  getPerfConfig: () => PerfConfig;
  getCurrentBirdSkin: () => BirdSkin;
  setScore: (updater: (prev: number) => number) => void;
  playSound: (frequency: number, volume: number, type: string) => void;
  createParticles: (x: number, y: number, count: number, color: string, type: string) => void;
  unlockAchievement: (id: string) => void;
}

export const usePowerUpSystem = ({
  powerUps,
  bird,
  world,
  currentBiome,
  time,
  getPerfConfig,
  getCurrentBirdSkin,
  setScore,
  playSound,
  createParticles,
  unlockAchievement
}: PowerUpSystemProps) => {

  const spawnPowerUp = useCallback(() => {
    const perfConfig = getPerfConfig();
    const biomeBonus = currentBiome.current.powerUpBonus;
    
    // Növelt spawn rate
    const baseRate = 0.003;
    const adjustedRate = baseRate * biomeBonus;
    
    // Aktív power-up-ok tisztítása (eltűnt objektumok)
    powerUps.current = powerUps.current.filter(p => p.x > -50 && !p.collected);
    
    if (powerUps.current.length < perfConfig.maxPowerUps && Math.random() < adjustedRate) {
      const types: ('shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow')[] = 
        ['shield', 'slow', 'score', 'magnet', 'double', 'rainbow'];
      powerUps.current.push({
        x: world.current.w + 20,
        y: 60 + Math.random() * (world.current.h - world.current.groundH - 120),
        type: types[Math.floor(Math.random() * types.length)],
        collected: false,
        animTime: 0
      });
    }
  }, [powerUps, world, currentBiome, getPerfConfig]);

  const checkPowerUpCombination = useCallback((newPowerUp: string) => {
    const b = bird.current;
    
    // Ha van aktív combo window (180 frames = 3 sec)
    if (b.comboWindow > 0) {
      let comboActivated = false;
      
      // SUPER MODE: Shield + Slow = Invincible + Speed Boost
      if ((b.lastPowerUp === 'shield' && newPowerUp === 'slow') ||
          (b.lastPowerUp === 'slow' && newPowerUp === 'shield')) {
        b.superMode = 600; // 10 seconds
        b.shield = 600;
        comboActivated = true;
        createParticles(b.x, b.y, 25, '#FFD700', 'explosion');
        playSound(1000, 0.5, 'powerup');
      }
      
      // MEGA MODE: Magnet + Double = Super Magnet + Triple Points
      else if ((b.lastPowerUp === 'magnet' && newPowerUp === 'double') ||
               (b.lastPowerUp === 'double' && newPowerUp === 'magnet')) {
        b.megaMode = 480; // 8 seconds
        b.magnet = 480;
        b.doublePoints = 0; // Reset double, será triple
        comboActivated = true;
        createParticles(b.x, b.y, 30, '#FF69B4', 'explosion');
        playSound(1200, 0.6, 'powerup');
      }
      
      // GOD MODE: Rainbow + Shield = Ultimate Power
      else if ((b.lastPowerUp === 'rainbow' && newPowerUp === 'shield') ||
               (b.lastPowerUp === 'shield' && newPowerUp === 'rainbow')) {
        b.godMode = 900; // 15 seconds
        b.rainbow = 900;
        b.shield = 900;
        comboActivated = true;
        createParticles(b.x, b.y, 40, '#9966FF', 'explosion');
        playSound(1500, 0.8, 'powerup');
        
        // Screen flash effect
        time.current.cameraShake = 60;
      }
      
      if (comboActivated) {
        // Reset combo window
        b.comboWindow = 0;
        b.lastPowerUp = '';
        return true;
      }
    }
    
    // Set up for next potential combo
    b.lastPowerUp = newPowerUp;
    b.comboWindow = 180; // 3 seconds to activate combo
    return false;
  }, [bird, createParticles, playSound, time]);

  const checkPowerUpCollisions = useCallback(() => {
    const b = bird.current;
    
    powerUps.current.forEach(powerUp => {
      if (!powerUp.collected) {
        const dx = powerUp.x - b.x;
        const dy = powerUp.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
          powerUp.collected = true;
          b.powerUpsUsed++;
          
          // Check for combinations first
          const comboActivated = checkPowerUpCombination(powerUp.type);
          
          if (!comboActivated) {
            // Apply normal power-up effect
            playSound(660, 0.2, 'powerup');
            createParticles(powerUp.x, powerUp.y, 8, '#FF69B4', 'sparkle');
            
            switch (powerUp.type) {
              case 'shield':
                const currentSkin = getCurrentBirdSkin();
                const shieldMultiplier = currentSkin.abilities.shieldDuration || 1.0;
                b.shield = Math.round(300 * shieldMultiplier); // 5 másodperc védelem * skin bonus
                b.shieldsUsed++;
                break;
              case 'slow':
                b.slowMotion = 180; // 3 másodperc lassítás
                break;
              case 'score':
                const scoreBonus = b.megaMode > 0 ? 15 : b.doublePoints > 0 ? 10 : 5;
                setScore(s => s + scoreBonus);
                break;
              case 'magnet':
                b.magnet = 240; // 4 másodperc magnet
                break;
              case 'double':
                b.doublePoints = 300; // 5 másodperc dupla pont
                break;
              case 'rainbow':
                b.rainbow = 300; // 5 másodperc rainbow mode
                break;
            }
          }
          
          // Achievement ellenőrzés
          if (b.powerUpsUsed >= 10) {
            unlockAchievement('power_user');
          }
          if (b.shieldsUsed >= 5) {
            unlockAchievement('shield_master');
          }
          if (powerUp.type === 'rainbow') {
            unlockAchievement('rainbow_rider');
          }
        }
      }
    });
  }, [powerUps, bird, checkPowerUpCombination, playSound, createParticles, getCurrentBirdSkin, setScore, unlockAchievement]);

  const updatePowerUps = useCallback(() => {
    powerUps.current.forEach(powerUp => {
      powerUp.x -= 2; // Move left
      powerUp.animTime += 1;
    });
    
    // Remove off-screen power-ups
    powerUps.current = powerUps.current.filter(p => p.x > -20);
  }, [powerUps]);

  const clearPowerUps = useCallback(() => {
    powerUps.current = [];
  }, [powerUps]);

  return {
    spawnPowerUp,
    checkPowerUpCollisions,
    updatePowerUps,
    clearPowerUps,
    checkPowerUpCombination
  };
};