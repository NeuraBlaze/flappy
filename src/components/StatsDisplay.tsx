/**
 * Game Stats Display Component
 * Shows current game statistics and achievements
 */

import React from 'react';
import { GameStats, Achievement } from '../domains/scoring';

interface StatsDisplayProps {
  stats: GameStats;
  achievements: Achievement[];
  isVisible: boolean;
  onClose: () => void;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  achievements,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalAchievements = achievements.length;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50, #34495e)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '2px solid #3498db'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#3498db',
            fontSize: '24px'
          }}>
            📊 Game Statistics
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Game Stats */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#e67e22', marginBottom: '15px' }}>🎮 Game Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Games Played: <strong>{stats.gamesPlayed}</strong></div>
            <div>High Score: <strong>{stats.highScore}</strong></div>
            <div>Total Score: <strong>{stats.totalScore}</strong></div>
            <div>Crashes: <strong>{stats.crashCount}</strong></div>
            <div>Perfect Runs: <strong>{stats.perfectRuns}</strong></div>
            <div>Total Jumps: <strong>{stats.totalJumps}</strong></div>
            <div>Pipes Cleared: <strong>{stats.pipesCleared}</strong></div>
            <div>Play Time: <strong>{formatTime(stats.totalPlayTime)}</strong></div>
          </div>
        </div>

        {/* Power-ups & Collectibles */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#f39c12', marginBottom: '15px' }}>⚡ Power-ups & Collectibles</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Coins Collected: <strong>{stats.coinsCollected}</strong></div>
            <div>Power-ups Used: <strong>{stats.powerUpsUsed}</strong></div>
            <div>Shield Activations: <strong>{stats.shieldActivations}</strong></div>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 style={{ color: '#2ecc71', marginBottom: '15px' }}>
            🏆 Achievements ({unlockedAchievements.length}/{totalAchievements})
          </h3>
          <div style={{
            display: 'grid',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  borderRadius: '8px',
                  background: achievement.unlocked 
                    ? 'rgba(46, 204, 113, 0.2)' 
                    : 'rgba(149, 165, 166, 0.2)',
                  border: achievement.unlocked 
                    ? '1px solid #2ecc71' 
                    : '1px solid #95a5a6',
                  opacity: achievement.unlocked ? 1 : 0.6
                }}
              >
                <span style={{ fontSize: '20px' }}>
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: achievement.unlocked ? '#2ecc71' : '#95a5a6'
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px',
                    color: achievement.unlocked ? '#ecf0f1' : '#95a5a6'
                  }}>
                    {achievement.description}
                  </div>
                </div>
                {achievement.unlocked && achievement.reward?.coins && (
                  <div style={{ 
                    fontSize: '12px',
                    color: '#f39c12',
                    fontWeight: 'bold'
                  }}>
                    +{achievement.reward.coins}💰
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};