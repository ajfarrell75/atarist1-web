# CMakeLists.txt for NeoST WASM build
# Configures Emscripten compilation to WebAssembly + JavaScript bindings

cmake_minimum_required(VERSION 3.16)
project(neost-wasm LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# =============================================================================
# Emscripten Configuration
# =============================================================================

# Check if we're using Emscripten
if(NOT EMSCRIPTEN)
    message(FATAL_ERROR "This build requires Emscripten toolchain")
endif()

# Set output directory for WASM artifacts
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/wasm)

# =============================================================================
# Include NeoST Core Library
# =============================================================================

# Add the main NeoST core library (without GUI dependencies)
add_subdirectory(${CMAKE_SOURCE_DIR}/../../src/core neost_core_build)

# Include paths for core
include_directories(
    ${CMAKE_SOURCE_DIR}/../../src
    ${CMAKE_SOURCE_DIR}/../../src/core
    ${CMAKE_SOURCE_DIR}/../../src/io
    ${CMAKE_SOURCE_DIR}/../../extern/moira
)

# =============================================================================
# WASM Bindings Library
# =============================================================================

# Create the WASM bindings library
add_library(neost_wasm STATIC
    bindings.cpp
)

# Link against the core emulator
target_link_libraries(neost_wasm PUBLIC neost_core)

# =============================================================================
# Emscripten Compiler Flags
# =============================================================================

# WASM module settings
set(EMSCRIPTEN_FLAGS
    -s WASM=1
    -s USE_WEBGL2=1
    -s ALLOW_MEMORY_GROWTH=1
    -s INITIAL_MEMORY=134217728
    -s TOTAL_MEMORY=268435456
    -s MAXIMUM_MEMORY=536870912
    -s ENVIRONMENT=web
    -s EXPORTED_FUNCTIONS=['_malloc','_free']
    -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','getValue','setValue','HEAPU8']
    --bind
    -fexceptions
)

# Optimization flags
if(CMAKE_BUILD_TYPE MATCHES Release)
    list(APPEND EMSCRIPTEN_FLAGS -O3)
else()
    list(APPEND EMSCRIPTEN_FLAGS -g -O0)
endif()

# Apply flags to the bindings library
target_compile_options(neost_wasm PRIVATE ${EMSCRIPTEN_FLAGS})

# =============================================================================
# WASM Executable
# =============================================================================

# Create the WASM module (JavaScript + .wasm file)
add_executable(neost neost_wasm.cpp)

target_link_libraries(neost PRIVATE neost_wasm neost_core)
target_compile_options(neost PRIVATE ${EMSCRIPTEN_FLAGS})

# Set Emscripten linking flags
set_target_properties(neost PROPERTIES
    LINK_FLAGS "${EMSCRIPTEN_FLAGS} \
        -s WASM_ASYNC_COMPILATION=0 \
        -s ASSERTIONS=2 \
        --source-map-base='./'"
    SUFFIX ".js"
)

# Output: neost.js (loader) and neost.wasm (binary module)
# These should be copied to public/ for the React app

# =============================================================================
# Post-build: Copy artifacts to public directory
# =============================================================================

add_custom_command(TARGET neost POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/neost.js
        ${CMAKE_SOURCE_DIR}/public/neost.js
    COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/neost.wasm
        ${CMAKE_SOURCE_DIR}/public/neost.wasm
    COMMENT "Copied WASM artifacts to public/"
)

message(STATUS "NeoST WASM build configured")
message(STATUS "  Output: ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/")
message(STATUS "  Emscripten: ${EMSCRIPTEN}")
