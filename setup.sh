#!/bin/bash

clear
echo " _           _ _                       _"
echo "| |__   __ _| | | ___  _   _ _ __ ___ (_)"
echo "| '_ \ / _\` | | |/ _ \| | | | '_ \` _ \| |"
echo "| | | | (_| | | | (_) | |_| | | | | | | |"
echo "|_| |_|\__,_|_|_|\___/ \__,_|_| |_| |_|_|"
echo ""

# Check if already installed
if [ -d "/root/containers" ]; then
  read -p "/root/containers directory already exists. Do you want to continue? (y/n): " choice
  if [ "$choice" != "y" ]; then
    exit 1
  fi
fi

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
echo $hostname > /etc/hostname
hostnamectl set-hostname $hostname > /dev/null 2>&1
echo "127.0.0.1 $hostname" >> /etc/hosts

# Update and install core dependencies
echo "Installing core dependencies ..."
apt update -qq > /dev/null 2>&1
apt upgrade -y -qq > /dev/null 2>&1
apt install git zsh logrotate figlet apache2-utils rsync htop -y -qq > /dev/null 2>&1

# Create ASCII banner and remove figlet
echo "Creating login banner ..."
banner=$(echo $hostname | figlet -w 120)
echo "$banner" > /etc/motd
apt remove figlet -y -qq > /dev/null 2>&1

# Enable banner for SSH login
echo "PrintMotd yes" >> /etc/ssh/sshd_config
systemctl restart sshd > /dev/null 2>&1

# Install Docker
echo "Installing docker ..."
curl -fsSL https://get.docker.com -o get-docker.sh > /dev/null 2>&1
sh get-docker.sh -y > /dev/null 2>&1
rm get-docker.sh

# Install lazydocker
echo "Installing lazydocker ..."
curl -fsSL https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh -o install-lazy-docker.sh > /dev/null 2>&1
bash install-lazy-docker.sh > /dev/null 2>&1
rm install-lazy-docker.sh
mv .local/bin/lazydocker /usr/bin
rm -rf .local

# Configure logrotate
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
cd /root
mkdir scripts/
mkdir -p containers/apps/
mkdir -p containers/services/proxy/
mkdir -p containers/projects/

# Save config
echo "Saving config ..."
mkdir -p .config/halloumi/
cd .config/halloumi/
echo $hostname > hostname.txt
echo $rootDomain > domain.txt
echo $adminEmail > email.txt
cd /root

# Clone Halloumi repo
echo "Cloning Halloumi repo ..."
git clone https://github.com/zouloux/halloumi.git /tmp/halloumi > /dev/null 2>&1

# Set bash profile
rm ~/.bashrc
cp /tmp/halloumi/.bashrc ~/.bashrc
source ~/.bashrc

# Copy proxy and scripts
echo "Setting up nginx proxy ..."
cp /tmp/halloumi/containers/services/proxy/docker-compose.yaml /root/containers/services/proxy/
cp -r /tmp/halloumi/containers/services/proxy/config/ /root/containers/services/proxy/config/
cp -r /tmp/halloumi/scripts/* /root/scripts/

# Create halloumi docker network
echo "Creating Halloumi docker network ..."
docker network create halloumi > /dev/null 2>&1

# Start reverse proxy
echo "Downloading proxy ..."
cd /root/containers/services/proxy/
docker compose build > /dev/null 2>&1
echo "Starting proxy ..."
docker compose up -d > /dev/null 2>&1
cd /root

echo "Cleaning ..."
rm -rf /tmp/halloumi
rm -f .zcompdump* > /dev/null 2>&1
rm -f .wget-hsts > /dev/null 2>&1
rm -f .viminfo > /dev/null 2>&1
echo "" > .bash_history

echo ""
echo "All done ✨"
echo ""
echo "You can add this alias to your .zshrc or .bashrc :"
./scripts/print-alias.sh