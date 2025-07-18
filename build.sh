#!/bin/bash

# Build script for Railway deployment
# This builds the React frontend before starting the Flask app

echo "Starting build process..."

# Install frontend dependencies and build React app
echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Frontend build complete!"
echo "Build process finished." 