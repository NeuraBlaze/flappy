import React from 'react';

interface BirdSkin {
  id: string;
  emoji: string;
  name: string;
  description: string;
  abilities: Record<string, any>;
  unlockRequirement: {
    type: string;
    value: number;
  };
}

interface BirdSelectorProps {
  getCurrentBirdSkin: () => BirdSkin;
  birdSkins: { current: BirdSkin[] };
  selectedBirdSkin: string;
  isSkinUnlocked: (skin: BirdSkin) => boolean;
  selectBirdSkin: (id: string) => void;
  getUnlockedSkinsCount: () => number;
  setShowBirdSelector: (show: boolean) => void;
}

const BirdSelector: React.FC<BirdSelectorProps> = ({
  getCurrentBirdSkin,
  birdSkins,
  selectedBirdSkin,
  isSkinUnlocked,
  selectBirdSkin,
  getUnlockedSkinsCount,
  setShowBirdSelector
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg text-white pixel-text max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl mb-4 text-center">🐦 Madár Választás</h2>
        
        {/* Current selection display */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg text-center">
          <div className="text-3xl mb-2">{getCurrentBirdSkin().emoji}</div>
          <div className="text-lg font-bold">{getCurrentBirdSkin().name}</div>
          <div className="text-sm text-gray-300">{getCurrentBirdSkin().description}</div>
          {Object.keys(getCurrentBirdSkin().abilities).length > 0 && (
            <div className="text-xs text-yellow-400 mt-2">
              Képességek: {Object.entries(getCurrentBirdSkin().abilities).map(([key, value]) => 
                `${key}: ${(value as number * 100).toFixed(0)}%`
              ).join(', ')}
            </div>
          )}
        </div>
        
        {/* Bird grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {birdSkins.current.map(skin => {
            const isUnlocked = isSkinUnlocked(skin);
            const isSelected = selectedBirdSkin === skin.id;
            
            return (
              <button
                key={skin.id}
                onClick={() => isUnlocked && selectBirdSkin(skin.id)}
                disabled={!isUnlocked}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-yellow-400 bg-yellow-900/50' 
                    : isUnlocked
                    ? 'border-gray-600 bg-gray-700 hover:border-gray-400 hover:bg-gray-600'
                    : 'border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-2xl mb-1">{isUnlocked ? skin.emoji : '🔒'}</div>
                <div className="text-sm font-bold">{skin.name}</div>
                <div className="text-xs text-gray-300 mb-2">{skin.description}</div>
                
                {/* Unlock requirement */}
                {!isUnlocked && (
                  <div className="text-xs text-red-400">
                    {skin.unlockRequirement.type === 'coins' && `${skin.unlockRequirement.value} érme`}
                    {skin.unlockRequirement.type === 'score' && `${skin.unlockRequirement.value} pont best`}
                    {skin.unlockRequirement.type === 'achievement' && 'Achievement szükséges'}
                  </div>
                )}
                
                {/* Abilities preview */}
                {isUnlocked && Object.keys(skin.abilities).length > 0 && (
                  <div className="text-xs text-yellow-400 mt-1">
                    {Object.entries(skin.abilities).map(([key, value]) => (
                      <div key={key}>
                        {key === 'jumpPower' && '🚀 Ugrás'}
                        {key === 'gravity' && '🪶 Gravitáció'}
                        {key === 'magnetBonus' && '🧲 Mágnes'}
                        {key === 'shieldDuration' && '🛡️ Pajzs'}
                        {key === 'coinValue' && '💰 Érme'}
                        {key === 'extraLives' && `❤️ +${value} élet`}
                        {key === 'canShoot' && value && '🔫 Lövés'}
                        {key === 'autoShield' && `🛡️ Auto ${value}s`}
                        {typeof value === 'number' && key !== 'extraLives' && key !== 'autoShield' && !key.includes('can') && 
                          `: ${((value as number) * 100).toFixed(0)}%`}
                      </div>
                    ))}
                  </div>
                )}
                
                {isSelected && (
                  <div className="text-green-400 text-xs mt-2 font-bold">✓ KIVÁLASZTVA</div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Progress info */}
        <div className="text-center text-sm text-gray-400 mb-4">
          Feloldva: {getUnlockedSkinsCount()}/{birdSkins.current.length} madár
        </div>
        
        <button 
          onClick={() => setShowBirdSelector(false)}
          className="pixel-button px-6 py-3 w-full"
        >
          ❌ Bezárás
        </button>
      </div>
    </div>
  );
};

export default BirdSelector;