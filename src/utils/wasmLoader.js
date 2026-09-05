/**
 * wasmLoader.js — Load and initialize the NeoST WASM module
 *
 * This utility handles the async loading of the Emscripten-compiled WASM module.
 * The module is expected to be in public/neost.js and public/neost.wasm
 */

let wasmModuleInstance = null;
let wasmModuleLoading = null;

const loadWasmModule = async () => {
  // Return cached instance if already loaded
  if (wasmModuleInstance) {
    return wasmModuleInstance;
  }

  // Return the pending promise if loading is in progress
  if (wasmModuleLoading) {
    return wasmModuleLoading;
  }

  // Start loading
  wasmModuleLoading = (async () => {
    try {
      // Import the Emscripten-generated module
      // This assumes the WASM module is built and available at public/neost.js
      const Module = await import('./neost.js');

      // Wait for the module to fully initialize
      // Emscripten modules have a ready promise
      await Module.default;

      wasmModuleInstance = Module.default;

      console.log('✅ WASM module loaded successfully');
      console.log('   Available classes:', Object.keys(Module.default).join(', '));

      return wasmModuleInstance;
    } catch (error) {
      console.error('❌ Failed to load WASM module:', error);
      wasmModuleLoading = null; // Reset loading state
      throw new Error(`WASM module loading failed: ${error.message}`);
    }
  })();

  return wasmModuleLoading;
};

export default loadWasmModule;
