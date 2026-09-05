// =============================================================================
//  bindings.cpp — Emscripten C++ ↔ JavaScript glue for NeoST WASM
//
//  This file exposes the NeoST emulator core to JavaScript via Emscripten's
//  WebIDL bindings. The emulator runs in a Web Worker and communicates via
//  structured messages for screen data, audio, and control inputs.
//
//  Key classes:
//    - WasmEmulator: Main facade that wraps the NeoST Machine class
//    - Screen buffer management and rendering coordination
//    - File I/O through ArrayBuffer interchange
// =============================================================================

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstdint>
#include <cstring>
#include <vector>
#include <array>

// Forward declarations - these will be linked from NeoST core
// In a real build, include the actual headers:
// #include "core/Machine.hpp"
// #include "core/Bus.hpp"
// etc.

// Placeholder structure matching NeoST's screen resolution
// Real implementation will get this from the Machine class
static constexpr uint32_t SCREEN_WIDTH = 640;
static constexpr uint32_t SCREEN_HEIGHT = 400;
static constexpr uint32_t SCREEN_BUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT * 4;  // RGBA

// Global screen buffer (in WASM linear memory)
static std::array<uint8_t, SCREEN_BUFFER_SIZE> g_screenBuffer;

// Emulator state wrapper
class WasmEmulator {
private:
    bool m_initialized = false;
    bool m_running = false;
    uint32_t m_cycleCount = 0;
    
    // In real implementation, this would be:
    // Machine m_machine;
    // Bus m_bus;
    // etc.

public:
    WasmEmulator() : m_initialized(false), m_running(false), m_cycleCount(0) {
        // Initialize screen buffer to black
        std::fill(g_screenBuffer.begin(), g_screenBuffer.end(), 0);
    }

    ~WasmEmulator() {
        shutdown();
    }

    // Initialize the emulator with default machine configuration
    void initialize() {
        if (m_initialized) return;
        
        // TODO: Call NeoST Machine::init()
        // m_machine.initialize();
        
        m_initialized = true;
        emscripten_console_log("WasmEmulator: initialized");
    }

    // Shutdown and cleanup
    void shutdown() {
        if (!m_initialized) return;
        
        // TODO: Cleanup resources
        // m_machine.shutdown();
        
        m_initialized = false;
        m_running = false;
    }

    // Reset the emulator to boot state
    void reset() {
        if (!m_initialized) return;
        
        // TODO: Call NeoST Machine::reset()
        // m_machine.reset();
        
        m_cycleCount = 0;
        emscripten_console_log("WasmEmulator: reset");
    }

    // Execute one emulation step (typically ~1ms of emulated time)
    void step() {
        if (!m_initialized || !m_running) return;
        
        // TODO: Implement stepping logic
        // - Run CPU cycles for ~1ms of emulated time
        // - Update audio buffer if needed
        // - Copy screen from m_machine to g_screenBuffer
        
        // Placeholder: just increment cycle counter
        m_cycleCount += 8000;  // ~1ms of 68000 cycles at 8MHz
    }

    // Run continuous emulation (called from JavaScript RAF loop)
    void runFrame() {
        if (!m_initialized) return;
        
        // Run enough cycles for one frame (50Hz PAL = 20ms)
        // Real implementation: run until raster == 0 or similar
        for (int i = 0; i < 20; i++) {
            step();
        }
    }

    // Load ROM from ArrayBuffer (passed via Emscripten)
    void loadRom(const std::string& filename, emscripten::val romBuffer) {
        if (!m_initialized) {
            emscripten_console_log("Error: loadRom called before initialize()");
            return;
        }

        // TODO: Extract ROM data from ArrayBuffer and load into emulator
        // The romBuffer is an Uint8Array from JavaScript
        // unsigned char* data = (unsigned char*)romBuffer.as<uintptr_t>();
        // size_t length = romBuffer["length"].as<size_t>();
        
        emscripten_console_log("ROM loading not yet implemented");
    }

    // Load floppy disk image from ArrayBuffer
    void loadDisk(const std::string& filename, int driveNumber, emscripten::val diskBuffer) {
        if (!m_initialized) {
            emscripten_console_log("Error: loadDisk called before initialize()");
            return;
        }

        // TODO: Extract disk data and mount to specified drive
        // int driveNumber: 0 = A:, 1 = B:
        
        emscripten_console_log("Disk loading not yet implemented");
    }

