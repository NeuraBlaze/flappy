import { useState, useCallback, useRef, useEffect } from 'react';

// Menu types and interfaces
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action: string;
  isEnabled: boolean;
  isVisible: boolean;
  subItems?: MenuItem[];
  data?: any;
}

export interface MenuConfig {
  title?: string;
  theme: 'default' | 'dark' | 'light' | 'game';
  showBackButton: boolean;
  showLogo: boolean;
  enableAnimations: boolean;
  enableSounds: boolean;
  backgroundType: 'solid' | 'gradient' | 'image' | 'animated';
  layout: 'vertical' | 'horizontal' | 'grid';
}

export interface MenuState {
  currentMenu: string;
  previousMenu: string | null;
  isTransitioning: boolean;
  selectedIndex: number;
  navigationHistory: string[];
}

export interface MenuRendererReturn {
  // Core menu functions
  showMenu: (menuId: string, items: MenuItem[], config?: Partial<MenuConfig>) => void;
  hideMenu: () => void;
  navigateToMenu: (menuId: string, items: MenuItem[]) => void;
  goBack: () => void;
  
  // Menu item interaction
  selectItem: (index: number) => void;
  activateItem: (itemId: string) => void;
  setItemEnabled: (itemId: string, enabled: boolean) => void;
  setItemVisible: (itemId: string, visible: boolean) => void;
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
  
  // Navigation methods
  selectNext: () => void;
  selectPrevious: () => void;
  selectFirst: () => void;
  selectLast: () => void;
  
  // Game-specific menu functions
  showMainMenu: (onNewGame: () => void, onLoadGame: () => void, onSettings: () => void, onQuit: () => void) => void;
  showPauseMenu: (onResume: () => void, onRestart: () => void, onSettings: () => void, onMainMenu: () => void) => void;
  showGameOverMenu: (score: number, highScore: number, onRestart: () => void, onMainMenu: () => void) => void;
  showSettingsMenu: (currentSettings: any, onSave: (settings: any) => void, onCancel: () => void) => void;
  showCreditsMenu: (onBack: () => void) => void;
  showLevelSelectMenu: (levels: any[], onSelectLevel: (level: any) => void, onBack: () => void) => void;
  
  // Menu rendering control
  setMenuTheme: (theme: MenuConfig['theme']) => void;
  setMenuLayout: (layout: MenuConfig['layout']) => void;
  enableAnimations: (enabled: boolean) => void;
  enableSounds: (enabled: boolean) => void;
  
  // State getters
  currentMenuState: MenuState;
  currentMenuItems: MenuItem[];
  currentMenuConfig: MenuConfig;
  isMenuVisible: boolean;
  canGoBack: boolean;
  
  // Event handlers
  onMenuItemAction: (callback: (action: string, itemId: string, data?: any) => void) => () => void;
  onMenuShow: (callback: (menuId: string) => void) => () => void;
  onMenuHide: (callback: () => void) => () => void;
}

const DEFAULT_MENU_CONFIG: MenuConfig = {
  title: '',
  theme: 'default',
  showBackButton: true,
  showLogo: false,
  enableAnimations: true,
  enableSounds: true,
  backgroundType: 'gradient',
  layout: 'vertical',
};

const DEFAULT_MENU_STATE: MenuState = {
  currentMenu: '',
  previousMenu: null,
  isTransitioning: false,
  selectedIndex: 0,
  navigationHistory: [],
};

