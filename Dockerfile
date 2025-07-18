# Use official Python runtime as base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for React frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy Python requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend package files and install Node dependencies
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install --only=production

# Copy frontend source code (needed for build)
COPY frontend/ .

# Build React frontend (ignore ESLint warnings in production)
ENV CI=false
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Go back to app directory
WORKDIR /app

# Copy the rest of the application code (but exclude frontend to preserve build)
COPY api/ api/
COPY db/ db/
COPY etl/ etl/
COPY run.py .
COPY requirements.txt .

# Expose port
EXPOSE 8080

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=8080

# Run the application
CMD ["python", "run.py"] 