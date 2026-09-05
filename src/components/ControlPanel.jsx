import React, { useState } from 'react';

const ControlPanel = ({ emulator, isRunning, onStart, onPause, onReset }) => {
  const [machineModel, setMachineModel] = useState('st');
  const [videoMode, setVideoMode] = useState('color');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleMachineChange = (model) => {
    if (emulator && !isRunning) {
      emulator.setMachineModel(model);
      setMachineModel(model);
    }
  };

  const handleVideoModeChange = (mode) => {
    if (emulator) {
      emulator.setVideoMode(mode);
      setVideoMode(mode);
    }
  };

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#0a0a0a',
        borderRight: '1px solid #00aa00',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #00aa00',
          backgroundColor: '#1a1a1a',
          color: '#00ff00',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: '14px',
        }}
      >
        NEOST CONTROL
      </div>

      {/* Machine Selection */}
      <div style={{ padding: '12px', borderBottom: '1px solid #003300' }}>
        <div
          style={{
            color: '#00aa00',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '6px',
            fontFamily: 'monospace',
          }}
        >
          MACHINE MODEL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {['st', 'megast', 'ste', 'megaste'].map((model) => (
            <label
              key={model}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#00ff00',
                fontSize: '12px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                opacity: isRunning ? 0.5 : 1,
              }}
            >
              <input
                type="radio"
                name="machine"
                value={model}
                checked={machineModel === model}
                onChange={(e) => handleMachineChange(e.target.value)}
                disabled={isRunning}
                style={{ marginRight: '6px', cursor: 'pointer' }}
              />
              {model.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Video Mode */}
      <div style={{ padding: '12px', borderBottom: '1px solid #003300' }}>
        <div
          style={{
            color: '#00aa00',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '6px',
            fontFamily: 'monospace',
          }}
        >
          VIDEO MODE
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['color', 'mono'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleVideoModeChange(mode)}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: videoMode === mode ? '#00aa00' : '#003300',
                color: videoMode === mode ? '#000' : '#00ff00',
                border: '1px solid #00aa00',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* CPU & Memory Info */}
      <div style={{ padding: '12px', borderBottom: '1px solid #003300' }}>
        <div
          style={{
            color: '#00aa00',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '6px',
            fontFamily: 'monospace',
          }}
        >
          SYSTEM INFO
        </div>
        <div style={{ color: '#00ff00', fontSize: '11px', fontFamily: 'monospace' }}>
          <div>CPU: 68000 @ 8 MHz</div>
          <div>RAM: 512 KB / 1 MB</div>
          <div>Display: 640×400 PAL</div>
          <div style={{ marginTop: '4px', color: '#00aa00' }}>
            Status: {isRunning ? '▶ RUNNING' : '⏸ STOPPED'}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={{ padding: '12px', borderBottom: '1px solid #003300' }}>
        <div
          style={{
            color: '#00aa00',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '6px',
            fontFamily: 'monospace',
          }}
        >
          SHORTCUTS
        </div>
        <div style={{ color: '#00ff00', fontSize: '10px', fontFamily: 'monospace' }}>
          <div>
            <span style={{ color: '#00aa00' }}>Space</span> - Start/Pause
          </div>
          <div>
            <span style={{ color: '#00aa00' }}>R</span> - Reset
          </div>
          <div>
            <span style={{ color: '#00aa00' }}>F5</span> - Save State
          </div>
          <div>
            <span style={{ color: '#00aa00' }}>F7</span> - Load State
          </div>
          <div>
            <span style={{ color: '#00aa00' }}>F12</span> - Toggle Debug
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div style={{ padding: '12px', borderBottom: '1px solid #003300' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#003300',
            color: '#00ff00',
            border: '1px solid #00aa00',
            borderRadius: '2px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          {showAdvanced ? '▼ ADVANCED' : '▶ ADVANCED'}
        </button>

        {showAdvanced && (
          <div style={{ marginTop: '8px', color: '#00ff00', fontSize: '11px' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <input type="checkbox" defaultChecked style={{ marginRight: '6px' }} />
              <span style={{ fontFamily: 'monospace' }}>Frame skip</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <input type="checkbox" defaultChecked style={{ marginRight: '6px' }} />
              <span style={{ fontFamily: 'monospace' }}>Audio enabled</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" style={{ marginRight: '6px' }} />
              <span style={{ fontFamily: 'monospace' }}>Debug output</span>
            </label>
          </div>
        )}
      </div>

      {/* About */}
      <div
        style={{
          marginTop: 'auto',
          padding: '12px',
          borderTop: '1px solid #003300',
          color: '#00aa00',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}
      >
        <div>NeoST v0.6.1-web</div>
        <div style={{ marginTop: '4px', color: '#006600' }}>
          © 2026 VERHILLE Arnaud
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
