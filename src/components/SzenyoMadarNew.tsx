import { useEffect, useRef, useState, useCallback } from "react";

// ===== 🔧 PHASE 4 UTILITY HOOKS IMPORT =====
import { 
  useInputManager, 
  usePerformanceManager, 
  useStorageManager, 
  useErrorTracker, 
  useMathUtils 
} from '../utils';

/**
 * ========================================
 * MONOLIT KÓD KOMPONENS SZÉTBONTÁSI TERV
 * ========================================
 * 
 * JÖVŐBELI KOMPONENSEK FELCÍMKÉZÉSE:
 * 
 * 🏗️ CORE SYSTEM COMPONENTS:
 * - GameEngine.tsx        - Fő játék logika és loop
 * - PhysicsEngine.tsx     - Fizika számítások (gravitáció, ütközés)
 * - RenderEngine.tsx      - Canvas renderelés és optimalizáció
 * 
 * 🎮 GAME LOGIC COMPONENTS:
 * - GameStateManager.tsx  - Játék állapot kezelés (menu, run, pause, gameover)
 * - PlayerController.tsx  - Input kezelés és madár vezérlés
 * - CollisionDetector.tsx - Ütközés detektálás és fizika
 * 
 * 🌍 ENVIRONMENT COMPONENTS:
 * - BiomeManager.tsx      - Biome rendszer és váltás
 * - WeatherSystem.tsx     - Időjárás effektek
 * - BackgroundRenderer.tsx- Háttér és parallax scrolling
 * 
 * 🚧 OBSTACLE COMPONENTS:
 * - ObstacleManager.tsx   - Akadályok spawn és kezelés
 * - PipeRenderer.tsx      - Csövek renderelése
 * - ObstacleRenderer.tsx  - Különféle akadályok (fa, épület)
 * 
 * 💫 EFFECT COMPONENTS:
 * - ParticleSystem.tsx    - Részecske effektek
 * - PowerUpManager.tsx    - Power-up spawn és logika
 * - CoinSystem.tsx        - Érme rendszer
 * 
 * 🎨 UI COMPONENTS:
 * - GameUI.tsx           - Fő játék felület
 * - MenuScreen.tsx       - Főmenü
 * - GameOverScreen.tsx   - Game over képernyő
 * - SettingsPanel.tsx    - Beállítások
 * - ScoreDisplay.tsx     - Pontszám kijelző
 * - DebugPanel.tsx       - Debug információk
 * 
 * 🐦 CHARACTER COMPONENTS:
 * - BirdRenderer.tsx     - Madár renderelés és animáció
 * - BirdSkinManager.tsx  - Skin rendszer
 * - BirdAbilities.tsx    - Madár képességek
 * 
 * 🏪 SHOP COMPONENTS:
 * - ShopSystem.tsx       - Bolt rendszer
 * - AchievementSystem.tsx- Achievement rendszer
 * - InventoryManager.tsx - Inventory kezelés
 * 
 * ⚡ PERFORMANCE COMPONENTS:
 * - PerformanceManager.tsx- Teljesítmény optimalizáció
 * - ConfigManager.tsx    - Konfigurációs beállítások
 * 
 * 💾 DATA COMPONENTS:
 * - SaveSystem.tsx       - Mentés/betöltés
 * - LocalStorageManager.tsx- LocalStorage kezelés
 * 
 * 🔊 AUDIO COMPONENTS:
 * - AudioManager.tsx     - Hang effektek és zene
 * - SoundPlayer.tsx      - Hang lejátszás
 */

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

// ===== 🎮 GAME STATE MANAGEMENT =====
// Jövőbeli GameStateManager.tsx komponens
// Játék állapot enum
const GameState = {
  MENU: "menu",
  RUN: "run",
  GAMEOVER: "gameover",
  PAUSE: "pause",
} as const;

// ===== 🌍 BIOME & ENVIRONMENT SYSTEM =====
// Jövőbeli BiomeManager.tsx komponens
// Biome típusok
interface Biome {
  id: 'forest' | 'city'; // space és ocean eltávolítva mert nem működnek
  name: string;
  backgroundColors: string[];
  obstacleTypes: ('pipe' | 'tree' | 'building')[];
  weatherTypes: ('clear' | 'rain' | 'snow' | 'fog')[];
  powerUpBonus: number; // power-up spawn rate multiplier
  musicTheme: string;
  particleColor: string;
}

// ===== ⚡ PERFORMANCE MANAGEMENT SYSTEM =====
// Jövőbeli PerformanceManager.tsx komponens
// Particle típusok
// Kiegyensúlyozott teljesítmény optimalizáció konstansok
const PERFORMANCE_CONFIG = {
  // Nagy teljesítmény - erős gépek
  high: {
    maxParticles: 150,
    maxPowerUps: 8,
    maxCoins: 10,
    reducedEffects: false,
    simplifiedRendering: false,
    weatherIntensity: 1.0
  },
  
  // Közepes teljesítmény - átlagos gépek
  medium: {
    maxParticles: 100,
    maxPowerUps: 6,
    maxCoins: 8,
    reducedEffects: false,
    simplifiedRendering: false,
    weatherIntensity: 0.8
  },
  
  // Alacsony teljesítmény - gyenge gépek/böngészők
  low: {
    maxParticles: 60,
    maxPowerUps: 5,
    maxCoins: 6,
    reducedEffects: true,
    simplifiedRendering: true,
    weatherIntensity: 0.6
  },
  
  // Minimális teljesítmény - nagyon gyenge gépek
  minimal: {
    maxParticles: 40,
    maxPowerUps: 4,
    maxCoins: 5,
    reducedEffects: true,
    simplifiedRendering: true,
    weatherIntensity: 0.2
  }
};

// Böngésző és hardver detektálás - 120 FPS optimalizált
const detectPerformanceLevel = () => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Mobil eszköz detektálás
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  
  // Böngésző típusok
  const isOldBrowser = ua.includes('msie') || ua.includes('trident');
  
  // Hardver info (ha elérhető)
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  // 120 FPS minden eszközön - agresszív optimalizáció mobilra
  if (isMobile) {
    // Modern mobil eszközök képesek 120 FPS-re
    return cores >= 6 ? 'high' : 'medium'; // Erős mobilok HIGH, gyengébbek MEDIUM
  }
  
  // Desktop optimalizáció - 120 FPS target
  if (isOldBrowser || cores < 2) return 'low'; // Régi böngészők
  if (cores < 4 || memory < 4) return 'medium';
  if (cores < 8 || memory < 8) return 'high';
  return 'high'; // Minden modern gép HIGH 120 FPS-hez
};

// Dinamikus teljesítmény konfig
const getPerfConfig = () => {
  const level = detectPerformanceLevel();
  return PERFORMANCE_CONFIG[level as keyof typeof PERFORMANCE_CONFIG];
};

