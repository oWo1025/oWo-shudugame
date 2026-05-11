#!/bin/bash
echo "  Sudoku Game Server"
echo "  ====================="
echo ""
cd "$(dirname "$0")/dist"
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
elif command -v npx &> /dev/null; then
    npx serve . -l 8080 --no-clipboard
else
    echo "No server runtime found. Install Python or Node.js."
fi
