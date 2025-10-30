/**
 * Default biomes configuration
 */

import { Biome } from '../types';

export const DEFAULT_BIOMES: Biome[] = [
  {
    id: 'forest',
    name: 'Enchanted Forest',
    backgroundColors: ['#228B22', '#32CD32', '#90EE90'],
    skyGradient: {
      top: '#87CEEB',
      bottom: '#98FB98'
    },
    groundColor: '#8B4513',
    pipeColor: '#8B4513',
    obstacleTypes: ['tree', 'pipe'],
    weatherTypes: ['clear', 'rain', 'fog'],
    powerUpBonus: 1.0,
    musicTheme: 'forest_theme',
    particleColor: '#90EE90'
  },
  {
    id: 'city',
    name: 'Neon City',
    backgroundColors: ['#4B0082', '#8A2BE2', '#9370DB'],
    skyGradient: {
      top: '#2F1B69',
      bottom: '#8A2BE2'
    },
    groundColor: '#696969',
    pipeColor: '#C0C0C0',
    obstacleTypes: ['building', 'pipe'],
    weatherTypes: ['clear', 'fog', 'storm'],
    powerUpBonus: 1.2,
    musicTheme: 'city_theme',
    particleColor: '#9370DB'
  },
  {
    id: 'space',
    name: 'Cosmic Void',
    backgroundColors: ['#000000', '#191970', '#4B0082'],
    skyGradient: {
      top: '#000000',
      bottom: '#191970'
    },
    groundColor: '#2F2F2F',
    pipeColor: '#708090',
    obstacleTypes: ['asteroid', 'satellite'],
    weatherTypes: ['clear', 'aurora'],
    powerUpBonus: 1.5,
    musicTheme: 'space_theme',
    particleColor: '#FFD700'
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    backgroundColors: ['#006994', '#4682B4', '#87CEEB'],
    skyGradient: {
      top: '#4682B4',
      bottom: '#006994'
    },
    groundColor: '#F4A460',
    pipeColor: '#228B22',
    obstacleTypes: ['coral', 'shipwreck'],
    weatherTypes: ['clear', 'current', 'storm'],
    powerUpBonus: 1.1,
    musicTheme: 'ocean_theme',
    particleColor: '#87CEEB'
  }
];