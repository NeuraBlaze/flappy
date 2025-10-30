/**
 * Default shop catalog with bird skins, power-ups, and upgrades
 */

import { ShopItem } from '../../domains/shop/ports';

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // Bird Skins
  {
    id: 'classic_red',
    name: 'Classic Red Bird',
    description: 'The iconic red bird from the original game',
    category: 'skins',
    rarity: 'common',
    price: 50,
    icon: '🔴',
    preview: '🐦🔴',
    effects: [],
    metadata: {
      tags: ['classic', 'red', 'original']
    }
  },
  {
    id: 'golden_eagle',
    name: 'Golden Eagle',
    description: 'Majestic golden bird that shines as it flies',
    category: 'skins',
    rarity: 'rare',
    price: 200,
    icon: '🟨',
    preview: '🦅✨',
    unlockRequirement: {
      type: 'score',
      value: 25
    },
    effects: [
      {
        type: 'visual_effect',
        property: 'trail',
        value: 'golden_sparkles'
      }
    ],
    metadata: {
      tags: ['golden', 'rare', 'sparkles']
    }
  },
  {
    id: 'phoenix_bird',
    name: 'Phoenix',
    description: 'Legendary fire bird that rises from ashes',
    category: 'skins',
    rarity: 'legendary',
    price: 1000,
    icon: '🔥',
    preview: '🔥🐦🔥',
    unlockRequirement: {
      type: 'achievement',
      value: 'veteran_player'
    },
    effects: [
      {
        type: 'visual_effect',
        property: 'trail',
        value: 'fire_trail'
      },
      {
        type: 'gameplay_modifier',
        property: 'resurrection',
        value: 1
      }
    ],
    metadata: {
      tags: ['fire', 'legendary', 'resurrection']
    }
  },
  {
    id: 'ice_bird',
    name: 'Ice Bird',
    description: 'Cool blue bird with frost effects',
    category: 'skins',
    rarity: 'epic',
    price: 500,
    icon: '❄️',
    preview: '🐦❄️',
    unlockRequirement: {
      type: 'score',
      value: 100
    },
    effects: [
      {
        type: 'visual_effect',
        property: 'trail',
        value: 'ice_crystals'
      }
    ],
    metadata: {
      tags: ['ice', 'frost', 'blue']
    }
  },

  // Power-ups
  {
    id: 'super_shield',
    name: 'Super Shield',
    description: 'Enhanced shield that lasts 10 seconds',
    category: 'powerups',
    rarity: 'rare',
    price: 75,
    icon: '🛡️',
    effects: [
      {
        type: 'gameplay_modifier',
        property: 'shield_duration',
        value: 10,
        duration: 10
      }
    ],
    metadata: {
      tags: ['defense', 'shield', 'protection']
    }
  },
  {
    id: 'coin_magnet',
    name: 'Coin Magnet',
    description: 'Automatically attracts nearby coins',
    category: 'powerups',
    rarity: 'common',
    price: 30,
    icon: '🧲',
    effects: [
      {
        type: 'gameplay_modifier',
        property: 'coin_attraction',
        value: 150, // pixels radius
        duration: 15
      }
    ],
    metadata: {
      tags: ['coins', 'magnet', 'collection']
    }
  },
  {
    id: 'time_warp',
    name: 'Time Warp',
    description: 'Slows down time for easier navigation',
    category: 'powerups',
    rarity: 'epic',
    price: 150,
    icon: '⏰',
    unlockRequirement: {
      type: 'games_played',
      value: 10
    },
    effects: [
      {
        type: 'gameplay_modifier',
        property: 'game_speed',
        value: 0.5,
        duration: 8
      }
    ],
    metadata: {
      tags: ['time', 'slow', 'precision']
    }
  },

  // Upgrades
  {
    id: 'stronger_wings',
    name: 'Stronger Wings',
    description: 'Increases jump power by 20%',
    category: 'upgrades',
    rarity: 'common',
    price: 100,
    icon: '💪',
    effects: [
      {
        type: 'stat_boost',
        property: 'jump_power',
        value: 1.2
      }
    ],
    metadata: {
      tags: ['jump', 'power', 'permanent']
    }
  },
  {
    id: 'feather_light',
    name: 'Feather Light',
    description: 'Reduces gravity by 15%',
    category: 'upgrades',
    rarity: 'rare',
    price: 250,
    icon: '🪶',
    unlockRequirement: {
      type: 'score',
      value: 50
    },
    effects: [
      {
        type: 'stat_boost',
        property: 'gravity',
        value: 0.85
      }
    ],
    metadata: {
      tags: ['gravity', 'light', 'permanent']
    }
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Increases coin spawn rate by 50%',
    category: 'upgrades',
    rarity: 'epic',
    price: 400,
    icon: '🍀',
    unlockRequirement: {
      type: 'achievement',
      value: 'coin_collector'
    },
    effects: [
      {
        type: 'stat_boost',
        property: 'coin_spawn_rate',
        value: 1.5
      }
    ],
    metadata: {
      tags: ['luck', 'coins', 'spawn']
    }
  },

  // Consumables
  {
    id: 'extra_life',
    name: 'Extra Life',
    description: 'Get one free revival when you crash',
    category: 'consumables',
    rarity: 'rare',
    price: 200,
    icon: '💖',
    effects: [
      {
        type: 'gameplay_modifier',
        property: 'extra_lives',
        value: 1
      }
    ],
    metadata: {
      tags: ['life', 'revival', 'second_chance']
    }
  },
  {
    id: 'score_multiplier',
    name: '2x Score Boost',
    description: 'Double your score for the next game',
    category: 'consumables',
    rarity: 'common',
    price: 80,
    icon: '⭐',
    effects: [
      {
        type: 'gameplay_modifier',
        property: 'score_multiplier',
        value: 2,
        duration: 300 // 5 minutes
      }
    ],
    metadata: {
      tags: ['score', 'boost', 'multiplier']
    }
  },
  {
    id: 'coin_shower',
    name: 'Coin Shower',
    description: 'Spawns extra coins for 30 seconds',
    category: 'consumables',
    rarity: 'common',
    price: 60,
    icon: '🌟',
    effects: [
      {
        type: 'gameplay_modifier',
        property: 'extra_coin_spawn',
        value: 3, // 3x normal spawn rate
        duration: 30
      }
    ],
    metadata: {
      tags: ['coins', 'shower', 'temporary']
    }
  }
];