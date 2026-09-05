# NeoST WebAssembly Module

This directory contains the Emscripten bindings and CMake configuration for compiling the NeoST C++ emulator core to WebAssembly.

## Directory Structure

```
wasm/
├── CMakeLists.txt          # Emscripten/CMake build configuration
├── bindings.cpp            # C++/JavaScript bridge (Emscripten bindings)
├── README.md               # This file
└── (built artifacts)
    ├── neost.js            # JavaScript loader and glue code
    └── neost.wasm          # Binary WebAssembly module
```

## Quick Build

```bash
# From repository root
npm run build:wasm         # Release build
npm run build:wasm:debug   # Debug build with symbols
```

The artifacts are automatically copied to `public/` for use by the React frontend.

## Key Files

### `bindings.cpp`

Exposes the NeoST C++ API to JavaScript through Emscripten's C++ bindings system.

**Key class: `WasmEmulator`**

This wrapper class provides:
- **Lifecycle**: `initialize()`, `shutdown()`, `reset()`
- **Emulation**: `runFrame()`, `step()`, `setRunning()`
- **Configuration**: `setMachineModel()`, `setVideoMode()`
- **Media Loading**: `loadRom()`, `loadDisk()`
- **Input**: `setKeyDown()`, `setKeyUp()`, `setMousePosition()`, `setMouseButton()`, `setJoystick()`
- **Screen Access**: `getScreenBuffer()`, `getScreenWidth()`, `getScreenHeight()`
- **State**: `saveState()`, `loadState()`, `getCPUCycles()`

Example usage from JavaScript:

```javascript
// Load the WASM module
const Module = await import('./neost.js');
await Module.onRuntimeInitialized;

// Create emulator instance
const emulator = new Module.Emulator();
emulator.initialize();

// Run emulation
emulator.setMachineModel('st');
emulator.setVideoMode('color');
emulator.setRunning(true);

// Emulation loop
const loop = () => {
  emulator.runFrame();
  // Read screen buffer and render
  requestAnimationFrame(loop);
};
loop();
```

### `CMakeLists.txt`

Configures the Emscripten compilation process. Key settings:

- **Memory**: 256 MB initial, 512 MB maximum
- **Optimization**: Release builds use `-O3 -flto`
- **Exports**: Exposes necessary functions and classes to JavaScript
- **Artifacts**: Copies `.js` and `.wasm` files to `public/`

**Key CMake variables**:

```cmake
NEOST_WITH_NET=OFF          # Disable network (not available in browser)
NEOST_WITH_IMGUI=OFF        # Disable ImGui (use React UI instead)
CMAKE_BUILD_TYPE=Release    # Optimize for production
INITIAL_MEMORY=268435456    # 256 MB
TOTAL_MEMORY=536870912      # 512 MB
```

## Building

### Prerequisites

1. **Emscripten SDK** (≥3.1.27)
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **CMake** (≥3.16)
3. **Node.js** (≥18.0.0)

### Build Process

```bash
# Activate Emscripten
source /path/to/emsdk/emsdk_env.sh

# Clean build directory (optional)
npm run build:wasm:clean

# Build WASM module
npm run build:wasm

# Result: public/neost.js + public/neost.wasm
```

### Build Variants

**Release Build (default, optimized for performance)**
```bash
npm run build:wasm
```
- Compilation flags: `-O3 -flto`
- Output size: ~20 MB WASM
- Runtime performance: Maximum optimization
- Build time: ~15 minutes

**Debug Build (faster compilation, slower runtime)**
```bash
npm run build:wasm:debug
```
- Compilation flags: `-g -O0`
- Output size: ~40 MB WASM
- Runtime performance: Minimal optimization
- Build time: ~5 minutes
- Includes source maps for debugging

## Build Output

### Generated Files

After a successful build, two files appear in `public/`:

1. **`neost.js`** (~5 MB)
   - JavaScript loader and glue code
   - Handles WASM module instantiation
   - Manages memory and object marshaling
   - Contains class definitions for JavaScript

2. **`neost.wasm`** (~15-20 MB uncompressed, ~5 MB gzipped)
   - Binary WebAssembly module
   - Contains compiled NeoST core
   - Executes emulation logic
   - Manages hardware simulation

### Size Optimization

The production build uses Emscripten's optimization flags:
- `-O3`: Aggressive optimization
- `-flto`: Link-time optimization
- Gzip compression: Reduces ~20 MB to ~5 MB (typically 75% reduction)

## Memory Layout

The WASM module has a 512 MB linear memory space:

```
0x00000000 ┌─────────────────────────┐
           │  Emulator State         │
           │  (CPU, GPU, Audio)      │
           ├─────────────────────────┤
           │  Atari RAM (512KB-4MB)  │
           │  ROM (192KB)            │
           ├─────────────────────────┤
           │  Screen Buffer (1 MB)   │
           │  (640×400 RGBA)         │
           ├─────────────────────────┤
           │  Audio Buffers          │
           ├─────────────────────────┤
           │  Heap (malloc'd data)   │
           │  (grows as needed)      │
           ├─────────────────────────┤
           │  Free Space (~250 MB)   │
           └─────────────────────────┘ 0x20000000
```

