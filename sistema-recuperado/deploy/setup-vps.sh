#!/bin/bash
# ============================================
# Initial VPS Setup Script
# ============================================
# Run this ONCE on a fresh Hostinger VPS
# Usage: chmod +x setup-vps.sh && sudo ./setup-vps.sh
# ============================================

set -e

# Configuration - UPDATE THESE VALUES
SUBDOMAIN="app.seudominio.com.br"  # <-- Replace with your subdomain
APP_DIR="/var/www/sistema-recuperado"
GIT_REPO="YOUR_GIT_REPO_URL"  # <-- Replace with your Git repository URL

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  VPS Initial Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Update system
echo -e "\n${YELLOW}[1/9] Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install essential tools
echo -e "\n${YELLOW}[2/9] Installing essential tools...${NC}"
apt-get install -y curl git build-essential

# Install Node.js 20 LTS
echo -e "\n${YELLOW}[3/9] Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
echo -e "Node.js version: $(node -v)"
echo -e "npm version: $(npm -v)"

# Install PM2 globally
echo -e "\n${YELLOW}[4/9] Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "\n${YELLOW}[5/9] Installing Nginx...${NC}"
apt-get install -y nginx

# Install Certbot for SSL
echo -e "\n${YELLOW}[6/9] Installing Certbot...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Create app directory
echo -e "\n${YELLOW}[7/9] Setting up app directory...${NC}"
mkdir -p "$APP_DIR"
mkdir -p /var/log/pm2

# Clone repository (if GIT_REPO is set)
if [ "$GIT_REPO" != "YOUR_GIT_REPO_URL" ]; then
    echo -e "\n${YELLOW}[8/9] Cloning repository...${NC}"
    git clone "$GIT_REPO" "$APP_DIR"
else
    echo -e "\n${YELLOW}[8/9] Skipping git clone - update GIT_REPO variable and clone manually${NC}"
fi

# Configure firewall
echo -e "\n${YELLOW}[9/9] Configuring firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Initial Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Copy your Nginx config to /etc/nginx/sites-available/$SUBDOMAIN"
echo -e "2. Enable it: sudo ln -s /etc/nginx/sites-available/$SUBDOMAIN /etc/nginx/sites-enabled/"
echo -e "3. Test Nginx: sudo nginx -t"
echo -e "4. Get SSL certificate: sudo certbot --nginx -d $SUBDOMAIN"
echo -e "5. Navigate to $APP_DIR and run: npm ci && npm run build"
echo -e "6. Start with PM2: pm2 start ecosystem.config.js --env production"
echo -e "7. Save PM2: pm2 save && pm2 startup"
echo ""
