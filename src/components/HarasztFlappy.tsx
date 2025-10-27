import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Haraszt Flappy – egy Flappy Bird jellegű mini‑game
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
}

// Power-up típusok
interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'slow' | 'score';
  collected: boolean;
  animTime: number;
}

// Háttér objektumok (felhők, stb.)
interface BackgroundObj {
  x: number;
  y: number;
  type: 'cloud' | 'star';
  size: number;
  speed: number;
}

export default function HarasztFlappy() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<typeof GameState[keyof typeof GameState]>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => {
    const v = localStorage.getItem("haraszt_flappy_best");
    return v ? parseInt(v, 10) : 0;
  });
  const [debug, setDebug] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Világ paraméterek (virtuális koordináta-rendszer)
  const world = useRef({
    w: 320, // világ szélesség (logikai px)
    h: 480, // világ magasság
    gravity: 0.35,
    jump: -5.8,
    speed: 1.8, // játék világ sebesség
    gap: 90, // akadály rés
    pipeW: 40,
    pipeSpace: 160, // akadály távolság
    groundH: 50,
  });

  // Játékos (madár) állapot
  const bird = useRef({ 
    x: 80, 
    y: 200, 
    vy: 0, 
    r: 12,
    angle: 0,
    shield: 0, // shield frames
    slowMotion: 0, // slow motion frames
  });

  // Akadályok (csövek / háztömbök)
  const pipes = useRef<{ x: number; top: number; passed: boolean; type: string }[]>([]);
  
  // Részecskék
  const particles = useRef<Particle[]>([]);
  
  // Power-upok
  const powerUps = useRef<PowerUp[]>([]);
  
  // Háttér objektumok
  const bgObjects = useRef<BackgroundObj[]>([]);
  
  // Idő és effektek
  const time = useRef({ 
    last: 0, 
    acc: 0, 
    frameCount: 0,
    cameraShake: 0,
    slowMotion: false 
  });

  // Hangeffektek (Web Audio API)
  const audioContext = useRef<AudioContext | null>(null);

  // Audio inicializálás
  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Hang generálás (8-bit stílusú)
  const playSound = useCallback((frequency: number, duration: number, type: 'jump' | 'score' | 'hit' | 'powerup' = 'jump') => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    const now = audioContext.current.currentTime;
    
    switch (type) {
      case 'jump':
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + duration);
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

  // Power-up generálás
  const spawnPowerUp = useCallback(() => {
    if (powerUps.current.length < 2 && Math.random() < 0.003) {
      const types: ('shield' | 'slow' | 'score')[] = ['shield', 'slow', 'score'];
      powerUps.current.push({
        x: world.current.w + 20,
        y: 60 + Math.random() * (world.current.h - world.current.groundH - 120),
        type: types[Math.floor(Math.random() * types.length)],
        collected: false,
        animTime: 0
      });
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
    bird.current = { x: 80, y: 200, vy: 0, r: 12, angle: 0, shield: 0, slowMotion: 0 };
    pipes.current = [];
    particles.current = [];
    powerUps.current = [];
    time.current = { last: 0, acc: 0, frameCount: 0, cameraShake: 0, slowMotion: false };
    
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

  // Ugrás (input)
  const flap = useCallback(() => {
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

  // Power-up ütközés
  const checkPowerUpCollisions = useCallback(() => {
    const b = bird.current;
    
    powerUps.current.forEach(powerUp => {
      if (!powerUp.collected) {
        const dx = powerUp.x - b.x;
        const dy = powerUp.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) {
          powerUp.collected = true;
          playSound(660, 0.2, 'powerup');
          createParticles(powerUp.x, powerUp.y, 8, '#FF69B4', 'sparkle');
          
          switch (powerUp.type) {
            case 'shield':
              bird.current.shield = 300; // 5 másodperc védelem
              break;
            case 'slow':
              bird.current.slowMotion = 180; // 3 másodperc lassítás
              break;
            case 'score':
              setScore(s => s + 5);
              break;
          }
        }
      }
    });
  }, [playSound, createParticles]);

  // Játék logika update
  const updateGame = useCallback((deltaTime: number) => {
    const dt = Math.min(deltaTime, 20); // Cap delta time
    const gameSpeed = bird.current.slowMotion > 0 ? 0.5 : 1.0;
    const w = world.current;
    const b = bird.current;
    
    time.current.frameCount++;
    
    // Madár fizika
    b.vy += w.gravity * gameSpeed;
    b.y += b.vy * gameSpeed;
    b.angle = Math.max(-0.5, Math.min(0.8, b.vy * 0.1));
    
    // Csövek mozgatása és generálása
    pipes.current.forEach(pipe => {
      pipe.x -= w.speed * gameSpeed;
    });
    
    // Új cső generálás
    if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < w.w - w.pipeSpace) {
      const minTop = 40;
      const maxTop = w.h - w.groundH - w.gap - 40;
      const top = minTop + Math.random() * (maxTop - minTop);
      
      pipes.current.push({
        x: w.w,
        top,
        passed: false,
        type: Math.random() < 0.3 ? 'building' : 'pipe'
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
    powerUps.current.forEach(powerUp => {
      if (!powerUp.collected) {
        powerUp.x -= w.speed * gameSpeed * 0.7;
        powerUp.animTime += dt;
      }
    });
    powerUps.current = powerUps.current.filter(p => p.x > -20);
    
    // Háttér objektumok
    spawnBackgroundObject();
    bgObjects.current.forEach(obj => {
      obj.x -= obj.speed * gameSpeed;
    });
    bgObjects.current = bgObjects.current.filter(obj => obj.x > -50);
    
    // Részecskék update
    particles.current.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life--;
    });
    particles.current = particles.current.filter(p => p.life > 0);
    
    // Effektek csökkentése
    if (b.shield > 0) b.shield--;
    if (b.slowMotion > 0) b.slowMotion--;
    if (time.current.cameraShake > 0) time.current.cameraShake--;
    
    // Power-up ütközések
    checkPowerUpCollisions();
    
    // Ütközés ellenőrzés (csak ha nincs pajzs)
    if (b.shield === 0 && checkCollisions()) {
      playSound(150, 0.5, 'hit');
      createParticles(b.x, b.y, 12, '#FF4444', 'explosion');
      time.current.cameraShake = 20;
      
      // Best score mentés
      if (score > best) {
        setBest(score);
        localStorage.setItem("haraszt_flappy_best", score.toString());
      }
      
      setState(GameState.GAMEOVER);
    }
  }, [score, best, checkCollisions, checkPowerUpCollisions, playSound, createParticles, spawnPowerUp, spawnBackgroundObject]);

  // Renderelés
  const render = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = world.current;
    const b = bird.current;
    const shake = time.current.cameraShake;
    
    // Kamera rázkódás
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 0.5 : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 0.5 : 0;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    // Háttér gradiens
    const gradient = ctx.createLinearGradient(0, 0, 0, w.h);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#98D8E8');
    gradient.addColorStop(1, '#DEB887');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w.w, w.h);
    
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
    
    // Csövek/épületek
    pipes.current.forEach(pipe => {
      if (pipe.type === 'building') {
        // Épület stílus
        ctx.fillStyle = '#444444';
        // Felső épület
        ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
        // Alsó épület
        ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
        
        // Ablakok
        ctx.fillStyle = '#FFFF99';
        for (let y = 10; y < pipe.top - 10; y += 20) {
          for (let x = pipe.x + 5; x < pipe.x + w.pipeW - 5; x += 15) {
            if (Math.random() < 0.7) {
              ctx.fillRect(x, y, 8, 12);
            }
          }
        }
        for (let y = pipe.top + w.gap + 10; y < w.h - w.groundH - 10; y += 20) {
          for (let x = pipe.x + 5; x < pipe.x + w.pipeW - 5; x += 15) {
            if (Math.random() < 0.7) {
              ctx.fillRect(x, y, 8, 12);
            }
          }
        }
      } else {
        // Klasszikus cső
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
        }
        ctx.restore();
      }
    });
    
    // Részecskék
    particles.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
    });
    
    // Madár
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    
    // Pajzs effekt
    if (b.shield > 0) {
      const shieldAlpha = Math.sin(time.current.frameCount * 0.3) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(0, 191, 255, ${shieldAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Madár test
    ctx.fillStyle = b.shield > 0 ? '#00BFFF' : '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Madár szem
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(4, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Csőr
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(15, -2);
    ctx.lineTo(15, 2);
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
    render(ctx, canvas);
    
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
      style={{ cursor: state === GameState.RUN ? 'pointer' : 'default' }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-800 shadow-2xl"
        onClick={flap}
        onTouchStart={(e) => {
          e.preventDefault();
          flap();
        }}
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Score */}
        {state === GameState.RUN && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="score-display">{score}</div>
            {bird.current.shield > 0 && (
              <div className="text-blue-400 text-sm font-bold text-center">
                🛡 Shield: {Math.ceil(bird.current.shield / 60)}s
              </div>
            )}
            {bird.current.slowMotion > 0 && (
              <div className="text-purple-400 text-sm font-bold text-center">
                ⏰ Slow Motion: {Math.ceil(bird.current.slowMotion / 60)}s
              </div>
            )}
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
                🐦 HARASZT FLAPPY
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
              <div className="pixel-text text-xl mb-8 text-yellow-400">
                🏆 Best: {best}
                {score > best && (
                  <div className="text-green-400 text-lg animate-pulse">
                    🎉 ÚJ REKORD! 🎉
                  </div>
                )}
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