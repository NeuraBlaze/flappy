import React from 'react';

interface ScoreDisplayProps {
  score: number;
  coins: number;
  bird: {
    doublePoints: number;
    godMode: number;
    superMode: number;
    megaMode: number;
    shield: number;
    slowMotion: number;
    magnet: number;
    rainbow: number;
    comboWindow: number;
  };
  weather: {
    type: string;
  };
  currentBiome: {
    id: string;
  };
  fps: number;
  powerUps: any[];
  gameCoins: any[];
  lastError: string;
  debug: boolean;
  detectPerformanceLevel: () => string;
  getPerfConfig: () => { maxPowerUps: number; maxCoins: number };
  setLastError: (error: string) => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  coins,
  bird,
  weather,
  currentBiome,
  fps,
  powerUps,
  gameCoins,
  lastError,
  debug,
  detectPerformanceLevel,
  getPerfConfig,
  setLastError
}) => {
  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
      <div className="score-display">
        {score} {bird.doublePoints > 0 && <span className="text-green-400">2x</span>}
      </div>
      <div className="text-center">
        {/* Coins */}
        <div className="text-yellow-400 text-lg font-bold">
          🪙 {coins}
        </div>
        
        {/* FPS Monitor - valós render FPS */}
        <div className="text-cyan-400 text-sm font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
          Render: {fps} FPS | Logic: 120 FPS | {detectPerformanceLevel().toUpperCase()}
        </div>
        
        {/* Debug Spawn Info */}
        {debug && (
          <div className="text-white text-xs font-mono bg-black bg-opacity-50 px-2 py-1 rounded">
            PowerUps: {powerUps.length}/{getPerfConfig().maxPowerUps} | 
            Coins: {gameCoins.length}/{getPerfConfig().maxCoins}
          </div>
        )}
        
        {/* Error Display */}
        {lastError && (
          <div className="text-red-400 text-xs font-mono bg-red-900 bg-opacity-75 px-2 py-1 rounded max-w-md">
            🚨 {lastError}
            <button 
              className="ml-2 text-white hover:text-red-300"
              onClick={() => setLastError('')}
            >
              ❌
            </button>
          </div>
        )}
        
        {/* Active effects */}
        <div className="flex justify-center gap-2 mt-1">
          {/* Combination effects (priority display) */}
          {bird.godMode > 0 && (
            <div className="text-purple-300 text-sm font-bold animate-pulse">
              🌟 GOD MODE {Math.ceil(bird.godMode / 60)}s
            </div>
          )}
          {bird.superMode > 0 && bird.godMode === 0 && (
            <div className="text-yellow-300 text-sm font-bold animate-bounce">
              ⚡ SUPER MODE {Math.ceil(bird.superMode / 60)}s
            </div>
          )}
          {bird.megaMode > 0 && bird.godMode === 0 && (
            <div className="text-pink-400 text-sm font-bold animate-ping">
              💎 MEGA MODE {Math.ceil(bird.megaMode / 60)}s
            </div>
          )}
          
          {/* Standard effects (only show if no combo active) */}
          {bird.godMode === 0 && bird.superMode === 0 && bird.megaMode === 0 && (
            <>
              {bird.shield > 0 && (
                <div className="text-blue-400 text-sm font-bold">
                  🛡 {Math.ceil(bird.shield / 60)}s
                </div>
              )}
              {bird.slowMotion > 0 && (
                <div className="text-purple-400 text-sm font-bold">
                  ⏰ {Math.ceil(bird.slowMotion / 60)}s
                </div>
              )}
              {bird.magnet > 0 && (
                <div className="text-orange-400 text-sm font-bold">
                  🧲 {Math.ceil(bird.magnet / 60)}s
                </div>
              )}
              {bird.doublePoints > 0 && (
                <div className="text-green-400 text-sm font-bold">
                  2x {Math.ceil(bird.doublePoints / 60)}s
                </div>
              )}
              {bird.rainbow > 0 && (
                <div className="text-pink-400 text-sm font-bold animate-pulse">
                  🌈 {Math.ceil(bird.rainbow / 60)}s
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Combo window indicator */}
        {bird.comboWindow > 0 && bird.godMode === 0 && bird.superMode === 0 && bird.megaMode === 0 && (
          <div className="text-yellow-300 text-xs font-bold mt-1 animate-pulse">
            ⚡ COMBO READY! ({Math.ceil(bird.comboWindow / 60)}s)
          </div>
        )}
        
        {/* Weather indicator */}
        {weather.type !== 'clear' && (
          <div className="text-white text-sm font-bold mt-1">
            {weather.type === 'rain' && '🌧️ Esik'}
            {weather.type === 'snow' && '❄️ Havazik'}
            {weather.type === 'fog' && '🌫️ Ködös'}
          </div>
        )}
        
        {/* Biome indicator */}
        <div className="text-white text-xs font-bold mt-1 opacity-75">
          {currentBiome.id === 'forest' && '🌲 Varázserdő'}
          {currentBiome.id === 'city' && '🏙️ Cyber Város'}
          {score >= 10 && (
            <div className="text-yellow-400 text-xs">
              Következő biome: {Math.floor((score + 10) / 10) * 10} pont
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;