#!/bin/bash
# ============================================
# Deploy Script for Sistema Recuperado
# ============================================
# Usage: ./deploy.sh
# Run this script on your VPS after initial setup
# ============================================

set -e  # Exit on any error

# Configuration
APP_DIR="/var/www/sistema-recuperado"
REPO_URL="YOUR_GIT_REPO_URL"  # <-- Replace with your Git repository URL
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploying Sistema Recuperado${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Navigate to app directory
echo -e "\n${YELLOW}[1/6] Navigating to app directory...${NC}"
cd "$APP_DIR"

# Step 2: Pull latest changes from Git
echo -e "\n${YELLOW}[2/6] Pulling latest changes from $BRANCH...${NC}"
git fetch origin
git reset --hard origin/$BRANCH
git pull origin $BRANCH

# Step 3: Install dependencies (production only)
echo -e "\n${YELLOW}[3/6] Installing production dependencies...${NC}"
npm ci --only=production

# Step 4: Build the application
echo -e "\n${YELLOW}[4/6] Building Next.js application...${NC}"
npm run build

# Step 5: Restart PM2 process
echo -e "\n${YELLOW}[5/6] Restarting PM2 process...${NC}"
pm2 reload ecosystem.config.js --env production

# Step 6: Save PM2 process list
echo -e "\n${YELLOW}[6/6] Saving PM2 process list...${NC}"
pm2 save

# Done!
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nCheck status with: ${YELLOW}pm2 status${NC}"
echo -e "View logs with: ${YELLOW}pm2 logs sistema-recuperado${NC}"
