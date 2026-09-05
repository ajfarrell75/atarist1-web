import React, { useEffect, useRef, useState } from 'react';
import WasmModule from '../utils/wasmLoader';

const EmulatorContainer = () => {
  const canvasRef = useRef(null);
  const [emulator, setEmulator] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const initializeEmulator = async () => {
      try {
        // Load WASM module
        const Module = await WasmModule();
        
        // Create emulator instance
        const emu = new Module.Emulator();
        emu.initialize();
        
        setEmulator(emu);
        setStatus('Ready');
        
        console.log('✅ Emulator initialized');
        console.log(`Screen: ${emu.getScreenWidth()}x${emu.getScreenHeight()}`);
      } catch (error) {
        console.error('❌ Emulator initialization failed:', error);
        setStatus(`Error: ${error.message}`);
      }
    };

    initializeEmulator();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Main emulation loop
  useEffect(() => {
    if (!emulator || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      console.error('Failed to get canvas 2D context');
      return;
    }

    const width = emulator.getScreenWidth();
    const height = emulator.getScreenHeight();

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    const renderFrame = () => {
      if (!isRunning) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      // Run one frame of emulation
      emulator.runFrame();

      // Get screen buffer from WASM memory
      const bufferPtr = emulator.getScreenBuffer();
      const bufferSize = emulator.getScreenBufferSize();

      // Create ImageData from screen buffer
      // The buffer is RGBA, 4 bytes per pixel
      const heap = new Uint8ClampedArray(
        Module.HEAPU8.buffer,
        bufferPtr,
        bufferSize
      );

      const imageData = ctx.createImageData(width, height);
      imageData.data.set(heap);

      // Draw to canvas
      ctx.putImageData(imageData, 0, 0);

      // Update FPS every 500ms
      frameCount++;
      const now = Date.now();
      if (now - lastFpsUpdate >= 500) {
        const fps = (frameCount * 1000) / (now - lastFpsUpdate);
        setStatus(`Running - ${fps.toFixed(1)} FPS - Cycles: ${emulator.getCPUCycles()}`);
        frameCount = 0;
        lastFpsUpdate = now;
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [emulator, isRunning]);

  const handleStart = () => {
    if (emulator) {
      emulator.reset();
      emulator.setRunning(true);
      setIsRunning(true);
      setStatus('Running...');
    }
  };

  const handlePause = () => {
    if (emulator) {
      emulator.setRunning(false);
      setIsRunning(false);
      setStatus('Paused');
    }
  };

  const handleReset = () => {
    if (emulator) {
      emulator.reset();
      setStatus('Reset');
      if (isRunning) {
        emulator.setRunning(true);
      }
    }
  };

  const handleLoadRom = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !emulator) return;

    try {
      setStatus(`Loading ROM: ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      emulator.loadRom(file.name, uint8Array);
      setStatus(`ROM loaded: ${file.name}`);
    } catch (error) {
      console.error('ROM loading failed:', error);
      setStatus(`Error loading ROM: ${error.message}`);
    }
  };

  const handleLoadDisk = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !emulator) return;

    try {
      setStatus(`Loading disk: ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      emulator.loadDisk(file.name, 0, uint8Array);
      setStatus(`Disk loaded: ${file.name}`);
    } catch (error) {
      console.error('Disk loading failed:', error);
      setStatus(`Error loading disk: ${error.message}`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasRef.current?.classList.remove('drag-over');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    canvasRef.current?.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (!files.length) return;

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    // Determine file type and load accordingly
    if (['img', 'st', 'msa', 'dim', 'stx'].includes(ext)) {
      const loadEvent = { target: { files: [file] } };
      if (ext === 'st' || ext === 'msa' || ext === 'dim' || ext === 'stx') {
        handleLoadDisk(loadEvent);
      } else {
        handleLoadRom(loadEvent);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
      {/* Status Bar */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #00aa00',
          color: '#00ff00',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4',
        }}
      >
        <div>{status}</div>
      </div>

      {/* Canvas Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            cursor: 'grab',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 4px rgba(0, 255, 0, 0.3))',
          }}
          title="Drag .st/.msa disk or .img ROM here"
        />
      </div>

      {/* Control Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px',
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #00aa00',
        }}
      >
        <button
          onClick={handleStart}
          disabled={isRunning || !emulator}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: isRunning ? '#003300' : '#00aa00',
            color: '#000',
            border: '1px solid #00aa00',
            borderRadius: '3px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          ▶ Start
        </button>

        <button
          onClick={handlePause}
          disabled={!isRunning || !emulator}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: !isRunning ? '#003300' : '#00aa00',
            color: '#000',
            border: '1px solid #00aa00',
            borderRadius: '3px',
            cursor: !isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          ⏸ Pause
        </button>

        <button
          onClick={handleReset}
          disabled={!emulator}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#004400',
            color: '#00ff00',
            border: '1px solid #00aa00',
            borderRadius: '3px',
            cursor: emulator ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          🔄 Reset
        </button>
      </div>

      {/* File Input Section */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px',
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #00aa00',
        }}
      >
        <label
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#004400',
            color: '#00ff00',
            border: '1px solid #00aa00',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📁 Load ROM
          <input
            type="file"
            accept=".img,.bin"
            onChange={handleLoadRom}
            style={{ display: 'none' }}
          />
        </label>

        <label
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#004400',
            color: '#00ff00',
            border: '1px solid #00aa00',
            borderRadius: '3px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          💾 Load Disk
          <input
            type="file"
            accept=".st,.msa,.dim,.stx"
            onChange={handleLoadDisk}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
};

export default EmulatorContainer;
