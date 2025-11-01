import { useState, useCallback, useRef, useEffect } from 'react';

// Simplified interfaces
export interface NotificationOptions {
  title?: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface PopupOptions {
  title: string;
  content: string;
  type?: 'info' | 'confirmation' | 'input' | 'custom';
  buttons?: Array<{
    text: string;
    action: string;
    type?: 'primary' | 'secondary' | 'danger';
  }>;
  onAction?: (action: string, data?: any) => void;
  hasBackdrop?: boolean;
  backdropDismiss?: boolean;
}

export interface UIOverlayManagerReturn {
  // Notification functions
  showNotification: (options: NotificationOptions) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Popup functions  
  showPopup: (options: PopupOptions) => string;
  hidePopup: (id: string) => void;
  clearAllPopups: () => void;
  
  // Convenience notification methods
  showInfo: (content: string, title?: string, duration?: number) => string;
  showSuccess: (content: string, title?: string, duration?: number) => string;
  showWarning: (content: string, title?: string, duration?: number) => string;
  showError: (content: string, title?: string, duration?: number) => string;
  showAchievement: (achievement: string, description: string) => string;
  
  // Convenience popup methods
  showConfirmation: (title: string, content: string, onConfirm: () => void, onCancel?: () => void) => string;
  showInputDialog: (title: string, placeholder: string, onSubmit: (value: string) => void, onCancel?: () => void) => string;
  showLoadingDialog: (content: string, title?: string) => string;
  
  // Game-specific UI functions
  showGameOver: (score: number, highScore: number, onRestart: () => void, onMenu: () => void) => void;
  showPauseMenu: (onResume: () => void, onRestart: () => void, onMenu: () => void) => void;
  showSettingsDialog: (onSave: (settings: any) => void, onCancel: () => void) => void;
  showScoreNotification: (score: number, isHighScore: boolean) => void;
  showPowerUpNotification: (powerUp: string, duration: number) => void;
  showLevelComplete: (level: number, score: number, time: number, onContinue: () => void, onRestart: () => void) => void;
  