// ===== 💫 PARTICLE SYSTEM =====
// Jövőbeli ParticleSystem.tsx komponens
interface Particle {
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

// ===== 💎 POWER-UP SYSTEM =====
// Jövőbeli PowerUpManager.tsx komponens
// Power-up típusok
interface PowerUp {
  x: number;
  y: number;
  type: 'shield' | 'slow' | 'score' | 'magnet' | 'double' | 'rainbow';
  collected: boolean;
  animTime: number;
}

// ===== 🪙 COIN SYSTEM =====
// Jövőbeli CoinSystem.tsx komponens
// Coin típus
interface Coin {
  x: number;
  y: number;
  collected: boolean;
  animTime: number;
  value: number;
}

// ===== 🏆 ACHIEVEMENT SYSTEM =====
// Jövőbeli AchievementSystem.tsx komponens
// Achievement típus
interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

// ===== 🌤️ BACKGROUND SYSTEM =====
// Jövőbeli BackgroundRenderer.tsx komponens
// Háttér objektumok (felhők, stb.)
interface BackgroundObj {
  x: number;
  y: number;
  type: 'cloud' | 'star';
  size: number;
  speed: number;
}

// ===== 🐦 BIRD SYSTEM =====
// Jövőbeli BirdRenderer.tsx és BirdSkinManager.tsx komponensek
// Bird skin típusok
interface BirdSkin {
  id: string;
  name: string;
  emoji: string;
  bodyColor: string;
  wingColor: string;
  unlockRequirement: {
    type: 'coins' | 'achievement' | 'score';
    value: number | string;
  };
  abilities: {
    jumpPower?: number; // 1.0 = normal
    gravity?: number; // 1.0 = normal  
    magnetBonus?: number; // 1.0 = normal
    shieldDuration?: number; // 1.0 = normal
    coinValue?: number; // 1.0 = normal
    extraLives?: number; // Extra életek száma
    canShoot?: boolean; // Tud-e lőni
    autoShield?: number; // Automatikus pajzs újratöltődés (sec)
    
    // Démoni Madár képességek
    lifeSteal?: boolean; // Életlopás ütközésnél
    darkAura?: number; // Sötét aura hatótávolság
    shadowTeleport?: number; // Árnyék teleport használatok száma
    
    // Villám Madár képességek
    lightningStrike?: number; // Villám csapás cooldown (sec)
    electricField?: boolean; // Elektromos mező
    chainLightning?: number; // Lánc villám max targets
    
    // Szupermadár képességek  
    flyThroughWalls?: number; // Hányszor repülhet át akadályokon
    superStrength?: boolean; // Akadályok összetörése ütközéskor
    laserVision?: boolean; // Lézer látás
    
    // UFO Madár képességek
    antiGravity?: boolean; // Anti-gravitáció
    abductionBeam?: boolean; // Abdukciós sugár
    warpSpeed?: number; // Warp jump használatok
    
    // Retro Gamer Madár képességek
    pixelMode?: boolean; // Pixel art mód
    powerUpMagnet?: boolean; // Automatikus power-up vonzás
    
    // Egyszarvú Madár képességek
    magicHorn?: boolean; // Mágikus szarv akadály áttöréshez
    hornCooldown?: number; // Szarv cooldown (sec)
  };
  description: string;
}

// ===== 🏗️ MAIN GAME COMPONENT =====
// Ez a nagy monolit komponens amit szét kell bontani
export default function SzenyoMadar() {
  // ===== � PHASE 4 UTILITY HOOKS =====
  // Advanced system hooks for modular architecture
  const inputManager = useInputManager({
    enableKeyboard: true,
    enableMouse: true,
    enableTouch: true,
    enableGestures: true,
    preventDefault: true
  }, {
    onKeyDown: (key: string, event: KeyboardEvent) => {
      // Ha a konzol nyitva van, ne akadályozzuk meg a billentyűzet használatát
      if (showConsole) {
        return; // Engedjük át minden billentyűt a konzolhoz
      }
      
      const b = bird.current;
      const currentSkin = birdSkins.current.find(skin => skin.id === selectedBirdSkin);
      
      switch (event.code) {
        case 'Space':
        case 'ArrowUp':
          event.preventDefault();
          flap();
          break;
        case 'KeyX':
        case 'KeyS':
          event.preventDefault();
          shoot();
          break;
        case 'KeyQ': // Demon Bird - Shadow Teleport
          event.preventDefault();
          if (currentSkin?.abilities.shadowTeleport && b.shadowTeleportsLeft > 0) {
            b.shadowTeleportsLeft--;
            b.y = Math.max(50, Math.min(world.current.h - 50, Math.random() * world.current.h));
            createParticles(b.x, b.y, 15, '#8B0000', 'explosion');
            playSound(400, 0.3, 'powerup');
          }
          break;
        case 'KeyE': // Super Bird - Wall Phase
          event.preventDefault();
          if (currentSkin?.abilities.flyThroughWalls && b.wallPhaseLeft > 0) {
            b.wallPhaseLeft = Math.min(b.wallPhaseLeft, 180); // 3 seconds max
            b.wallPhaseActive = true;
            createParticles(b.x, b.y, 10, '#0080FF', 'sparkle');
            playSound(600, 0.2, 'powerup');
          }
          break;
        case 'KeyF': // UFO Bird - Warp Speed
          event.preventDefault();
          if (currentSkin?.abilities.warpSpeed && b.warpJumpsLeft > 0) {
            b.warpJumpsLeft--;
            b.x += 150; // Quick forward movement
            createParticles(b.x, b.y, 12, '#00FF00', 'trail');
            playSound(800, 0.2, 'powerup');
          }
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
        default:
          break;
      }
    },
    onTap: (x: number, y: number) => {
      // Touch/click handling - trigger flap
      flap();
    }
  });
  
  const performanceManager = usePerformanceManager({
    targetFPS: 60,
    autoAdjustQuality: true,
    defaultQuality: 'high',
    enableMonitoring: true
  });
  
  const storageManager = useStorageManager({
    namespace: 'szenyo_madar',
    version: '1.0.0',
    autoSave: true,
    enableBackup: true
  });
  
  const errorTracker = useErrorTracker({
    enableLogging: true,
    enableCrashReporting: true
  });
  
  const mathUtils = useMathUtils();

  // ===== �🔗 DOM REFERENCES =====
  // Jövőbeli GameEngine.tsx komponensbe
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // ===== 🎮 GAME STATE HOOKS =====
  // Jövőbeli GameStateManager.tsx komponensbe
  const [state, setState] = useState<typeof GameState[keyof typeof GameState]>(GameState.MENU);
  const [score, setScore] = useState(0);
  
  // ===== 🪙 CURRENCY & ACHIEVEMENT HOOKS =====
  // Jövőbeli CoinSystem.tsx és AchievementSystem.tsx komponensekbe
  const [coins, setCoins] = useState<number>(() => {
    return storageManager.load("coins", 0);
  });
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const loadedAchievements = storageManager.loadAchievements();
    if (loadedAchievements.length > 0) {
      return loadedAchievements;
    }
    // Default achievements if none found
    return [
      { id: 'first_flight', name: 'Első Repülés', description: 'Repülj először!', unlocked: false, icon: '🐣' },
      { id: 'coin_collector', name: 'Érme Gyűjtő', description: 'Gyűjts 50 érmét!', unlocked: false, icon: '💰' },
      { id: 'high_flyer', name: 'Magas Repülő', description: 'Érj el 20 pontot!', unlocked: false, icon: '🚀' },
      { id: 'power_user', name: 'Power Felhasználó', description: 'Használj 10 power-upot!', unlocked: false, icon: '⚡' },
      { id: 'shield_master', name: 'Pajzs Mester', description: 'Túlélj 5 ütközést pajzzsal!', unlocked: false, icon: '🛡️' },
      { id: 'rainbow_rider', name: 'Szivárvány Lovas', description: 'Használd a rainbow mode-ot!', unlocked: false, icon: '🌈' }
    ];
  });
  
  // ===== 📊 SCORE & BEST HOOKS =====
  // Jövőbeli ScoreSystem.tsx komponensbe
  const [best, setBest] = useState<number>(() => {
    return storageManager.load<number>("best", 0) || 0;
  });
  
  // ===== 🐛 DEBUG & DEVELOPMENT HOOKS =====
  // Jövőbeli DebugPanel.tsx komponensbe
  const [debug, setDebug] = useState(false);
  
  // ===== ⚙️ SETTINGS & CONFIGURATION HOOKS =====
  // Jövőbeli SettingsManager.tsx komponensbe
  // Sebesség beállítások - játékban módosítható
  const [speedSettings, setSpeedSettings] = useState(() => {
    const saved = localStorage.getItem("szenyo_madar_speed_settings");
    return saved ? JSON.parse(saved) : {
      normal: 2.0,      // Alap sebesség
      slowMotion: 1.0,  // Slow motion sebesség
      rainbow: 3.0,     // Rainbow mode sebesség
      super: 4.0,       // Super mode sebesség
      godMode: 2.5      // God mode sebesség
    };
  });
  
  // ===== 📱 UI STATE HOOKS =====
  // Jövőbeli UI komponensekbe (MenuScreen.tsx, SettingsPanel.tsx, stb.)
  // Beállítások menü megjelenítése
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showBirdSelector, setShowBirdSelector] = useState(false);
  const [showBiomeSelector, setShowBiomeSelector] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleInput, setConsoleInput] = useState("");
  
  // ===== 🐦 BIRD CUSTOMIZATION HOOKS =====
  // Jövőbeli BirdSkinManager.tsx komponensbe
  const [selectedBirdSkin, setSelectedBirdSkin] = useState<string>(() => {
    return localStorage.getItem("szenyo_madar_selected_skin") || "classic";
  });
  
  // ===== 🌍 BIOME SELECTION HOOKS =====
  // Jövőbeli BiomeManager.tsx komponensbe
  const [startingBiome, setStartingBiome] = useState<number>(() => {
    const saved = localStorage.getItem("szenyo_madar_starting_biome");
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // ===== 🎮 CONTROL SETTINGS HOOKS =====
  // Jövőbeli ControlManager.tsx komponensbe
  const [buttonPosition, setButtonPosition] = useState<'left' | 'right'>(() => {
    const saved = localStorage.getItem("szenyo_madar_button_position");
    return (saved as 'left' | 'right') || 'left';
  });

  // ===== 🚨 ERROR TRACKING HOOKS =====
  // Jövőbeli ErrorTracker.tsx komponensbe
  // Error tracking and crash reporting
  const [, setGameErrors] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string>('');
  const errorLogRef = useRef<Array<{
    timestamp: string;
    error: string;
    birdSkin: string;
    gameState: string;
    score: number;
    biome: string;
    abilities: any;
    stackTrace?: string;
  }>>([]);

  // Bird skins definition
  const birdSkins = useRef<BirdSkin[]>([
    {
      id: "classic",
      name: "Klasszikus Madár",
      emoji: "🐦",
      bodyColor: "#FFD700",
      wingColor: "#FFA500",
      unlockRequirement: { type: "coins", value: 0 },
      abilities: {},
      description: "Az eredeti szenyo-madár"
    },
    {
      id: "eagle",
      name: "Sas",
      emoji: "🦅",
      bodyColor: "#8B4513",
      wingColor: "#A0522D",
      unlockRequirement: { type: "score", value: 50 },
      abilities: { jumpPower: 1.2, gravity: 0.9 },
      description: "Erősebb ugrás és jobb irányítás"
    },
    {
      id: "penguin",
      name: "Pingvin",
      emoji: "🐧",
      bodyColor: "#000000",
      wingColor: "#FFFFFF",
      unlockRequirement: { type: "achievement", value: "shield_master" },
      abilities: { gravity: 0.7, shieldDuration: 1.5 },
      description: "Lassabb zuhanás és hosszabb pajzs"
    },
    {
      id: "duck",
      name: "Kacsa",
      emoji: "🦆",
      bodyColor: "#FFFF00",
      wingColor: "#FF8C00",
      unlockRequirement: { type: "coins", value: 100 },
      abilities: { magnetBonus: 1.5, coinValue: 1.2 },
      description: "Jobb érme gyűjtés és mágnes"
    },
    {
      id: "dove",
      name: "Galamb",
      emoji: "🕊️",
      bodyColor: "#F8F8FF",
      wingColor: "#E6E6FA",
      unlockRequirement: { type: "achievement", value: "rainbow_rider" },
      abilities: { shieldDuration: 2.0, jumpPower: 0.9 },
      description: "Békés repülés extra védelem"
    },
    {
      id: "parrot",
      name: "Papagáj",
      emoji: "🦜",
      bodyColor: "#FF69B4",
      wingColor: "#00CED1",
      unlockRequirement: { type: "coins", value: 250 },
      abilities: { jumpPower: 1.1, magnetBonus: 1.3, coinValue: 1.1 },
      description: "Színes és sokoldalú képességek"
    },
    {
      id: "robot",
      name: "Robot Madár",
      emoji: "🤖",
      bodyColor: "#C0C0C0",
      wingColor: "#696969",
      unlockRequirement: { type: "score", value: 100 },
      abilities: { extraLives: 3, autoShield: 15, gravity: 0.95 },
      description: "3 extra életet + auto-pajzs"
    },
    {
      id: "rambo",
      name: "Rambo Madár",
      emoji: "💪",
      bodyColor: "#8B4513",
      wingColor: "#556B2F",
      unlockRequirement: { type: "achievement", value: "high_flyer" },
      abilities: { canShoot: true, jumpPower: 1.15, shieldDuration: 1.3 },
      description: "Tud lőni az akadályokra!"
    },
    {
      id: "demon",
      name: "Démoni Madár",
      emoji: "😈",
      bodyColor: "#8B0000",
      wingColor: "#FF0000",
      unlockRequirement: { type: "score", value: 666 },
      abilities: { lifeSteal: true, darkAura: 50, shadowTeleport: 3, extraLives: 1 },
      description: "Sötét erők: életlopás és árnyék teleport!"
    },
    {
      id: "lightning",
      name: "Villám Madár",
      emoji: "⚡",
      bodyColor: "#FFD700",
      wingColor: "#00BFFF",
      unlockRequirement: { type: "achievement", value: "power_user" },
      abilities: { lightningStrike: 10, electricField: true, chainLightning: 3, jumpPower: 1.1 },
      description: "Villámgyors pusztítás elektromos erőkkel!"
    },
    {
      id: "super",
      name: "Szupermadár",
      emoji: "🦸‍♂️",
      bodyColor: "#FF0000",
      wingColor: "#0000FF",
      unlockRequirement: { type: "coins", value: 500 },
      abilities: { flyThroughWalls: 5, superStrength: true, laserVision: true, extraLives: 2 },
      description: "Szupererők: átrepülés és lézer látás!"
    },
    {
      id: "ufo",
      name: "UFO Madár",
      emoji: "🛸",
      bodyColor: "#C0C0C0",
      wingColor: "#00FF00",
      unlockRequirement: { type: "achievement", value: "coin_collector" },
      abilities: { antiGravity: true, abductionBeam: true, warpSpeed: 5, gravity: 0.3 },
      description: "Földönkívüli technológia és anti-gravitáció!"
    },
    {
      id: "gamer",
      name: "Retro Gamer Madár",
      emoji: "🎮",
      bodyColor: "#8A2BE2",
      wingColor: "#FF1493",
      unlockRequirement: { type: "score", value: 200 },
      abilities: { pixelMode: true, extraLives: 9, powerUpMagnet: true, coinValue: 1.5 },
      description: "Retro gaming: 9 élet és pixel art mód!"
    },
    {
      id: "unicorn",
      name: "Egyszarvú Madár",
      emoji: "🦄",
      bodyColor: "#FFB6C1",
      wingColor: "#DDA0DD",
      unlockRequirement: { type: "coins", value: 300 },
      abilities: { magicHorn: true, hornCooldown: 20, shieldDuration: 1.5, jumpPower: 1.2 },
      description: "Mágikus szarv 20 másodpercenként áttöri az akadályokat!"
    }
  ]);

  // Világ paraméterek (virtuális koordináta-rendszer)
  const world = useRef({
    w: 320, // világ szélesség (logikai px)
    h: 480, // világ magasság
    gravity: 0.119, // 5%-kal kevesebb gravitáció (volt: 0.125)
    jump: -3.83, // 10%-kal gyengébb ugrás (volt: -4.25)
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
    // Combat and special abilities
    lives: 1, // alap 1 élet
    maxLives: 1, // maximum lives
    autoShieldTimer: 0, // auto shield countdown
    bullets: [] as {x: number, y: number, vx: number, vy: number, life: number}[], // bullets for rambo
    canShoot: false, // shooting ability
    shootCooldown: 0, // shooting cooldown
    
    // Új őrült képességek
    // Démoni Madár
    shadowTeleportsLeft: 0, // hátralevő teleportálások
    darkAuraActive: false, // sötét aura aktív-e
    
    // Villám Madár
    lightningCooldown: 0, // villám cooldown
    electricFieldActive: false, // elektromos mező
    
    // Szupermadár
    wallPhaseLeft: 0, // hátralevő fal átrepülések
    laserActive: false, // lézer aktív
    
    // UFO Madár
    warpJumpsLeft: 0, // hátralevő warp jumpok
    antiGravActive: false, // anti-gravitáció aktív
    abductionActive: false, // abdukciós sugár
    
    // Retro Gamer Madár  
    pixelModeActive: false, // pixel art mód
    powerUpMagnetActive: false, // automatikus power-up vonzás
    
    // Egyszarvú Madár
    hornCooldown: 0, // szarv cooldown
    hornActive: false, // szarv használható-e
    
    // Szupermadár
    wallPhaseActive: false, // fal áthatolás állapot
  });

  // Valós FPS monitoring - performanceManager-rel kezelve
  const [fps, setFps] = useState(60);

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

  // Helper: Get current bird skin
  const getCurrentBirdSkin = useCallback(() => {
    return birdSkins.current.find(skin => skin.id === selectedBirdSkin) || birdSkins.current[0];
  }, [selectedBirdSkin]);

  // Helper: Check if skin is unlocked
  const isSkinUnlocked = useCallback((skin: BirdSkin) => {
    switch (skin.unlockRequirement.type) {
      case 'coins':
        return coins >= (skin.unlockRequirement.value as number);
      case 'score':
        return best >= (skin.unlockRequirement.value as number);
      case 'achievement':
        const achievement = achievements.find(ach => ach.id === skin.unlockRequirement.value);
        return achievement?.unlocked || false;
      default:
        return true;
    }
  }, [coins, best, achievements]);

  // Helper: Get unlocked skins count
  const getUnlockedSkinsCount = useCallback(() => {
    return birdSkins.current.filter(skin => isSkinUnlocked(skin)).length;
  }, [isSkinUnlocked]);

  // Helper: Select bird skin
  const selectBirdSkin = useCallback((skinId: string) => {
    const skin = birdSkins.current.find(s => s.id === skinId);
    if (skin && isSkinUnlocked(skin)) {
      setSelectedBirdSkin(skinId);
      localStorage.setItem("szenyo_madar_selected_skin", skinId);
    }
  }, [isSkinUnlocked]);

  // Helper: Select starting biome
  const selectStartingBiome = useCallback((biomeIndex: number) => {
    setStartingBiome(biomeIndex);
    localStorage.setItem("szenyo_madar_starting_biome", biomeIndex.toString());
  }, []);

  // Helper: Select button position
  const selectButtonPosition = useCallback((position: 'left' | 'right') => {
    setButtonPosition(position);
    localStorage.setItem("szenyo_madar_button_position", position);
  }, []);

  // Error logging - átmozgatva errorTracker-be
  const logError = useCallback((error: string, additionalInfo?: any) => {
    const currentSkin = getCurrentBirdSkin();
    
    errorTracker.logError(error, {
      gameState: state.toString(),
      score,
      birdSkin: currentSkin.id,
      biome: currentBiome.current.id,
      abilities: currentSkin.abilities,
      additionalInfo
    }, 'error', 'game');
    
    setGameErrors(prev => [...prev, error]);
    setLastError(error);
  }, [errorTracker, getCurrentBirdSkin, state, score]);

  // Helper: Handle console commands
  const handleConsoleCommand = useCallback((command: string) => {
    const cmd = command.toLowerCase().trim();
    
    if (cmd === "szeretlekmario") {
      // Unlock all bird skins
      const unlockedAchievements = [
        { id: 'first_flight', name: 'Első Repülés', description: 'Repülj először!', unlocked: true, icon: '🐣' },
        { id: 'coin_collector', name: 'Érme Gyűjtő', description: 'Gyűjts 50 érmét!', unlocked: true, icon: '💰' },
        { id: 'high_flyer', name: 'Magas Repülő', description: 'Érj el 20 pontot!', unlocked: true, icon: '🚀' },
        { id: 'power_user', name: 'Power Felhasználó', description: 'Használj 10 power-upot!', unlocked: true, icon: '⚡' },
        { id: 'shield_master', name: 'Pajzs Mester', description: 'Túlélj 5 ütközést pajzzsal!', unlocked: true, icon: '🛡️' },
        { id: 'rainbow_rider', name: 'Szivárvány Lovas', description: 'Használd a rainbow mode-ot!', unlocked: true, icon: '🌈' }
      ];
      
      setAchievements(unlockedAchievements);
      localStorage.setItem("szenyo_madar_achievements", JSON.stringify(unlockedAchievements));
      
      // Give lots of coins for score-based skins
      setCoins(999);
      localStorage.setItem("szenyo_madar_coins", "999");
      
      // Set high score for score-based unlocks
      setBest(999);
      localStorage.setItem("szenyo_madar_best", "999");
      
      alert("🎉 Minden madár skin feloldva! Mario ❤️");
      setShowConsole(false);
      setConsoleInput("");
    }
    // Extreme Bird unlock cheat codes
    else if (cmd === "dracarys") {
      setCoins(prev => prev + 200);
      localStorage.setItem("szenyo_madar_coins", (coins + 200).toString());
      alert("🔥 Démoni Madár képességek aktiválva! +200 érme");
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "area51") {
      setCoins(prev => prev + 300);
      localStorage.setItem("szenyo_madar_coins", (coins + 300).toString());
      alert("🛸 UFO Madár feloldva! +300 érme az idegen technológiáért");
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "gamer") {
      setCoins(prev => prev + 250);
      localStorage.setItem("szenyo_madar_coins", (coins + 250).toString());
      alert("🎮 Retro Gamer Madár power-up! +250 érme");
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "unicorn") {
      setCoins(prev => prev + 400);
      localStorage.setItem("szenyo_madar_coins", (coins + 400).toString());
      alert("🦄 Egyszarvú mágikus erő! +400 érme");
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "thunderstorm") {
      setBest(150);
      localStorage.setItem("szenyo_madar_best", "150");
      alert("⚡ Villám Madár villámcsapás! High score: 150");
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "superhero") {
      setBest(200);
      localStorage.setItem("szenyo_madar_best", "200");
      alert("🦸‍♂️ Szupermadár képességek! High score: 200");
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "errorlog") {
      const logs = errorLogRef.current;
      if (logs.length === 0) {
        alert("✅ Nincsenek hibák a logban!");
      } else {
        const logSummary = logs.slice(-5).map((log, i) => 
          `${i + 1}. ${log.timestamp.split('T')[1].slice(0,8)} - ${log.birdSkin} - ${log.error}`
        ).join('\n');
        alert(`🚨 Utolsó 5 hiba:\n\n${logSummary}\n\nRészletek a konzolban (F12).`);
        console.table(logs);
      }
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "clearerrors") {
      errorLogRef.current = [];
      setGameErrors([]);
      setLastError('');
      localStorage.removeItem("szenyo_madar_error_log");
      alert("🧹 Error log törölve!");
      setShowConsole(false);
      setConsoleInput("");
    }
    // Új diagnosztikai és debug parancsok
    else if (cmd === "status" || cmd === "info") {
      const currentSkin = birdSkins.current.find(skin => skin.id === selectedBirdSkin);
      const b = bird.current;
      const statusInfo = `📊 JÁTÉK ÁLLAPOT:\n\n` +
        `🎯 Pontszám: ${score}\n` +
        `🏆 Legjobb: ${best}\n` +
        `💰 Érmék: ${coins}\n` +
        `🎮 Játék állapot: ${state === GameState.MENU ? 'MENU' : state === GameState.RUN ? 'FUTÓ' : state === GameState.GAMEOVER ? 'GAME OVER' : 'PAUSE'}\n` +
        `🐦 Madár skin: ${currentSkin?.name || 'Alapértelmezett'}\n` +
        `📍 Madár pozíció: x=${Math.round(b.x)}, y=${Math.round(b.y)}\n` +
        `🌡️ FPS: ~${Math.round(1000/16.67)}\n` +
        `🚨 Hibák száma: ${errorLogRef.current.length}\n` +
        `🎪 Aktív biom: ${currentBiome.current.id}\n` +
        `📱 Touch kontrollok: ${buttonPosition}`;
      alert(statusInfo);
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "performance" || cmd === "perf") {
      const perfInfo = `⚡ TELJESÍTMÉNY ADATOK:\n\n` +
        `🖥️ Eszköz pixel ratio: ${window.devicePixelRatio || 1}\n` +
        `📐 Képernyő felbontás: ${window.screen.width}x${window.screen.height}\n` +
        `🌐 Böngésző: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                      navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                      navigator.userAgent.includes('Safari') ? 'Safari' : 'Egyéb'}\n` +
        `📱 Mobil eszköz: ${/Mobi|Android/i.test(navigator.userAgent) ? 'Igen' : 'Nem'}\n` +
        `⚡ Target FPS: 60\n` +
        `🎮 Game loop: requestAnimationFrame\n` +
        `🎨 Canvas renderelés: 2D context\n` +
        `💾 LocalStorage használat: ${Object.keys(localStorage).filter(k => k.startsWith('szenyo_madar')).length} kulcs`;
      alert(perfInfo);
      console.log("🔧 Performance details:", {
        screen: { width: window.screen.width, height: window.screen.height },
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent,
        localStorage: Object.keys(localStorage).filter(k => k.startsWith('szenyo_madar'))
      });
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "birds" || cmd === "skins") {
      const availableSkins = birdSkins.current.map(skin => `${skin.id === selectedBirdSkin ? '✅' : '🔒'} ${skin.name} (${skin.id})`).join('\n');
      alert(`🐦 MADÁR SKINEK:\n\n${availableSkins}\n\n✅ = Feloldva\n🔒 = Zárva`);
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "abilities") {
      const currentSkin = birdSkins.current.find(skin => skin.id === selectedBirdSkin);
      if (!currentSkin) {
        alert("❌ Nincs kiválasztott madár skin!");
        setShowConsole(false);
        setConsoleInput("");
        return;
      }
      
      const abilities = Object.entries(currentSkin.abilities)
        .filter(([, value]) => value === true)
        .map(([key]) => key)
        .join(', ');
      
      const b = bird.current;
      const abilityStatus = `🎯 KÉPESSÉGEK - ${currentSkin.name}:\n\n` +
        `⚡ Aktív képességek: ${abilities || 'Nincs'}\n` +
        `🌑 Shadow teleport: ${b.shadowTeleportsLeft || 0} db\n` +
        `👻 Wall phase: ${b.wallPhaseLeft || 0} tick\n` +
        `🚀 Warp jumps: ${b.warpJumpsLeft || 0} db\n` +
        `⚡ Lightning cooldown: ${b.lightningCooldown || 0}\n` +
        `🔥 Dark aura: ${b.darkAuraActive ? 'Aktív' : 'Inaktív'}\n` +
        `⚡ Electric field: ${b.electricFieldActive ? 'Aktív' : 'Inaktív'}`;
      
      alert(abilityStatus);
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "reset" || cmd === "restart") {
      if (confirm("🔄 Biztosan újraindítod a játékot? (Pontszám elvész)")) {
        resetGame();
        alert("🎮 Játék újraindítva!");
      }
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "save") {
      try {
        localStorage.setItem("szenyo_madar_coins", coins.toString());
        localStorage.setItem("szenyo_madar_best", best.toString());
        localStorage.setItem("szenyo_madar_achievements", JSON.stringify(achievements));
        localStorage.setItem("szenyo_madar_starting_biome", startingBiome.toString());
        localStorage.setItem("szenyo_madar_button_position", buttonPosition);
        alert("💾 Játék mentve!");
      } catch (error) {
        alert("❌ Hiba a mentés során!");
        logError('Console save failed', error);
      }
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "export") {
      try {
        const exportData = {
          coins,
          best,
          achievements,
          startingBiome,
          buttonPosition,
          timestamp: new Date().toISOString(),
          version: "1.0"
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `flappy_bird_save_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        alert("📤 Játék adatok exportálva!");
      } catch (error) {
        alert("❌ Hiba az exportálás során!");
        logError('Console export failed', error);
      }
      setShowConsole(false);
      setConsoleInput("");
    }
    else if (cmd === "help" || cmd === "commands") {
      const helpText = `🆘 ELÉRHETŐ PARANCSOK:\n\n` +
        `🎮 JÁTÉK VEZÉRLÉS:\n` +
        `• status/info - Játék állapot megjelenítése\n` +
        `• reset/restart - Játék újraindítása\n` +
        `• save - Játék mentése\n` +
        `• export - Adatok exportálása\n\n` +
        `🐦 MADÁR KEZELÉS:\n` +
        `• birds/skins - Elérhető skinek listája\n` +
        `• abilities - Aktuális képességek\n\n` +
        `🔧 DIAGNOSZTIKA:\n` +
        `• performance/perf - Teljesítmény adatok\n` +
        `• errorlog - Hibák megjelenítése\n` +
        `• clearerrors - Hibák törlése\n\n` +
        `🎁 CHEAT KÓDOK:\n` +
        `• szeretlekmario - Minden feloldása\n` +
        `• dracarys, area51, gamer, unicorn - Érmék\n` +
        `• thunderstorm, superhero - High score`;
      alert(helpText);
      setShowConsole(false);
      setConsoleInput("");
    }
    else {
      alert("❌ Ismeretlen parancs. Írd be: 'help' a parancsok listájához!");
      setConsoleInput("");
    }
  }, [coins]);

  // Weather rendszer
  const weather = useRef({
    type: 'clear' as 'clear' | 'rain' | 'snow' | 'fog',
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
    }
  ]);

  // Initialize current biome with the selected starting biome - use useEffect to ensure proper initialization
  const currentBiome = useRef<Biome>(biomes.current[0]); // Default to first biome
  const biomeTransitionScore = useRef(0);

  // Initialize biome after startingBiome is loaded
  useEffect(() => {
    if (biomes.current[startingBiome]) {
      currentBiome.current = biomes.current[startingBiome];
    }
  }, [startingBiome]);

  // Load previous error logs on component mount
  useEffect(() => {
    try {
      const savedErrors = localStorage.getItem("szenyo_madar_error_log");
      if (savedErrors) {
        const parsed = JSON.parse(savedErrors);
        errorLogRef.current = parsed;
        if (parsed.length > 0) {
          setLastError(`${parsed.length} korábbi hiba betöltve`);
          setTimeout(() => setLastError(''), 3000);
        }
      }
    } catch (error) {
      console.warn('Failed to load error log:', error);
    }
  }, []);

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

  // Teljesítmény optimalizált részecske létrehozás
  const createParticles = useCallback((x: number, y: number, count: number, color: string, type: 'explosion' | 'trail' | 'sparkle' = 'explosion') => {
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
        size: type === 'sparkle' ? 1 + Math.random() * 2 : 2 + Math.random() * 3
      });
    }
  }, []);

  // Sebesség beállítások mentése
  const saveSpeedSettings = useCallback((newSettings: typeof speedSettings) => {
    setSpeedSettings(newSettings);
    localStorage.setItem("szenyo_madar_speed_settings", JSON.stringify(newSettings));
  }, []);

  // Teljesítmény optimalizált Power-up generálás
  const spawnPowerUp = useCallback(() => {
    const perfConfig = getPerfConfig();
    const biomeBonus = currentBiome.current.powerUpBonus;
    
    // Növelt spawn rate Opera esetén is
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
  }, []);

  // Érme generálás
  // Teljesítmény optimalizált Coin generálás
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
  }, []);

  // Teljesítmény optimalizált Weather effektek generálása
  const spawnWeatherParticles = useCallback(() => {
    const w = world.current;
    const weatherData = weather.current;
    const perfConfig = getPerfConfig();
    
    // Ha nincs időjárás vagy letiltott, ne hozzunk létre részecskéket
    if (weatherData.type === 'clear') return;
    
    // Adaptív időjárás intenzitás a teljesítmény szint alapján
    const adjustedIntensity = weatherData.intensity * (perfConfig.weatherIntensity || 1.0);
    const spawnRate = adjustedIntensity * 0.1;
    
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
    
    // Get current bird skin abilities
    const currentSkin = birdSkins.current.find(skin => skin.id === selectedBirdSkin);
    const extraLives = currentSkin?.abilities.extraLives || 0;
    
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
      comboWindow: 0,
      lives: 1 + extraLives,
      maxLives: 1 + extraLives,
      autoShieldTimer: currentSkin?.abilities.autoShield ? (currentSkin.abilities.autoShield * 60) : 0,
      bullets: [],
      canShoot: currentSkin?.abilities.canShoot || false,
      shootCooldown: 0,
      
      // Initialize new abilities based on current skin - with null safety
      shadowTeleportsLeft: (currentSkin?.abilities?.shadowTeleport ?? 0),
      darkAuraActive: Boolean(currentSkin?.abilities?.darkAura),
      lightningCooldown: 0,
      electricFieldActive: Boolean(currentSkin?.abilities?.electricField),
      wallPhaseLeft: (currentSkin?.abilities?.flyThroughWalls ?? 0),
      laserActive: Boolean(currentSkin?.abilities?.laserVision),
      warpJumpsLeft: (currentSkin?.abilities?.warpSpeed ?? 0),
      antiGravActive: Boolean(currentSkin?.abilities?.antiGravity),
      abductionActive: Boolean(currentSkin?.abilities?.abductionBeam),
      pixelModeActive: Boolean(currentSkin?.abilities?.pixelMode),
      powerUpMagnetActive: Boolean(currentSkin?.abilities?.powerUpMagnet),
      hornCooldown: 0,
      hornActive: Boolean(currentSkin?.abilities?.magicHorn),
      wallPhaseActive: false
    };
    pipes.current = [];
    particles.current = [];
    powerUps.current = [];
    gameCoins.current = [];
    time.current = { last: 0, acc: 0, frameCount: 0, cameraShake: 0, slowMotion: false, lastTap: 0, tapCooldown: 150 };
    
    // Set starting biome
    currentBiome.current = biomes.current[startingBiome];
    biomeTransitionScore.current = -10; // Reset transition score
    
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
  }, [selectedBirdSkin, startingBiome]);

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
    
    const currentSkin = getCurrentBirdSkin();
    const jumpMultiplier = currentSkin.abilities.jumpPower || 1.0;
    
    bird.current.vy = world.current.jump * jumpMultiplier;
    bird.current.angle = -0.3;
    playSound(440, 0.1, 'jump');
    
    // Trail részecskék
    createParticles(bird.current.x - 5, bird.current.y, 3, '#FFD700', 'trail');
  }, [state, resetGame, initAudio, playSound, createParticles, getCurrentBirdSkin]);

  // Lövés funkció (Rambo Bird)
  const shoot = useCallback(() => {
    if (state !== GameState.RUN) return;
    
    const b = bird.current;
    const currentSkin = getCurrentBirdSkin();
    
    if (currentSkin.abilities.canShoot && b.shootCooldown === 0) {
      // Create bullet
      b.bullets.push({
        x: b.x + 15,
        y: b.y,
        vx: 4, // bullet speed
        vy: 0,
        life: 180 // 3 seconds
      });
      
      b.shootCooldown = 30; // 0.5 second cooldown
      playSound(600, 0.1, 'hit');
      createParticles(b.x + 15, b.y, 3, '#FFFF00', 'sparkle');
    }
  }, [state, playSound, createParticles, getCurrentBirdSkin]);

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
    
    // Érme ütközések
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
          const currentSkin = getCurrentBirdSkin();
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

  // Játék logika update - stabil 60 FPS minden eszközön
  const updateGame = useCallback(() => {
    try {
      // Optimális 60 FPS timing - kényelmes és stabil játékélmény
      // Kiegyensúlyozott logika frissítés = smooth mozgás
      
      // Game physics - enhanced with combinations (módosítható sebességek)
      const b = bird.current;
      let speedMultiplier = speedSettings.normal; // Alapértelmezett sebesség - beállítható
      if (b.slowMotion > 0) speedMultiplier = speedSettings.slowMotion; // Slow motion - beállítható
      if (b.rainbow > 0 && b.godMode === 0) speedMultiplier = speedSettings.rainbow; // Rainbow mode - beállítható
      if (b.superMode > 0) speedMultiplier = speedSettings.super; // Super mode - beállítható
      if (b.godMode > 0) speedMultiplier = speedSettings.godMode; // God mode - beállítható
      
      const gameSpeed = speedMultiplier;
      const w = world.current;
      
      time.current.frameCount++;
      
      // Valós FPS számítás - performanceManager-rel
      const deltaTime = Date.now() - time.current.last;
      performanceManager.updateFPS(deltaTime);
      const fpsData = performanceManager.getFPSData();
      setFps(Math.round(fpsData.current));
    
    // Madár fizika és animáció - skin abilities (fix 60 FPS)
    const currentSkin = getCurrentBirdSkin();
    const gravityMultiplier = currentSkin.abilities.gravity || 1.0;
    
    b.vy += w.gravity * gameSpeed * gravityMultiplier;
    b.y += b.vy * gameSpeed;
    b.angle = Math.max(-0.5, Math.min(0.8, b.vy * 0.1));
    
    // Robot Bird auto-shield mechanic
    if (currentSkin.abilities.autoShield && b.autoShieldTimer > 0) {
      b.autoShieldTimer--;
      if (b.autoShieldTimer === 0 && b.shield === 0) {
        b.shield = 180; // 3 seconds of shield
        createParticles(b.x, b.y, 6, '#00FFFF', 'sparkle');
        playSound(400, 0.2, 'powerup');
        b.autoShieldTimer = (currentSkin.abilities.autoShield || 15) * 60; // Reset timer
      }
    }
    
    // Shooting cooldown for Rambo Bird
    if (b.shootCooldown > 0) b.shootCooldown--;
    
    // Update bullets
    b.bullets.forEach(bullet => {
      bullet.x += bullet.vx * gameSpeed;
      bullet.y += bullet.vy * gameSpeed;
      bullet.life--;
    });
    // Remove expired bullets
    b.bullets = b.bullets.filter(bullet => bullet.life > 0 && bullet.x < w.w + 50);
    
    // Bullet collision with pipes
    b.bullets.forEach(bullet => {
      pipes.current.forEach((pipe, pipeIndex) => {
        if (bullet.x + 3 > pipe.x && bullet.x - 3 < pipe.x + w.pipeW) {
          if (bullet.y - 3 < pipe.top || bullet.y + 3 > pipe.top + w.gap) {
            // Hit pipe - remove it and bullet
            pipes.current.splice(pipeIndex, 1);
            bullet.life = 0;
            createParticles(bullet.x, bullet.y, 8, '#FF8800', 'explosion');
            playSound(200, 0.2, 'hit');
            // Bonus points for destroying obstacles
            setScore(prev => prev + 2);
          }
        }
      });
    });

    // ⚡ VILLÁM MADÁR KÉPESSÉGEK ⚡
    if (currentSkin.abilities.lightningStrike) {
      if (b.lightningCooldown > 0) {
        b.lightningCooldown--;
      } else {
        // Lightning strike every X seconds
        b.lightningCooldown = (currentSkin.abilities.lightningStrike * 60);
        // Destroy closest pipe with lightning
        if (pipes.current.length > 0) {
          const closestPipe = pipes.current.find(pipe => pipe.x > b.x);
          if (closestPipe) {
            const pipeIndex = pipes.current.indexOf(closestPipe);
            if (pipeIndex !== -1) {
              pipes.current.splice(pipeIndex, 1);
              createParticles(closestPipe.x + w.pipeW/2, closestPipe.top + w.gap/2, 15, '#FFFF00', 'explosion');
              playSound(800, 0.3, 'hit');
              setScore(prev => prev + 3); // Lightning bonus
            }
          }
        }
      }
      
      // Electric field damages nearby pipes
      if (b.electricFieldActive) {
        // Safe iteration with reverse loop to avoid index issues
        for (let i = pipes.current.length - 1; i >= 0; i--) {
          const pipe = pipes.current[i];
          const distance = Math.abs(pipe.x + w.pipeW/2 - b.x);
          if (distance < 80) { // Electric field range
            pipes.current.splice(i, 1);
            createParticles(pipe.x + w.pipeW/2, pipe.top + w.gap/2, 8, '#00FFFF', 'sparkle');
            setScore(prev => prev + 1);
          }
        }
      }
    }

    // 😈 DÉMONI MADÁR KÉPESSÉGEK 😈
    if (currentSkin.abilities.darkAura && b.darkAuraActive) {
      // Dark aura destroys nearby pipes - safe iteration
      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const pipe = pipes.current[i];
        const distance = Math.abs(pipe.x + w.pipeW/2 - b.x);
        if (distance < (currentSkin.abilities.darkAura || 50)) {
          pipes.current.splice(i, 1);
          createParticles(pipe.x + w.pipeW/2, pipe.top + w.gap/2, 10, '#8B0000', 'explosion');
          playSound(150, 0.2, 'hit');
          // Life steal: restore health if damaged
          if (b.lives < b.maxLives) {
            b.lives++;
            createParticles(b.x, b.y, 5, '#FF0000', 'sparkle');
          }
        }
      }
    }

    // 🦸‍♂️ SZUPERMADÁR KÉPESSÉGEK 🦸‍♂️
    if (currentSkin.abilities.laserVision && b.laserActive) {
      // Laser vision destroys pipes in front - safe iteration
      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const pipe = pipes.current[i];
        if (pipe.x > b.x && pipe.x < b.x + 100) {
          pipes.current.splice(i, 1);
          createParticles(pipe.x + w.pipeW/2, pipe.top + w.gap/2, 12, '#FF0000', 'explosion');
          playSound(600, 0.2, 'hit');
          setScore(prev => prev + 2);
        }
      }
    }

    // 🛸 UFO MADÁR KÉPESSÉGEK 🛸
    if (currentSkin.abilities.antiGravity && b.antiGravActive) {
      // Override gravity for UFO
      b.vy *= 0.95; // Slow down falling
    }
    
    if (currentSkin.abilities.abductionBeam && b.abductionActive) {
      // Abduction beam pulls pipes upward and destroys them - safe iteration
      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const pipe = pipes.current[i];
        const distance = Math.abs(pipe.x + w.pipeW/2 - b.x);
        if (distance < 60) {
          pipe.top -= 2; // Pull upward
          if (pipe.top <= 0) {
            pipes.current.splice(i, 1);
            createParticles(pipe.x + w.pipeW/2, 50, 8, '#00FF00', 'sparkle');
            setScore(prev => prev + 2);
          }
        }
      }
    }

    // 🎮 RETRO GAMER MADÁR KÉPESSÉGEK 🎮
    if (currentSkin.abilities.powerUpMagnet && b.powerUpMagnetActive) {
      // Auto-collect power-ups and coins
      powerUps.current.forEach(powerUp => {
        const distance = Math.sqrt((powerUp.x - b.x) ** 2 + (powerUp.y - b.y) ** 2);
        if (distance < 100) { // Extended magnet range
          powerUp.x += (b.x - powerUp.x) * 0.3;
          powerUp.y += (b.y - powerUp.y) * 0.3;
        }
      });
      
      gameCoins.current.forEach(coin => {
        const distance = Math.sqrt((coin.x - b.x) ** 2 + (coin.y - b.y) ** 2);
        if (distance < 100) {
          coin.x += (b.x - coin.x) * 0.3;
          coin.y += (b.y - coin.y) * 0.3;
        }
      });
    }

    // 🦄 EGYSZARVÚ MADÁR KÉPESSÉGEK 🦄
    if (currentSkin.abilities.magicHorn) {
      if (b.hornCooldown > 0) {
        b.hornCooldown--;
      } else {
        b.hornActive = true;
      }
    }
    
    // Madár animáció frissítés (fix 60 FPS)
    b.animFrame += gameSpeed;
    if (b.animFrame >= 60 / birdSprites.current.flying.frameRate) {
      b.wingCycle = (b.wingCycle + 1) % birdSprites.current.flying.frames.length;
      b.animFrame = 0;
    }
    
    // Csövek mozgatása és generálása (fix 60 FPS)
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
    
    // Power-upok update és debug info
    spawnPowerUp();
    spawnCoin();
    
    // Debug: spawn info minden 5 másodpercben
    if (debug && time.current.frameCount % 300 === 0) {
      console.log(`Spawn Status - PowerUps: ${powerUps.current.length}/${getPerfConfig().maxPowerUps}, Coins: ${gameCoins.current.length}/${getPerfConfig().maxCoins}`);
    }
    
    powerUps.current.forEach(powerUp => {
      if (!powerUp.collected) {
        powerUp.x -= w.speed * gameSpeed * 0.7;
        powerUp.animTime += 1; // Fix increment
      }
    });
    powerUps.current = powerUps.current.filter(p => p.x > -20);
    
    // Érmék update és mega mode enhanced collection (fix 60 FPS)
    gameCoins.current.forEach(coin => {
      if (!coin.collected) {
        coin.x -= w.speed * gameSpeed * 0.8;
        coin.animTime += 1; // Fix increment
        
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
    
    // Háttér objektumok (fix 60 FPS)
    spawnBackgroundObject();
    bgObjects.current.forEach(obj => {
      obj.x -= obj.speed * gameSpeed;
    });
    bgObjects.current = bgObjects.current.filter(obj => obj.x > -50);
    
    spawnWeatherParticles(); // Weather effektek
    
    // Weather particles update (fix 60 FPS)
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
    
    // Részecske limitálás teljesítmény alapján
    const perfConfig = getPerfConfig();
    particles.current = particles.current.filter(p => p.life > 0).slice(-perfConfig.maxParticles);
    
    // Power-up ütközések
    checkPowerUpCollisions();
    
    // Achievement ellenőrzések
    if (score >= 1) unlockAchievement('first_flight');
    if (coins >= 50) unlockAchievement('coin_collector');
    if (score >= 20) unlockAchievement('high_flyer');
    
    // Coins localStorage mentés
    localStorage.setItem("szenyo_madar_coins", coins.toString());
    
    // 🦸‍♂️ SZUPERMADÁR - Fal áthatolás logika
    if (currentSkin.abilities.flyThroughWalls) {
      if (b.wallPhaseLeft > 0) {
        // Átlátszó és áthatoló állapot
        b.wallPhaseLeft--;
        if (b.wallPhaseLeft === 0) {
          b.wallPhaseActive = false;
        }
      }
    }

    // 🦄 EGYSZARVÚ MADÁR - Szarv ütközés logika (ütközés előtt!)
    if (currentSkin.abilities.magicHorn && b.hornActive) {
      // Szarv áttöri az akadályokat - safe iteration
      for (let i = pipes.current.length - 1; i >= 0; i--) {
        const pipe = pipes.current[i];
        if (b.x + b.r > pipe.x && b.x - b.r < pipe.x + w.pipeW) {
          if (b.y - b.r < pipe.top || b.y + b.r > pipe.top + w.gap) {
            // Szarv áttöri a csövet
            pipes.current.splice(i, 1);
            createParticles(pipe.x + w.pipeW/2, pipe.top + w.gap/2, 15, '#FF69B4', 'sparkle');
            playSound(400, 0.3, 'hit');
            setScore(prev => prev + 5); // Bonus unicorn horn points
          }
        }
      }
      
      // Horn cooldown reset
      b.hornActive = false;
      b.hornCooldown = (currentSkin.abilities.hornCooldown || 1200); // 20 seconds at 60fps
    }
    
    // Ütközés ellenőrzés (enhanced with combinations and lives system)
    const isInvulnerable = b.shield > 0 || b.rainbow > 0 || b.superMode > 0 || b.godMode > 0 || (b.wallPhaseLeft > 0);
    if (!isInvulnerable && checkCollisions()) {
      playSound(150, 0.5, 'hit');
      createParticles(b.x, b.y, 12, '#FF4444', 'explosion');
      time.current.cameraShake = 20;
      
      // Lives system for Robot Bird
      if (b.lives > 1) {
        b.lives--;
        // Reset position after losing a life
        b.y = 240;
        b.vy = 0;
        // Give temporary invulnerability
        b.shield = 120; // 2 seconds of shield
        createParticles(b.x, b.y, 8, '#FFD700', 'sparkle');
        playSound(300, 0.3, 'powerup');
      } else {
        // Best score mentés
        if (score > best) {
          setBest(score);
          localStorage.setItem("szenyo_madar_best", score.toString());
        }
        setState(GameState.GAMEOVER);
      }
    }
    } catch (error) {
      logError(`UpdateGame crashed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        birdSkin: getCurrentBirdSkin().id,
        birdState: bird.current,
        pipesCount: pipes.current.length,
        powerUpsCount: powerUps.current.length,
        score,
        gameState: state
      });
      
      // Try to recover gracefully
      try {
        if (state === GameState.RUN) {
          setState(GameState.PAUSE);
          alert(`🚨 Játék hiba történt!\nMadár: ${getCurrentBirdSkin().name}\nHiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}\n\nA játék szüneteltetve. Nyomj R-t az újraindításhoz.`);
        }
      } catch (recoveryError) {
        logError('Recovery failed', recoveryError);
        window.location.reload(); // Last resort
      }
    }
  }, [score, best, coins, checkCollisions, checkPowerUpCollisions, playSound, createParticles, spawnPowerUp, spawnCoin, spawnBackgroundObject, spawnWeatherParticles, unlockAchievement, checkPowerUpCombination, logError, getCurrentBirdSkin, state]);

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
    
    // Teljesítmény optimalizált háttér renderelés
    const perfConfig = getPerfConfig();
    const biome = currentBiome.current;
    let colors = [...biome.backgroundColors];
    
    // Weather color modifications
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
      default:
        // Use original biome colors
        break;
    }
    
    // Opera esetén egyszerűsített háttér - gradient nélkül
    if (perfConfig.simplifiedRendering) {
      ctx.fillStyle = colors[1]; // Középső szín használata
      ctx.fillRect(0, 0, w.w, w.h);
    } else {
      // Teljes gradient háttér
      const gradient = ctx.createLinearGradient(0, 0, 0, w.h);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w.w, w.h);
    }
    
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
    
    // Háttér objektumok renderelése
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
            const perfConfig = getPerfConfig();
            
            for (let y = 10; y < pipe.top - 10; y += 20) {
              for (let x = pipe.x + 5; x < pipe.x + w.pipeW - 5; x += 15) {
                if (Math.random() < 0.8) {
                  ctx.fillRect(x, y, 8, 12);
                  // Opera esetén neon glow mellőzése
                  if (!perfConfig.simplifiedRendering) {
                    ctx.shadowColor = '#00FFFF';
                    ctx.shadowBlur = 5;
                    ctx.fillRect(x, y, 8, 12);
                    ctx.shadowBlur = 0;
                  }
                }
              }
            }
            for (let y = pipe.top + w.gap + 10; y < w.h - w.groundH - 10; y += 20) {
              for (let x = pipe.x + 5; x < pipe.x + w.pipeW - 5; x += 15) {
                if (Math.random() < 0.8) {
                  ctx.fillRect(x, y, 8, 12);
                  if (!perfConfig.simplifiedRendering) {
                    ctx.shadowColor = '#00FFFF';
                    ctx.shadowBlur = 5;
                    ctx.fillRect(x, y, 8, 12);
                    ctx.shadowBlur = 0;
                  }
                }
              }
            }
          }
          break;
          
        case 'asteroid':
          // Valódi aszteroida akadályok - nem cső formájú!
          const asteroidSize = 35 + Math.sin(time.current.frameCount * 0.02 + pipe.x * 0.01) * 5;
          
          // Felső aszteroida
          ctx.save();
          ctx.translate(pipe.x + w.pipeW/2, pipe.top - 25);
          ctx.rotate(time.current.frameCount * 0.01 + pipe.x * 0.001);
          
          ctx.fillStyle = '#8B7D6B';
          ctx.beginPath();
          const sides1 = 12;
          for (let i = 0; i < sides1; i++) {
            const angle = (i / sides1) * Math.PI * 2;
            const radius = asteroidSize + Math.sin(i * 1.7 + pipe.x * 0.01) * 8;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          
          // Kraters
          ctx.fillStyle = '#696969';
          ctx.beginPath();
          ctx.arc(-12, -8, 6, 0, Math.PI * 2);
          ctx.arc(15, 10, 4, 0, Math.PI * 2);
          ctx.arc(-5, 12, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Bright spots (metal ore)
          ctx.fillStyle = '#A0A0A0';
          ctx.beginPath();
          ctx.arc(8, -15, 2, 0, Math.PI * 2);
          ctx.arc(-18, 3, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          
          // Alsó aszteroida - másik méret és forma
          ctx.save();
          ctx.translate(pipe.x + w.pipeW/2, pipe.top + w.gap + 25);
          ctx.rotate(time.current.frameCount * -0.008 + pipe.x * 0.002);
          
          const lowerAsteroidSize = 32 + Math.cos(time.current.frameCount * 0.015 + pipe.x * 0.01) * 4;
          ctx.fillStyle = '#7A6F5D';
          ctx.beginPath();
          const sides2 = 10;
          for (let i = 0; i < sides2; i++) {
            const angle = (i / sides2) * Math.PI * 2;
            const radius = lowerAsteroidSize + Math.sin(i * 2.1 + pipe.x * 0.015) * 6;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          
          // Kraters
          ctx.fillStyle = '#5A5A5A';
          ctx.beginPath();
          ctx.arc(-10, -6, 5, 0, Math.PI * 2);
          ctx.arc(12, 8, 3, 0, Math.PI * 2);
          ctx.arc(3, -12, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Ice spots (frozen areas)
          ctx.fillStyle = '#B0E0E6';
          ctx.beginPath();
          ctx.arc(-15, 5, 1.5, 0, Math.PI * 2);
          ctx.arc(8, 12, 1, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          
          // TELJES HITBOX KITÖLTÉSE TÖRMELÉKEKKEL - Egyértelmű repülési terület
          // Felső aszteroida teljes hitbox területe - 0-től pipe.top-ig
          for (let y = 0; y < pipe.top; y += 12) {
            for (let x = pipe.x; x < pipe.x + w.pipeW; x += 15) {
              // Különböző méretű és színű törmelékek
              const seed = (x * 0.1 + y * 0.2 + pipe.x * 0.01);
              const debrisSize = 4 + Math.sin(seed) * 6 + Math.cos(seed * 1.5) * 3; // 1-13 pixel
              const debrisX = x + Math.sin(time.current.frameCount * 0.02 + seed) * 8;
              const debrisY = y + Math.cos(time.current.frameCount * 0.015 + seed * 1.3) * 6;
              
              // Színvariációk
              const colorVariant = Math.floor((seed * 10) % 4);
              let debrisColor: string;
              switch(colorVariant) {
                case 0: debrisColor = '#666666'; break; // Sötét szürke
                case 1: debrisColor = '#808080'; break; // Közép szürke  
                case 2: debrisColor = '#999999'; break; // Világos szürke
                default: debrisColor = '#4A4A4A'; break; // Nagyon sötét
              }
              ctx.fillStyle = debrisColor;
              
              ctx.save();
              ctx.translate(debrisX, debrisY);
              ctx.rotate(time.current.frameCount * 0.01 + seed);
              
              // Különböző alakzatok
              const shape = Math.floor((seed * 7) % 5);
              switch(shape) {
                case 0: // Négyzet
                  ctx.fillRect(-debrisSize/2, -debrisSize/2, debrisSize, debrisSize);
                  break;
                case 1: // Kör
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/2, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 2: // Háromszög
                  ctx.beginPath();
                  ctx.moveTo(0, -debrisSize/2);
                  ctx.lineTo(-debrisSize/2, debrisSize/2);
                  ctx.lineTo(debrisSize/2, debrisSize/2);
                  ctx.closePath();
                  ctx.fill();
                  break;
                case 3: // Rombusz
                  ctx.beginPath();
                  ctx.moveTo(0, -debrisSize/2);
                  ctx.lineTo(debrisSize/2, 0);
                  ctx.lineTo(0, debrisSize/2);
                  ctx.lineTo(-debrisSize/2, 0);
                  ctx.closePath();
                  ctx.fill();
                  break;
                case 4: // Téglatest
                  ctx.fillRect(-debrisSize/3, -debrisSize/2, debrisSize * 0.66, debrisSize);
                  break;
              }
              ctx.restore();
            }
          }
          
          // Alsó aszteroida teljes hitbox területe - pipe.top + gap-től a földig
          for (let y = pipe.top + w.gap; y < w.h - w.groundH; y += 12) {
            for (let x = pipe.x; x < pipe.x + w.pipeW; x += 15) {
              // Különböző méretű és színű törmelékek
              const seed = (x * 0.15 + y * 0.25 + pipe.x * 0.012);
              const debrisSize = 3 + Math.sin(seed * 1.2) * 7 + Math.cos(seed * 0.8) * 4; // 1-14 pixel
              const debrisX = x + Math.sin(time.current.frameCount * 0.018 + seed) * 7;
              const debrisY = y + Math.cos(time.current.frameCount * 0.012 + seed * 1.1) * 5;
              
              // Másik színpaletta az alsó részhez
              const colorVariant = Math.floor((seed * 12) % 4);
              let debrisColor: string;
              switch(colorVariant) {
                case 0: debrisColor = '#555555'; break; // Sötétebb szürke
                case 1: debrisColor = '#777777'; break; // Közép
                case 2: debrisColor = '#8A8A8A'; break; // Világosabb
                default: debrisColor = '#3C3C3C'; break; // Legdöntebb
              }
              ctx.fillStyle = debrisColor;
              
              ctx.save();
              ctx.translate(debrisX, debrisY);
              ctx.rotate(time.current.frameCount * -0.008 + seed * 1.3);
              
              // Más alakzatok az alsó részben
              const shape = Math.floor((seed * 9) % 6);
              switch(shape) {
                case 0: // Hosszúkás téglalap
                  ctx.fillRect(-debrisSize/4, -debrisSize/2, debrisSize/2, debrisSize);
                  break;
                case 1: // Ellipszis
                  ctx.beginPath();
                  ctx.ellipse(0, 0, debrisSize/2, debrisSize/3, 0, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 2: // Pentagram
                  ctx.beginPath();
                  for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const radius = i % 2 === 0 ? debrisSize/2 : debrisSize/4;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                  }
                  ctx.closePath();
                  ctx.fill();
                  break;
                case 3: // Hexagon
                  ctx.beginPath();
                  for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const px = Math.cos(angle) * debrisSize/2;
                    const py = Math.sin(angle) * debrisSize/2;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                  }
                  ctx.closePath();
                  ctx.fill();
                  break;
                case 4: // L-alakzat
                  ctx.fillRect(-debrisSize/2, -debrisSize/2, debrisSize/3, debrisSize);
                  ctx.fillRect(-debrisSize/2, debrisSize/3, debrisSize, debrisSize/3);
                  break;
                case 5: // Plus alakzat
                  ctx.fillRect(-debrisSize/6, -debrisSize/2, debrisSize/3, debrisSize);
                  ctx.fillRect(-debrisSize/2, -debrisSize/6, debrisSize, debrisSize/3);
                  break;
              }
              ctx.restore();
            }
          }
          
          // Extra sűrű kis részecskék a sarkokhoz és szélehez
          for (let i = 0; i < 40; i++) {
            // Felső rész szélei
            const edgeX = pipe.x + (i % 2 === 0 ? 0 : w.pipeW) + Math.sin(time.current.frameCount * 0.05 + i) * 3;
            const edgeY = Math.random() * pipe.top;
            const particleSize = 1 + Math.random() * 2;
            
            ctx.fillStyle = '#333333';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(edgeX, edgeY, particleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            
            // Alsó rész szélei
            const lowerEdgeX = pipe.x + (i % 2 === 0 ? 0 : w.pipeW) + Math.cos(time.current.frameCount * 0.04 + i * 1.5) * 3;
            const lowerEdgeY = pipe.top + w.gap + Math.random() * (w.h - w.groundH - pipe.top - w.gap);
            
            ctx.fillStyle = '#2A2A2A';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(lowerEdgeX, lowerEdgeY, particleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
          break;
          
        case 'pipe':
          // Űrállomás alagút/átjáró (csak űr biome esetén)
          if (pipe.biome === 'space') {
            // Űrállomás alagút metalikus megjelenéssel
            const perfConfig = getPerfConfig();
            
            // Opera esetén egyszerűsített gradient
            if (perfConfig.simplifiedRendering) {
              ctx.fillStyle = '#708090';
            } else {
              const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + w.pipeW, 0);
              gradient.addColorStop(0, '#2F4F4F');
              gradient.addColorStop(0.5, '#708090');
              gradient.addColorStop(1, '#2F4F4F');
              ctx.fillStyle = gradient;
            }
            
            ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
            ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
            
            // Űrállomás panelok és fények
            ctx.fillStyle = '#1E90FF';
            for (let y = 10; y < pipe.top - 10; y += 25) {
              ctx.fillRect(pipe.x + 2, y, w.pipeW - 4, 3);
              // Opera esetén glow effect mellőzése
              if (!perfConfig.simplifiedRendering) {
                ctx.shadowColor = '#1E90FF';
                ctx.shadowBlur = 8;
                ctx.fillRect(pipe.x + 2, y, w.pipeW - 4, 3);
                ctx.shadowBlur = 0;
              }
            }
            for (let y = pipe.top + w.gap + 10; y < w.h - w.groundH - 10; y += 25) {
              ctx.fillRect(pipe.x + 2, y, w.pipeW - 4, 3);
              if (!perfConfig.simplifiedRendering) {
                ctx.shadowColor = '#1E90FF';
                ctx.shadowBlur = 8;
                ctx.fillRect(pipe.x + 2, y, w.pipeW - 4, 3);
                ctx.shadowBlur = 0;
              }
            }
            
            // Metalikus szegélyek
            ctx.fillStyle = '#B0C4DE';
            ctx.fillRect(pipe.x - 2, pipe.top - 8, w.pipeW + 4, 8);
            ctx.fillRect(pipe.x - 2, pipe.top + w.gap, w.pipeW + 4, 8);
            
            // Vészfények
            const blinkTime = Math.floor(time.current.frameCount / 30) % 2;
            if (blinkTime === 0) {
              ctx.fillStyle = '#FF4500';
              ctx.beginPath();
              ctx.arc(pipe.x + w.pipeW/2, pipe.top - 4, 3, 0, Math.PI * 2);
              ctx.arc(pipe.x + w.pipeW/2, pipe.top + w.gap + 4, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Klasszikus zöld cső más biome-okhoz
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
            ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
            
            // Cső sapka
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(pipe.x - 3, pipe.top - 15, w.pipeW + 6, 15);
            ctx.fillRect(pipe.x - 3, pipe.top + w.gap, w.pipeW + 6, 15);
          }
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
          
        case 'coral':
          // Korallzátony akadályok - víz alatti világ
          ctx.save();
          
          // Felső korall formáció
          ctx.translate(pipe.x + w.pipeW/2, pipe.top - 20);
          
          // Korall alapszín - élénk színek
          const coralColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
          const primaryColor = coralColors[Math.floor(pipe.x * 0.01) % coralColors.length];
          
          ctx.fillStyle = primaryColor;
          
          // Főkorall struktúra
          for (let i = 0; i < 5; i++) {
            const branchHeight = 25 + Math.sin(time.current.frameCount * 0.03 + i + pipe.x * 0.01) * 8;
            const branchWidth = 8 + Math.cos(time.current.frameCount * 0.02 + i * 1.5) * 3;
            const x = (i - 2) * 12 + Math.sin(time.current.frameCount * 0.04 + i) * 4;
            
            // Korall ág
            ctx.beginPath();
            ctx.ellipse(x, -branchHeight/2, branchWidth/2, branchHeight/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Korall részletek
            ctx.fillStyle = primaryColor === '#FF6B6B' ? '#FF9999' : '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x - 3, -branchHeight/2 - 5, 2, 0, Math.PI * 2);
            ctx.arc(x + 3, -branchHeight/2 + 3, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = primaryColor;
          }
          
          // Tengeri növények
          ctx.fillStyle = '#228B22';
          for (let i = 0; i < 3; i++) {
            const waveHeight = 15 + Math.sin(time.current.frameCount * 0.05 + i * 2) * 5;
            const x = (i - 1) * 15 + Math.sin(time.current.frameCount * 0.03 + i) * 3;
            
            ctx.beginPath();
            ctx.moveTo(x, 0);
            for (let j = 0; j < waveHeight; j += 3) {
              const wave = Math.sin(j * 0.3 + time.current.frameCount * 0.1 + i) * 4;
              ctx.lineTo(x + wave, -j);
            }
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          
          ctx.restore();
          
          // Alsó korall formáció
          ctx.save();
          ctx.translate(pipe.x + w.pipeW/2, pipe.top + w.gap + 20);
          
          const secondaryColor = coralColors[(Math.floor(pipe.x * 0.01) + 2) % coralColors.length];
          ctx.fillStyle = secondaryColor;
          
          // Alsó korall más formával
          for (let i = 0; i < 4; i++) {
            const branchHeight = 20 + Math.cos(time.current.frameCount * 0.025 + i + pipe.x * 0.015) * 6;
            const branchWidth = 10 + Math.sin(time.current.frameCount * 0.03 + i * 1.8) * 4;
            const x = (i - 1.5) * 15 + Math.cos(time.current.frameCount * 0.035 + i * 0.7) * 5;
            
            // Fan korall
            ctx.beginPath();
            ctx.arc(x, branchHeight/2, branchWidth, -Math.PI * 0.7, -Math.PI * 0.3);
            ctx.lineWidth = branchHeight * 0.8;
            ctx.stroke();
          }
          
          ctx.restore();
          
          // Buborékok a korallok körül
          ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
          for (let i = 0; i < 6; i++) {
            const bubbleX = pipe.x + 10 + (i * 8) + Math.sin(time.current.frameCount * 0.1 + i) * 5;
            const bubbleY = pipe.top - 30 + Math.sin(time.current.frameCount * 0.08 + i * 1.5) * 20;
            const bubbleSize = 2 + Math.sin(time.current.frameCount * 0.12 + i * 2) * 1;
            
            ctx.globalAlpha = 0.6 + Math.sin(time.current.frameCount * 0.1 + i) * 0.3;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }
          
          // TELJES HITBOX KITÖLTÉSE - Korallzátony területek
          // Felső korall hitbox - 0-től pipe.top-ig
          for (let y = 0; y < pipe.top; y += 14) {
            for (let x = pipe.x; x < pipe.x + w.pipeW; x += 16) {
              const seed = (x * 0.08 + y * 0.12 + pipe.x * 0.005);
              const coralSize = 3 + Math.sin(seed * 1.5) * 4 + Math.cos(seed * 0.9) * 3; // 0-10 pixel
              const coralX = x + Math.sin(time.current.frameCount * 0.03 + seed) * 6;
              const coralY = y + Math.cos(time.current.frameCount * 0.025 + seed * 1.2) * 5;
              
              // Korall színek
              const colorVariant = Math.floor((seed * 8) % 5);
              let coralColor: string;
              switch(colorVariant) {
                case 0: coralColor = '#FF6B6B'; break; // Piros korall
                case 1: coralColor = '#4ECDC4'; break; // Türkiz korall
                case 2: coralColor = '#45B7D1'; break; // Kék korall
                case 3: coralColor = '#FFA07A'; break; // Lazac korall
                default: coralColor = '#98D8C8'; break; // Zöld korall
              }
              ctx.fillStyle = coralColor;
              
              ctx.save();
              ctx.translate(coralX, coralY);
              ctx.rotate(time.current.frameCount * 0.02 + seed);
              
              // Korall alakzatok
              const shape = Math.floor((seed * 6) % 4);
              switch(shape) {
                case 0: // Korall ág
                  ctx.beginPath();
                  ctx.ellipse(0, 0, coralSize/3, coralSize/2, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.ellipse(-coralSize/4, -coralSize/3, coralSize/4, coralSize/3, 0, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 1: // Buborék korall
                  for (let j = 0; j < 3; j++) {
                    ctx.beginPath();
                    ctx.arc(j * coralSize/4 - coralSize/4, 0, coralSize/4, 0, Math.PI * 2);
                    ctx.fill();
                  }
                  break;
                case 2: // Fan korall
                  ctx.beginPath();
                  ctx.arc(0, 0, coralSize/2, -Math.PI * 0.8, -Math.PI * 0.2);
                  ctx.lineWidth = coralSize/3;
                  ctx.stroke();
                  break;
                case 3: // Csoportos korall
                  ctx.fillRect(-coralSize/3, -coralSize/2, coralSize/6, coralSize);
                  ctx.fillRect(0, -coralSize/3, coralSize/6, coralSize * 0.8);
                  ctx.fillRect(coralSize/6, -coralSize/2, coralSize/6, coralSize);
                  break;
              }
              ctx.restore();
            }
          }
          
          // Alsó korall hitbox - pipe.top + gap-től a földig
          for (let y = pipe.top + w.gap; y < w.h - w.groundH; y += 14) {
            for (let x = pipe.x; x < pipe.x + w.pipeW; x += 16) {
              const seed = (x * 0.09 + y * 0.15 + pipe.x * 0.007);
              const coralSize = 2.5 + Math.sin(seed * 1.8) * 5 + Math.cos(seed * 1.1) * 3; // 0-10.5 pixel
              const coralX = x + Math.sin(time.current.frameCount * 0.025 + seed) * 7;
              const coralY = y + Math.cos(time.current.frameCount * 0.02 + seed * 1.4) * 4;
              
              // Alsó korall sötétebb színek
              const colorVariant = Math.floor((seed * 9) % 5);
              let coralColor: string;
              switch(colorVariant) {
                case 0: coralColor = '#CC5555'; break; // Sötét piros
                case 1: coralColor = '#3BACA0'; break; // Sötét türkiz
                case 2: coralColor = '#3A96B5'; break; // Sötét kék
                case 3: coralColor = '#E8956A'; break; // Sötét lazac
                default: coralColor = '#7BC4B4'; break; // Sötét zöld
              }
              ctx.fillStyle = coralColor;
              
              ctx.save();
              ctx.translate(coralX, coralY);
              ctx.rotate(time.current.frameCount * -0.015 + seed * 1.3);
              
              // Alsó korall alakzatok
              const shape = Math.floor((seed * 7) % 5);
              switch(shape) {
                case 0: // Sima korall test
                  ctx.beginPath();
                  ctx.ellipse(0, 0, coralSize/2, coralSize/1.5, 0, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 1: // Tubular korall
                  ctx.fillRect(-coralSize/6, -coralSize/2, coralSize/3, coralSize);
                  ctx.beginPath();
                  ctx.arc(0, -coralSize/2, coralSize/6, 0, Math.PI);
                  ctx.fill();
                  break;
                case 2: // Lemezes korall
                  for (let j = 0; j < 3; j++) {
                    ctx.fillRect(-coralSize/2, -coralSize/2 + j * coralSize/3, coralSize, coralSize/6);
                  }
                  break;
                case 3: // Ágacskás korall
                  ctx.lineWidth = coralSize/4;
                  ctx.beginPath();
                  ctx.moveTo(0, -coralSize/2);
                  ctx.lineTo(-coralSize/3, 0);
                  ctx.moveTo(0, -coralSize/2);
                  ctx.lineTo(coralSize/3, 0);
                  ctx.moveTo(0, -coralSize/2);
                  ctx.lineTo(0, coralSize/2);
                  ctx.stroke();
                  break;
                case 4: // Csomós korall
                  for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI * 2) / 4;
                    const nx = Math.cos(angle) * coralSize/3;
                    const ny = Math.sin(angle) * coralSize/3;
                    ctx.beginPath();
                    ctx.arc(nx, ny, coralSize/5, 0, Math.PI * 2);
                    ctx.fill();
                  }
                  break;
              }
              ctx.restore();
            }
          }
          
          // Tengeri növények és extra detáljok a széleken
          ctx.strokeStyle = '#228B22';
          ctx.lineWidth = 2;
          for (let i = 0; i < 30; i++) {
            // Felső rész algái
            const algaeX = pipe.x + (i % 2 === 0 ? 2 : w.pipeW - 2) + Math.sin(time.current.frameCount * 0.04 + i) * 3;
            const algaeY = Math.random() * pipe.top;
            const algaeHeight = 8 + Math.random() * 12;
            
            ctx.beginPath();
            ctx.moveTo(algaeX, algaeY);
            for (let j = 1; j <= algaeHeight; j += 2) {
              const wave = Math.sin(j * 0.4 + time.current.frameCount * 0.06 + i) * 2;
              ctx.lineTo(algaeX + wave, algaeY - j);
            }
            ctx.stroke();
            
            // Alsó rész algái
            const lowerAlgaeX = pipe.x + (i % 2 === 0 ? 3 : w.pipeW - 3) + Math.cos(time.current.frameCount * 0.035 + i * 1.5) * 4;
            const lowerAlgaeY = pipe.top + w.gap + Math.random() * (w.h - w.groundH - pipe.top - w.gap);
            
            ctx.beginPath();
            ctx.moveTo(lowerAlgaeX, lowerAlgaeY);
            for (let j = 1; j <= algaeHeight; j += 2) {
              const wave = Math.sin(j * 0.3 + time.current.frameCount * 0.05 + i) * 3;
              ctx.lineTo(lowerAlgaeX + wave, lowerAlgaeY - j);
            }
            ctx.stroke();
          }
          break;
          
        case 'shipwreck':
          // Hajóroncs akadályok - elsüllyedt hajó részei
          
          // Felső hajórész - kapitányi híd
          ctx.save();
          ctx.translate(pipe.x, pipe.top - 30);
          
          // Rozsdás barna szín
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(0, 0, w.pipeW, 30);
          
          // Hajó részletek
          ctx.fillStyle = '#654321';
          ctx.fillRect(5, 5, w.pipeW - 10, 8); // Felső fedélzet
          ctx.fillRect(8, 15, w.pipeW - 16, 10); // Alsó rész
          
          // Rozsdafoltok
          ctx.fillStyle = '#CD853F';
          for (let i = 0; i < 4; i++) {
            const rustX = 3 + (i * w.pipeW / 4) + Math.sin(pipe.x * 0.01 + i) * 3;
            const rustY = 8 + Math.cos(pipe.x * 0.015 + i * 1.5) * 8;
            ctx.beginPath();
            ctx.arc(rustX, rustY, 2 + Math.sin(i * 2) * 1, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Törött ablak
          ctx.fillStyle = '#000080';
          ctx.fillRect(w.pipeW/2 - 8, 8, 16, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(w.pipeW/2 - 6, 10, 3, 2);
          ctx.fillRect(w.pipeW/2 + 3, 10, 3, 2);
          
          ctx.restore();
          
          // Alsó hajórész - hajótest
          ctx.save();
          ctx.translate(pipe.x, pipe.top + w.gap);
          
          ctx.fillStyle = '#696969';
          ctx.fillRect(0, 0, w.pipeW, 40);
          
          // Hajótest görbület
          ctx.fillStyle = '#808080';
          ctx.beginPath();
          ctx.arc(w.pipeW/2, 40, w.pipeW/2 - 2, 0, Math.PI);
          ctx.fill();
          
          // Hajó bordázat
          ctx.strokeStyle = '#2F4F4F';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const lineX = (i + 1) * w.pipeW / 5;
            ctx.beginPath();
            ctx.moveTo(lineX, 0);
            ctx.lineTo(lineX, 35);
            ctx.stroke();
          }
          
          // Horgony maradványok
          ctx.fillStyle = '#A0522D';
          ctx.beginPath();
          ctx.arc(w.pipeW - 8, 15, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(w.pipeW - 8, 25, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          
          // Tengeri növények a roncs körül
          ctx.strokeStyle = '#006400';
          ctx.lineWidth = 3;
          for (let i = 0; i < 5; i++) {
            const seaweedX = pipe.x + 5 + (i * 10) + Math.sin(time.current.frameCount * 0.04 + i) * 4;
            const seaweedBase = pipe.top + w.gap + 40;
            
            ctx.beginPath();
            ctx.moveTo(seaweedX, seaweedBase);
            for (let j = 1; j <= 8; j++) {
              const waveX = seaweedX + Math.sin(time.current.frameCount * 0.06 + i + j * 0.5) * (j * 2);
              const waveY = seaweedBase - (j * 8);
              ctx.lineTo(waveX, waveY);
            }
            ctx.stroke();
          }
          
          // Halrajok a roncs körül
          ctx.fillStyle = '#FFD700';
          for (let i = 0; i < 8; i++) {
            const fishX = pipe.x + w.pipeW + 20 + Math.sin(time.current.frameCount * 0.08 + i * 0.8) * 30;
            const fishY = pipe.top + (w.gap / 2) + Math.cos(time.current.frameCount * 0.06 + i * 1.2) * 40;
            const fishSize = 3 + Math.sin(i * 1.5) * 1;
            
            // Kis hal forma
            ctx.save();
            ctx.translate(fishX, fishY);
            ctx.rotate(Math.sin(time.current.frameCount * 0.1 + i) * 0.3);
            
            ctx.beginPath();
            ctx.ellipse(0, 0, fishSize, fishSize * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Hal farok
            ctx.beginPath();
            ctx.moveTo(-fishSize, 0);
            ctx.lineTo(-fishSize * 1.5, -fishSize * 0.4);
            ctx.lineTo(-fishSize * 1.5, fishSize * 0.4);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
          
          // TELJES HITBOX KITÖLTÉSE - Hajóroncs területek
          // Felső hajóroncs hitbox - 0-től pipe.top-ig
          for (let y = 0; y < pipe.top; y += 16) {
            for (let x = pipe.x; x < pipe.x + w.pipeW; x += 18) {
              const seed = (x * 0.07 + y * 0.11 + pipe.x * 0.006);
              const debrisSize = 4 + Math.sin(seed * 1.3) * 6 + Math.cos(seed * 0.8) * 4; // 0-14 pixel
              const debrisX = x + Math.sin(time.current.frameCount * 0.03 + seed) * 8;
              const debrisY = y + Math.cos(time.current.frameCount * 0.02 + seed * 1.1) * 6;
              
              // Hajóroncs anyagok
              const materialVariant = Math.floor((seed * 7) % 6);
              let debrisColor: string;
              switch(materialVariant) {
                case 0: debrisColor = '#8B4513'; break; // Rozsdás fa
                case 1: debrisColor = '#696969'; break; // Szürke fém
                case 2: debrisColor = '#A0522D'; break; // Sötét fa
                case 3: debrisColor = '#2F4F4F'; break; // Sötét szürke
                case 4: debrisColor = '#CD853F'; break; // Világos rozsda
                default: debrisColor = '#654321'; break; // Sötét barna
              }
              ctx.fillStyle = debrisColor;
              
              ctx.save();
              ctx.translate(debrisX, debrisY);
              ctx.rotate(time.current.frameCount * 0.025 + seed);
              
              // Hajóroncs darabok
              const shape = Math.floor((seed * 8) % 6);
              switch(shape) {
                case 0: // Fadeszkák
                  ctx.fillRect(-debrisSize/2, -debrisSize/4, debrisSize, debrisSize/2);
                  ctx.strokeStyle = '#654321';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(-debrisSize/2, -debrisSize/4, debrisSize, debrisSize/2);
                  break;
                case 1: // Fémdarabok
                  ctx.beginPath();
                  ctx.moveTo(0, -debrisSize/2);
                  ctx.lineTo(debrisSize/2, 0);
                  ctx.lineTo(0, debrisSize/2);
                  ctx.lineTo(-debrisSize/2, 0);
                  ctx.closePath();
                  ctx.fill();
                  break;
                case 2: // Csavarok/szögek
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/3, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#2F4F4F';
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/6, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 3: // Hajólánc
                  for (let j = 0; j < 3; j++) {
                    ctx.strokeStyle = debrisColor;
                    ctx.lineWidth = debrisSize/4;
                    ctx.beginPath();
                    ctx.arc(0, j * debrisSize/3 - debrisSize/3, debrisSize/4, 0, Math.PI * 2);
                    ctx.stroke();
                  }
                  break;
                case 4: // Vitorla darabok
                  ctx.globalAlpha = 0.7;
                  ctx.fillStyle = '#F5F5DC';
                  ctx.fillRect(-debrisSize/3, -debrisSize/2, debrisSize * 0.66, debrisSize);
                  ctx.globalAlpha = 1.0;
                  break;
                case 5: // Hajótest darabok
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/2, Math.PI, 0);
                  ctx.closePath();
                  ctx.fill();
                  break;
              }
              ctx.restore();
            }
          }
          
          // Alsó hajóroncs hitbox - pipe.top + gap-től a földig
          for (let y = pipe.top + w.gap; y < w.h - w.groundH; y += 16) {
            for (let x = pipe.x; x < pipe.x + w.pipeW; x += 18) {
              const seed = (x * 0.08 + y * 0.13 + pipe.x * 0.008);
              const debrisSize = 3 + Math.sin(seed * 1.6) * 7 + Math.cos(seed * 1.2) * 5; // 0-15 pixel
              const debrisX = x + Math.sin(time.current.frameCount * 0.025 + seed) * 9;
              const debrisY = y + Math.cos(time.current.frameCount * 0.018 + seed * 1.3) * 7;
              
              // Víz alatti hajóroncs anyagok
              const materialVariant = Math.floor((seed * 9) % 6);
              let debrisColor: string;
              switch(materialVariant) {
                case 0: debrisColor = '#556B2F'; break; // Mohás fa
                case 1: debrisColor = '#483D8B'; break; // Víz alatti fém
                case 2: debrisColor = '#2F4F4F'; break; // Korrodált fém
                case 3: debrisColor = '#6B8E23'; break; // Algás fa
                case 4: debrisColor = '#708090'; break; // Iszapos fém
                default: debrisColor = '#4682B4'; break; // Vizes fa
              }
              ctx.fillStyle = debrisColor;
              
              ctx.save();
              ctx.translate(debrisX, debrisY);
              ctx.rotate(time.current.frameCount * -0.02 + seed * 1.5);
              
              // Víz alatti hajóroncs darabok
              const shape = Math.floor((seed * 9) % 7);
              switch(shape) {
                case 0: // Mohás fadeszkák
                  ctx.fillRect(-debrisSize/2, -debrisSize/3, debrisSize, debrisSize * 0.66);
                  ctx.fillStyle = '#228B22';
                  ctx.fillRect(-debrisSize/3, -debrisSize/4, debrisSize * 0.66, debrisSize/6);
                  break;
                case 1: // Korrodált fémlapok
                  ctx.beginPath();
                  for (let j = 0; j < 5; j++) {
                    const angle = (j * Math.PI * 2) / 5;
                    const radius = debrisSize/2 + Math.sin(j * 2) * debrisSize/6;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (j === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                  }
                  ctx.closePath();
                  ctx.fill();
                  break;
                case 2: // Horgonyok
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/3, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillRect(-debrisSize/6, 0, debrisSize/3, debrisSize/2);
                  ctx.fillRect(-debrisSize/2, debrisSize/3, debrisSize, debrisSize/6);
                  break;
                case 3: // Hajókormány
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/2, 0, Math.PI * 2);
                  ctx.stroke();
                  for (let j = 0; j < 8; j++) {
                    const angle = (j * Math.PI * 2) / 8;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * debrisSize/3, Math.sin(angle) * debrisSize/3);
                    ctx.stroke();
                  }
                  break;
                case 4: // Ágyúgolyók
                  ctx.beginPath();
                  ctx.arc(0, 0, debrisSize/2, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#2F4F4F';
                  ctx.beginPath();
                  ctx.arc(-debrisSize/4, -debrisSize/4, debrisSize/8, 0, Math.PI * 2);
                  ctx.fill();
                  break;
                case 5: // Kötél maradványok
                  ctx.strokeStyle = '#8B7D6B';
                  ctx.lineWidth = debrisSize/4;
                  ctx.beginPath();
                  for (let j = 0; j < debrisSize; j += 2) {
                    const wave = Math.sin(j * 0.5 + seed) * debrisSize/4;
                    ctx.lineTo(wave, j - debrisSize/2);
                  }
                  ctx.stroke();
                  break;
                case 6: // Lőportartók
                  ctx.fillRect(-debrisSize/3, -debrisSize/2, debrisSize * 0.66, debrisSize);
                  ctx.strokeStyle = '#2F4F4F';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(-debrisSize/3, -debrisSize/2, debrisSize * 0.66, debrisSize);
                  break;
              }
              ctx.restore();
            }
          }
          
          // Vízalatti vegetáció és extra részletek a széleken
          ctx.strokeStyle = '#006400';
          ctx.lineWidth = 3;
          for (let i = 0; i < 25; i++) {
            // Felső tengeri növények
            const seaweedX = pipe.x + (i % 2 === 0 ? 1 : w.pipeW - 1) + Math.sin(time.current.frameCount * 0.04 + i) * 4;
            const seaweedY = Math.random() * pipe.top;
            const seaweedHeight = 10 + Math.random() * 15;
            
            ctx.beginPath();
            ctx.moveTo(seaweedX, seaweedY);
            for (let j = 1; j <= seaweedHeight; j += 3) {
              const wave = Math.sin(j * 0.3 + time.current.frameCount * 0.05 + i) * 3;
              ctx.lineTo(seaweedX + wave, seaweedY - j);
            }
            ctx.stroke();
            
            // Alsó tengeri növények
            const lowerSeaweedX = pipe.x + (i % 2 === 0 ? 2 : w.pipeW - 2) + Math.cos(time.current.frameCount * 0.035 + i * 1.3) * 5;
            const lowerSeaweedY = pipe.top + w.gap + Math.random() * (w.h - w.groundH - pipe.top - w.gap);
            
            ctx.beginPath();
            ctx.moveTo(lowerSeaweedX, lowerSeaweedY);
            for (let j = 1; j <= seaweedHeight; j += 3) {
              const wave = Math.sin(j * 0.4 + time.current.frameCount * 0.06 + i) * 4;
              ctx.lineTo(lowerSeaweedX + wave, lowerSeaweedY - j);
            }
            ctx.stroke();
          }
          break;
          
        default: // Classic pipe vagy ismeretlen típus
          if (pipe.biome === 'space') {
            // Űr biome esetén ismeretlen akadály típus alapértelmezett megjelenése
            ctx.fillStyle = '#4B0082';
            ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
            ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
            
            // Energia aura
            ctx.strokeStyle = '#9400D3';
            ctx.lineWidth = 3;
            ctx.strokeRect(pipe.x - 1, 0, w.pipeW + 2, pipe.top);
            ctx.strokeRect(pipe.x - 1, pipe.top + w.gap, w.pipeW + 2, w.h - w.groundH - pipe.top - w.gap);
          } else {
            // Klasszikus zöld cső más biome-okhoz
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x, 0, w.pipeW, pipe.top);
            ctx.fillRect(pipe.x, pipe.top + w.gap, w.pipeW, w.h - w.groundH - pipe.top - w.gap);
            
            // Cső sapka
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(pipe.x - 3, pipe.top - 15, w.pipeW + 6, 15);
            ctx.fillRect(pipe.x - 3, pipe.top + w.gap, w.pipeW + 6, 15);
          }
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
            ctx.fillStyle
             = '#9932CC';
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
    
    // Madár test (animált) - enhanced with combo colors and skin
    const bodyY = currentFrame.bodyOffset;
    const currentSkin = getCurrentBirdSkin();
    
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
      // Use skin colors with shield overlay
      if (b.shield > 0) {
        ctx.fillStyle = '#00BFFF'; // Shield blue overrides skin
      } else {
        ctx.fillStyle = currentSkin.bodyColor;
      }
    }
    
    // Skin-specific body shape modifications
    if (currentSkin.id === 'penguin') {
      // Penguin: More oval, standing upright
      ctx.beginPath();
      ctx.ellipse(0, bodyY, b.r * 0.8, b.r * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Penguin belly (white)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(2, bodyY, b.r * 0.4, b.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'eagle') {
      // Eagle: Slightly larger, more majestic
      ctx.beginPath();
      ctx.arc(0, bodyY, b.r * 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'duck') {
      // Duck: Round and chubby
      ctx.beginPath();
      ctx.arc(0, bodyY, b.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Duck's orange beak area
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.ellipse(3, bodyY - 2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'dove') {
      // Dove: Elegant, slightly smaller
      ctx.beginPath();
      ctx.arc(0, bodyY, b.r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'parrot') {
      // Parrot: Colorful stripes
      ctx.beginPath();
      ctx.arc(0, bodyY, b.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Parrot stripes
      ctx.strokeStyle = '#00CED1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, bodyY, b.r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Classic bird
      ctx.beginPath();
      ctx.arc(0, bodyY, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Szárnyak animációja - enhanced colors with skin
    let wingColor = currentSkin.wingColor;
    if (b.godMode > 0) wingColor = '#FFFFFF';
    else if (b.superMode > 0) wingColor = '#FFD700';
    else if (b.megaMode > 0) wingColor = '#FF69B4';
    else if (b.rainbow > 0) wingColor = '#FF69B4';
    
    ctx.fillStyle = wingColor;
    
    // Skin-specific wing shapes and animations
    switch (currentFrame.wing) {
      case 'up':
        if (currentSkin.id === 'eagle') {
          // Eagle: Larger, more pointed wings
          ctx.beginPath();
          ctx.ellipse(-6, bodyY - 10, 12, 6, -0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'penguin') {
          // Penguin: Small flippers
          ctx.beginPath();
          ctx.ellipse(-3, bodyY - 4, 4, 2, -0.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'duck') {
          // Duck: Rounded wings
          ctx.beginPath();
          ctx.ellipse(-5, bodyY - 8, 8, 5, -0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'dove') {
          // Dove: Graceful, long wings
          ctx.beginPath();
          ctx.ellipse(-7, bodyY - 9, 10, 4, -0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'parrot') {
          // Parrot: Colorful layered wings
          ctx.beginPath();
          ctx.ellipse(-5, bodyY - 8, 8, 4, -0.5, 0, Math.PI * 2);
          ctx.fill();
          // Second wing layer
          ctx.fillStyle = '#FF69B4';
          ctx.beginPath();
          ctx.ellipse(-4, bodyY - 7, 6, 3, -0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic bird wing
          ctx.beginPath();
          ctx.ellipse(-5, bodyY - 8, 8, 4, -0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'middle':
        if (currentSkin.id === 'eagle') {
          // Eagle: Spread wings
          ctx.beginPath();
          ctx.ellipse(-10, bodyY - 2, 14, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'penguin') {
          // Penguin: Flippers at side
          ctx.beginPath();
          ctx.ellipse(-6, bodyY, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'duck') {
          // Duck: Wide wings
          ctx.beginPath();
          ctx.ellipse(-8, bodyY - 2, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'dove') {
          // Dove: Extended wings
          ctx.beginPath();
          ctx.ellipse(-9, bodyY - 2, 12, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'parrot') {
          // Parrot: Colorful spread
          ctx.beginPath();
          ctx.ellipse(-8, bodyY - 2, 10, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FF69B4';
          ctx.beginPath();
          ctx.ellipse(-7, bodyY - 1, 8, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic bird wing
          ctx.beginPath();
          ctx.ellipse(-8, bodyY - 2, 10, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'down':
        if (currentSkin.id === 'eagle') {
          // Eagle: Powerful downstroke
          ctx.beginPath();
          ctx.ellipse(-6, bodyY + 8, 12, 6, 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'penguin') {
          // Penguin: Flippers down
          ctx.beginPath();
          ctx.ellipse(-3, bodyY + 3, 4, 2, 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'duck') {
          // Duck: Rounded down
          ctx.beginPath();
          ctx.ellipse(-5, bodyY + 5, 8, 5, 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'dove') {
          // Dove: Gentle downstroke
          ctx.beginPath();
          ctx.ellipse(-7, bodyY + 6, 10, 4, 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentSkin.id === 'parrot') {
          // Parrot: Colorful down
          ctx.beginPath();
          ctx.ellipse(-5, bodyY + 5, 8, 4, 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FF69B4';
          ctx.beginPath();
          ctx.ellipse(-4, bodyY + 4, 6, 3, 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic bird wing
          ctx.beginPath();
          ctx.ellipse(-5, bodyY + 5, 8, 4, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
    
    // Madár szem - skin specific
    if (currentSkin.id === 'eagle') {
      // Eagle: Sharp, intense eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(3, bodyY - 3, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(4, bodyY - 3, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eagle eyebrow
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1, bodyY - 6);
      ctx.lineTo(6, bodyY - 5);
      ctx.stroke();
    } else if (currentSkin.id === 'penguin') {
      // Penguin: Round, friendly eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3, bodyY - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(3, bodyY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'duck') {
      // Duck: Large, round eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3, bodyY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(4, bodyY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'dove') {
      // Dove: Gentle, soft eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(3, bodyY - 3, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(4, bodyY - 3, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'parrot') {
      // Parrot: Bright, intelligent eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3, bodyY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(4, bodyY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Colorful eye ring
      ctx.strokeStyle = '#FF69B4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(3, bodyY - 3, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Classic bird eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3, bodyY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(4, bodyY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Csőr - skin specific
    if (currentSkin.id === 'eagle') {
      // Eagle: Sharp, hooked beak
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(8, bodyY);
      ctx.lineTo(16, bodyY - 3);
      ctx.lineTo(15, bodyY + 1);
      ctx.lineTo(12, bodyY + 2);
      ctx.closePath();
      ctx.fill();
    } else if (currentSkin.id === 'penguin') {
      // Penguin: Short, pointed beak
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(8, bodyY);
      ctx.lineTo(12, bodyY - 1);
      ctx.lineTo(12, bodyY + 1);
      ctx.closePath();
      ctx.fill();
    } else if (currentSkin.id === 'duck') {
      // Duck: Wide, flat bill
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.ellipse(11, bodyY, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentSkin.id === 'dove') {
      // Dove: Small, delicate beak
      ctx.fillStyle = '#FFB6C1';
      ctx.beginPath();
      ctx.moveTo(8, bodyY);
      ctx.lineTo(13, bodyY - 1);
      ctx.lineTo(13, bodyY + 1);
      ctx.closePath();
      ctx.fill();
    } else if (currentSkin.id === 'parrot') {
      // Parrot: Curved, colorful beak
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.moveTo(8, bodyY);
      ctx.quadraticCurveTo(12, bodyY - 3, 15, bodyY - 1);
      ctx.lineTo(14, bodyY + 1);
      ctx.quadraticCurveTo(11, bodyY + 1, 8, bodyY);
      ctx.fill();
    } else {
      // Classic bird beak
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(8, bodyY);
      ctx.lineTo(15, bodyY - 2);
      ctx.lineTo(15, bodyY + 2);
      ctx.closePath();
      ctx.fill();
    }
    
    // Debug hitbox
    if (debug) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Bullets rendering (for Rambo Bird)
    b.bullets.forEach(bullet => {
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Bullet trail
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(bullet.x - 5, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Lives indicator (for Robot Bird)
    if (b.maxLives > 1) {
      ctx.save();
      ctx.fillStyle = '#FF0000';
      ctx.font = '16px monospace';
      ctx.fillText(`❤️ x${b.lives}`, 10, 50);
      
      // Auto-shield timer
      const currentSkin = getCurrentBirdSkin();
      if (currentSkin.abilities.autoShield && b.autoShieldTimer > 0) {
        const timeLeft = Math.ceil(b.autoShieldTimer / 60);
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(`🛡️ ${timeLeft}s`, 10, 70);
      }
      ctx.restore();
    }
    
    // Shooting cooldown indicator (for Rambo Bird)
    if (b.canShoot && b.shootCooldown > 0) {
      ctx.save();
      ctx.fillStyle = '#FFFF00';
      ctx.font = '12px monospace';
      ctx.fillText(`🔫 ${Math.ceil((30 - b.shootCooldown) / 6) * 10}%`, 10, state === GameState.RUN && b.maxLives > 1 ? 90 : 50);
      ctx.restore();
    }
    
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

  // Fő game loop - 60 FPS standardizálva
  const gameLoop = useCallback((now: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Optimalizált 60 FPS - stabil és kényelmes minden eszközön
    if (time.current.last === 0) time.current.last = now;
    const deltaTime = now - time.current.last;
    
    // 60 FPS frame timing - 16.67ms target (stabil teljesítmény)
    const targetFrameTime = 1000 / 60;
    
    // Csak 60 FPS-nél gyorsabban ne rendereljünk (optimális balance)
    if (deltaTime < targetFrameTime) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    time.current.last = now;
    
    // Csak futó állapotban frissítjük a játékot
    if (state === GameState.RUN) {
      // MAXIMALIZÁLT 120 FPS gameplay - minden eszközön ultra smooth
      updateGame();
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

  // Event handlerek - áthelyezve inputManager-be
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === GameState.RUN) {
        setState(GameState.PAUSE);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state]);

  // Canvas és resize setup
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Update current biome when starting biome changes
  useEffect(() => {
    if (state === GameState.MENU || state === GameState.GAMEOVER) {
      currentBiome.current = biomes.current[startingBiome] || biomes.current[0];
    }
  }, [startingBiome, state]);

  // Game loop indítás
  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  // 120 FPS mobil optimalizáció
  useEffect(() => {
    // Mobil eszközökön 120 FPS engedélyezése
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
    
    if (isMobile) {
      // High refresh rate engedélyezése mobilon
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
      
      // CSS változók beállítása 120 FPS-hez
      document.documentElement.style.setProperty('--refresh-rate', '120Hz');
      document.body.style.willChange = 'transform';
      
      // Canvas optimalizálás 120 FPS-hez
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.style.imageRendering = 'pixelated';
        canvas.style.willChange = 'transform';
      }
    }
  }, []);

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
        {/* Score és FPS */}
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
              
              {/* FPS Monitor - valós render FPS */}
              <div className="text-cyan-400 text-sm font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
                Render: {fps} FPS | Logic: 120 FPS | {detectPerformanceLevel().toUpperCase()}
              </div>
              
              {/* Debug Spawn Info */}
              {debug && (
                <div className="text-white text-xs font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
                  PowerUps: {powerUps.current.length}/{getPerfConfig().maxPowerUps} | 
                  Coins: {gameCoins.current.length}/{getPerfConfig().maxCoins}
                </div>
              )}
              
              {/* Error Display */}
              {lastError && (
                <div className="text-red-400 text-xs font-mono bg-red-900 bg-opacity-75 px-2 py-1 rounded max-w-md">
                  🚨 {lastError} | Bird: {getCurrentBirdSkin().name}
                  <button 
                    className="ml-2 text-white hover:text-red-300"
                    onClick={() => setLastError('')}
                  >
                    ❌
                  </button>
                </div>
              )}
              
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
                </div>
              )}
              
              {/* Biome indicator */}
              <div className="text-white text-xs font-bold mt-1 opacity-75">
                {currentBiome.current.id === 'forest' && '🌲 Varázserdő'}
                {currentBiome.current.id === 'city' && '🏙️ Cyber Város'}
                {score >= 10 && (
                  <div className="text-yellow-400 text-xs">
                    Következő biome: {Math.floor((score + 10) / 10) * 10} pont
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Touch Control Buttons for Special Abilities */}
        {state === GameState.RUN && (
          <div className={`absolute bottom-4 ${buttonPosition === 'left' ? 'left-4' : 'right-4'} flex flex-col gap-2 pointer-events-auto`}>
            {/* Shadow Teleport - Demon Bird */}
            {getCurrentBirdSkin().abilities.shadowTeleport && bird.current.shadowTeleportsLeft > 0 && (
              <button
                className="w-12 h-12 bg-red-800 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg active:bg-red-600"
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const b = bird.current;
                  if (b.shadowTeleportsLeft > 0) {
                    b.shadowTeleportsLeft--;
                    b.y = Math.max(50, Math.min(world.current.h - 50, Math.random() * world.current.h));
                    createParticles(b.x, b.y, 15, '#8B0000', 'explosion');
                    playSound(400, 0.3, 'powerup');
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const b = bird.current;
                  if (b.shadowTeleportsLeft > 0) {
                    b.shadowTeleportsLeft--;
                    b.y = Math.max(50, Math.min(world.current.h - 50, Math.random() * world.current.h));
                    createParticles(b.x, b.y, 15, '#8B0000', 'explosion');
                    playSound(400, 0.3, 'powerup');
                  }
                }}
              >
                😈
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bird.current.shadowTeleportsLeft}
                </span>
              </button>
            )}
            
            {/* Wall Phase - Super Bird */}
            {getCurrentBirdSkin().abilities.flyThroughWalls && bird.current.wallPhaseLeft > 0 && (
              <button
                className="w-12 h-12 bg-blue-600 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg active:bg-blue-400"
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const b = bird.current;
                  if (b.wallPhaseLeft > 0 && !b.wallPhaseActive) {
                    b.wallPhaseLeft = Math.min(b.wallPhaseLeft, 180); // 3 seconds max
                    b.wallPhaseActive = true;
                    createParticles(b.x, b.y, 10, '#0080FF', 'sparkle');
                    playSound(600, 0.2, 'powerup');
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const b = bird.current;
                  if (b.wallPhaseLeft > 0 && !b.wallPhaseActive) {
                    b.wallPhaseLeft = Math.min(b.wallPhaseLeft, 180); // 3 seconds max
                    b.wallPhaseActive = true;
                    createParticles(b.x, b.y, 10, '#0080FF', 'sparkle');
                    playSound(600, 0.2, 'powerup');
                  }
                }}
              >
                🦸‍♂️
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Math.ceil(bird.current.wallPhaseLeft / 60)}
                </span>
              </button>
            )}
            
            {/* Warp Speed - UFO Bird */}
            {getCurrentBirdSkin().abilities.warpSpeed && bird.current.warpJumpsLeft > 0 && (
              <button
                className="w-12 h-12 bg-green-600 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg active:bg-green-400"
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const b = bird.current;
                  if (b.warpJumpsLeft > 0) {
                    b.warpJumpsLeft--;
                    b.x += 150; // Quick forward movement
                    createParticles(b.x, b.y, 12, '#00FF00', 'trail');
                    playSound(800, 0.2, 'powerup');
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const b = bird.current;
                  if (b.warpJumpsLeft > 0) {
                    b.warpJumpsLeft--;
                    b.x += 150; // Quick forward movement
                    createParticles(b.x, b.y, 12, '#00FF00', 'trail');
                    playSound(800, 0.2, 'powerup');
                  }
                }}
              >
                🛸
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bird.current.warpJumpsLeft}
                </span>
              </button>
            )}
          </div>
        )}
        
        {/* Shoot Button for Combat Birds */}
        {state === GameState.RUN && getCurrentBirdSkin().abilities.canShoot && (
          <div className={`absolute bottom-4 ${buttonPosition === 'left' ? 'right-4' : 'left-4'} pointer-events-auto`}>
            <button
              className="w-14 h-14 bg-orange-600 bg-opacity-80 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg active:bg-orange-400"
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shoot();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shoot();
              }}
            >
              🔫
            </button>
          </div>
        )}
        
        {/* Pause indicator */}
        {state === GameState.PAUSE && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="pixel-text text-white text-6xl animate-pulse">⏸</div>
            <div className="pixel-text text-white text-xl text-center mt-4">SZÜNET</div>
            <div className="text-cyan-400 text-sm font-mono text-center mt-2 bg-black bg-opacity-50 px-2 py-1 rounded">
              Render: {fps} FPS | Logic: 120 FPS | {detectPerformanceLevel().toUpperCase()}
            </div>
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
                  onClick={() => setShowBirdSelector(!showBirdSelector)}
                  className="pixel-button px-6 py-3 text-lg block mx-auto"
                >
                  🐦 MADÁR VÁLASZTÁS ({getUnlockedSkinsCount()}/{birdSkins.current.length})
                </button>
                <button 
                  onClick={() => setShowBiomeSelector(!showBiomeSelector)}
                  className="pixel-button px-6 py-3 text-lg block mx-auto"
                >
                  🌍 BIOM VÁLASZTÁS
                </button>
                <button 
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="pixel-button px-6 py-3 text-lg block mx-auto"
                >
                  📖 UTASÍTÁSOK
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="pixel-button px-6 py-3 text-lg block mx-auto"
                >
                  ⚙️ SEBESSÉG BEÁLLÍTÁSOK
                </button>
                <button 
                  onClick={() => setShowConsole(!showConsole)}
                  className="pixel-button px-6 py-3 text-sm block mx-auto"
                >
                  💻 TERMINAL
                </button>
                <button 
                  onClick={() => setDebug(!debug)}
                  className="pixel-button px-6 py-3 text-sm block mx-auto"
                >
                  {debug ? '🔍 DEBUG KI' : '🔍 DEBUG BE'}
                </button>
              </div>
              
              {/* Teljesítmény indikátor */}
              <div className="mt-6 px-4 py-2 bg-gray-800 bg-opacity-50 rounded-lg">
                <div className="text-sm text-gray-300">
                  Detektált teljesítmény: <span className={`font-bold ${
                    detectPerformanceLevel() === 'high' ? 'text-green-400' :
                    detectPerformanceLevel() === 'medium' ? 'text-yellow-400' :
                    detectPerformanceLevel() === 'low' ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {detectPerformanceLevel().toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {getPerfConfig().maxParticles} részecske limit
                </div>
                <div className="text-cyan-400 text-sm font-mono mt-1">
                  Render: {fps} FPS | Logic: 120 FPS
                </div>
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
        
        {/* Speed Settings Panel */}
        {showSettings && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md text-white pixel-text">
              <h2 className="text-2xl mb-6 text-center">⚙️ Sebesség Beállítások</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">🏃 Alap sebesség: {speedSettings.normal.toFixed(1)}x</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.1"
                    value={speedSettings.normal}
                    onChange={(e) => saveSpeedSettings({...speedSettings, normal: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2">⏰ Slow Motion: {speedSettings.slowMotion.toFixed(1)}x</label>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="3.0" 
                    step="0.1"
                    value={speedSettings.slowMotion}
                    onChange={(e) => saveSpeedSettings({...speedSettings, slowMotion: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2">🌈 Rainbow Mode: {speedSettings.rainbow.toFixed(1)}x</label>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="8.0" 
                    step="0.1"
                    value={speedSettings.rainbow}
                    onChange={(e) => saveSpeedSettings({...speedSettings, rainbow: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2">⚡ Super Mode: {speedSettings.super.toFixed(1)}x</label>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="10.0" 
                    step="0.1"
                    value={speedSettings.super}
                    onChange={(e) => saveSpeedSettings({...speedSettings, super: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2">🌟 God Mode: {speedSettings.godMode.toFixed(1)}x</label>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="8.0" 
                    step="0.1"
                    value={speedSettings.godMode}
                    onChange={(e) => saveSpeedSettings({...speedSettings, godMode: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                </div>
                
                <div className="flex space-x-2 mt-6">
                  <button 
                    onClick={() => saveSpeedSettings({normal: 2.0, slowMotion: 1.0, rainbow: 3.0, super: 4.0, godMode: 2.5})}
                    className="pixel-button px-4 py-2 text-sm flex-1"
                  >
                    🔄 Alapértelmezett
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="pixel-button px-4 py-2 text-sm flex-1"
                  >
                    ❌ Bezárás
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bird Selector */}
        {showBirdSelector && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-800 p-6 rounded-lg max-w-lg text-white pixel-text max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl mb-4 text-center">🐦 Madár Választás</h2>
              
              {/* Current selection display */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg text-center">
                <div className="text-3xl mb-2">{getCurrentBirdSkin().emoji}</div>
                <div className="text-lg font-bold">{getCurrentBirdSkin().name}</div>
                <div className="text-sm text-gray-300">{getCurrentBirdSkin().description}</div>
                {Object.keys(getCurrentBirdSkin().abilities).length > 0 && (
                  <div className="text-xs text-yellow-400 mt-2">
                    Képességek: {Object.entries(getCurrentBirdSkin().abilities).map(([key, value]) => 
                      `${key}: ${(value as number * 100).toFixed(0)}%`
                    ).join(', ')}
                  </div>
                )}
              </div>
              
              {/* Bird grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {birdSkins.current.map(skin => {
                  const isUnlocked = isSkinUnlocked(skin);
                  const isSelected = selectedBirdSkin === skin.id;
                  
                  return (
                    <button
                      key={skin.id}
                      onClick={() => isUnlocked && selectBirdSkin(skin.id)}
                      disabled={!isUnlocked}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-yellow-400 bg-yellow-900/50' 
                          : isUnlocked
                          ? 'border-gray-600 bg-gray-700 hover:border-gray-400 hover:bg-gray-600'
                          : 'border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-2xl mb-1">{isUnlocked ? skin.emoji : '🔒'}</div>
                      <div className="text-sm font-bold">{skin.name}</div>
                      <div className="text-xs text-gray-300 mb-2">{skin.description}</div>
                      
                      {/* Unlock requirement */}
                      {!isUnlocked && (
                        <div className="text-xs text-red-400">
                          {skin.unlockRequirement.type === 'coins' && `${skin.unlockRequirement.value} érme`}
                          {skin.unlockRequirement.type === 'score' && `${skin.unlockRequirement.value} pont best`}
                          {skin.unlockRequirement.type === 'achievement' && 'Achievement szükséges'}
                        </div>
                      )}
                      
                      {/* Abilities preview */}
                      {isUnlocked && Object.keys(skin.abilities).length > 0 && (
                        <div className="text-xs text-yellow-400 mt-1">
                          {Object.entries(skin.abilities).map(([key, value]) => (
                            <div key={key}>
                              {key === 'jumpPower' && '🚀 Ugrás'}
                              {key === 'gravity' && '🪶 Gravitáció'}
                              {key === 'magnetBonus' && '🧲 Mágnes'}
                              {key === 'shieldDuration' && '🛡️ Pajzs'}
                              {key === 'coinValue' && '💰 Érme'}
                              {key === 'extraLives' && `❤️ +${value} élet`}
                              {key === 'canShoot' && value && '🔫 Lövés'}
                              {key === 'autoShield' && `🛡️ Auto ${value}s`}
                              {typeof value === 'number' && key !== 'extraLives' && key !== 'autoShield' && !key.includes('can') && 
                                `: ${((value as number) * 100).toFixed(0)}%`}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isSelected && (
                        <div className="text-green-400 text-xs mt-2 font-bold">✓ KIVÁLASZTVA</div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Progress info */}
              <div className="text-center text-sm text-gray-400 mb-4">
                Feloldva: {getUnlockedSkinsCount()}/{birdSkins.current.length} madár
              </div>
              
              <button 
                onClick={() => setShowBirdSelector(false)}
                className="pixel-button px-6 py-3 w-full"
              >
                ❌ Bezárás
              </button>
            </div>
          </div>
        )}
        
        {/* Biome Selector */}
        {showBiomeSelector && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h2 className="pixel-text text-white text-2xl mb-4 text-center">🌍 BIOM VÁLASZTÁS</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {biomes.current.map((biome, index) => {
                  const isSelected = startingBiome === index;
                  
                  return (
                    <button 
                      key={biome.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-yellow-400 bg-yellow-900 bg-opacity-50' 
                          : 'border-gray-600 bg-gray-700 hover:border-gray-400'
                      }`}
                      onClick={() => selectStartingBiome(index)}
                    >
                      <div className="text-2xl mb-2">
                        {biome.id === 'forest' && '🌲'}
                        {biome.id === 'city' && '🏙️'}
                      </div>
                      <div className="text-white font-bold text-lg">{biome.name}</div>
                      <div className="text-sm text-gray-300 mb-2">
                        {biome.id === 'forest' && 'Fák és természetes akadályok'}
                        {biome.id === 'city' && 'Futurisztikus épületek és neon fények'}
                      </div>
                      <div className="text-xs text-blue-400">
                        Power-up bonus: {((biome.powerUpBonus || 1) * 100).toFixed(0)}%
                      </div>
                      
                      {isSelected && (
                        <div className="text-green-400 text-sm mt-2 font-bold">✓ KIVÁLASZTVA</div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="text-center text-sm text-gray-400 mb-4">
                A játék ezzel a biommal kezdődik (10 pontonként vált át)
              </div>
              
              {/* Button Position Selector */}
              <div className="mb-4">
                <h3 className="text-white text-lg mb-2 text-center">📱 Touch Button Pozíció</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    className={`p-3 rounded-lg border-2 transition-all ${
                      buttonPosition === 'left'
                        ? 'border-blue-400 bg-blue-900 bg-opacity-50' 
                        : 'border-gray-600 bg-gray-700 hover:border-gray-400'
                    }`}
                    onClick={() => selectButtonPosition('left')}
                  >
                    <div className="text-lg mb-1">👈</div>
                    <div className="text-white font-bold">Bal oldal</div>
                    <div className="text-xs text-gray-300">Képességek balra, lövés jobbra</div>
                    {buttonPosition === 'left' && (
                      <div className="text-green-400 text-sm mt-1 font-bold">✓ AKTÍV</div>
                    )}
                  </button>
                  
                  <button 
                    className={`p-3 rounded-lg border-2 transition-all ${
                      buttonPosition === 'right'
                        ? 'border-blue-400 bg-blue-900 bg-opacity-50' 
                        : 'border-gray-600 bg-gray-700 hover:border-gray-400'
                    }`}
                    onClick={() => selectButtonPosition('right')}
                  >
                    <div className="text-lg mb-1">👉</div>
                    <div className="text-white font-bold">Jobb oldal</div>
                    <div className="text-xs text-gray-300">Képességek jobbra, lövés balra</div>
                    {buttonPosition === 'right' && (
                      <div className="text-green-400 text-sm mt-1 font-bold">✓ AKTÍV</div>
                    )}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setShowBiomeSelector(false)}
                className="pixel-button px-6 py-3 w-full"
              >
                ❌ Bezárás
              </button>
            </div>
          </div>
        )}
        
        {/* Console/Terminal */}
        {showConsole && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
            <div className="bg-black border-2 border-green-400 rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-green-400 text-xl mb-4 font-mono text-center">💻 SZENYO-TERMINAL</h2>
              
              <div className="bg-gray-900 p-4 rounded mb-4 font-mono text-sm">
                <div className="text-green-400">szenyo@madar:~$ </div>
                <div className="text-gray-400 text-xs mb-2">Írj be egy parancsot...</div>
              </div>
              
              <input 
                type="text"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConsoleCommand(consoleInput);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-green-400 text-green-400 font-mono rounded mb-4 focus:outline-none focus:border-green-300"
                placeholder="Parancs..."
                autoFocus
              />
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleConsoleCommand(consoleInput)}
                  className="bg-green-600 hover:bg-green-500 text-white font-mono px-4 py-2 rounded flex-1"
                >
                  FUTTAT
                </button>
                <button 
                  onClick={() => {
                    setShowConsole(false);
                    setConsoleInput("");
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-mono px-4 py-2 rounded flex-1"
                >
                  BEZÁR
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mt-4 text-center font-mono">
                Tipp: Próbálj ki különböző parancsokat! 😉
              </div>
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
            {bird.current.canShoot && <div>X/S = Lövés</div>}
          </div>
        )}
        
        {/* Shooting button for Rambo Bird (mobile) */}
        {state === GameState.RUN && bird.current.canShoot && (
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            <button
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors"
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shoot();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shoot();
              }}
              disabled={bird.current.shootCooldown > 0}
              style={{ opacity: bird.current.shootCooldown > 0 ? 0.5 : 1 }}
            >
              🔫
            </button>
          </div>
        )}
        
        {/* FPS kijelző - jobb felső sarok - valós render FPS */}
        <div className="absolute top-4 right-4 text-cyan-400 text-sm font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
          Render: {fps} | Logic: 120
        </div>
      </div>
    </div>
  );
}