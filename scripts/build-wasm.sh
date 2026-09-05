#!/bin/bash

# Build script for NeoST WASM module
# Usage: ./scripts/build-wasm.sh [debug|release]

set -e  # Exit on error

# Configuration
BUILD_TYPE=${1:-release}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$REPO_ROOT/build-wasm"
WASM_DIR="$REPO_ROOT/wasm"
PUBLIC_DIR="$REPO_ROOT/public"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== NeoST WASM Build ===${NC}"
echo "Build type: $BUILD_TYPE"
echo "Repository root: $REPO_ROOT"
echo "Build directory: $BUILD_DIR"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v emcmake &> /dev/null; then
    echo -e "${RED}ERROR: emcmake not found. Please install Emscripten SDK and activate it:${NC}"
    echo "  source /path/to/emsdk/emsdk_env.sh"
    exit 1
fi

if ! command -v cmake &> /dev/null; then
    echo -e "${RED}ERROR: cmake not found. Please install CMake 3.16 or later.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}"

# Determine CMake flags
if [ "$BUILD_TYPE" = "debug" ]; then
    CMAKE_BUILD_TYPE="Debug"
    CXX_FLAGS="-g -O0"
    echo "Debug build: slower compilation, faster build, debug symbols included"
else
    CMAKE_BUILD_TYPE="Release"
    CXX_FLAGS="-O3 -flto"
    echo "Release build: slower compilation, optimal performance, size-optimized"
fi

# Create/clean build directory
echo -e "${YELLOW}Preparing build directory...${NC}"
if [ -d "$BUILD_DIR" ]; then
    echo "Cleaning $BUILD_DIR"
    rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"

# Configure with Emscripten
echo -e "${YELLOW}Configuring CMake with Emscripten...${NC}"
cd "$BUILD_DIR"

emcmake cmake "$REPO_ROOT" \
    -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE" \
    -DCMAKE_CXX_FLAGS="$CXX_FLAGS" \
    -DNEOST_WITH_NET=OFF \
    -DNEOST_WITH_IMGUI=OFF

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: CMake configuration failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ CMake configured successfully${NC}"

# Build
echo -e "${YELLOW}Building WASM module...${NC}"
NPROC=$(nproc 2>/dev/null || echo 4)
echo "Using $NPROC parallel jobs"

cmake --build . --config "$CMAKE_BUILD_TYPE" -j"$NPROC"

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"

# Verify output
echo -e "${YELLOW}Verifying WASM artifacts...${NC}"

if [ ! -f "$BUILD_DIR/wasm/neost.js" ]; then
    echo -e "${RED}ERROR: neost.js not found in build output${NC}"
    exit 1
fi

if [ ! -f "$BUILD_DIR/wasm/neost.wasm" ]; then
    echo -e "${RED}ERROR: neost.wasm not found in build output${NC}"
    exit 1
fi

echo -e "${GREEN}✓ WASM artifacts verified${NC}"

# Display file sizes
echo -e "${YELLOW}Build artifacts:${NC}"
JS_SIZE=$(du -h "$BUILD_DIR/wasm/neost.js" | cut -f1)
WASM_SIZE=$(du -h "$BUILD_DIR/wasm/neost.wasm" | cut -f1)
echo "  neost.js:   $JS_SIZE"
echo "  neost.wasm: $WASM_SIZE"

# Ensure public directory exists
mkdir -p "$PUBLIC_DIR"

# Copy artifacts (CMakeLists.txt should do this, but we do it again to be sure)
echo -e "${YELLOW}Copying artifacts to public directory...${NC}"
cp "$BUILD_DIR/wasm/neost.js" "$PUBLIC_DIR/neost.js"
cp "$BUILD_DIR/wasm/neost.wasm" "$PUBLIC_DIR/neost.wasm"

if [ -f "$BUILD_DIR/wasm/neost.wasm.map" ]; then
    cp "$BUILD_DIR/wasm/neost.wasm.map" "$PUBLIC_DIR/neost.wasm.map"
fi

echo -e "${GREEN}✓ Artifacts copied to $PUBLIC_DIR${NC}"

# Summary
echo -e "${GREEN}=== Build Complete ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Install dependencies:  npm install"
echo "  2. Start dev server:      npm run dev"
echo "  3. Build React app:       npm run build"
echo ""
echo "For more information, see BUILD.md and INTEGRATION.md"