  // State
  activeNotifications: any[];
  activePopups: any[];
  isVisible: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useUIOverlayManager = (): UIOverlayManagerReturn => {
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const [activePopups, setActivePopups] = useState<any[]>([]);
  const timeoutRefs = useRef<Map<string, number>>(new Map());

  // Core notification functions
  const showNotification = useCallback((options: NotificationOptions): string => {
    const id = generateId();
    const notification = {
      id,
      title: options.title,
      content: options.content,
      type: options.type || 'info',
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      timestamp: Date.now(),
    };

    setActiveNotifications(prev => [...prev, notification]);

    // Auto-hide after duration
    if (notification.duration > 0) {
      const timeout = setTimeout(() => {
        hideNotification(id);
      }, notification.duration);
      timeoutRefs.current.set(id, timeout);
    }

    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(notification => notification.id !== id));
    
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setActiveNotifications([]);
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  // Core popup functions
  const showPopup = useCallback((options: PopupOptions): string => {
    const id = generateId();
    const popup = {
      id,
      title: options.title,
      content: options.content,
      type: options.type || 'info',
      buttons: options.buttons || [{ text: 'OK', action: 'ok', type: 'primary' }],
      onAction: options.onAction,
      hasBackdrop: options.hasBackdrop !== false,
      backdropDismiss: options.backdropDismiss !== false,
      timestamp: Date.now(),
    };

    setActivePopups(prev => [...prev, popup]);
    return id;
  }, []);

  const hidePopup = useCallback((id: string) => {
    setActivePopups(prev => prev.filter(popup => popup.id !== id));
  }, []);

  const clearAllPopups = useCallback(() => {
    setActivePopups([]);
  }, []);

  // Convenience notification methods
  const showInfo = useCallback((content: string, title?: string, duration?: number): string => {
    return showNotification({ content, title, type: 'info', duration });
  }, [showNotification]);

  const showSuccess = useCallback((content: string, title?: string, duration?: number): string => {
    return showNotification({ content, title, type: 'success', duration });
  }, [showNotification]);

  const showWarning = useCallback((content: string, title?: string, duration?: number): string => {
    return showNotification({ content, title, type: 'warning', duration });
  }, [showNotification]);

  const showError = useCallback((content: string, title?: string, duration?: number): string => {
    return showNotification({ content, title, type: 'error', duration: duration || 6000 });
  }, [showNotification]);

  const showAchievement = useCallback((achievement: string, description: string): string => {
    return showNotification({ 
      title: achievement, 
      content: description, 
      type: 'achievement', 
      duration: 5000 
    });
  }, [showNotification]);

  // Convenience popup methods
  const showConfirmation = useCallback((
    title: string, 
    content: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ): string => {
    return showPopup({
      title,
      content,
      type: 'confirmation',
      buttons: [
        { text: 'Cancel', action: 'cancel', type: 'secondary' },
        { text: 'Confirm', action: 'confirm', type: 'primary' }
      ],
      onAction: (action) => {
        if (action === 'confirm') onConfirm();
        else if (action === 'cancel' && onCancel) onCancel();
      }
    });
  }, [showPopup]);

  const showInputDialog = useCallback((
    title: string, 
    placeholder: string, 
    onSubmit: (value: string) => void, 
    onCancel?: () => void
  ): string => {
    return showPopup({
      title,
      content: `<input type="text" placeholder="${placeholder}" id="dialog-input" />`,
      type: 'input',
      buttons: [
        { text: 'Cancel', action: 'cancel', type: 'secondary' },
        { text: 'OK', action: 'submit', type: 'primary' }
      ],
      onAction: (action) => {
        if (action === 'submit') {
          const input = document.getElementById('dialog-input') as HTMLInputElement;
          onSubmit(input?.value || '');
        } else if (action === 'cancel' && onCancel) {
          onCancel();
        }
      }
    });
  }, [showPopup]);

  const showLoadingDialog = useCallback((content: string, title?: string): string => {
    return showPopup({
      title: title || 'Loading...',
      content,
      type: 'info',
      buttons: [],
      hasBackdrop: true,
      backdropDismiss: false
    });
  }, [showPopup]);

  // Game-specific UI functions
  const showGameOver = useCallback((
    score: number, 
    highScore: number, 
    onRestart: () => void, 
    onMenu: () => void
  ) => {
    showPopup({
      title: 'Game Over',
      content: `Score: ${score}${score >= highScore ? ' (New High Score!)' : `\nHigh Score: ${highScore}`}`,
      type: 'info',
      buttons: [
        { text: 'Main Menu', action: 'menu', type: 'secondary' },
        { text: 'Play Again', action: 'restart', type: 'primary' }
      ],
      onAction: (action) => {
        if (action === 'restart') onRestart();
        else if (action === 'menu') onMenu();
      }
    });
  }, [showPopup]);

  const showPauseMenu = useCallback((
    onResume: () => void, 
    onRestart: () => void, 
    onMenu: () => void
  ) => {
    showPopup({
      title: 'Game Paused',
      content: 'Game is paused. Choose an action to continue.',
      type: 'info',
      buttons: [
        { text: 'Main Menu', action: 'menu', type: 'secondary' },
        { text: 'Restart', action: 'restart', type: 'secondary' },
        { text: 'Resume', action: 'resume', type: 'primary' }
      ],
      onAction: (action) => {
        if (action === 'resume') onResume();
        else if (action === 'restart') onRestart();
        else if (action === 'menu') onMenu();
      }
    });
  }, [showPopup]);

  const showSettingsDialog = useCallback((
    onSave: (settings: any) => void, 
    onCancel: () => void
  ) => {
    showPopup({
      title: 'Settings',
      content: 'Game settings and configuration options.',
      type: 'custom',
      buttons: [
        { text: 'Cancel', action: 'cancel', type: 'secondary' },
        { text: 'Save', action: 'save', type: 'primary' }
      ],
      onAction: (action) => {
        if (action === 'save') onSave({});
        else if (action === 'cancel') onCancel();
      }
    });
  }, [showPopup]);

  const showScoreNotification = useCallback((score: number, isHighScore: boolean) => {
    showNotification({
      title: isHighScore ? 'New High Score!' : 'Score',
      content: `${score} points`,
      type: isHighScore ? 'achievement' : 'success',
      duration: 3000
    });
  }, [showNotification]);

  const showPowerUpNotification = useCallback((powerUp: string, duration: number) => {
    showNotification({
      title: 'Power-up Activated!',
      content: `${powerUp} (${duration}s)`,
      type: 'info',
      duration: 3000
    });
  }, [showNotification]);

  const showLevelComplete = useCallback((
    level: number, 
    score: number, 
    time: number, 
    onContinue: () => void, 
    onRestart: () => void
  ) => {
    showPopup({
      title: `Level ${level} Complete!`,
      content: `Score: ${score}\nTime: ${time}s`,
      type: 'info',
      buttons: [
        { text: 'Restart Level', action: 'restart', type: 'secondary' },
        { text: 'Continue', action: 'continue', type: 'primary' }
      ],
      onAction: (action) => {
        if (action === 'continue') onContinue();
        else if (action === 'restart') onRestart();
      }
    });
  }, [showPopup]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  const isVisible = activeNotifications.length > 0 || activePopups.length > 0;

  return {
    // Core functions
    showNotification,
    hideNotification,
    clearAllNotifications,
    showPopup,
    hidePopup,
    clearAllPopups,
    
    // Convenience notification methods
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showAchievement,
    
    // Convenience popup methods
    showConfirmation,
    showInputDialog,
    showLoadingDialog,
    
    // Game-specific functions
    showGameOver,
    showPauseMenu,
    showSettingsDialog,
    showScoreNotification,
    showPowerUpNotification,
    showLevelComplete,
    
    // State
    activeNotifications,
    activePopups,
    isVisible,
  };
};

export default useUIOverlayManager;