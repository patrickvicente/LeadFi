#!/bin/bash
set -e

echo "🏗️  Starting LeadFi build process..."

# Install Node.js dependencies and build React frontend
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install

echo "⚛️  Building React frontend..."
npm run build

# Go back to root directory
cd ..

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Build complete!"
echo "📁 Frontend build files created in: frontend/build/"
echo "🚀 Ready for deployment!" 