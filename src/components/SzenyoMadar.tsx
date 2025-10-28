import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Szenyo-madár – egy Flappy Bird jellegű mini‑game
 * --------------------------------------------------
 * • React + Tailwind (stílus), egyetlen komponensben
 * • Vezérlés: kattintás / érintés / Space / ↑ – ugrás
 * • Pixel‑feeling: nearest-neighbor skálázás, 8‑bites színek
 * • Mentett best score (localStorage)
 * • Paused/Resume, Restart, Hitbox debug (opcionális kapcsoló)
 * • Reszponzív: canvas méret a konténerhez igazodik (DPR-aware)
 * • Egyedi elemek: részecske effektek, power-upok, változatos akadályok
 */

// Játék állapot enum
const GameState = {
  MENU: "menu",
  RUN: "run",
  GAMEOVER: "gameover",
  PAUSE: "pause",
} as const;

// Biome típusok
interface Biome {
  id: 'forest' | 'city' | 'space';
  name: string;
  backgroundColors: string[];
  obstacleTypes: ('pipe' | 'tree' | 'building' | 'asteroid' | 'satellite')[];
  weatherTypes: ('clear' | 'rain' | 'snow' | 'fog' | 'aurora')[];
  powerUpBonus: number; // power-up spawn rate multiplier
  musicTheme: string;
  particleColor: string;
}

// Sprite rendszer
interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnimationData {
  frames: SpriteFrame[];
  frameRate: number;
  loop: boolean;
}

// Particle típusok
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'rain' | 'snow' | 'fog' | 'sparkle' | 'explosion' | 'trail' | 'aurora';
}

// Power-up típusok
interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow';
  collected: boolean;
  animTime: number;
}

// Coin típus
interface Coin {
  x: number;
  y: number;
  collected: boolean;
  animTime: number;
  value: number;
}

// Achievement típus
interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

// Háttér objektumok (felhők, stb.)
interface BackgroundObj {
  x: number;
  y: number;
  type: 'cloud' | 'star';
  size: number;
  speed: number;
}

