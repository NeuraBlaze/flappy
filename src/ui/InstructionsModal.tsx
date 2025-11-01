import React from 'react';

interface InstructionsModalProps {
  setShowInstructions: (show: boolean) => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({
  setShowInstructions
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md text-white pixel-text">
        <h2 className="text-2xl mb-4 text-center">📖 Utasítások</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Vezérlés:</strong></p>
          <p>• Kattintás / Érintés / SPACE / ↑ = Ugrás</p>
          <p>• P = Szünet</p>
          <p>• R = Újrakezdés (game over után)</p>
          <p>• D = Debug mód</p>
          
          <p className="mt-4"><strong>Power-upok:</strong></p>
          <p>🛡 <span className="text-blue-400">Pajzs</span> - 5mp védelem</p>
          <p>⏰ <span className="text-purple-400">Lassítás</span> - 3mp slow motion</p>
          <p>★ <span className="text-yellow-400">Bónusz</span> - +5 pont</p>
          <p>🧲 <span className="text-orange-400">Mágnes</span> - 4mp érme vonzás</p>
          <p>2x <span className="text-green-400">Dupla pont</span> - 5mp dupla pontszám</p>
          <p>🌈 <span className="text-pink-400">Szivárvány</span> - 5mp varázslatos mód</p>
          
          <p className="mt-4"><strong>🔥 KOMBINÁCIÓ MÓDOK:</strong></p>
          <p>⚡ <span className="text-yellow-300">SUPER MODE</span> - Pajzs + Lassítás</p>
          <p>💎 <span className="text-pink-400">MEGA MODE</span> - Mágnes + Dupla</p>
          <p>🌟 <span className="text-purple-300">GOD MODE</span> - Szivárvány + Pajzs</p>
          <p className="text-xs text-gray-400 mt-2">Gyűjts 2 power-upot 3 másodpercen belül!</p>
          
          <p className="mt-4"><strong>Érmék:</strong></p>
          <p>🪙 <span className="text-yellow-400">Arany érme</span> - 1 pont</p>
          <p>💰 <span className="text-yellow-400">Kincs</span> - 5 pont (ritka)</p>
          
          <p className="mt-4"><strong>Célok:</strong></p>
          <p>• Kerüld el az akadályokat</p>
          <p>• Gyűjts power-upokat</p>
          <p>• Érj el magas pontszámot!</p>
        </div>
        <button 
          onClick={() => setShowInstructions(false)}
          className="pixel-button px-6 py-3 mt-4 w-full"
        >
          ❌ Bezárás
        </button>
      </div>
    </div>
  );
};

export default InstructionsModal;