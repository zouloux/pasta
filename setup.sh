#!/bin/bash

echo ""

# Ask some questions
read -p "On which root domain this server is installed ? Only DNS, no scheme. ( ex : google.com ) : " rootDomain
read -p "Which server name to use for this instance? It should be representative of its domain name, no dot, no ext, dash allowed. ( ex : google ) : " hostname
read -p "Admin email address ( for acme ) : " adminEmail

# Set the hostname
echo $hostname > /etc/hostname
hostnamectl set-hostname $hostname
echo "127.0.0.1 $hostname" >> /etc/hosts

# Confirm to install dependencies
echo "Installing dependencies"

# Update and install core dependencies
apt update && apt upgrade -y
apt install git zsh logrotate figlet apache2-utils -y

# Create ASCII banner
banner=$(echo $hostname | figlet -w 120)
echo "$banner" > /etc/motd

# Enable banner for SSH login
echo "PrintMotd yes" >> /etc/ssh/sshd_config
systemctl restart sshd

# Install ohmyzsh
wget -qO install-ohmyzsh.sh https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh
bash install-ohmyzsh.sh --unattended
rm install-ohmyzsh.sh

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh -y
rm get-docker.sh

# Configure logrotate
echo "include /etc/logrotate.d" > /etc/logrotate.conf

# Add a logrotate configuration for all logs
cat <<EOF > /etc/logrotate.d/all_logs
/var/log/*log {
    size 64M
    missingok
    notifempty
    copytruncate
    create 0640 root adm
    rotate 0
}
EOF

# Save config
cd /root
mkdir config/
mkdir scripts/
mkdir -p containers/apps
mkdir -p containers/services/proxy
mkdir -p containers/projects

# Save config
echo $hostname > config/hostname.txt
echo $rootDomain > config/root-domain.txt
echo $adminEmail > config/admin-email.txt

# Import zshtheme / proxy config / scripts from git
git clone https://github.com/zouloux/halloumi.git /tmp/halloumi
cd ~/.oh-my-zsh/themes/
mv robbyrussell.zsh-theme robbyrussell.zsh-theme.old
cp /tmp/halloumi/halloumi.zsh-theme ~/.oh-my-zsh/themes/robbyrussell.zsh-theme
cd /root
cp /tmp/halloumi/containers/services/proxy/docker-compose.yaml /root/containers/services/proxy/
cp -r /tmp/halloumi/scripts/* /root/scripts/
rm -rf /tmp/halloumi

# Create proxy dot env
echo "EMAIL_ADDRESS=${adminEmail}" > /root/containers/services/proxy/.env

# Create halloumi docker network
docker network create halloumi

# Start reverse proxy
cd /root/containers/services/proxy/

docker compose up -d

echo "All done"