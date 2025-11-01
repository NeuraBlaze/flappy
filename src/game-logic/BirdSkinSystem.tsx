// ===== 🐦 BIRD SKIN SYSTEM =====
// Bird skin management and ability calculations
// Separated from main game component for modularity

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface BirdSkin {
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

export interface BirdSkinSystemConfig {
  // Storage settings
  selectedSkinStorageKey: string;
  // Default abilities
  defaultAbilities: Partial<BirdSkin['abilities']>;
}

export interface UnlockRequirements {
  coins: number;
  score: number;
  achievements: { [achievementId: string]: boolean };
}

export interface UseBirdSkinSystemReturn {
  // State
  selectedSkin: string;
  availableSkins: BirdSkin[];
  currentSkin: BirdSkin;
  
  // Actions
  selectSkin: (skinId: string) => boolean;
  
  // Utilities
  isSkinUnlocked: (skin: BirdSkin) => boolean;
  getUnlockedSkinsCount: () => number;
  hasAbility: (abilityName: string) => boolean;
  getAbilityValue: <T>(abilityName: string, defaultValue: T) => T;
  
  // Skin management
  getSkinById: (id: string) => BirdSkin | undefined;
  getUnlockedSkins: () => BirdSkin[];
  
  // Requirements checking
  updateUnlockRequirements: (requirements: UnlockRequirements) => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: BirdSkinSystemConfig = {
  selectedSkinStorageKey: "szenyo_madar_selected_skin",
  defaultAbilities: {
    jumpPower: 1.0,
    gravity: 1.0,
    magnetBonus: 1.0,
    shieldDuration: 1.0,
    coinValue: 1.0,
    extraLives: 0,
    canShoot: false,
    autoShield: 0
  }
};

// ===== DEFAULT BIRD SKINS =====
const defaultBirdSkins: BirdSkin[] = [
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
    abilities: { magicHorn: true, hornCooldown: 5, jumpPower: 1.05, shieldDuration: 1.8 },
    description: "Mágikus szarv áttöri az akadályokat!"
  }
];

// ===== CUSTOM HOOK =====
export function useBirdSkinSystem(
  config: Partial<BirdSkinSystemConfig> = {},
  customSkins: BirdSkin[] = defaultBirdSkins
): UseBirdSkinSystemReturn {
  const finalConfig = { ...defaultConfig, ...config };
  const skinsRef = useRef<BirdSkin[]>(customSkins);
  
  // ===== STATE =====
  const [selectedSkin, setSelectedSkin] = useState<string>(() => {
    return localStorage.getItem(finalConfig.selectedSkinStorageKey) || "classic";
  });
  
  const [unlockRequirements, setUnlockRequirements] = useState<UnlockRequirements>({
    coins: 0,
    score: 0,
    achievements: {}
  });
  
  // ===== COMPUTED VALUES =====
  const currentSkin = skinsRef.current.find(skin => skin.id === selectedSkin) || skinsRef.current[0];
  
  // ===== PERSISTENCE =====
  useEffect(() => {
    localStorage.setItem(finalConfig.selectedSkinStorageKey, selectedSkin);
  }, [selectedSkin, finalConfig.selectedSkinStorageKey]);
  
  // ===== UNLOCK CHECKING =====
  const isSkinUnlocked = useCallback((skin: BirdSkin): boolean => {
    switch (skin.unlockRequirement.type) {
      case 'coins':
        return unlockRequirements.coins >= (skin.unlockRequirement.value as number);
      case 'score':
        return unlockRequirements.score >= (skin.unlockRequirement.value as number);
      case 'achievement':
        return unlockRequirements.achievements[skin.unlockRequirement.value as string] || false;
      default:
        return true;
    }
  }, [unlockRequirements]);
  
  // ===== ACTIONS =====
  const selectSkin = useCallback((skinId: string): boolean => {
    const skin = skinsRef.current.find(s => s.id === skinId);
    if (skin && isSkinUnlocked(skin)) {
      setSelectedSkin(skinId);
      return true;
    }
    return false;
  }, [isSkinUnlocked]);
  
  const updateUnlockRequirements = useCallback((requirements: UnlockRequirements) => {
    setUnlockRequirements(requirements);
  }, []);
  
  // ===== UTILITIES =====
  const getUnlockedSkinsCount = useCallback((): number => {
    return skinsRef.current.filter(skin => isSkinUnlocked(skin)).length;
  }, [isSkinUnlocked]);
  
  const hasAbility = useCallback((abilityName: string): boolean => {
    try {
      return Boolean(currentSkin?.abilities?.[abilityName as keyof typeof currentSkin.abilities]);
    } catch (error) {
      console.error(`Ability check failed for ${abilityName}`, error);
      return false;
    }
  }, [currentSkin]);
  
  const getAbilityValue = useCallback(function<T>(abilityName: string, defaultValue: T): T {
    try {
      const value = currentSkin?.abilities?.[abilityName as keyof typeof currentSkin.abilities];
      return (value !== undefined ? value : defaultValue) as T;
    } catch (error) {
      console.error(`Ability value retrieval failed for ${abilityName}`, error);
      return defaultValue;
    }
  }, [currentSkin]);
  
  const getSkinById = useCallback((id: string): BirdSkin | undefined => {
    return skinsRef.current.find(skin => skin.id === id);
  }, []);
  
  const getUnlockedSkins = useCallback((): BirdSkin[] => {
    return skinsRef.current.filter(skin => isSkinUnlocked(skin));
  }, [isSkinUnlocked]);
  
  return {
    // State
    selectedSkin,
    availableSkins: skinsRef.current,
    currentSkin,
    
    // Actions
    selectSkin,
    
    // Utilities
    isSkinUnlocked,
    getUnlockedSkinsCount,
    hasAbility,
    getAbilityValue,
    
    // Skin management
    getSkinById,
    getUnlockedSkins,
    
    // Requirements checking
    updateUnlockRequirements,
  };
}

// ===== COMPONENT EXPORT =====
export default useBirdSkinSystem;