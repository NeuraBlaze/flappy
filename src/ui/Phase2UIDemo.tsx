import React, { useState } from 'react';
import {
  ScoreDisplay,
  MenuScreen,
  GameOverScreen,
  SettingsPanel,
  TouchControlButtons,
  InstructionsModal,
  BirdSelector,
  BiomeSelector,
  ConsoleTerminal
} from './index';

// Mock data and functions for demo
const mockBird = {
  current: {
    x: 100,
    y: 200,
    doublePoints: 0,
    godMode: 0,
    superMode: 0,
    megaMode: 0,
    shield: 0,
    slowMotion: 0,
    magnet: 0,
    rainbow: 0,
    comboWindow: 0,
    shadowTeleportsLeft: 3,
    wallPhaseLeft: 180,
    wallPhaseActive: false,
    warpJumpsLeft: 2
  }
};

const mockWeather = { type: 'clear' };
const mockCurrentBiome = { id: 'forest' };
const mockBirdSkins = {
  current: [
    {
      id: 'default',
      emoji: '🐦',
      name: 'Szenyo Madár',
      description: 'Az eredeti szenyo-madár',
      abilities: { jumpPower: 1.0 },
      unlockRequirement: { type: 'default', value: 0 }
    },
    {
      id: 'eagle',
      emoji: '🦅',
      name: 'Sas',
      description: 'Erős és gyors',
      abilities: { jumpPower: 1.2, gravity: 0.8 },
      unlockRequirement: { type: 'coins', value: 100 }
    }
  ]
};

const mockBiomes = {
  current: [
    {
      id: 'forest',
      name: 'Varázserdő',
      powerUpBonus: 1.2
    },
    {
      id: 'city',
      name: 'Cyber Város',
      powerUpBonus: 1.0
    }
  ]
};

const mockAchievements = [
  { id: '1', icon: '🏆', unlocked: true },
  { id: '2', icon: '🎯', unlocked: false },
  { id: '3', icon: '⭐', unlocked: true }
];