export default function SzenyoMadar() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<typeof GameState[keyof typeof GameState]>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState<number>(() => {
    const v = localStorage.getItem("szenyo_madar_coins");
    return v ? parseInt(v, 10) : 0;
  });
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem("szenyo_madar_achievements");
    return saved ? JSON.parse(saved) : [
      { id: 'first_flight', name: 'Első Repülés', description: 'Repülj először!', unlocked: false, icon: '🐣' },
      { id: 'coin_collector', name: 'Érme Gyűjtő', description: 'Gyűjts 50 érmét!', unlocked: false, icon: '💰' },
      { id: 'high_flyer', name: 'Magas Repülő', description: 'Érj el 20 pontot!', unlocked: false, icon: '🚀' },
      { id: 'power_user', name: 'Power Felhasználó', description: 'Használj 10 power-upot!', unlocked: false, icon: '⚡' },
      { id: 'shield_master', name: 'Pajzs Mester', description: 'Túlélj 5 ütközést pajzzsal!', unlocked: false, icon: '🛡️' },
      { id: 'rainbow_rider', name: 'Szivárvány Lovas', description: 'Használd a rainbow mode-ot!', unlocked: false, icon: '🌈' }
    ];
  });
  const [best, setBest] = useState<number>(() => {
    const v = localStorage.getItem("szenyo_madar_best");
    return v ? parseInt(v, 10) : 0;
  });
  const [debug, setDebug] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Világ paraméterek (virtuális koordináta-rendszer)
  const world = useRef({
    w: 320, // világ szélesség (logikai px)
    h: 480, // világ magasság
    gravity: 0.08, // még finomabb gravitáció (volt: 0.12)
    jump: -2.8, // sokkal enyhébb ugrás (volt: -3.5)
    speed: 1.0, // lassabb sebesség
    gap: 110, // még nagyobb rés
    pipeW: 40,
    pipeSpace: 200, // még nagyobb távolság
    groundH: 50,
  });

  // Játékos (madár) állapot
  const bird = useRef({ 
    x: 80, 
    y: 240, // kicsit lejjebb kezdés (volt: 200)
    vy: 0, 
    r: 12,
    angle: 0,
    shield: 0, // shield frames
    slowMotion: 0, // slow motion frames
    magnet: 0, // magnet frames
    doublePoints: 0, // double points frames
    rainbow: 0, // rainbow mode frames
    trail: [] as {x: number, y: number, alpha: number}[], // rainbow trail
    powerUpsUsed: 0, // power-up használat számláló
    shieldsUsed: 0, // pajzs használat számláló
    animFrame: 0, // animáció frame
    wingCycle: 0, // szárny animáció
    // Combination effects
    superMode: 0, // shield + slow = invincible + speed boost
    megaMode: 0, // magnet + double = coin magnet + triple points
    godMode: 0, // rainbow + shield = ultimate power
    lastPowerUp: '' as string, // track last power-up for combinations
    comboWindow: 0, // time window for combinations
  });

  // Akadályok (csövek / háztömbök)
  const pipes = useRef<{ x: number; top: number; passed: boolean; type: string; biome: string }[]>([]);
  
  // Részecskék
  const particles = useRef<Particle[]>([]);
  
  // Power-upok
  const powerUps = useRef<PowerUp[]>([]);
  
  // Érmék
  const gameCoins = useRef<Coin[]>([]);
  
  // Háttér objektumok
  const bgObjects = useRef<BackgroundObj[]>([]);
  
  // Idő és effektek
  const time = useRef({ 
    last: 0, 
    acc: 0, 
    frameCount: 0,
    cameraShake: 0,
    slowMotion: false,
    lastTap: 0, // utolsó tap időpontja
    tapCooldown: 150 // minimum idő két tap között (ms)
  });

  // Hangeffektek (Web Audio API)
  const audioContext = useRef<AudioContext | null>(null);

  // Sound variations storage
  const soundVariations = useRef({
    jumpSounds: [440, 494, 523, 587], // A4, B4, C5, D5
    currentJumpIndex: 0
  });

  // Weather rendszer
  const weather = useRef({
    type: 'clear' as 'clear' | 'rain' | 'snow' | 'fog' | 'aurora',
    intensity: 0,
    particles: [] as Particle[]
  });

  // Biome rendszer
  const biomes = useRef<Biome[]>([
    {
      id: 'forest',
      name: 'Varázserdő',
      backgroundColors: ['#2D5A0B', '#4A7C59', '#8FBC8F'],
      obstacleTypes: ['tree', 'pipe'],
      weatherTypes: ['clear', 'rain', 'fog'],
      powerUpBonus: 1.2,
      musicTheme: 'nature',
      particleColor: '#90EE90'
    },
    {
      id: 'city',
      name: 'Cyber Város',
      backgroundColors: ['#1a1a2e', '#16213e', '#0f3460'],
      obstacleTypes: ['building', 'pipe'],
      weatherTypes: ['clear', 'rain', 'fog'],
      powerUpBonus: 1.0,
      musicTheme: 'urban',
      particleColor: '#00FFFF'
    },
    {
      id: 'space',
      name: 'Galaktikus Űr',
      backgroundColors: ['#0B0B1F', '#1A1A3E', '#2E2E5F'],
      obstacleTypes: ['asteroid', 'satellite'],
      weatherTypes: ['clear', 'aurora'],
      powerUpBonus: 1.5,
      musicTheme: 'cosmic',
      particleColor: '#9966FF'
    }
  ]);

  const currentBiome = useRef<Biome>(biomes.current[0]);
  const biomeTransitionScore = useRef(0);

  // Sprite animációk definiálása (pixel koordinátákban)
  const birdSprites = useRef({
    flying: {
      frames: [
        { wing: 'up', bodyOffset: 0 },
        { wing: 'middle', bodyOffset: -1 },
        { wing: 'down', bodyOffset: 0 },
        { wing: 'middle', bodyOffset: 1 },
      ],
      frameRate: 8 // fps
    }
  });

  // Audio inicializálás
  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Hang generálás (8-bit stílusú) - enhanced with variations
  const playSound = useCallback((frequency: number, duration: number, type: 'jump' | 'score' | 'hit' | 'powerup' = 'jump') => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    const now = audioContext.current.currentTime;
    
    switch (type) {
      case 'jump':
        // Véletlenszerű hang választás a variációkból
        const jumpVariations = soundVariations.current.jumpSounds;
        const randomJump = jumpVariations[Math.floor(Math.random() * jumpVariations.length)];
        oscillator.frequency.setValueAtTime(randomJump, now);
        oscillator.frequency.exponentialRampToValueAtTime(randomJump * 0.7, now + duration);
        // Slight pitch bend for organic feel
        oscillator.frequency.setValueAtTime(randomJump * 1.05, now + duration * 0.1);
        break;
      case 'score':
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.setValueAtTime(frequency * 1.5, now + duration * 0.5);
        break;
      case 'hit':
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + duration);
        break;
      case 'powerup':
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.setValueAtTime(frequency * 2, now + duration * 0.3);
        oscillator.frequency.setValueAtTime(frequency * 1.5, now + duration);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, []);

  // Részecske létrehozás
  const createParticles = useCallback((x: number, y: number, count: number, color: string, type: 'explosion' | 'trail' | 'sparkle' = 'explosion') => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = type === 'trail' ? 0.5 + Math.random() * 1 : 2 + Math.random() * 3;
      
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: type === 'trail' ? 15 : 30,
        maxLife: type === 'trail' ? 15 : 30,
        color,
        size: type === 'sparkle' ? 1 + Math.random() * 2 : 2 + Math.random() * 3
      });
    }
  }, []);

  // Power-up generálás - biome bonus-szal
  const spawnPowerUp = useCallback(() => {
    const biomeBonus = currentBiome.current.powerUpBonus;
    const adjustedRate = 0.003 * biomeBonus;
    
    if (powerUps.current.length < 2 && Math.random() < adjustedRate) {
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
  }, []);

  // Érme generálás
  const spawnCoin = useCallback(() => {
    if (gameCoins.current.length < 3 && Math.random() < 0.008) {
      gameCoins.current.push({
        x: world.current.w + 20,
        y: 80 + Math.random() * (world.current.h - world.current.groundH - 160),
        collected: false,
        animTime: 0,
        value: Math.random() < 0.1 ? 5 : 1 // 10% esély 5 érmére
      });
    }
  }, []);

  // Weather effektek generálása
  const spawnWeatherParticles = useCallback(() => {
    const w = world.current;
    const weatherData = weather.current;
    
    if (weatherData.type === 'clear') return;
    
    const spawnRate = weatherData.intensity * 0.1;
    if (Math.random() < spawnRate) {
      let particle: Particle;
      
      switch (weatherData.type) {
        case 'rain':
          particle = {
            x: Math.random() * (w.w + 50) - 25,
            y: -10,
            vx: -1 - Math.random() * 2,
            vy: 8 + Math.random() * 4,
            life: 100,
            maxLife: 100,
            color: '#4A90E2',
            size: 1 + Math.random(),
            type: 'rain'
          };
          break;
        case 'snow':
          particle = {
            x: Math.random() * (w.w + 50) - 25,
            y: -10,
            vx: -0.5 + Math.random(),
            vy: 1 + Math.random() * 2,
            life: 200,
            maxLife: 200,
            color: '#FFFFFF',
            size: 2 + Math.random() * 3,
            type: 'snow'
          };
          break;
        case 'fog':
          particle = {
            x: w.w + 20,
            y: Math.random() * w.h,
            vx: -0.5 - Math.random() * 0.5,
            vy: 0,
            life: 300,
            maxLife: 300,
            color: '#CCCCCC',
            size: 15 + Math.random() * 25,
            type: 'fog'
          };
          break;
        case 'aurora':
          particle = {
            x: Math.random() * w.w,
            y: Math.random() * (w.h * 0.4),
            vx: 0,
            vy: 0,
            life: 400,
            maxLife: 400,
            color: ['#FF69B4', '#00FFFF', '#ADFF2F', '#9370DB'][Math.floor(Math.random() * 4)],
            size: 30 + Math.random() * 40,
            type: 'aurora' as any
          };
          break;
        default:
          return;
      }
      
      weatherData.particles.push(particle);
    }
  }, []);

  // Háttér objektumok generálása
  const spawnBackgroundObject = useCallback(() => {
    if (bgObjects.current.length < 5 && Math.random() < 0.01) {
      bgObjects.current.push({
        x: world.current.w + 20,
        y: 20 + Math.random() * 100,
        type: Math.random() < 0.7 ? 'cloud' : 'star',
        size: 8 + Math.random() * 16,
        speed: 0.2 + Math.random() * 0.3
      });
    }
  }, []);

  // Helper: világ reset
  const resetGame = useCallback(() => {
    setScore(0);
    bird.current = { 
      x: 80, 
      y: 240, 
      vy: 0, 
      r: 12, 
      angle: 0, 
      shield: 0, 
      slowMotion: 0,
      magnet: 0,
      doublePoints: 0,
      rainbow: 0,
      trail: [],
      powerUpsUsed: 0,
      shieldsUsed: 0,
      animFrame: 0,
      wingCycle: 0,
      superMode: 0,
      megaMode: 0,
      godMode: 0,
      lastPowerUp: '',
      comboWindow: 0
    };
    pipes.current = [];
    particles.current = [];
    powerUps.current = [];
    gameCoins.current = [];
    time.current = { last: 0, acc: 0, frameCount: 0, cameraShake: 0, slowMotion: false, lastTap: 0, tapCooldown: 150 };
    
    // Kezdő háttér objektumok
    bgObjects.current = [];
    for (let i = 0; i < 3; i++) {
      bgObjects.current.push({
        x: Math.random() * world.current.w,
        y: 20 + Math.random() * 100,
        type: 'cloud',
        size: 12 + Math.random() * 20,
        speed: 0.3 + Math.random() * 0.2
      });
    }
  }, []);

  // Ugrás (input) - debounce-al a smooth mobil élményért
  const flap = useCallback(() => {
    const now = Date.now();
    
    // Debounce: ha túl gyorsan jön a következő tap, ignoráljuk
    if (now - time.current.lastTap < time.current.tapCooldown) {
      return;
    }
    time.current.lastTap = now;
    
    initAudio();
    
    if (state === GameState.MENU) {
      resetGame();
      setState(GameState.RUN);
      return;
    }
    if (state === GameState.GAMEOVER) {
      resetGame();
      setState(GameState.RUN);
      return;
    }
    if (state === GameState.PAUSE) return;
    
    bird.current.vy = world.current.jump;
    bird.current.angle = -0.3;
    playSound(440, 0.1, 'jump');
    
    // Trail részecskék
    createParticles(bird.current.x - 5, bird.current.y, 3, '#FFD700', 'trail');
  }, [state, resetGame, initAudio, playSound, createParticles]);

  // Szünet toggle
  const togglePause = useCallback(() => {
    setState((s) => (s === GameState.RUN ? GameState.PAUSE : s === GameState.PAUSE ? GameState.RUN : s));
  }, []);

  // Restart
  const restart = useCallback(() => {
    resetGame();
    setState(GameState.RUN);
  }, [resetGame]);

  // Ütközés detektálás
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
  }, []);

  // Power-up kombinációk ellenőrzése
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
  }, [createParticles, playSound]);

  // Power-up ütközés - enhanced with combinations
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
                b.shield = 300; // 5 másodperc védelem
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
    
    // Érme ütközések
    gameCoins.current.forEach(coin => {
      if (!coin.collected) {
        const dx = coin.x - b.x;
        const dy = coin.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 15 || (b.magnet > 0 && dist < 50)) {
          coin.collected = true;
          setCoins(c => c + coin.value);
          playSound(800, 0.1, 'score');
          createParticles(coin.x, coin.y, 5, '#FFD700', 'sparkle');
          
          // Magnet effekt ha aktív
          if (b.magnet > 0 && dist >= 15) {
            createParticles(coin.x, coin.y, 3, '#00FFFF', 'trail');
          }
        }
      }
    });
  }, [playSound, createParticles]);

  // Achievement feloldás
  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const updated = prev.map(ach => 
        ach.id === id && !ach.unlocked ? { ...ach, unlocked: true } : ach
      );
      localStorage.setItem("szenyo_madar_achievements", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Játék logika update
  const updateGame = useCallback((deltaTime: number) => {
    const dt = Math.min(deltaTime, 20); // Cap delta time
    
    // Game physics - enhanced with combinations
    const b = bird.current;
    let speedMultiplier = 1.0;
    if (b.slowMotion > 0) speedMultiplier = 0.5;
    if (b.rainbow > 0 && b.godMode === 0) speedMultiplier = 1.5; // Rainbow only if not in god mode
    if (b.superMode > 0) speedMultiplier = 2.0; // Super mode = extra speed
    if (b.godMode > 0) speedMultiplier = 0.8; // God mode = controlled power
    
    const gameSpeed = speedMultiplier;
    const w = world.current;
    
    time.current.frameCount++;
    
    // Madár fizika és animáció
    b.vy += w.gravity * gameSpeed;
    b.y += b.vy * gameSpeed;
    b.angle = Math.max(-0.5, Math.min(0.8, b.vy * 0.1));
    
    // Madár animáció frissítés
    b.animFrame += gameSpeed;
    if (b.animFrame >= 60 / birdSprites.current.flying.frameRate) {
      b.wingCycle = (b.wingCycle + 1) % birdSprites.current.flying.frames.length;
      b.animFrame = 0;
    }
    
    // Csövek mozgatása és generálása
    pipes.current.forEach(pipe => {
      pipe.x -= w.speed * gameSpeed;
    });
    
    // Új cső generálás - biome alapú
    if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < w.w - w.pipeSpace) {
      const minTop = 40;
      const maxTop = w.h - w.groundH - w.gap - 40;
      const top = minTop + Math.random() * (maxTop - minTop);
      
      // Biome-based obstacle type selection
      const biome = currentBiome.current;
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
    
    // Power-upok update
    spawnPowerUp();
    spawnCoin();
    powerUps.current.forEach(powerUp => {
      if (!powerUp.collected) {
        powerUp.x -= w.speed * gameSpeed * 0.7;
        powerUp.animTime += dt;
      }
    });
    powerUps.current = powerUps.current.filter(p => p.x > -20);
    
    // Érmék update és mega mode enhanced collection
    gameCoins.current.forEach(coin => {
      if (!coin.collected) {
        coin.x -= w.speed * gameSpeed * 0.8;
        coin.animTime += dt;
        
        // Enhanced magnet range in mega mode
        const magnetRange = b.megaMode > 0 ? 80 : b.magnet > 0 ? 50 : 15;
        const dx = coin.x - b.x;
        const dy = coin.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < magnetRange) {
          coin.collected = true;
          const coinValue = b.megaMode > 0 ? coin.value * 3 : coin.value; // Triple in mega mode
          setCoins(c => c + coinValue);
          playSound(800, 0.1, 'score');
          createParticles(coin.x, coin.y, 5, '#FFD700', 'sparkle');
          
          // Enhanced magnet effects
          if (b.megaMode > 0) {
            createParticles(coin.x, coin.y, 8, '#FF69B4', 'trail');
          } else if (b.magnet > 0 && dist >= 15) {
            createParticles(coin.x, coin.y, 3, '#00FFFF', 'trail');
          }
        }
      }
    });
    gameCoins.current = gameCoins.current.filter(c => c.x > -20);
    
    // Pontszám számítás (enhanced multipliers)
    pipes.current.forEach(pipe => {
      if (!pipe.passed && pipe.x + w.pipeW < b.x) {
        pipe.passed = true;
        let points = 1;
        
        // Apply multipliers
        if (b.megaMode > 0) points *= 3; // Mega mode = triple points
        else if (b.doublePoints > 0) points *= 2; // Double points
        if (b.godMode > 0) points *= 2; // God mode = additional double
        
        setScore(s => s + points);
        playSound(523, 0.1, 'score');
        
        // Enhanced particle effects based on points
        const particleColor = b.megaMode > 0 ? '#FF1493' : 
                            b.doublePoints > 0 ? '#FFD700' : '#00FF00';
        createParticles(b.x, b.y, 5 + points, particleColor, 'sparkle');
      }
    });
    
    // Rainbow trail update
    if (b.rainbow > 0) {
      b.trail.push({ x: b.x, y: b.y, alpha: 1.0 });
      b.trail = b.trail.map(t => ({ ...t, alpha: t.alpha - 0.05 })).filter(t => t.alpha > 0);
      if (b.trail.length > 15) b.trail.shift();
    }
    
    // Effektek csökkentése
    if (b.shield > 0) b.shield--;
    if (b.slowMotion > 0) b.slowMotion--;
    if (b.magnet > 0) b.magnet--;
    if (b.doublePoints > 0) b.doublePoints--;
    if (b.rainbow > 0) b.rainbow--;
    if (time.current.cameraShake > 0) time.current.cameraShake--;
    if (b.comboWindow > 0) b.comboWindow--; // Combo window countdown
    
    // Combination effects
    if (b.superMode > 0) b.superMode--;
    if (b.megaMode > 0) b.megaMode--;
    if (b.godMode > 0) b.godMode--;
    
    // Háttér objektumok
    spawnBackgroundObject();
    spawnWeatherParticles(); // Weather effektek
    bgObjects.current.forEach(obj => {
      obj.x -= obj.speed * gameSpeed;
    });
    bgObjects.current = bgObjects.current.filter(obj => obj.x > -50);
    
    // Weather particles update
    weather.current.particles.forEach(particle => {
      particle.x += particle.vx * gameSpeed;
      particle.y += particle.vy * gameSpeed;
      if (particle.type === 'fog') {
        particle.vy += 0.01; // Slight drift
      }
      particle.life--;
    });
    weather.current.particles = weather.current.particles.filter(p => p.life > 0 && p.x > -50 && p.y < world.current.h + 20);
    
    // Biome transitions (minden 10 pontnál)
    if (score > biomeTransitionScore.current + 10 && score > 0) {
      biomeTransitionScore.current = score;
      const nextBiomeIndex = Math.floor(score / 10) % biomes.current.length;
      const newBiome = biomes.current[nextBiomeIndex];
      
      if (currentBiome.current.id !== newBiome.id) {
        currentBiome.current = newBiome;
        
        // Weather változtatás biome alapján
        const allowedWeather = newBiome.weatherTypes;
        if (!allowedWeather.includes(weather.current.type)) {
          weather.current.type = allowedWeather[Math.floor(Math.random() * allowedWeather.length)];
          weather.current.intensity = weather.current.type === 'clear' ? 0 : 0.5 + Math.random() * 0.5;
        }
        
        // Particle effekt biome váltáskor
        createParticles(b.x, b.y, 20, newBiome.particleColor, 'sparkle');
        playSound(800, 0.3, 'powerup');
      }
    }
    
    // Weather transitions (example: random weather changes)
    if (time.current.frameCount % 1800 === 0) { // Every 30 seconds
      const allowedWeather = currentBiome.current.weatherTypes;
      weather.current.type = allowedWeather[Math.floor(Math.random() * allowedWeather.length)];
      weather.current.intensity = weather.current.type === 'clear' ? 0 : 0.3 + Math.random() * 0.7;
    }
    
    // Részecskék update
    particles.current.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life--;
    });
    particles.current = particles.current.filter(p => p.life > 0);
    
    // Power-up ütközések
    checkPowerUpCollisions();
    
    // Achievement ellenőrzések
    if (score >= 1) unlockAchievement('first_flight');
    if (coins >= 50) unlockAchievement('coin_collector');
    if (score >= 20) unlockAchievement('high_flyer');
    
    // Coins localStorage mentés
    localStorage.setItem("szenyo_madar_coins", coins.toString());
    
    // Ütközés ellenőrzés (enhanced with combinations)
    const isInvulnerable = b.shield > 0 || b.rainbow > 0 || b.superMode > 0 || b.godMode > 0;
    if (!isInvulnerable && checkCollisions()) {
      playSound(150, 0.5, 'hit');
      createParticles(b.x, b.y, 12, '#FF4444', 'explosion');
      time.current.cameraShake = 20;
      
      // Best score mentés
      if (score > best) {
        setBest(score);
        localStorage.setItem("szenyo_madar_best", score.toString());
      }
      
      setState(GameState.GAMEOVER);
    }
  }, [score, best, coins, checkCollisions, checkPowerUpCollisions, playSound, createParticles, spawnPowerUp, spawnCoin, spawnBackgroundObject, spawnWeatherParticles, unlockAchievement, checkPowerUpCombination]);

  // Renderelés
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = world.current;
    const b = bird.current;
    const shake = time.current.cameraShake;
    
    // Kamera rázkódás
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 0.5 : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 0.5 : 0;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    // Háttér gradiens - biome és weather alapú variációk
    const gradient = ctx.createLinearGradient(0, 0, 0, w.h);
    const biome = currentBiome.current;
    
    // Biome based colors, modified by weather
    let colors = [...biome.backgroundColors];
    
    switch (weather.current.type) {
      case 'rain':
        colors = colors.map(c => darkenColor(c, 0.3));
        break;
      case 'snow':
        colors = colors.map(c => lightenColor(c, 0.4));
        break;
      case 'fog':
        colors = colors.map(c => desaturateColor(c, 0.5));
        break;
      case 'aurora':
        // Keep original colors but add aurora effects later
        break;
      default:
        // Use original biome colors
        break;
    }
    
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w.w, w.h);
    
    // Helper functions for color manipulation
    function darkenColor(hex: string, amount: number): string {
      const num = parseInt(hex.replace("#", ""), 16);
      const r = Math.max(0, (num >> 16) - Math.floor(255 * amount));
      const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.floor(255 * amount));
      const b = Math.max(0, (num & 0x0000FF) - Math.floor(255 * amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    function lightenColor(hex: string, amount: number): string {
      const num = parseInt(hex.replace("#", ""), 16);
      const r = Math.min(255, (num >> 16) + Math.floor(255 * amount));
      const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.floor(255 * amount));
      const b = Math.min(255, (num & 0x0000FF) + Math.floor(255 * amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    function desaturateColor(hex: string, amount: number): string {
      const num = parseInt(hex.replace("#", ""), 16);
      const r = (num >> 16);
      const g = ((num >> 8) & 0x00FF);
      const b = (num & 0x0000FF);
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const newR = Math.round(r * (1 - amount) + gray * amount);
      const newG = Math.round(g * (1 - amount) + gray * amount);
      const newB = Math.round(b * (1 - amount) + gray * amount);
      return `#${((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0')}`;
    }
    
    // Háttér objektumok
    bgObjects.current.forEach(obj => {
      ctx.fillStyle = obj.type === 'cloud' ? 'rgba(255,255,255,0.6)' : '#FFFF99';
      if (obj.type === 'cloud') {
        // Egyszerű felhő
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size * 0.6, 0, Math.PI * 2);
        ctx.arc(obj.x + obj.size * 0.5, obj.y, obj.size * 0.4, 0, Math.PI * 2);
        ctx.arc(obj.x - obj.size * 0.3, obj.y, obj.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Csillag
        const spikes = 5;
        const outerRadius = obj.size * 0.5;
        const innerRadius = outerRadius * 0.4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          const x = obj.x + Math.cos(angle) * radius;
          const y = obj.y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
    
    // Csövek/épületek/akadályok - biome based rendering
    pipes.current.forEach(pipe => {
      switch (pipe.type) {
        case 'tree':
          // Erdő fa renderelés
          ctx.fillStyle = '#8B4513'; // trunk
          ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
          ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
          
          // Lombkorona
          ctx.fillStyle = '#228B22';
          ctx.beginPath();
          ctx.arc(pipe.x + w.pipeW/2, pipe.top - 15, 25, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pipe.x + w.pipeW/2, pipe.top + w.gap + 15, 25, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'building':
          // Város épület stílus
          ctx.fillStyle = pipe.biome === 'city' ? '#2C3E50' : '#444444';
          ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
          ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
          
          // Cyber-city ablakok
          if (pipe.biome === 'city') {
            ctx.fillStyle = '#00FFFF';
            for (let y = 10; y < pipe.top - 10; y += 20) {
              for (let x = pipe.x + 5; x < pipe.x + w.pipeW - 5; x += 15) {
                if (Math.random() < 0.8) {
                  ctx.fillRect(x, y, 8, 12);
                  // Neon glow effect
                  ctx.shadowColor = '#00FFFF';
                  ctx.shadowBlur = 5;
                  ctx.fillRect(x, y, 8, 12);
                  ctx.shadowBlur = 0;
                }
              }
            }
            for (let y = pipe.top + w.gap + 10; y < w.h - w.groundH - 10; y += 20) {
              for (let x = pipe.x + 5; x < pipe.x + w.pipeW - 5; x += 15) {
                if (Math.random() < 0.8) {
                  ctx.fillRect(x, y, 8, 12);
                  ctx.shadowColor = '#00FFFF';
                  ctx.shadowBlur = 5;
                  ctx.fillRect(x, y, 8, 12);
                  ctx.shadowBlur = 0;
                }
              }
            }
          }
          break;
          
        case 'asteroid':
          // Űr aszteroida
          ctx.fillStyle = '#8B7D6B';
          ctx.save();
          ctx.translate(pipe.x + w.pipeW/2, pipe.top/2);
          ctx.rotate(time.current.frameCount * 0.01);
          
          // Irregular asteroid shape
          ctx.beginPath();
          const sides = 8;
          for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const radius = 20 + Math.sin(i * 1.5) * 8;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          
          // Craters
          ctx.fillStyle = '#696969';
          ctx.beginPath();
          ctx.arc(-8, -5, 4, 0, Math.PI * 2);
          ctx.arc(10, 8, 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          
          // Lower asteroid
          ctx.save();
          ctx.translate(pipe.x + w.pipeW/2, pipe.top + w.gap + (w.h - w.groundH - pipe.top - w.gap)/2);
          ctx.rotate(time.current.frameCount * -0.008);
          
          ctx.fillStyle = '#8B7D6B';
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const radius = 18 + Math.sin(i * 2) * 6;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
          
        case 'satellite':
          // Űr szatelit
          ctx.fillStyle = '#C0C0C0';
          
          // Upper satellite
          ctx.fillRect(pipe.x + 5, pipe.top - 20, w.pipeW - 10, 20);
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(pipe.x - 5, pipe.top - 15, w.pipeW + 10, 3);
          ctx.fillRect(pipe.x - 5, pipe.top - 8, w.pipeW + 10, 3);
          
          // Lower satellite  
          ctx.fillStyle = '#C0C0C0';
          ctx.fillRect(pipe.x + 5, pipe.top + w.gap, w.pipeW - 10, 20);
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(pipe.x - 5, pipe.top + w.gap + 5, w.pipeW + 10, 3);
          ctx.fillRect(pipe.x - 5, pipe.top + w.gap + 12, w.pipeW + 10, 3);
          
          // Blinking lights
          if (time.current.frameCount % 60 < 30) {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(pipe.x + w.pipeW/2, pipe.top - 10, 2, 0, Math.PI * 2);
            ctx.arc(pipe.x + w.pipeW/2, pipe.top + w.gap + 10, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
          
        default: // Classic pipe
          ctx.fillStyle = '#228B22';
          ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
          ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
          
          // Cső sapka
          ctx.fillStyle = '#32CD32';
          ctx.fillRect(pipe.x - 3, pipe.top - 15, w.pipeW + 6, 15);
          ctx.fillRect(pipe.x - 3, pipe.top + w.gap, w.pipeW + 6, 15);
      }
      
      // Debug hitbox
      if (debug) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, w.pipeW, pipe.top);
        ctx.strokeRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
      }
    });
    
    // Power-upok
    powerUps.current.forEach(powerUp => {
      if (!powerUp.collected) {
        const pulse = Math.sin(powerUp.animTime * 0.1) * 0.2 + 1;
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.scale(pulse, pulse);
        
        switch (powerUp.type) {
          case 'shield':
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('🛡', -6, 4);
            break;
          case 'slow':
            ctx.fillStyle = '#9932CC';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('⏰', -6, 4);
            break;
          case 'score':
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('★', -5, 4);
            break;
          case 'magnet':
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('🧲', -6, 4);
            break;
          case 'double':
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('2x', -5, 4);
            break;
          case 'rainbow':
            const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
            const colorIndex = Math.floor(powerUp.animTime * 0.1) % rainbowColors.length;
            ctx.fillStyle = rainbowColors[colorIndex];
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('🌈', -6, 4);
            break;
        }
        ctx.restore();
      }
    });
    
    // Érmék
    gameCoins.current.forEach(coin => {
      if (!coin.collected) {
        const bounce = Math.sin(coin.animTime * 0.15) * 3;
        const scale = coin.value > 1 ? 1.3 : 1.0;
        ctx.save();
        ctx.translate(coin.x, coin.y + bounce);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = coin.value > 1 ? '#FFD700' : '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(coin.value > 1 ? '💰' : '🪙', 0, 4);
        
        ctx.restore();
      }
    });
    
    // Részecskék (beleértve weather particles)
    particles.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
    });
    
    // Weather particles külön renderelése
    weather.current.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      
      switch (particle.type) {
        case 'rain':
          ctx.strokeStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * 3, particle.y - particle.vy * 3);
          ctx.stroke();
          break;
        case 'snow':
          ctx.fillStyle = particle.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'fog':
          ctx.fillStyle = particle.color + Math.floor(alpha * 60).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'aurora':
          // Aurora borealis effect
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const waveAlpha = Math.sin(time.current.frameCount * 0.05 + particle.x * 0.01) * 0.3 + 0.7;
          ctx.fillStyle = particle.color + Math.floor(alpha * waveAlpha * 120).toString(16).padStart(2, '0');
          
          // Create wavy aurora shape
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size, particle.y);
          for (let x = 0; x < particle.size * 2; x += 5) {
            const waveY = particle.y + Math.sin((particle.x + x) * 0.02 + time.current.frameCount * 0.03) * 15;
            ctx.lineTo(particle.x - particle.size + x, waveY);
          }
          ctx.lineTo(particle.x + particle.size, particle.y + 20);
          ctx.lineTo(particle.x - particle.size, particle.y + 20);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
      }
      ctx.restore();
    });
    
    // Rainbow trail
    if (b.rainbow > 0) {
      b.trail.forEach((point, index) => {
        const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const colorIndex = (index + time.current.frameCount) % rainbowColors.length;
        ctx.fillStyle = rainbowColors[colorIndex] + Math.floor(point.alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 * point.alpha, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Madár - sprite-based renderelés
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    
    // Current animation frame
    const currentFrame = birdSprites.current.flying.frames[b.wingCycle];
    
    // Combination mode auras (render in order of power)
    if (b.superMode > 0) {
      // Super mode: Golden rotating ring
      const superAlpha = Math.sin(time.current.frameCount * 0.4) * 0.4 + 0.6;
      ctx.save();
      ctx.rotate(time.current.frameCount * 0.1);
      ctx.strokeStyle = `rgba(255, 215, 0, ${superAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    
    if (b.megaMode > 0) {
      // Mega mode: Pink pulsing hexagon
      const megaAlpha = Math.sin(time.current.frameCount * 0.3) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 105, 180, ${megaAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * (b.r + 15);
        const y = Math.sin(angle) * (b.r + 15);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    if (b.godMode > 0) {
      // God mode: Epic multi-layered cosmic aura
      const godAlpha = Math.sin(time.current.frameCount * 0.2) * 0.2 + 0.8;
      
      // Outer cosmic ring
      ctx.save();
      ctx.rotate(-time.current.frameCount * 0.05);
      ctx.strokeStyle = `rgba(153, 102, 255, ${godAlpha})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 20, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner energy ring
      ctx.rotate(time.current.frameCount * 0.15);
      ctx.strokeStyle = `rgba(255, 255, 255, ${godAlpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      
      // Cosmic particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time.current.frameCount * 0.03;
        const distance = b.r + 25 + Math.sin(time.current.frameCount * 0.1 + i) * 5;
        const px = Math.cos(angle) * distance;
        const py = Math.sin(angle) * distance;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${godAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Standard auras (only if no combo mode active)
    if (b.superMode === 0 && b.megaMode === 0 && b.godMode === 0) {
      // Magnet aura
      if (b.magnet > 0) {
        const magnetAlpha = Math.sin(time.current.frameCount * 0.2) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 69, 0, ${magnetAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Double points aura
      if (b.doublePoints > 0) {
        const doubleAlpha = Math.sin(time.current.frameCount * 0.25) * 0.4 + 0.6;
        ctx.strokeStyle = `rgba(50, 205, 50, ${doubleAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, b.r + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Pajzs effekt
      if (b.shield > 0) {
        const shieldAlpha = Math.sin(time.current.frameCount * 0.3) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(0, 191, 255, ${shieldAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, b.r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Madár test (animált) - enhanced with combo colors
    const bodyY = currentFrame.bodyOffset;
    
    if (b.godMode > 0) {
      // God mode: Cosmic shifting colors
      const cosmicColors = ['#9966FF', '#FF6699', '#66FFFF', '#FFFF66', '#FF9966'];
      const colorIndex = Math.floor(time.current.frameCount * 0.1) % cosmicColors.length;
      ctx.fillStyle = cosmicColors[colorIndex];
    } else if (b.superMode > 0) {
      // Super mode: Bright golden
      ctx.fillStyle = '#FFD700';
    } else if (b.megaMode > 0) {
      // Mega mode: Hot pink
      ctx.fillStyle = '#FF1493';
    } else if (b.rainbow > 0) {
      const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      const colorIndex = Math.floor(time.current.frameCount * 0.1) % rainbowColors.length;
      ctx.fillStyle = rainbowColors[colorIndex];
    } else {
      ctx.fillStyle = b.shield > 0 ? '#00BFFF' : '#FFD700';
    }
    ctx.beginPath();
    ctx.arc(0, bodyY, b.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Szárnyak animációja - enhanced colors
    let wingColor = '#FFA500';
    if (b.godMode > 0) wingColor = '#FFFFFF';
    else if (b.superMode > 0) wingColor = '#FFD700';
    else if (b.megaMode > 0) wingColor = '#FF69B4';
    else if (b.rainbow > 0) wingColor = '#FF69B4';
    
    ctx.fillStyle = wingColor;
    switch (currentFrame.wing) {
      case 'up':
        // Szárny felfelé
        ctx.beginPath();
        ctx.ellipse(-5, bodyY - 8, 8, 4, -0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'middle':
        // Szárny középen
        ctx.beginPath();
        ctx.ellipse(-8, bodyY - 2, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'down':
        // Szárny lefelé
        ctx.beginPath();
        ctx.ellipse(-5, bodyY + 5, 8, 4, 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    // Madár szem
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3, bodyY - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(4, bodyY - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Csőr
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(8, bodyY);
    ctx.lineTo(15, bodyY - 2);
    ctx.lineTo(15, bodyY + 2);
    ctx.closePath();
    ctx.fill();
    
    // Debug hitbox
    if (debug) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Talaj
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, w.h - w.groundH, w.w, w.groundH);
    
    // Füves talaj díszítés
    ctx.fillStyle = '#228B22';
    for (let x = 0; x < w.w; x += 20) {
      ctx.fillRect(x, w.h - w.groundH, 15, 8);
    }
    
    ctx.restore();
  }, [debug]);

  // Fő game loop
  const gameLoop = useCallback((now: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Delta time számítás
    if (time.current.last === 0) time.current.last = now;
    const deltaTime = now - time.current.last;
    time.current.last = now;
    
    // Csak futó állapotban frissítjük a játékot
    if (state === GameState.RUN) {
      updateGame(deltaTime);
    }
    
    // Renderelés minden frame-ben
    render(ctx);
    
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [state, updateGame, render]);

  // Canvas méretezés
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !wrapperRef.current) return;
    
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const rect = wrapper.getBoundingClientRect();
    
    // DPR-aware sizing
    const dpr = window.devicePixelRatio || 1;
    const worldAspect = world.current.w / world.current.h;
    const containerAspect = rect.width / rect.height;
    
    let canvasWidth, canvasHeight;
    
    if (containerAspect > worldAspect) {
      canvasHeight = rect.height;
      canvasWidth = canvasHeight * worldAspect;
    } else {
      canvasWidth = rect.width;
      canvasHeight = canvasWidth / worldAspect;
    }
    
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = world.current.w * dpr;
    canvas.height = world.current.h * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
    }
  }, []);

  // Event handlerek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
        case 'ArrowUp':
          e.preventDefault();
          flap();
          break;
        case 'KeyP':
          togglePause();
          break;
        case 'KeyR':
          if (state === GameState.GAMEOVER) restart();
          break;
        case 'KeyD':
          setDebug(d => !d);
          break;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && state === GameState.RUN) {
        setState(GameState.PAUSE);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flap, togglePause, restart, state]);

  // Canvas és resize setup
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Game loop indítás
  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  // Kezdő háttér objektumok
  useEffect(() => {
    if (bgObjects.current.length === 0) {
      for (let i = 0; i < 3; i++) {
        bgObjects.current.push({
          x: Math.random() * world.current.w,
          y: 20 + Math.random() * 100,
          type: 'cloud',
          size: 12 + Math.random() * 20,
          speed: 0.3 + Math.random() * 0.2
        });
      }
    }
  }, []);

  return (
    <div 
      ref={wrapperRef}
      className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden"
      style={{ 
        cursor: state === GameState.RUN ? 'pointer' : 'default',
        touchAction: 'none', // Megakadályozza a zoom/scroll/double-tap
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-800 shadow-2xl"
        onClick={flap}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          flap();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
        }}
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Score */}
        {state === GameState.RUN && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="score-display">
              {score} {bird.current.doublePoints > 0 && <span className="text-green-400">2x</span>}
            </div>
            <div className="text-center">
              {/* Coins */}
              <div className="text-yellow-400 text-lg font-bold">
                🪙 {coins}
              </div>
              
              {/* Active effects */}
              <div className="flex justify-center gap-2 mt-1">
                {/* Combination effects (priority display) */}
                {bird.current.godMode > 0 && (
                  <div className="text-purple-300 text-sm font-bold animate-pulse">
                    🌟 GOD MODE {Math.ceil(bird.current.godMode / 60)}s
                  </div>
                )}
                {bird.current.superMode > 0 && bird.current.godMode === 0 && (
                  <div className="text-yellow-300 text-sm font-bold animate-bounce">
                    ⚡ SUPER MODE {Math.ceil(bird.current.superMode / 60)}s
                  </div>
                )}
                {bird.current.megaMode > 0 && bird.current.godMode === 0 && (
                  <div className="text-pink-400 text-sm font-bold animate-ping">
                    💎 MEGA MODE {Math.ceil(bird.current.megaMode / 60)}s
                  </div>
                )}
                
                {/* Standard effects (only show if no combo active) */}
                {bird.current.godMode === 0 && bird.current.superMode === 0 && bird.current.megaMode === 0 && (
                  <>
                    {bird.current.shield > 0 && (
                      <div className="text-blue-400 text-sm font-bold">
                        🛡 {Math.ceil(bird.current.shield / 60)}s
                      </div>
                    )}
                    {bird.current.slowMotion > 0 && (
                      <div className="text-purple-400 text-sm font-bold">
                        ⏰ {Math.ceil(bird.current.slowMotion / 60)}s
                      </div>
                    )}
                    {bird.current.magnet > 0 && (
                      <div className="text-orange-400 text-sm font-bold">
                        🧲 {Math.ceil(bird.current.magnet / 60)}s
                      </div>
                    )}
                    {bird.current.doublePoints > 0 && (
                      <div className="text-green-400 text-sm font-bold">
                        2x {Math.ceil(bird.current.doublePoints / 60)}s
                      </div>
                    )}
                    {bird.current.rainbow > 0 && (
                      <div className="text-pink-400 text-sm font-bold animate-pulse">
                        🌈 {Math.ceil(bird.current.rainbow / 60)}s
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Combo window indicator */}
              {bird.current.comboWindow > 0 && bird.current.godMode === 0 && bird.current.superMode === 0 && bird.current.megaMode === 0 && (
                <div className="text-yellow-300 text-xs font-bold mt-1 animate-pulse">
                  ⚡ COMBO READY! ({Math.ceil(bird.current.comboWindow / 60)}s)
                </div>
              )}
              
              {/* Weather indicator */}
              {weather.current.type !== 'clear' && (
                <div className="text-white text-sm font-bold mt-1">
                  {weather.current.type === 'rain' && '🌧️ Esik'}
                  {weather.current.type === 'snow' && '❄️ Havazik'}
                  {weather.current.type === 'fog' && '🌫️ Ködös'}
                  {weather.current.type === 'aurora' && '🌌 Aurora'}
                </div>
              )}
              
              {/* Biome indicator */}
              <div className="text-white text-xs font-bold mt-1 opacity-75">
                {currentBiome.current.id === 'forest' && '🌲 Varázserdő'}
                {currentBiome.current.id === 'city' && '🏙️ Cyber Város'}
                {currentBiome.current.id === 'space' && '🚀 Galaktikus Űr'}
                {score >= 10 && (
                  <div className="text-yellow-400 text-xs">
                    Következő biome: {Math.floor((score + 10) / 10) * 10} pont
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Pause indicator */}
        {state === GameState.PAUSE && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="pixel-text text-white text-6xl animate-pulse">⏸</div>
            <div className="pixel-text text-white text-xl text-center mt-4">SZÜNET</div>
          </div>
        )}
        
        {/* Menu */}
        {state === GameState.MENU && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="pixel-text text-4xl md:text-6xl mb-8 animate-float">
                🐦 SZENYO-MADÁR
              </h1>
              <p className="pixel-text text-lg mb-8">
                Kattints vagy nyomd meg a SPACE-t az ugráshoz!
              </p>
              <div className="space-y-4 pointer-events-auto">
                <button 
                  onClick={flap}
                  className="pixel-button px-8 py-4 text-xl"
                >
                  ▶ JÁTÉK START
                </button>
                <button 
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="pixel-button px-6 py-3 text-lg block mx-auto"
                >
                  📖 UTASÍTÁSOK
                </button>
                <button 
                  onClick={() => setDebug(!debug)}
                  className="pixel-button px-6 py-3 text-sm block mx-auto"
                >
                  {debug ? '🔍 DEBUG KI' : '🔍 DEBUG BE'}
                </button>
              </div>
              <div className="mt-8">
                <div className="pixel-text text-yellow-400 text-xl">
                  🏆 Best: {best}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        {showInstructions && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md text-white pixel-text">
              <h2 className="text-2xl mb-4 text-center">📖 Utasítások</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Vezérlés:</strong></p>
                <p>• Kattintás / Érintés / SPACE / ↑ = Ugrás</p>
                <p>• P = Szünet</p>
                <p>• R = Újrakezdés (game over után)</p>
                <p>• D = Debug mód</p>
                
                <p className="mt-4"><strong>Power-upok:</strong></p>
                <p>🛡 <span className="text-blue-400">Pajzs</span> - 5mp védelem</p>
                <p>⏰ <span className="text-purple-400">Lassítás</span> - 3mp slow motion</p>
                <p>★ <span className="text-yellow-400">Bónusz</span> - +5 pont</p>
                <p>🧲 <span className="text-orange-400">Mágnes</span> - 4mp érme vonzás</p>
                <p>2x <span className="text-green-400">Dupla pont</span> - 5mp dupla pontszám</p>
                <p>🌈 <span className="text-pink-400">Szivárvány</span> - 5mp varázslatos mód</p>
                
                <p className="mt-4"><strong>🔥 KOMBINÁCIÓ MÓDOK:</strong></p>
                <p>⚡ <span className="text-yellow-300">SUPER MODE</span> - Pajzs + Lassítás</p>
                <p>💎 <span className="text-pink-400">MEGA MODE</span> - Mágnes + Dupla</p>
                <p>🌟 <span className="text-purple-300">GOD MODE</span> - Szivárvány + Pajzs</p>
                <p className="text-xs text-gray-400 mt-2">Gyűjts 2 power-upot 3 másodpercen belül!</p>
                
                <p className="mt-4"><strong>Érmék:</strong></p>
                <p>🪙 <span className="text-yellow-400">Arany érme</span> - 1 pont</p>
                <p>💰 <span className="text-yellow-400">Kincs</span> - 5 pont (ritka)</p>
                
                <p className="mt-4"><strong>Célok:</strong></p>
                <p>• Kerüld el az akadályokat</p>
                <p>• Gyűjts power-upokat</p>
                <p>• Érj el magas pontszámot!</p>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="pixel-button px-6 py-3 mt-4 w-full"
              >
                ❌ Bezárás
              </button>
            </div>
          </div>
        )}
        
        {/* Game Over */}
        {state === GameState.GAMEOVER && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="pixel-text text-4xl md:text-6xl mb-4 text-red-500 animate-pulse-fast">
                💀 GAME OVER
              </h2>
              <div className="pixel-text text-2xl mb-2">Pontszám: {score}</div>
              <div className="pixel-text text-lg mb-2 text-yellow-400">🪙 Érmék: {coins}</div>
              <div className="pixel-text text-xl mb-8 text-yellow-400">
                🏆 Best: {best}
                {score > best && (
                  <div className="text-green-400 text-lg animate-pulse">
                    🎉 ÚJ REKORD! 🎉
                  </div>
                )}
              </div>
              
              {/* Achievements display */}
              <div className="mb-4">
                <div className="text-white text-lg pixel-text mb-2">🏆 Teljesítmények:</div>
                <div className="grid grid-cols-3 gap-2 max-w-xs">
                  {achievements.slice(0, 6).map(ach => (
                    <div key={ach.id} className={`text-2xl ${ach.unlocked ? 'opacity-100' : 'opacity-30'}`}>
                      {ach.icon}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 pointer-events-auto">
                <button 
                  onClick={flap}
                  className="pixel-button px-8 py-4 text-xl"
                >
                  🔄 ÚJ JÁTÉK
                </button>
                <button 
                  onClick={() => setState(GameState.MENU)}
                  className="pixel-button px-6 py-3 text-lg block mx-auto"
                >
                  🏠 FŐMENÜ
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Control hints */}
        {state === GameState.RUN && (
          <div className="absolute bottom-4 left-4 text-white text-sm pixel-text opacity-75">
            P = Szünet | D = Debug
          </div>
        )}
      </div>
    </div>
  );
}