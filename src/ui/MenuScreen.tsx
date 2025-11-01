import React from 'react';

interface MenuScreenProps {
  flap: () => void;
  setShowBirdSelector: (show: boolean) => void;
  setShowBiomeSelector: (show: boolean) => void;
  setShowInstructions: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowConsole: (show: boolean) => void;
  setDebug: (debug: boolean) => void;
  debug: boolean;
  best: number;
  fps: number;
  showBirdSelector: boolean;
  getUnlockedSkinsCount: () => number;
  birdSkinsLength: number;
  detectPerformanceLevel: () => string;
  getPerfConfig: () => { maxParticles: number };
}

const MenuScreen: React.FC<MenuScreenProps> = ({
  flap,
  setShowBirdSelector,
  setShowBiomeSelector,
  setShowInstructions,
  setShowSettings,
  setShowConsole,
  setDebug,
  debug,
  best,
  fps,
  showBirdSelector,
  getUnlockedSkinsCount,
  birdSkinsLength,
  detectPerformanceLevel,
  getPerfConfig
}) => {
  return (
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
            🐦 MADÁR VÁLASZTÁS ({getUnlockedSkinsCount()}/{birdSkinsLength})
          </button>
          <button 
            onClick={() => setShowBiomeSelector(true)}
            className="pixel-button px-6 py-3 text-lg block mx-auto"
          >
            🌍 BIOM VÁLASZTÁS
          </button>
          <button 
            onClick={() => setShowInstructions(true)}
            className="pixel-button px-6 py-3 text-lg block mx-auto"
          >
            📖 UTASÍTÁSOK
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="pixel-button px-6 py-3 text-lg block mx-auto"
          >
            ⚙️ SEBESSÉG BEÁLLÍTÁSOK
          </button>
          <button 
            onClick={() => setShowConsole(true)}
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
  );
};

export default MenuScreen;