## Integration with React

### Loading the Module

```javascript
// In wasmLoader.js
export async function loadWasmModule() {
  const Module = await import('./neost.js');
  await Module.onRuntimeInitialized;
  return Module;
}
```

### Using in React Components

```javascript
import { loadWasmModule } from '../utils/wasmLoader.js';

export function EmulatorContainer() {
  const [emulator, setEmulator] = useState(null);

  useEffect(() => {
    loadWasmModule().then(Module => {
      const emu = new Module.Emulator();
      emu.initialize();
      setEmulator(emu);
    });
  }, []);

  useEffect(() => {
    if (!emulator) return;

    const loop = () => {
      emulator.runFrame();
      // Render screen buffer
      requestAnimationFrame(loop);
    };
    loop();
  }, [emulator]);

  return <canvas ref={canvasRef} />;
}
```

## Debugging

### Browser DevTools

1. **Console**
   ```javascript
   window.Module  // Access WASM module
   window.Module.Emulator  // Access emulator class
   ```

2. **Performance Profiling**
   - Open DevTools → Performance tab
   - Record emulation for 5-10 seconds
   - Analyze flame graph for hot spots
   - Typical frame: 5-10ms WASM, 1-2ms rendering

3. **Memory Profiling**
   - Open DevTools → Memory tab
   - Take heap snapshots
   - Monitor WASM linear memory growth
   - Should be stable (~50 MB)

### Debug Build with Source Maps

The debug build generates source maps (`.wasm.map` files) that allow stepping through C++ code in DevTools:

```bash
npm run build:wasm:debug

# In DevTools, you can now:
# 1. Set breakpoints in C++ source
# 2. Step through code
# 3. Inspect C++ variables
# 4. View stack traces with symbol names
```

## Troubleshooting

### "emcmake: command not found"

**Solution**: Activate Emscripten SDK
```bash
source /path/to/emsdk/emsdk_env.sh
emcc --version  # Verify
```

### "WASM module failed to load in browser"

**Check**:
1. `public/neost.js` and `public/neost.wasm` exist
2. Browser console shows specific error
3. Network tab shows WASM file downloaded (or cached)
4. Correct CORS headers (dev server should handle this)

**Common causes**:
- WASM file corrupted or incomplete
- Browser doesn't support WebAssembly (old browser)
- CORS issue if serving from different domain
- Memory limit too low

### Build runs out of memory

**Solution**: Reduce parallelism
```bash
cd build-wasm
cmake --build . --config Release -j2
```

Or increase system virtual memory.

### Emulation too slow (< 25 FPS)

**Check**:
1. Using Release build, not Debug
2. Browser hardware acceleration enabled
3. CPU not maxed out by other processes
4. Try reducing frame rate in control panel

**Optimization**:
- Ensure `-O3` flag in build
- Use Release build
- Check browser DevTools Performance tab for bottlenecks

## Advanced Configuration

### Custom Memory Settings

Edit `CMakeLists.txt`:

```cmake
set(EMSCRIPTEN_FLAGS
    -s WASM=1
    -s ALLOW_MEMORY_GROWTH=1
    -s INITIAL_MEMORY=536870912   # 512 MB
    -s TOTAL_MEMORY=1073741824    # 1 GB
)
```

### Enable SIMD (experimental)

```bash
emcmake cmake .. -DCMAKE_CXX_FLAGS="-msimd128"
```

Requires modern browser (Chrome 92+).

### Link-Time Optimization

Already enabled in Release builds with `-flto`. To adjust:

```bash
emcmake cmake .. -DCMAKE_CXX_FLAGS="-O3 -flto=thin"
```

## Performance Benchmarks

Typical performance on modern hardware:

| Build Type | WASM Size | Frame Time | FPS | Memory |
|-----------|-----------|-----------|-----|--------|
| Release   | 20 MB     | 15-20 ms  | 50  | 50 MB  |
| Debug     | 40 MB     | 30-40 ms  | 25  | 60 MB  |

Note: Frame time includes emulation + rendering. Target is 20 ms per frame (50 FPS PAL).

## References

- [BUILD.md](../BUILD.md) — Comprehensive build guide
- [INTEGRATION.md](../INTEGRATION.md) — React integration details
- [Emscripten Docs](https://emscripten.org/)
- [WebAssembly Specs](https://webassembly.org/)
- [NeoST Core](https://github.com/neost-project/neost) — Source C++ emulator

## Contributing

When modifying bindings:

1. Edit `bindings.cpp`
2. Rebuild: `npm run build:wasm`
3. Test in browser: `npm run dev`
4. Profile performance: DevTools → Performance tab
5. Check memory: DevTools → Memory tab

Always test both Release and Debug builds.

## License

This project is licensed under the MIT License. See LICENSE file for details.
