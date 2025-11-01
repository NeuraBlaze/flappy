import { useCallback } from 'react';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'rain' | 'snow' | 'fog' | 'sparkle' | 'explosion' | 'trail';
}

interface PerfConfig {
  maxParticles: number;
  reducedEffects: boolean;
}

interface ParticleSystemProps {
  particles: React.MutableRefObject<Particle[]>;
  getPerfConfig: () => PerfConfig;
}

export const useParticleSystem = ({
  particles,
  getPerfConfig
}: ParticleSystemProps) => {

  const createParticles = useCallback((
    x: number, 
    y: number, 
    count: number, 
    color: string, 
    type: 'explosion' | 'trail' | 'sparkle' = 'explosion'
  ) => {
    const perfConfig = getPerfConfig();
    
    // Opera esetén csökkentett részecske szám
    const adjustedCount = perfConfig.reducedEffects ? Math.max(1, Math.floor(count * 0.6)) : count;
    
    // Részecske limit ellenőrzés
    if (particles.current.length >= perfConfig.maxParticles) {
      // Régi részecskék eltávolítása
      particles.current = particles.current.slice(-Math.floor(perfConfig.maxParticles * 0.7));
    }
    
    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
      const speed = type === 'trail' ? 0.5 + Math.random() * 1 : 2 + Math.random() * 3;
      
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: type === 'trail' ? 15 : 30,
        maxLife: type === 'trail' ? 15 : 30,
        color,
        size: type === 'sparkle' ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
        type
      });
    }
  }, [particles, getPerfConfig]);

  const updateParticles = useCallback(() => {
    const perfConfig = getPerfConfig();
    
    // Részecskék update
    particles.current.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life--;
    });
    
    // Részecske limitálás teljesítmény alapján
    particles.current = particles.current.filter(p => p.life > 0).slice(-perfConfig.maxParticles);
  }, [particles, getPerfConfig]);

  const clearParticles = useCallback(() => {
    particles.current = [];
  }, [particles]);

  const getParticleCount = useCallback(() => {
    return particles.current.length;
  }, [particles]);

  const createExplosion = useCallback((x: number, y: number, intensity: number = 1) => {
    const count = Math.floor(15 * intensity);
    const colors = ['#FF6600', '#FF9900', '#FFCC00', '#FF3300'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    createParticles(x, y, count, color, 'explosion');
  }, [createParticles]);

  const createSparkles = useCallback((x: number, y: number, color: string = '#FFD700') => {
    createParticles(x, y, 8, color, 'sparkle');
  }, [createParticles]);

  const createTrail = useCallback((x: number, y: number, color: string = '#00FFFF') => {
    createParticles(x, y, 5, color, 'trail');
  }, [createParticles]);

  return {
    createParticles,
    updateParticles,
    clearParticles,
    getParticleCount,
    createExplosion,
    createSparkles,
    createTrail
  };
};