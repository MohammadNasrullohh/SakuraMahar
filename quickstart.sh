#!/bin/bash

# Sakura Mahar - Quick Start Script for Linux/Mac

echo ""
echo "========================================"
echo "   Sakura Mahar - Quick Start"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js tidak terinstall"
    echo "Silakan install Node.js dari https://nodejs.org"
    exit 1
fi

echo "✓ Node.js tersedia"
node --version
echo ""

# Install Backend Dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "========================================"
echo "   Setup Selesai!"
echo "========================================"
echo ""
echo "📝 LANGKAH BERIKUTNYA:"
echo ""
echo "1. Buka Terminal 1:"
echo "   cd backend"
echo "   npm run dev"
echo "   (Server akan berjalan di http://localhost:5000)"
echo ""
echo "2. Buka Terminal 2 atau Browser:"
echo "   Buka file index.html di browser"
echo "   (Frontend sudah siap)"
echo ""
echo "3. Testing:"
echo "   - Buka frontend/api-integration-example.html"
echo "   - Atau gunakan Postman dengan sakura_mahar_postman.json"
echo ""
echo "📚 Dokumentasi:"
echo "   - Backend: backend/README.md"
echo "   - API: backend/API_DOCUMENTATION.md"
echo "   - Project: PROJECT_GUIDE.md"
echo ""
echo "========================================"
echo ""
