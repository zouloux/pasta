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
proxyDir="/root/containers/services/proxy"

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi

# Check if pasta exists
if [ ! -d "$pastaDir" ]; then
  echo "Pasta Server does not seems to be installed on this server."
  echo "Please run install script."
  exit 1
fi

# Print version
echo -n "Current version is "
/usr/local/pasta/bin/print-version
echo ""

# Ask for confirmation
read -p "This script will update:
- ${pastaDir}/bin
- ${pastaDir}/.bashrc
- ${proxyDir}/docker-compose.yaml ( will create a .old backup if different )
Are you sure to continue? (y/n) " confirmation
if [ "$confirmation" != "y" ]; then
  exit 1
fi
echo ""

read -p "Do you want to update Docker ? ( you will have to wait 20s ) (y/n) " confirmation
if [ "$confirmation" == "y" ]; then
  echo "Updating docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh > /dev/null 2>&1
  sh get-docker.sh -y
  rm get-docker.sh
fi

# Stop proxy
echo "Stopping proxy..."
cd "$proxyDir"
docker compose stop > /dev/null 2>&1

# Clone repo
echo "Cloning Pasta repo..."
rm -rf /tmp/pasta > /dev/null 2>&1
git clone https://github.com/zouloux/pasta.git /tmp/pasta > /dev/null 2>&1

# Set bash profile
echo "Updating .bashrc..."
cp -f /tmp/pasta/server/.bashrc "${pastaDir}/.bashrc" > /dev/null 2>&1
source /root/.bashrc

# Copy the proxy config and scripts
echo "Updating proxy..."
cd "$proxyDir"
cp -f docker-compose.yaml docker-compose.yaml.old
cp -f /tmp/pasta/server/containers/services/proxy/docker-compose.yaml $proxyDir
if cmp -s docker-compose.yaml docker-compose.yaml.old; then rm docker-compose.yaml.old; fi

echo "Updating pasta bin..."
rm -rf "$pastaDir/bin" > /dev/null 2>&1
mkdir -p "$pastaDir/bin" > /dev/null 2>&1
cp -f -r /tmp/pasta/server/pasta/bin/* "$pastaDir/bin" > /dev/null 2>&1

# Updating lazydocker
cd /root
echo "Updating lazydocker..."
curl -fsSL https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh -o install-lazy-docker.sh > /dev/null 2>&1
bash install-lazy-docker.sh > /dev/null 2>&1
rm install-lazy-docker.sh
rm /usr/bin/lazydocker
mv .local/bin/lazydocker /usr/bin
rm -rf .local

# Start the proxy
echo "Starting proxy..."
cd "$proxyDir"
docker compose up -d > /dev/null 2>&1
cd /root

# Run migration installs
/usr/local/pasta/bin/install-1.1.sh

# After install script common
/usr/local/pasta/bin/after-install

# Print version
echo ""
echo -n "New version is "
/usr/local/pasta/bin/print-version
echo ""
echo "> All done"
