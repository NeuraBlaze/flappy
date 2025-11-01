import React from 'react';

interface Biome {
  id: string;
  name: string;
  powerUpBonus?: number;
}

interface BiomeSelectorProps {
  biomes: { current: Biome[] };
  startingBiome: number;
  buttonPosition: 'left' | 'right';
  selectStartingBiome: (index: number) => void;
  selectButtonPosition: (position: 'left' | 'right') => void;
  setShowBiomeSelector: (show: boolean) => void;
}

const BiomeSelector: React.FC<BiomeSelectorProps> = ({
  biomes,
  startingBiome,
  buttonPosition,
  selectStartingBiome,
  selectButtonPosition,
  setShowBiomeSelector
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <h2 className="pixel-text text-white text-2xl mb-4 text-center">🌍 BIOM VÁLASZTÁS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {biomes.current.map((biome, index) => {
            const isSelected = startingBiome === index;
            
            return (
              <button 
                key={biome.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-yellow-400 bg-yellow-900 bg-opacity-50' 
                    : 'border-gray-600 bg-gray-700 hover:border-gray-400'
                }`}
                onClick={() => selectStartingBiome(index)}
              >
                <div className="text-2xl mb-2">
                  {biome.id === 'forest' && '🌲'}
                  {biome.id === 'city' && '🏙️'}
                </div>
                <div className="text-white font-bold text-lg">{biome.name}</div>
                <div className="text-sm text-gray-300 mb-2">
                  {biome.id === 'forest' && 'Fák és természetes akadályok'}
                  {biome.id === 'city' && 'Futurisztikus épületek és neon fények'}
                </div>
                <div className="text-xs text-blue-400">
                  Power-up bonus: {((biome.powerUpBonus || 1) * 100).toFixed(0)}%
                </div>
                
                {isSelected && (
                  <div className="text-green-400 text-sm mt-2 font-bold">✓ KIVÁLASZTVA</div>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="text-center text-sm text-gray-400 mb-4">
          A játék ezzel a biommal kezdődik (10 pontonként vált át)
        </div>
        
        {/* Button Position Selector */}
        <div className="mb-4">
          <h3 className="text-white text-lg mb-2 text-center">📱 Touch Button Pozíció</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              className={`p-3 rounded-lg border-2 transition-all ${
                buttonPosition === 'left'
                  ? 'border-blue-400 bg-blue-900 bg-opacity-50' 
                  : 'border-gray-600 bg-gray-700 hover:border-gray-400'
              }`}
              onClick={() => selectButtonPosition('left')}
            >
              <div className="text-lg mb-1">👈</div>
              <div className="text-white font-bold">Bal oldal</div>
              <div className="text-xs text-gray-300">Képességek balra, lövés jobbra</div>
              {buttonPosition === 'left' && (
                <div className="text-green-400 text-sm mt-1 font-bold">✓ AKTÍV</div>
              )}
            </button>
            
            <button 
              className={`p-3 rounded-lg border-2 transition-all ${
                buttonPosition === 'right'
                  ? 'border-blue-400 bg-blue-900 bg-opacity-50' 
                  : 'border-gray-600 bg-gray-700 hover:border-gray-400'
              }`}
              onClick={() => selectButtonPosition('right')}
            >
              <div className="text-lg mb-1">👉</div>
              <div className="text-white font-bold">Jobb oldal</div>
              <div className="text-xs text-gray-300">Képességek jobbra, lövés balra</div>
              {buttonPosition === 'right' && (
                <div className="text-green-400 text-sm mt-1 font-bold">✓ AKTÍV</div>
              )}
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setShowBiomeSelector(false)}
          className="pixel-button px-6 py-3 w-full"
        >
          ❌ Bezárás
        </button>
      </div>
    </div>
  );
};

export default BiomeSelector;