export const useMenuRenderer = (): MenuRendererReturn => {
  const [menuState, setMenuState] = useState<MenuState>(DEFAULT_MENU_STATE);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(DEFAULT_MENU_CONFIG);
  const [isVisible, setIsVisible] = useState(false);
  
  // Event callback refs
  const onItemActionCallbacks = useRef<Set<(action: string, itemId: string, data?: any) => void>>(new Set());
  const onShowCallbacks = useRef<Set<(menuId: string) => void>>(new Set());
  const onHideCallbacks = useRef<Set<() => void>>(new Set());

  // Core menu functions
  const showMenu = useCallback((menuId: string, items: MenuItem[], config: Partial<MenuConfig> = {}) => {
    const newConfig = { ...DEFAULT_MENU_CONFIG, ...config };
    
    setMenuConfig(newConfig);
    setMenuItems(items);
    setMenuState(prev => ({
      ...prev,
      currentMenu: menuId,
      selectedIndex: 0,
      isTransitioning: true,
    }));
    setIsVisible(true);
    
    // Trigger show callbacks
    onShowCallbacks.current.forEach(callback => callback(menuId));
    
    // Reset transition state after animation
    setTimeout(() => {
      setMenuState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, isTransitioning: true }));
    
    setTimeout(() => {
      setIsVisible(false);
      setMenuState(DEFAULT_MENU_STATE);
      setMenuItems([]);
      
      // Trigger hide callbacks
      onHideCallbacks.current.forEach(callback => callback());
    }, 300);
  }, []);

  const navigateToMenu = useCallback((menuId: string, items: MenuItem[]) => {
    setMenuState(prev => ({
      ...prev,
      previousMenu: prev.currentMenu,
      navigationHistory: [...prev.navigationHistory, prev.currentMenu],
    }));
    
    showMenu(menuId, items);
  }, [showMenu]);

  const goBack = useCallback(() => {
    const { navigationHistory } = menuState;
    if (navigationHistory.length > 0) {
      const previousMenu = navigationHistory[navigationHistory.length - 1];
      setMenuState(prev => ({
        ...prev,
        currentMenu: previousMenu,
        navigationHistory: prev.navigationHistory.slice(0, -1),
        selectedIndex: 0,
        isTransitioning: true,
      }));
      
      setTimeout(() => {
        setMenuState(prev => ({ ...prev, isTransitioning: false }));
      }, 300);
    } else {
      hideMenu();
    }
  }, [menuState, hideMenu]);

  // Menu item interaction
  const selectItem = useCallback((index: number) => {
    const enabledItems = menuItems.filter(item => item.isEnabled && item.isVisible);
    if (index >= 0 && index < enabledItems.length) {
      setMenuState(prev => ({ ...prev, selectedIndex: index }));
    }
  }, [menuItems]);

  const activateItem = useCallback((itemId: string) => {
    const item = menuItems.find(item => item.id === itemId);
    if (item && item.isEnabled) {
      onItemActionCallbacks.current.forEach(callback => 
        callback(item.action, itemId, item.data)
      );
    }
  }, [menuItems]);

  const setItemEnabled = useCallback((itemId: string, enabled: boolean) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isEnabled: enabled } : item
    ));
  }, []);

  const setItemVisible = useCallback((itemId: string, visible: boolean) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isVisible: visible } : item
    ));
  }, []);

  const updateMenuItem = useCallback((itemId: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  // Navigation methods
  const selectNext = useCallback(() => {
    const enabledItems = menuItems.filter(item => item.isEnabled && item.isVisible);
    const nextIndex = (menuState.selectedIndex + 1) % enabledItems.length;
    selectItem(nextIndex);
  }, [menuItems, menuState.selectedIndex, selectItem]);

  const selectPrevious = useCallback(() => {
    const enabledItems = menuItems.filter(item => item.isEnabled && item.isVisible);
    const prevIndex = menuState.selectedIndex === 0 
      ? enabledItems.length - 1 
      : menuState.selectedIndex - 1;
    selectItem(prevIndex);
  }, [menuItems, menuState.selectedIndex, selectItem]);

  const selectFirst = useCallback(() => {
    selectItem(0);
  }, [selectItem]);

  const selectLast = useCallback(() => {
    const enabledItems = menuItems.filter(item => item.isEnabled && item.isVisible);
    selectItem(enabledItems.length - 1);
  }, [menuItems, selectItem]);

  // Game-specific menu functions
  const showMainMenu = useCallback((
    onNewGame: () => void, 
    onLoadGame: () => void, 
    onSettings: () => void, 
    onQuit: () => void
  ) => {
    const items: MenuItem[] = [
      {
        id: 'new-game',
        label: 'New Game',
        icon: '🎮',
        action: 'new-game',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'load-game',
        label: 'Continue',
        icon: '📂',
        action: 'load-game',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        action: 'settings',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'quit',
        label: 'Quit',
        icon: '🚪',
        action: 'quit',
        isEnabled: true,
        isVisible: true,
      },
    ];

    showMenu('main-menu', items, {
      title: 'Flappy Bird',
      showLogo: true,
      showBackButton: false,
    });

    // Set up action handlers
    const handleAction = (action: string) => {
      switch (action) {
        case 'new-game': onNewGame(); break;
        case 'load-game': onLoadGame(); break;
        case 'settings': onSettings(); break;
        case 'quit': onQuit(); break;
      }
    };

    onItemActionCallbacks.current.add(handleAction);
    return () => onItemActionCallbacks.current.delete(handleAction);
  }, [showMenu]);

  const showPauseMenu = useCallback((
    onResume: () => void, 
    onRestart: () => void, 
    onSettings: () => void, 
    onMainMenu: () => void
  ) => {
    const items: MenuItem[] = [
      {
        id: 'resume',
        label: 'Resume',
        icon: '▶️',
        action: 'resume',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'restart',
        label: 'Restart',
        icon: '🔄',
        action: 'restart',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        action: 'settings',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'main-menu',
        label: 'Main Menu',
        icon: '🏠',
        action: 'main-menu',
        isEnabled: true,
        isVisible: true,
      },
    ];

    showMenu('pause-menu', items, {
      title: 'Game Paused',
      showBackButton: false,
      backgroundType: 'solid',
    });

    const handleAction = (action: string) => {
      switch (action) {
        case 'resume': onResume(); hideMenu(); break;
        case 'restart': onRestart(); hideMenu(); break;
        case 'settings': onSettings(); break;
        case 'main-menu': onMainMenu(); hideMenu(); break;
      }
    };

    onItemActionCallbacks.current.add(handleAction);
    return () => onItemActionCallbacks.current.delete(handleAction);
  }, [showMenu, hideMenu]);

  const showGameOverMenu = useCallback((
    score: number, 
    highScore: number, 
    onRestart: () => void, 
    onMainMenu: () => void
  ) => {
    const items: MenuItem[] = [
      {
        id: 'restart',
        label: 'Play Again',
        icon: '🔄',
        action: 'restart',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'main-menu',
        label: 'Main Menu',
        icon: '🏠',
        action: 'main-menu',
        isEnabled: true,
        isVisible: true,
      },
    ];

    showMenu('game-over', items, {
      title: score >= highScore ? 'New High Score!' : 'Game Over',
      showBackButton: false,
      backgroundType: 'gradient',
    });

    const handleAction = (action: string) => {
      switch (action) {
        case 'restart': onRestart(); hideMenu(); break;
        case 'main-menu': onMainMenu(); hideMenu(); break;
      }
    };

    onItemActionCallbacks.current.add(handleAction);
    return () => onItemActionCallbacks.current.delete(handleAction);
  }, [showMenu, hideMenu]);

  const showSettingsMenu = useCallback((
    currentSettings: any, 
    onSave: (settings: any) => void, 
    onCancel: () => void
  ) => {
    const items: MenuItem[] = [
      {
        id: 'audio',
        label: `Audio: ${currentSettings.audioEnabled ? 'On' : 'Off'}`,
        icon: currentSettings.audioEnabled ? '🔊' : '🔇',
        action: 'toggle-audio',
        isEnabled: true,
        isVisible: true,
        data: { audioEnabled: !currentSettings.audioEnabled },
      },
      {
        id: 'difficulty',
        label: `Difficulty: ${currentSettings.difficulty || 'Normal'}`,
        icon: '⚡',
        action: 'cycle-difficulty',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'save',
        label: 'Save Settings',
        icon: '💾',
        action: 'save',
        isEnabled: true,
        isVisible: true,
      },
      {
        id: 'cancel',
        label: 'Cancel',
        icon: '❌',
        action: 'cancel',
        isEnabled: true,
        isVisible: true,
      },
    ];

    showMenu('settings', items, {
      title: 'Settings',
      showBackButton: true,
    });

    const handleAction = (action: string, itemId: string, data?: any) => {
      switch (action) {
        case 'toggle-audio':
          currentSettings.audioEnabled = data.audioEnabled;
          updateMenuItem(itemId, {
            label: `Audio: ${currentSettings.audioEnabled ? 'On' : 'Off'}`,
            icon: currentSettings.audioEnabled ? '🔊' : '🔇',
          });
          break;
        case 'save': onSave(currentSettings); hideMenu(); break;
        case 'cancel': onCancel(); hideMenu(); break;
      }
    };

    onItemActionCallbacks.current.add(handleAction);
    return () => onItemActionCallbacks.current.delete(handleAction);
  }, [showMenu, hideMenu, updateMenuItem]);

  const showCreditsMenu = useCallback((onBack: () => void) => {
    const items: MenuItem[] = [
      {
        id: 'back',
        label: 'Back',
        icon: '⬅️',
        action: 'back',
        isEnabled: true,
        isVisible: true,
      },
    ];

    showMenu('credits', items, {
      title: 'Credits',
      showBackButton: true,
    });

    const handleAction = (action: string, _itemId: string, _data?: any) => {
      if (action === 'back') {
        onBack();
        hideMenu();
      }
    };

    onItemActionCallbacks.current.add(handleAction);
    return () => onItemActionCallbacks.current.delete(handleAction);
  }, [showMenu, hideMenu]);

  const showLevelSelectMenu = useCallback((
    levels: any[], 
    onSelectLevel: (level: any) => void, 
    onBack: () => void
  ) => {
    const items: MenuItem[] = [
      ...levels.map((level, index) => ({
        id: `level-${index}`,
        label: `Level ${index + 1}`,
        icon: level.completed ? '✅' : '🔒',
        action: 'select-level',
        isEnabled: level.unlocked,
        isVisible: true,
        data: level,
      })),
      {
        id: 'back',
        label: 'Back',
        icon: '⬅️',
        action: 'back',
        isEnabled: true,
        isVisible: true,
      },
    ];

    showMenu('level-select', items, {
      title: 'Select Level',
      showBackButton: true,
      layout: 'grid',
    });

    const handleAction = (action: string, _itemId: string, data?: any) => {
      switch (action) {
        case 'select-level': onSelectLevel(data); hideMenu(); break;
        case 'back': onBack(); hideMenu(); break;
      }
    };

    onItemActionCallbacks.current.add(handleAction);
    return () => onItemActionCallbacks.current.delete(handleAction);
  }, [showMenu, hideMenu]);

  // Menu rendering control
  const setMenuTheme = useCallback((theme: MenuConfig['theme']) => {
    setMenuConfig(prev => ({ ...prev, theme }));
  }, []);

  const setMenuLayout = useCallback((layout: MenuConfig['layout']) => {
    setMenuConfig(prev => ({ ...prev, layout }));
  }, []);

  const enableAnimations = useCallback((enabled: boolean) => {
    setMenuConfig(prev => ({ ...prev, enableAnimations: enabled }));
  }, []);

  const enableSounds = useCallback((enabled: boolean) => {
    setMenuConfig(prev => ({ ...prev, enableSounds: enabled }));
  }, []);

  // Event handlers
  const onMenuItemAction = useCallback((callback: (action: string, itemId: string, data?: any) => void) => {
    onItemActionCallbacks.current.add(callback);
    return () => onItemActionCallbacks.current.delete(callback);
  }, []);

  const onMenuShow = useCallback((callback: (menuId: string) => void) => {
    onShowCallbacks.current.add(callback);
    return () => onShowCallbacks.current.delete(callback);
  }, []);

  const onMenuHide = useCallback((callback: () => void) => {
    onHideCallbacks.current.add(callback);
    return () => onHideCallbacks.current.delete(callback);
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          selectPrevious();
          break;
        case 'ArrowDown':
          event.preventDefault();
          selectNext();
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          const currentItem = menuItems[menuState.selectedIndex];
          if (currentItem) {
            activateItem(currentItem.id);
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (menuState.navigationHistory.length > 0) {
            goBack();
          } else {
            hideMenu();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, menuItems, menuState, selectNext, selectPrevious, activateItem, goBack, hideMenu]);

  const canGoBack = menuState.navigationHistory.length > 0;

  return {
    // Core menu functions
    showMenu,
    hideMenu,
    navigateToMenu,
    goBack,
    
    // Menu item interaction
    selectItem,
    activateItem,
    setItemEnabled,
    setItemVisible,
    updateMenuItem,
    
    // Navigation methods
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    
    // Game-specific menu functions
    showMainMenu,
    showPauseMenu,
    showGameOverMenu,
    showSettingsMenu,
    showCreditsMenu,
    showLevelSelectMenu,
    
    // Menu rendering control
    setMenuTheme,
    setMenuLayout,
    enableAnimations,
    enableSounds,
    
    // State getters
    currentMenuState: menuState,
    currentMenuItems: menuItems,
    currentMenuConfig: menuConfig,
    isMenuVisible: isVisible,
    canGoBack,
    
    // Event handlers
    onMenuItemAction,
    onMenuShow,
    onMenuHide,
  };
};

export default useMenuRenderer;