const Phase2UIDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<string>('menu');
  const [consoleInput, setConsoleInput] = useState('');
  const [speedSettings, setSpeedSettings] = useState({
    normal: 2.0,
    slowMotion: 1.0,
    rainbow: 3.0,
    super: 4.0,
    godMode: 2.5
  });

  // Mock functions
  const mockFunctions = {
    flap: () => console.log('Flap!'),
    setShowBirdSelector: (show: boolean) => console.log('Bird selector:', show),
    setShowBiomeSelector: (show: boolean) => console.log('Biome selector:', show),
    setShowInstructions: (show: boolean) => console.log('Instructions:', show),
    setShowSettings: (show: boolean) => console.log('Settings:', show),
    setShowConsole: (show: boolean) => console.log('Console:', show),
    setDebug: (debug: boolean) => console.log('Debug:', debug),
    setLastError: (error: string) => console.log('Error cleared:', error),
    detectPerformanceLevel: () => 'high' as const,
    getPerfConfig: () => ({ maxParticles: 100, maxPowerUps: 5, maxCoins: 10 }),
    getCurrentBirdSkin: () => mockBirdSkins.current[0],
    getUnlockedSkinsCount: () => 2,
    isSkinUnlocked: () => true,
    selectBirdSkin: (id: string) => console.log('Selected bird:', id),
    selectStartingBiome: (index: number) => console.log('Selected biome:', index),
    selectButtonPosition: (pos: 'left' | 'right') => console.log('Button position:', pos),
    setState: (state: any) => console.log('State changed:', state),
    saveSpeedSettings: (settings: any) => {
      setSpeedSettings(settings);
      console.log('Speed settings saved:', settings);
    },
    handleConsoleCommand: (cmd: string) => {
      console.log('Console command:', cmd);
      setConsoleInput('');
    },
    createParticles: (x: number, y: number, count: number, color: string, type: string) => 
      console.log('Particles created:', { x, y, count, color, type }),
    playSound: (freq: number, vol: number, type: string) => 
      console.log('Sound played:', { freq, vol, type }),
    shoot: () => console.log('Shoot!'),
    world: { current: { h: 400 } }
  };

  const renderDemo = () => {
    switch (currentDemo) {
      case 'score':
        return (
          <ScoreDisplay
            score={1234}
            coins={56}
            bird={mockBird.current}
            weather={mockWeather}
            currentBiome={mockCurrentBiome}
            fps={60}
            powerUps={[]}
            gameCoins={[]}
            lastError=""
            debug={false}
            detectPerformanceLevel={mockFunctions.detectPerformanceLevel}
            getPerfConfig={mockFunctions.getPerfConfig}
            setLastError={mockFunctions.setLastError}
          />
        );
      
      case 'menu':
        return (
          <MenuScreen
            flap={mockFunctions.flap}
            setShowBirdSelector={mockFunctions.setShowBirdSelector}
            setShowBiomeSelector={mockFunctions.setShowBiomeSelector}
            setShowInstructions={mockFunctions.setShowInstructions}
            setShowSettings={mockFunctions.setShowSettings}
            setShowConsole={mockFunctions.setShowConsole}
            setDebug={mockFunctions.setDebug}
            debug={false}
            best={999}
            fps={60}
            showBirdSelector={false}
            getUnlockedSkinsCount={mockFunctions.getUnlockedSkinsCount}
            birdSkinsLength={mockBirdSkins.current.length}
            detectPerformanceLevel={mockFunctions.detectPerformanceLevel}
            getPerfConfig={mockFunctions.getPerfConfig}
          />
        );
      
      case 'gameover':
        return (
          <GameOverScreen
            score={1234}
            coins={56}
            best={999}
            achievements={mockAchievements}
            flap={mockFunctions.flap}
            setState={mockFunctions.setState}
            GameState={{ MENU: 'menu' }}
          />
        );
      
      case 'settings':
        return (
          <SettingsPanel
            speedSettings={speedSettings}
            saveSpeedSettings={mockFunctions.saveSpeedSettings}
            setShowSettings={mockFunctions.setShowSettings}
          />
        );
      
      case 'instructions':
        return (
          <InstructionsModal
            setShowInstructions={mockFunctions.setShowInstructions}
          />
        );
      
      case 'birds':
        return (
          <BirdSelector
            getCurrentBirdSkin={mockFunctions.getCurrentBirdSkin}
            birdSkins={mockBirdSkins}
            selectedBirdSkin="default"
            isSkinUnlocked={mockFunctions.isSkinUnlocked}
            selectBirdSkin={mockFunctions.selectBirdSkin}
            getUnlockedSkinsCount={mockFunctions.getUnlockedSkinsCount}
            setShowBirdSelector={mockFunctions.setShowBirdSelector}
          />
        );
      
      case 'biomes':
        return (
          <BiomeSelector
            biomes={mockBiomes}
            startingBiome={0}
            buttonPosition="left"
            selectStartingBiome={mockFunctions.selectStartingBiome}
            selectButtonPosition={mockFunctions.selectButtonPosition}
            setShowBiomeSelector={mockFunctions.setShowBiomeSelector}
          />
        );
      
      case 'console':
        return (
          <ConsoleTerminal
            consoleInput={consoleInput}
            setConsoleInput={setConsoleInput}
            handleConsoleCommand={mockFunctions.handleConsoleCommand}
            setShowConsole={mockFunctions.setShowConsole}
          />
        );
      
      case 'controls':
        return (
          <TouchControlButtons
            buttonPosition="left"
            getCurrentBirdSkin={() => ({
              abilities: { shadowTeleport: true, flyThroughWalls: true, warpSpeed: true, canShoot: true }
            })}
            bird={mockBird}
            world={mockFunctions.world}
            createParticles={mockFunctions.createParticles}
            playSound={mockFunctions.playSound}
            shoot={mockFunctions.shoot}
          />
        );
      
      default:
        return <div>Demo kiválasztva: {currentDemo}</div>;
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 relative">
      {/* Demo selector */}
      <div className="absolute top-4 left-4 z-50 flex flex-wrap gap-2">
        {[
          { key: 'score', label: '📊 Score' },
          { key: 'menu', label: '🏠 Menu' },
          { key: 'gameover', label: '💀 Game Over' },
          { key: 'settings', label: '⚙️ Settings' },
          { key: 'instructions', label: '📖 Instructions' },
          { key: 'birds', label: '🐦 Birds' },
          { key: 'biomes', label: '🌍 Biomes' },
          { key: 'console', label: '💻 Console' },
          { key: 'controls', label: '🎮 Controls' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCurrentDemo(key)}
            className={`px-3 py-1 text-xs rounded font-mono ${
              currentDemo === key
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Canvas placeholder */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-96 h-96 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center text-white">
          Játék canvas itt lenne
        </div>
      </div>

      {/* Demo component */}
      {renderDemo()}
      
      {/* Demo info */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-sm font-mono">
        <div className="text-green-400 font-bold">Phase 2 UI Demo</div>
        <div>Aktív komponens: {currentDemo}</div>
        <div className="text-xs text-gray-400 mt-1">
          Minden UI komponens sikeresen kiszervezve!
        </div>
      </div>
    </div>
  );
};

export default Phase2UIDemo;