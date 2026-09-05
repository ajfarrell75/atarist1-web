# Building NeoST WASM

This guide explains how to build the NeoST emulator core for WebAssembly and integrate it with the React frontend.

## Prerequisites

### Required Tools

1. **Emscripten SDK** (latest stable, ≥ 3.1.27)
   ```bash
   # Install emsdk if you haven't already
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh  # On Windows: emsdk_env.bat
   ```

2. **Node.js** (≥ 18.0.0)
   ```bash
   node --version  # Should output v18.x.x or higher
   ```

3. **CMake** (≥ 3.16)
   ```bash
   cmake --version
   ```

4. **Git** (for cloning the repository)

### System Requirements

- **Linux/macOS**: 8 GB RAM, 10 GB free disk space
- **Windows**: Same as above, or use WSL2 for better compatibility
- **Build time**: ~10–15 minutes on modern hardware

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ajfarrell75/atarist1-web.git
cd atarist1-web
```

### 2. Initialize NeoST Submodule

The repository includes the NeoST core as a git submodule:

```bash
git submodule update --init --recursive
```

### 3. Build the WASM Module

```bash
# Create build directory
mkdir build-wasm && cd build-wasm

# Configure with Emscripten toolchain
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build . --config Release -j$(nproc)
```

The build produces:
- `wasm/neost.js` — JavaScript loader
- `wasm/neost.wasm` — Binary WebAssembly module

### 4. Install React Dependencies

```bash
# From the repository root
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

The emulator will be available at `http://localhost:5173/`

## Detailed Build Steps

### Understanding the Build Architecture

```
NeoST Core (C++)
    ↓
Emscripten Bindings (C++/JavaScript bridge)
    ↓
WASM Module (.wasm + .js loader)
    ↓
React Frontend (JavaScript)
```

### Step-by-Step Build Process

#### A. Configure Emscripten

Before building, ensure Emscripten environment variables are set:

```bash
# Activate Emscripten (Linux/macOS)
source /path/to/emsdk/emsdk_env.sh

# Or on Windows (in PowerShell)
& 'C:\path\to\emsdk\emsdk_env.ps1'

# Verify
emcc --version
```

#### B. CMake Configuration for WASM

```bash
mkdir build-wasm
cd build-wasm

# Configure with Emscripten toolchain
emcmake cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_FLAGS="-O3" \
  -DNEOST_WITH_NET=OFF \
  -DNEOST_WITH_IMGUI=OFF
```

**Key flags:**
- `NEOST_WITH_NET=OFF` — Disable networking (not available in browser)
- `NEOST_WITH_IMGUI=OFF` — Disable ImGui (use React UI instead)
- `CMAKE_BUILD_TYPE=Release` — Optimize for production

#### C. Compile the WASM Module

```bash
cmake --build . --config Release -j$(nproc)
```

**Expected output:**
```
[100%] Linking CXX executable wasm/neost.js
[100%] Built target neost
```

The compiler will generate:
- `build-wasm/wasm/neost.js` — ~5 MB (loader + glue code)
- `build-wasm/wasm/neost.wasm` — ~15–20 MB (compressed binary)

#### D. Copy Artifacts to Public Directory

The CMakeLists.txt automatically copies WASM artifacts to `public/`:

```bash
# Verify the files exist
ls -lh ../public/neost.*
```

### Build Optimization

#### Release Build (for production)

```bash
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-O3 -flto"
cmake --build . --config Release -j$(nproc)
```

**Size**: ~20 MB WASM (gzipped ~5 MB)
**Speed**: Maximum optimization, slower build time

#### Debug Build (for development)

```bash
emcmake cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="-g -O0"
cmake --build . --config Debug -j$(nproc)
```

**Size**: ~40 MB WASM
**Speed**: Faster build, slower execution (useful for debugging)

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts a local dev server with hot module reloading.

### Production Build

```bash
npm run build
```

Generates optimized production files in `dist/`.

### Preview Production Build

```bash
npm run preview
```

Starts a preview server on `http://localhost:4173/`

## Troubleshooting

### "emcmake: command not found"

**Solution**: Ensure Emscripten SDK is activated:
```bash
source /path/to/emsdk/emsdk_env.sh
```

### "WASM module failed to load"

**Check**:
1. Browser console for specific error messages
2. Verify `public/neost.wasm` and `public/neost.js` exist
3. Ensure CORS is properly configured (dev server should handle this)

**Common causes**:
- WASM file not copied to public directory
- Browser doesn't support WebAssembly
- Memory limit too low (increase in CMakeLists.txt)

### Out of Memory During Build

The WASM compiler can be memory-intensive. If you get OOM errors:

```bash
# Reduce parallelism
cmake --build . --config Release -j2
```

Or increase system swap/virtual memory.

### Slow Emulation Performance

**Optimization tips**:
1. Use Release build (not Debug)
2. Enable browser hardware acceleration
3. Reduce frame rate in control panel
4. Check CPU usage in DevTools

## Integration with React

### How WASM Module is Loaded

