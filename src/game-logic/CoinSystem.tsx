import { useCallback } from 'react';

export interface Coin {
  x: number;
  y: number;
  collected: boolean;
  animTime: number;
  value: number;
}

interface Bird {
  x: number;
  y: number;
  magnet: number;
}

interface World {
  w: number;
  h: number;
  groundH: number;
}

interface PerfConfig {
  maxCoins: number;
}

interface BirdSkin {
  abilities: {
    magnetBonus?: number;
    coinValue?: number;
  };
}

interface CoinSystemProps {
  gameCoins: React.MutableRefObject<Coin[]>;
  bird: React.MutableRefObject<Bird>;
  world: React.MutableRefObject<World>;
  getPerfConfig: () => PerfConfig;
  getCurrentBirdSkin: () => BirdSkin;
  setCoins: (updater: (prev: number) => number) => void;
  playSound: (frequency: number, volume: number, type: string) => void;
  createParticles: (x: number, y: number, count: number, color: string, type: string) => void;
}

export const useCoinSystem = ({
  gameCoins,
  bird,
  world,
  getPerfConfig,
  getCurrentBirdSkin,
  setCoins,
  playSound,
  createParticles
}: CoinSystemProps) => {

  const spawnCoin = useCallback(() => {
    const perfConfig = getPerfConfig();
    
    // Aktív coin-ok tisztítása (eltűnt objektumok)
    gameCoins.current = gameCoins.current.filter(c => c.x > -50 && !c.collected);
    
    // Növelt spawn rate jobb gameplay érdekében
    const spawnRate = 0.01; // Növelve 0.008-ról 0.01-re
    
    if (gameCoins.current.length < perfConfig.maxCoins && Math.random() < spawnRate) {
      gameCoins.current.push({
        x: world.current.w + 20,
        y: 80 + Math.random() * (world.current.h - world.current.groundH - 160),
        collected: false,
        animTime: 0,
        value: Math.random() < 0.1 ? 5 : 1 // 10% esély 5 érmére
      });
    }
  }, [gameCoins, world, getPerfConfig]);

  const checkCoinCollisions = useCallback(() => {
    const b = bird.current;
    
    gameCoins.current.forEach(coin => {
      if (!coin.collected) {
        const dx = coin.x - b.x;
        const dy = coin.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Apply skin magnet bonus
        const currentSkin = getCurrentBirdSkin();
        const magnetBonus = currentSkin.abilities.magnetBonus || 1.0;
        const magnetRange = b.magnet > 0 ? 50 * magnetBonus : 15;
        
        if (dist < magnetRange) {
          coin.collected = true;
          
          // Apply skin coin value bonus
          const coinMultiplier = currentSkin.abilities.coinValue || 1.0;
          const finalValue = Math.round(coin.value * coinMultiplier);
          
          setCoins(c => c + finalValue);
          playSound(800, 0.1, 'score');
          createParticles(coin.x, coin.y, 5, '#FFD700', 'sparkle');
          
          // Magnet effekt ha aktív
          if (b.magnet > 0 && dist >= 15) {
            createParticles(coin.x, coin.y, 3, '#00FFFF', 'trail');
          }
        }
      }
    });
  }, [gameCoins, bird, getCurrentBirdSkin, setCoins, playSound, createParticles]);

  const updateCoins = useCallback(() => {
    gameCoins.current.forEach(coin => {
      coin.x -= 2; // Move left
      coin.animTime += 1;
    });
    
    // Remove off-screen coins
    gameCoins.current = gameCoins.current.filter(c => c.x > -20);
  }, [gameCoins]);

  const clearCoins = useCallback(() => {
    gameCoins.current = [];
  }, [gameCoins]);

  return {
    spawnCoin,
    checkCoinCollisions,
    updateCoins,
    clearCoins
  };
};