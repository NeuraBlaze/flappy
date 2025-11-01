import React from 'react';

interface ConsoleTerminalProps {
  consoleInput: string;
  setConsoleInput: (input: string) => void;
  handleConsoleCommand: (command: string) => void;
  setShowConsole: (show: boolean) => void;
}

const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({
  consoleInput,
  setConsoleInput,
  handleConsoleCommand,
  setShowConsole
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center pointer-events-auto">
      <div className="bg-black border-2 border-green-400 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-green-400 text-xl mb-4 font-mono text-center">💻 SZENYO-TERMINAL</h2>
        
        <div className="bg-gray-900 p-4 rounded mb-4 font-mono text-sm">
          <div className="text-green-400">szenyo@madar:~$ </div>
          <div className="text-gray-400 text-xs mb-2">Írj be egy parancsot...</div>
        </div>
        
        <input 
          type="text"
          value={consoleInput}
          onChange={(e) => setConsoleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConsoleCommand(consoleInput);
            }
          }}
          className="w-full px-3 py-2 bg-gray-900 border border-green-400 text-green-400 font-mono rounded mb-4 focus:outline-none focus:border-green-300"
          placeholder="Parancs..."
          autoFocus
        />
        
        <div className="flex gap-2">
          <button 
            onClick={() => handleConsoleCommand(consoleInput)}
            className="bg-green-600 hover:bg-green-500 text-white font-mono px-4 py-2 rounded flex-1"
          >
            FUTTAT
          </button>
          <button 
            onClick={() => {
              setShowConsole(false);
              setConsoleInput("");
            }}
            className="bg-red-600 hover:bg-red-500 text-white font-mono px-4 py-2 rounded flex-1"
          >
            BEZÁR
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-4 text-center font-mono">
          Tipp: Próbálj ki különböző parancsokat! 😉
        </div>
      </div>
    </div>
  );
};

export default ConsoleTerminal;