1. **`wasmLoader.js`** — Asynchronously loads the WASM module
2. **`EmulatorContainer.jsx`** — Creates emulator instance and runs the loop
3. **`ControlPanel.jsx`** — Provides user controls (machine model, video mode, etc.)
4. **`App.jsx`** — Orchestrates the full UI

### Module API

The WASM bindings expose this interface to JavaScript:

```javascript
const emulator = new Module.Emulator();

// Lifecycle
emulator.initialize();
emulator.shutdown();
emulator.reset();

// Control
emulator.runFrame();           // Run one 20ms frame
emulator.setRunning(true);     // Start/stop emulation
emulator.isRunning();          // Check state

// Configuration
emulator.setMachineModel('st');  // 'st', 'megast', 'ste', 'megaste'
emulator.setVideoMode('color');  // 'color' or 'mono'

// Media
emulator.loadRom(filename, uint8ArrayBuffer);
emulator.loadDisk(filename, driveNumber, uint8ArrayBuffer);

// Screen
emulator.getScreenWidth();     // Returns 640
emulator.getScreenHeight();    // Returns 400
emulator.getScreenBuffer();    // Pointer to RGBA framebuffer
emulator.getScreenBufferSize();

// State
emulator.getCPUCycles();
emulator.saveState();
emulator.loadState(stateBuffer);

// Input
emulator.setKeyDown(scanCode);
emulator.setKeyUp(scanCode);
emulator.setMousePosition(x, y);
emulator.setMouseButton(button, pressed);
emulator.setJoystick(port, buttons, x, y);
```

### Rendering Pipeline

```
Emulator Core (WASM)
    ↓
Screen Buffer (WASM linear memory)
    ↓
JavaScript reads buffer via Uint8ClampedArray
    ↓
Canvas ImageData
    ↓
Canvas 2D Context
    ↓
Browser Display
```

## Performance Considerations

### Memory Allocation

The WASM module reserves:
- **Initial**: 128 MB
- **Maximum**: 512 MB

For Atari ST emulation:
- RAM: 512 KB to 4 MB
- ROM: ~192 KB
- Video buffer: ~512 KB
- Audio buffers: ~1 MB

**Total emulator footprint**: ~10 MB (plenty of headroom)

### CPU Profiling

Use Chrome DevTools to profile performance:

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click record, run emulation for 5–10 seconds, stop
4. Analyze flame graph — look for long JS execution times

### Framerate Target

The emulator runs at 50 Hz (PAL):
- Ideal: 50 FPS (one frame per 20 ms)
- Acceptable: 25+ FPS (skipping frames)
- Minimum: 12+ FPS (playable but sluggish)

## Advanced Configuration

### Custom Emscripten Flags

Edit `wasm/CMakeLists.txt` to modify compiler flags:

```cmake
set(EMSCRIPTEN_FLAGS
    -s WASM=1
    -s ALLOW_MEMORY_GROWTH=1
    -s INITIAL_MEMORY=268435456   # Increase to 256 MB
    -s TOTAL_MEMORY=536870912     # Increase to 512 MB
    # ... other flags
)
```

### Building with SIMD Support

For faster emulation (experimental):

```bash
emcmake cmake .. -DCMAKE_CXX_FLAGS="-msimd128"
```

Requires browser support (Chrome 92+, Firefox not yet).

### Debugging WASM

Generate source maps for debugging:

```bash
emcmake cmake .. -DCMAKE_CXX_FLAGS="-g4" -DCMAKE_EXE_LINKER_FLAGS="--source-map-base='./'"
cmake --build . --config Debug
```

In Chrome DevTools, you can then step through C++ code (requires `.cpp` files to be served).

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build WASM

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      
      - uses: mymindstorm/setup-emsdk@v12
        with:
          version: latest
      
      - run: mkdir build-wasm && cd build-wasm
      - run: emcmake cmake .. -DCMAKE_BUILD_TYPE=Release
      - run: cmake --build . --config Release
      
      - uses: actions/upload-artifact@v3
        with:
          name: wasm-module
          path: public/neost.*
```

## Common Build Configurations

### Fast Development Build

```bash
emcmake cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="-O1 -g"
cmake --build . -j$(nproc)
```

**Build time**: ~5 minutes
**Runtime**: 10–20 FPS (acceptable for development)

### Optimized Production Build

```bash
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-O3 -flto"
cmake --build . -j$(nproc)
```

**Build time**: ~15 minutes
**Runtime**: 45+ FPS, near-realtime performance

### Size-Optimized Build

```bash
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-Os"
cmake --build . -j$(nproc)
```

**Build time**: ~10 minutes
**WASM size**: ~12 MB (gzipped ~3 MB)
**Runtime**: 30+ FPS

## Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
npm run build
# Deploy the `dist/` directory
```

The React build includes all WASM artifacts from `public/`.

### Docker Deployment

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Further Reading

- [Emscripten Documentation](https://emscripten.org/)
- [WebAssembly Concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/)
- [NeoST Core Architecture](../README.md)
- [React + WASM Integration](https://react.dev/)
