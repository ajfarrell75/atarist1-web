import React, { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import EmulatorContainer from './components/EmulatorContainer';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [emulator, setEmulator] = useState(null);

  const handleStart = () => {
    if (emulator) {
      emulator.reset();
      emulator.setRunning(true);
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (emulator) {
      emulator.setRunning(false);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (emulator) {
      emulator.reset();
      setIsRunning(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🎮 NeoST WebAssembly Emulator</h1>
          <p className="app-subtitle">
            Atari ST/STE/Mega emulation in your browser — cycle-accurate, fully transparent
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-main">
        <ControlPanel
          emulator={emulator}
          isRunning={isRunning}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
        />
        <EmulatorContainer
          onEmulatorReady={setEmulator}
          onRunningChange={setIsRunning}
        />
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <span className="footer-label">Getting Started:</span>
            <span>
              1. Select machine model • 2. Load ROM or disk • 3. Press Start
            </span>
          </div>
          <div className="footer-section">
            <span className="footer-label">Drag & Drop:</span>
            <span>
              Drop .st, .msa, .dim, or .stx files onto the screen
            </span>
          </div>
          <div className="footer-section">
            <span className="footer-label">Keyboard:</span>
            <span>
              Space = Pause/Resume | R = Reset | F5 = Save | F7 = Load
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
