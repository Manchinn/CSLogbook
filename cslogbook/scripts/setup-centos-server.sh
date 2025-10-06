#!/bin/bash

# CSLogbook Production Server Setup Script for CentOS/RHEL
# This script prepares CentOS/RHEL server for production deployment

set -e  # Exit on any error

echo "🚀 Starting CSLogbook Production Server Setup for CentOS/RHEL..."
echo "=========================================================="

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

# Detect CentOS version
if [ -f /etc/centos-release ]; then
    CENTOS_VERSION=$(rpm -q --queryformat '%{VERSION}' centos-release)
    print_status "Detected CentOS version: $CENTOS_VERSION"
elif [ -f /etc/redhat-release ]; then
    CENTOS_VERSION=$(cat /etc/redhat-release | grep -oE '[0-9]+\.[0-9]+' | head -1 | cut -d. -f1)
    print_status "Detected RHEL-based system version: $CENTOS_VERSION"
else
    print_error "This script is designed for CentOS/RHEL systems"
    exit 1
fi

print_step "1. Updating system packages..."
sudo yum update -y
print_status "System packages updated successfully"

print_step "2. Installing EPEL repository..."
if [[ "$CENTOS_VERSION" == "8" ]] || [[ "$CENTOS_VERSION" == "9" ]]; then
    sudo dnf install -y epel-release
    sudo dnf config-manager --set-enabled powertools 2>/dev/null || sudo dnf config-manager --set-enabled PowerTools 2>/dev/null || true
else
    sudo yum install -y epel-release
fi
print_status "EPEL repository installed"

print_step "3. Installing essential packages..."
if [[ "$CENTOS_VERSION" == "8" ]] || [[ "$CENTOS_VERSION" == "9" ]]; then
    sudo dnf install -y \
        curl \
        wget \
        git \
        unzip \
        yum-utils \
        device-mapper-persistent-data \
        lvm2 \
        firewalld \
        fail2ban \
        htop \
        nano \
        vim \
        net-tools
else
    sudo yum install -y \
        curl \
        wget \
        git \
        unzip \
        yum-utils \
        device-mapper-persistent-data \
        lvm2 \
        firewalld \
        fail2ban \
        htop \
        nano \
        vim \
        net-tools
fi
print_status "Essential packages installed"

print_step "4. Installing Docker..."
# Remove old Docker versions
sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
if [[ "$CENTOS_VERSION" == "8" ]] || [[ "$CENTOS_VERSION" == "9" ]]; then
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

print_status "Docker installed and started successfully"

print_step "5. Installing Docker Compose (standalone)..."
# Get latest version
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

print_status "Docker Compose ${DOCKER_COMPOSE_VERSION} installed"

print_step "6. Configuring Firewall (firewalld)..."
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Configure firewall rules
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp  # Frontend
sudo firewall-cmd --permanent --add-port=5000/tcp  # Backend API

# Reload firewall
sudo firewall-cmd --reload

print_status "Firewall configured and enabled"

print_step "7. Configuring SELinux..."
# Set SELinux to permissive mode for Docker (can be adjusted based on security requirements)
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
print_warning "SELinux set to permissive mode. Consider configuring proper SELinux policies for production."

print_step "8. Configuring Fail2Ban..."
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
logpath = /var/log/secure
maxretry = 3
bantime = 3600
EOF

sudo systemctl restart fail2ban
print_status "Fail2Ban configured for SSH protection"

print_step "9. Creating application directory..."
APP_DIR="/opt/cslogbook"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
print_status "Application directory created at $APP_DIR"

print_step "10. Setting up log rotation..."
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

print_step "11. Creating systemd service for Docker Compose..."
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

print_step "12. Setting up automatic security updates..."
if [[ "$CENTOS_VERSION" == "8" ]] || [[ "$CENTOS_VERSION" == "9" ]]; then
    sudo dnf install -y dnf-automatic
    sudo systemctl enable --now dnf-automatic.timer
else
    sudo yum install -y yum-cron
    sudo systemctl enable yum-cron
    sudo systemctl start yum-cron
fi
print_status "Automatic security updates configured"

print_step "13. Optimizing system performance..."
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

print_step "14. Disabling unnecessary services..."
# Disable services that are not needed for a web server
sudo systemctl disable postfix 2>/dev/null || true
sudo systemctl stop postfix 2>/dev/null || true
print_status "Unnecessary services disabled"

echo ""
echo "=========================================================="
print_status "🎉 CentOS/RHEL Server Setup Complete!"
echo "=========================================================="
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo "1. Logout and login again to apply Docker group membership"
echo "2. Upload your project to: $APP_DIR"
echo "3. Create and configure .env.production file"
echo "4. Run: cd $APP_DIR && docker-compose --env-file .env.production up -d"
echo ""
print_warning "SECURITY REMINDERS:"
echo "• Change default SSH port if needed"
echo "• Configure proper SELinux policies for production"
echo "• Set up SSL certificates (Let's Encrypt recommended)"
echo "• Configure regular backups"
echo "• Monitor system logs regularly"
echo ""
print_status "Server IP Address: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo ""
print_warning "Please reboot the server to ensure all changes take effect:"
echo "sudo reboot"