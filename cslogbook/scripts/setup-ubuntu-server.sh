#!/bin/bash

# CSLogbook Production Server Setup Script for Ubuntu
# This script prepares Ubuntu server for production deployment

set -e  # Exit on any error

echo "🚀 Starting CSLogbook Production Server Setup for Ubuntu..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   print_warning "Please run as a regular user with sudo privileges"
   exit 1
fi

# Check if user has sudo privileges
if ! sudo -n true 2>/dev/null; then
    print_error "This script requires sudo privileges"
    exit 1
fi

print_step "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System packages updated successfully"

print_step "2. Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim
print_status "Essential packages installed"

print_step "3. Installing Docker..."
# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

print_status "Docker installed successfully"

print_step "4. Installing Docker Compose (standalone)..."
# Get latest version
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

print_status "Docker Compose ${DOCKER_COMPOSE_VERSION} installed"

print_step "5. Configuring Firewall (UFW)..."
# Reset UFW to default
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if needed)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend API

# Enable UFW
sudo ufw --force enable

print_status "Firewall configured and enabled"

print_step "6. Configuring Fail2Ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create jail for SSH
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl restart fail2ban
print_status "Fail2Ban configured for SSH protection"

print_step "7. Creating application directory..."
APP_DIR="/opt/cslogbook"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
print_status "Application directory created at $APP_DIR"

print_step "8. Setting up log rotation..."
sudo tee /etc/logrotate.d/cslogbook > /dev/null <<EOF
/opt/cslogbook/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
print_status "Log rotation configured"

print_step "9. Creating systemd service for Docker Compose..."
sudo tee /etc/systemd/system/cslogbook.service > /dev/null <<EOF
[Unit]
Description=CSLogbook Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cslogbook
ExecStart=/usr/local/bin/docker-compose --env-file .env.production up -d
ExecStop=/usr/local/bin/docker-compose --env-file .env.production down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cslogbook.service
print_status "Systemd service created and enabled"

print_step "10. Setting up automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
print_status "Automatic security updates configured"

print_step "11. Optimizing system performance..."
# Increase file limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# CSLogbook optimizations
vm.max_map_count=262144
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
EOF

print_status "System performance optimized"

echo ""
echo "=================================================="
print_status "🎉 Ubuntu Server Setup Complete!"
echo "=================================================="
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo "1. Logout and login again to apply Docker group membership"
echo "2. Upload your project to: $APP_DIR"
echo "3. Create and configure .env.production file"
echo "4. Run: cd $APP_DIR && docker-compose --env-file .env.production up -d"
echo ""
print_warning "SECURITY REMINDERS:"
echo "• Change default SSH port if needed"
echo "• Set up SSL certificates (Let's Encrypt recommended)"
echo "• Configure regular backups"
echo "• Monitor system logs regularly"
echo ""
print_status "Server IP Address: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo ""
print_warning "Please reboot the server to ensure all changes take effect:"
echo "sudo reboot"