    // Set machine model before boot
    void setMachineModel(const std::string& model) {
        // model: "st", "megast", "ste", "megaste"
        
        // TODO: Configure Machine with selected model
        // This must be called before initialize()
        
        emscripten_console_log("Machine model selection not yet implemented");
    }

    // Set video mode (affects palette handling)
    void setVideoMode(const std::string& mode) {
        // mode: "color" or "mono"
        
        // TODO: Configure Shifter for video mode
    }

    // Start/stop emulation
    void setRunning(bool running) {
        m_running = running;
    }

    bool isRunning() const {
        return m_running;
    }

    bool isInitialized() const {
        return m_initialized;
    }

    // Screen data access
    uint32_t getScreenWidth() const {
        return SCREEN_WIDTH;
    }

    uint32_t getScreenHeight() const {
        return SCREEN_HEIGHT;
    }

    // Get pointer to screen buffer (in WASM linear memory)
    // JavaScript accesses this via HEAPU8.buffer
    uint8_t* getScreenBuffer() {
        return g_screenBuffer.data();
    }

    uint32_t getScreenBufferSize() const {
        return SCREEN_BUFFER_SIZE;
    }

    // Get current CPU cycle count
    uint32_t getCPUCycles() const {
        return m_cycleCount;
    }

    // Save emulation state to ArrayBuffer
    emscripten::val saveState() {
        // TODO: Serialize complete machine state
        // Return as Uint8Array (typed array)
        
        return emscripten::val::undefined();
    }

    // Load emulation state from ArrayBuffer
    void loadState(emscripten::val stateBuffer) {
        // TODO: Deserialize and restore machine state
    }

    // Keyboard input
    void setKeyDown(uint8_t scanCode) {
        // TODO: Feed key press to IKBD (keyboard controller)
    }

    void setKeyUp(uint8_t scanCode) {
        // TODO: Feed key release to IKBD
    }

    // Mouse input
    void setMousePosition(int16_t x, int16_t y) {
        // TODO: Feed mouse coordinates to IKBD
    }

    void setMouseButton(int button, bool pressed) {
        // button: 0=left, 1=middle, 2=right
        // TODO: Feed mouse button to IKBD
    }

    // Joystick/gamepad input
    void setJoystick(int port, uint16_t buttons, int8_t x, int8_t y) {
        // port: 0 or 1
        // buttons: bit flags for buttons
        // x, y: -127 to +127
        // TODO: Feed to joypad hardware
    }
};

// =============================================================================
//  Emscripten Bindings
//
//  This section exposes the WasmEmulator class to JavaScript
// =============================================================================

using namespace emscripten;

EMSCRIPTEN_BINDINGS(neost_emulator) {
    // Main emulator class
    class_<WasmEmulator>("Emulator")
        .constructor<>()
        
        // Lifecycle
        .function("initialize", &WasmEmulator::initialize)
        .function("shutdown", &WasmEmulator::shutdown)
        .function("reset", &WasmEmulator::reset)
        .function("isInitialized", &WasmEmulator::isInitialized)
        
        // Emulation control
        .function("step", &WasmEmulator::step)
        .function("runFrame", &WasmEmulator::runFrame)
        .function("setRunning", &WasmEmulator::setRunning)
        .function("isRunning", &WasmEmulator::isRunning)
        
        // Configuration
        .function("setMachineModel", &WasmEmulator::setMachineModel)
        .function("setVideoMode", &WasmEmulator::setVideoMode)
        
        // Media loading
        .function("loadRom", &WasmEmulator::loadRom)
        .function("loadDisk", &WasmEmulator::loadDisk)
        
        // Screen data
        .function("getScreenWidth", &WasmEmulator::getScreenWidth)
        .function("getScreenHeight", &WasmEmulator::getScreenHeight)
        .function("getScreenBuffer", &WasmEmulator::getScreenBuffer, return_value_policy::reference())
        .function("getScreenBufferSize", &WasmEmulator::getScreenBufferSize)
        
        // State
        .function("getCPUCycles", &WasmEmulator::getCPUCycles)
        .function("saveState", &WasmEmulator::saveState)
        .function("loadState", &WasmEmulator::loadState)
        
        // Input
        .function("setKeyDown", &WasmEmulator::setKeyDown)
        .function("setKeyUp", &WasmEmulator::setKeyUp)
        .function("setMousePosition", &WasmEmulator::setMousePosition)
        .function("setMouseButton", &WasmEmulator::setMouseButton)
        .function("setJoystick", &WasmEmulator::setJoystick);
}
