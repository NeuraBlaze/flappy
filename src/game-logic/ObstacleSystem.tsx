import { useCallback } from 'react';

export interface Pipe {
  x: number;
  top: number;
  passed: boolean;
  type: string;
  biome: string;
}

interface Bird {
  x: number;
  y: number;
  r: number;
}

interface World {
  w: number;
  h: number;
  groundH: number;
  gap: number;
  pipeW: number;
  pipeSpace: number;
  speed: number;
}

interface Biome {
  id: string;
  obstacleTypes: string[];
}

interface ObstacleSystemProps {
  pipes: React.MutableRefObject<Pipe[]>;
  bird: React.MutableRefObject<Bird>;
  world: React.MutableRefObject<World>;
  currentBiome: React.MutableRefObject<Biome>;
  gameSpeed: number;
  setScore: (updater: (prev: number) => number) => void;
  playSound: (frequency: number, volume: number, type: string) => void;
  createParticles: (x: number, y: number, count: number, color: string, type: string) => void;
}

export const useObstacleSystem = ({
  pipes,
  bird,
  world,
  currentBiome,
  gameSpeed,
  setScore,
  playSound,
  createParticles
}: ObstacleSystemProps) => {

  const checkCollisions = useCallback(() => {
    const b = bird.current;
    const w = world.current;
    
    // Talaj ütközés
    if (b.y + b.r > w.h - w.groundH) {
      return true;
    }
    
    // Mennyezet ütközés
    if (b.y - b.r < 0) {
      return true;
    }
    
    // Cső ütközések
    for (const pipe of pipes.current) {
      if (pipe.x < b.x + b.r && pipe.x + w.pipeW > b.x - b.r) {
        if (b.y - b.r < pipe.top || b.y + b.r > pipe.top + w.gap) {
          return true;
        }
      }
    }
    
    return false;
  }, [pipes, bird, world]);

  const spawnPipe = useCallback(() => {
    const w = world.current;
    const biome = currentBiome.current;
    
    // Új cső generálás - biome alapú
    if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < w.w - w.pipeSpace) {
      const minTop = 40;
      const maxTop = w.h - w.groundH - w.gap - 40;
      const top = minTop + Math.random() * (maxTop - minTop);
      
      // Biome-based obstacle type selection
      const obstacleTypes = biome.obstacleTypes;
      const selectedType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      pipes.current.push({
        x: w.w,
        top,
        passed: false,
        type: selectedType,
        biome: biome.id
      });
    }
  }, [pipes, world, currentBiome]);

  const updatePipes = useCallback(() => {
    const w = world.current;
    const b = bird.current;
    
    // Csövek mozgatása
    pipes.current.forEach(pipe => {
      pipe.x -= w.speed * gameSpeed;
    });
    
    // Pontszám számítás
    pipes.current.forEach(pipe => {
      if (!pipe.passed && pipe.x + w.pipeW < b.x) {
        pipe.passed = true;
        setScore(s => s + 1);
        playSound(523, 0.1, 'score');
        createParticles(b.x, b.y, 5, '#00FF00', 'sparkle');
      }
    });
    
    // Távoli csövek törlése
    pipes.current = pipes.current.filter(pipe => pipe.x > -w.pipeW);
  }, [pipes, world, bird, gameSpeed, setScore, playSound, createParticles]);

  const destroyPipe = useCallback((pipeIndex: number) => {
    if (pipeIndex >= 0 && pipeIndex < pipes.current.length) {
      const pipe = pipes.current[pipeIndex];
      // Create explosion effect at pipe location
      createParticles(pipe.x + world.current.pipeW / 2, pipe.top + world.current.gap / 2, 15, '#FF6600', 'explosion');
      playSound(300, 0.4, 'explosion');
      
      // Remove the pipe
      pipes.current.splice(pipeIndex, 1);
    }
  }, [pipes, world, createParticles, playSound]);

  const clearPipes = useCallback(() => {
    pipes.current = [];
  }, [pipes]);

  return {
    checkCollisions,
    spawnPipe,
    updatePipes,
    destroyPipe,
    clearPipes
  };
};