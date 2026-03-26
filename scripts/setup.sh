#!/bin/bash

# Notification Orchestrator - Setup Script
# This script helps set up the project quickly

echo "🚀 Notification Orchestrator - Setup Script"
echo "============================================"
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    exit 1
fi
echo "✅ Node.js $(node --version) found"
echo ""

# Check PostgreSQL
echo "🐘 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL v12+ first."
    exit 1
fi
echo "✅ PostgreSQL found"
echo ""

# Check Redis
echo "📮 Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis not found. Please install Redis v6+ first."
    exit 1
fi
echo "✅ Redis found"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Setup environment file
echo "⚙️  Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please edit .env file with your database and email credentials"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs
echo "✅ Logs directory created"
echo ""

# Database setup
echo "🗄️  Database setup..."
read -p "Do you want to create the database now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter database name (default: notification_orchestrator): " dbname
    dbname=${dbname:-notification_orchestrator}
    
    createdb $dbname 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database '$dbname' created"
    else
        echo "ℹ️  Database might already exist or check permissions"
    fi
    
    read -p "Run migrations now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run migrate
        if [ $? -eq 0 ]; then
            echo "✅ Migrations completed"
        else
            echo "❌ Migration failed. Check your database credentials in .env"
        fi
    fi
fi
echo ""

# Redis check
echo "📮 Checking Redis connection..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis is not running. Start it with: redis-server"
fi
echo ""

# Final instructions
echo "============================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Start Redis (if not running): redis-server"
echo "3. Run migrations: npm run migrate"
echo "4. Start the application: npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: docs/SETUP_GUIDE.md"
echo "   - API Docs: docs/API_DOCUMENTATION.md"
echo "   - Demo Guide: DEMO_GUIDE.md"
echo ""
echo "🎉 Happy coding!"
