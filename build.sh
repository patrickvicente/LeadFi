#!/bin/bash

# Build script for Railway deployment
# This builds the React frontend before starting the Flask app

echo "===================="
echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"
echo "===================="

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "ERROR: frontend directory not found!"
    echo "Available directories: $(ls -d */)"
    exit 1
fi

# Install frontend dependencies and build React app
echo "Building React frontend..."
cd frontend

echo "Frontend directory contents: $(ls -la)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in frontend directory!"
    exit 1
fi

echo "Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed!"
    exit 1
fi

echo "Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: npm run build failed!"
    exit 1
fi

echo "Build completed successfully!"
echo "Build directory contents: $(ls -la build/)"

cd ..

echo "Frontend build complete!"
echo "Build process finished."
echo "====================" 