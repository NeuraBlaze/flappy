/**
 * Achievement Notification Component
 * Shows achievement unlock notifications
 */

import React, { useState, useEffect } from 'react';
import { Achievement } from '../domains/scoring';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div 
      className={`achievement-notification ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
        color: '#333',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)',
        border: '2px solid #ffd700',
        minWidth: '280px',
        transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        zIndex: 1000,
        fontSize: '14px',
        fontFamily: 'monospace'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        <span style={{ fontSize: '24px' }}>{achievement.icon}</span>
        <div>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '16px',
            marginBottom: '4px'
          }}>
            🏆 Achievement Unlocked!
          </div>
          <div style={{ 
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            {achievement.name}
          </div>
          <div style={{ 
            fontSize: '12px',
            color: '#555',
            marginTop: '2px'
          }}>
            {achievement.description}
          </div>
          {achievement.reward?.coins && (
            <div style={{ 
              fontSize: '12px',
              color: '#f39c12',
              marginTop: '4px',
              fontWeight: 'bold'
            }}>
              +{achievement.reward.coins} coins!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};