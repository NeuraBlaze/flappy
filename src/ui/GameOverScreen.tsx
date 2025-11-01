import React from 'react';

interface Achievement {
  id: string;
  icon: string;
  unlocked: boolean;
}

interface GameOverScreenProps {
  score: number;
  coins: number;
  best: number;
  achievements: Achievement[];
  flap: () => void;
  setState: (state: any) => void;
  GameState: { MENU: any };
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  coins,
  best,
  achievements,
  flap,
  setState,
  GameState
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="text-center text-white">
        <h2 className="pixel-text text-4xl md:text-6xl mb-4 text-red-500 animate-pulse-fast">
          💀 GAME OVER
        </h2>
        <div className="pixel-text text-2xl mb-2">Pontszám: {score}</div>
        <div className="pixel-text text-lg mb-2 text-yellow-400">🪙 Érmék: {coins}</div>
        <div className="pixel-text text-xl mb-8 text-yellow-400">
          🏆 Best: {best}
          {score > best && (
            <div className="text-green-400 text-lg animate-pulse">
              🎉 ÚJ REKORD! 🎉
            </div>
          )}
        </div>
        
        {/* Achievements display */}
        <div className="mb-4">
          <div className="text-white text-lg pixel-text mb-2">🏆 Teljesítmények:</div>
          <div className="grid grid-cols-3 gap-2 max-w-xs">
            {achievements.slice(0, 6).map(ach => (
              <div key={ach.id} className={`text-2xl ${ach.unlocked ? 'opacity-100' : 'opacity-30'}`}>
                {ach.icon}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 pointer-events-auto">
          <button 
            onClick={flap}
            className="pixel-button px-8 py-4 text-xl"
          >
            🔄 ÚJ JÁTÉK
          </button>
          <button 
            onClick={() => setState(GameState.MENU)}
            className="pixel-button px-6 py-3 text-lg block mx-auto"
          >
            🏠 FŐMENÜ
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;