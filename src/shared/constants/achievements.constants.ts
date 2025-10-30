/**
 * Default achievements configuration
 */

import { Achievement } from '../../domains/scoring/ports';

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_flight',
    name: 'First Flight',
    description: 'Take your first jump!',
    icon: '🐣',
    unlocked: false,
    requirement: { type: 'totalJumps', value: 1 },
    reward: { coins: 10 }
  },
  {
    id: 'score_10',
    name: 'Rookie Flyer',
    description: 'Score 10 points',
    icon: '🎯',
    unlocked: false,
    requirement: { type: 'highScore', value: 10 },
    reward: { coins: 50 }
  },
  {
    id: 'score_50',
    name: 'Sky Master',
    description: 'Score 50 points',
    icon: '🚀',
    unlocked: false,
    requirement: { type: 'highScore', value: 50 },
    reward: { coins: 200 }
  },
  {
    id: 'coin_collector',
    name: 'Coin Collector',
    description: 'Collect 100 coins total',
    icon: '💰',
    unlocked: false,
    requirement: { type: 'coinsCollected', value: 100 },
    reward: { coins: 100 }
  },
  {
    id: 'power_user',
    name: 'Power User',
    description: 'Use 20 power-ups',
    icon: '⚡',
    unlocked: false,
    requirement: { type: 'powerUpsUsed', value: 20 },
    reward: { powerUp: 'shield' }
  },
  {
    id: 'shield_master',
    name: 'Shield Master',
    description: 'Activate shield 10 times',
    icon: '🛡️',
    unlocked: false,
    requirement: { type: 'shieldActivations', value: 10 },
    reward: { coins: 150 }
  },
  {
    id: 'pipe_clearer',
    name: 'Pipe Clearer',
    description: 'Clear 100 pipes',
    icon: '🌿',
    unlocked: false,
    requirement: { type: 'pipesCleared', value: 100 },
    reward: { coins: 300 }
  },
  {
    id: 'perfect_run',
    name: 'Perfect Run',
    description: 'Complete a run without crashing',
    icon: '💎',
    unlocked: false,
    requirement: { type: 'perfectRuns', value: 1 },
    reward: { coins: 500 }
  },
  {
    id: 'veteran_player',
    name: 'Veteran Player',
    description: 'Play 50 games',
    icon: '🏆',
    unlocked: false,
    requirement: { type: 'gamesPlayed', value: 50 },
    reward: { coins: 1000 }
  },
  {
    id: 'time_master',
    name: 'Time Master',
    description: 'Play for 1 hour total',
    icon: '⏰',
    unlocked: false,
    requirement: { type: 'totalPlayTime', value: 3600 }, // 1 hour in seconds
    reward: { coins: 750 }
  }
];