#!/bin/bash

clear
echo "______         _          _____"
echo "| ___ \       | |        /  ___|"
echo "| |_/ /_ _ ___| |_ __ _  \ \`--.  ___ _ ____   _____ _ __"
echo "|  __/ _\` / __| __/ _\` |  \`--. \/ _ \ '__\ \ / / _ \ '__|"
echo "| | | (_| \__ \ || (_| | /\__/ /  __/ |   \ V /  __/ |"
echo "\_|  \__,_|___/\__\__,_| \____/ \___|_|    \_/ \___|_|"
echo ""

pastaDir="/usr/local/pasta"

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Check if pasta exists
if [ -d "/usr/local/pasta/" ]; then
  echo "Pasta Server seems to be already installed on this server."
  echo "Please run update script."
  exit 1
fi

# Check if docker is present
if command -v docker &> /dev/null; then
  echo "Docker seems already installed on this server. Docker installation will be skipped."
  read -p "Do you want to continue? (y/n): " choice
  if [ "$choice" != "y" ]; then
    exit 1
  fi
  echo ""
fi

# Ask for confirmation
read -p "This script will :
- install Pasta Server core dependencies
- override .bashrc ( do a backup before )
- create ~/containers/ directory
- create $pastaDir directory
- create ~/.config directory
Are you sure to continue? (y/n) : " confirmation
if [ "$confirmation" != "y" ]; then
  exit 1
fi
echo ""

# Ask some questions
read -p "On which root domain this server is installed ?
Only DNS, no scheme. ( ex : my-domain.com ) :
" rootDomain
echo ""
read -p "Which server name to use for this instance ?
It should be representative of its domain name, no special char [a-zA-Z0-9_-]. ( ex : my-domain ) :
" hostname
echo ""
read -p "Admin email address :
" adminEmail
echo ""

# Set the hostname
echo "Configuring hosts ..."
echo $hostname > /etc/hostname
hostnamectl set-hostname $hostname > /dev/null 2>&1
echo "" >> /etc/hosts
echo "127.0.0.1 $hostname" >> /etc/hosts

# Update and install core dependencies
echo "Installing core dependencies ..."
apt update -qq > /dev/null 2>&1
apt upgrade -y -qq > /dev/null 2>&1
apt install git logrotate figlet apache2-utils rsync htop acl -y -qq > /dev/null 2>&1

# Create ASCII banner and remove figlet
echo "Creating login banner ..."
banner=$(echo $hostname | figlet -w 120)
echo "$banner" > /etc/motd
apt remove figlet -y -qq > /dev/null 2>&1

# Enable banner for SSH login
echo "PrintMotd yes" >> /etc/ssh/sshd_config
systemctl restart sshd > /dev/null 2>&1

# Install Docker
if ! command -v docker &> /dev/null; then
  echo "Installing docker ..."
  curl -fsSL https://get.docker.com -o get-docker.sh > /dev/null 2>&1
  sh get-docker.sh -y > /dev/null 2>&1
  rm get-docker.sh
fi

# Install lazydocker
echo "Installing lazydocker ..."
curl -fsSL https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh -o install-lazy-docker.sh > /dev/null 2>&1
bash install-lazy-docker.sh > /dev/null 2>&1
rm install-lazy-docker.sh
mv .local/bin/lazydocker /usr/bin
rm -rf .local

# Configure logs
echo "Configuring logs ..."
echo "include /etc/logrotate.d" > /etc/logrotate.conf
# Add a logrotate configuration for all logs
cat <<EOF > /etc/logrotate.d/all_logs
/var/log/*log {
    size 32M
    missingok
    notifempty
    copytruncate
    create 0640 root adm
    rotate 0
}
EOF
# Configure journald for log max size
cat <<EOF > /etc/systemd/journald.conf
[Journal]
Storage=persistent
SystemMaxUse=256M
SystemKeepFree=1G
SystemMaxFileSize=32M
MaxRetentionSec=1month
RateLimitInterval=60s
RateLimitBurst=1000
Compress=yes
EOF
systemctl restart systemd-journald > /dev/null 2>&1

# Save config
echo "Creating directories ..."
cd ~
mkdir -p containers/apps/
mkdir -p containers/services/proxy/
mkdir -p containers/projects/

# Save config
echo "Saving config ..."
mkdir -p .config/pasta/
cd .config/pasta/
echo $hostname > hostname.txt
echo $rootDomain > domain.txt
echo $adminEmail > email.txt
cd ~

# Clone repo
echo "Cloning Pasta repo ..."
git clone https://github.com/zouloux/pasta.git /tmp/pasta > /dev/null 2>&1

# Set bash profile
rm ~/.bashrc > /dev/null 2>&1
cp /tmp/pasta/server/.bashrc ~/.bashrc
source ~/.bashrc

echo "Setting up nginx proxy ..."
cp /tmp/pasta/server/containers/services/proxy/docker-compose.yaml ~/containers/services/proxy/
cp -r /tmp/pasta/server/containers/services/proxy/config/ ~/containers/services/proxy/config/

echo "Installing pasta scripts ..."
pastaDir="/usr/local/pasta"
mkdir -p $pastaDir > /dev/null 2>&1
cp -r /tmp/pasta/server/scripts/* $pastaDir > /dev/null 2>&1

echo "Creating docker network ..."
docker network create pasta > /dev/null 2>&1

echo "Downloading proxy image ..."
cd ~/containers/services/proxy/
docker compose build > /dev/null 2>&1

echo "Starting proxy ..."
docker compose up -d > /dev/null 2>&1
cd ~

# After install script common
/usr/local/pasta/after-install

echo ""
echo "All done ✨"
echo ""
echo "You can add this alias to your .zshrc or .bashrc to connect easily :"
/usr/local/pasta/print-alias