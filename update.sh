#!/bin/bash

clear
echo "______         _          _____"
echo "| ___ \       | |        /  ___|"
echo "| |_/ /_ _ ___| |_ __ _  \ \`--.  ___ _ ____   _____ _ __"
echo "|  __/ _\` / __| __/ _\` |  \`--. \/ _ \ '__\ \ / / _ \ '__|"
echo "| | | (_| \__ \ || (_| | /\__/ /  __/ |   \ V /  __/ |"
echo "\_|  \__,_|___/\__\__,_| \____/ \___|_|    \_/ \___|_|"
echo ""

# Check if pasta exists
if [ ! -d "$HOME/.config/pasta" ]; then
  echo "Pasta Server does not seems to be installed on this server."
    echo "Please run install script."
  exit 1
fi

# Ask for confirmation
read -p "This script will update :
- ~/scripts ( override ),
- ~/.bashrc ( will create a .old backup if different )
- ${proxyDir}/docker-compose.yaml ( will create a .old backup if different )
Are you sure to continue? (y/n) : " confirmation
if [ "$confirmation" != "y" ]; then
  exit 1
fi

read -p "Do you want to update Docker ? ( you will have to wait 20s ) (y/n)" confirmation
if [ "$confirmation" == "y" ]; then
  echo "Updating docker ..."
  curl -fsSL https://get.docker.com -o get-docker.sh > /dev/null 2>&1
  sh get-docker.sh -y
  rm get-docker.sh
fi

proxyDir="$HOME/containers/proxy"

# Stop proxy
echo "Stopping proxy ..."
cd $proxyDir
docker compose stop > /dev/null 2>&1
cd ~

# Clone repo
echo "Cloning Pasta repo ..."
git clone https://github.com/zouloux/pasta.git /tmp/pasta > /dev/null 2>&1

# Set bash profile
echo "Updating .bashrc ..."
mv .bashrc .bashrc.old
cp /tmp/pasta/server/.bashrc .bashrc
if cmp -s .bashrc .bashrc.old; then rm .bashrc.old; fi
source .bashrc

# Copy the proxy config and scripts
echo "Updating proxy ..."
cd $proxyDir
cp -f docker-compose.yaml docker-compose.yaml.old
cp -f /tmp/pasta/server/containers/proxy/docker-compose.yaml $proxyDir
if cmp -s docker-compose.yaml docker-compose.yaml.old; then rm docker-compose.yaml.old; fi

echo "Updating scripts ..."
cp -f -r /tmp/pasta/server/scripts/* ~/scripts/

# Start the proxy
echo "Starting proxy ..."
cd $proxyDir
docker compose up -d > /dev/null 2>&1
cd ~

echo "Cleaning ..."
rm -rf /tmp/* > /dev/null 2>&1
rm -f .zcompdump* > /dev/null 2>&1
rm -f .wget-hsts > /dev/null 2>&1
rm -f .viminfo > /dev/null 2>&1
echo "" > .bash_history

echo ""
echo "All done ✨"
