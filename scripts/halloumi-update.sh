#!/bin/bash

proxyDir="~/containers/services/proxy"

clear
echo " _           _ _                       _"
echo "| |__   __ _| | | ___  _   _ _ __ ___ (_)"
echo "| '_ \ / _\` | | |/ _ \| | | | '_ \` _ \| |"
echo "| | | | (_| | | | (_) | |_| | | | | | | |"
echo "|_| |_|\__,_|_|_|\___/ \__,_|_| |_| |_|_|"
echo ""

# Ask for confirmation
read -p "This will update :
- ~/scripts ( override ),
- ~/.bashrc ( with a .old backup )
- ${proxyDir}/docker-compose.yaml ( with a .old backup )
Are you sure to continue? (y) : " confirmation
if [ "$confirmation" != "y" ]; then
  echo "Update aborted."
  exit 1
fi

# Stop proxy
echo "Stopping proxy ..."
cd $proxyDir
docker compose stop > /dev/null 2>&1
cd ~

# Clone Halloumi repo
echo "Cloning Halloumi repo ..."
git clone https://github.com/zouloux/halloumi.git /tmp/halloumi > /dev/null 2>&1

# Set bash profile
echo "Updating .bashrc ..."
mv ~/.bashrc ~/.bashrc.old
cp /tmp/halloumi/.bashrc ~/.bashrc
source ~/.bashrc

# Copy the proxy config and scripts
echo "Updating proxy ..."
cd $proxyDir
cp -f docker-compose.yaml docker-compose.yaml.old
cp -f /tmp/halloumi/containers/services/proxy/docker-compose.yaml $proxyDir

echo "Updating scripts ..."
cp -f -r /tmp/halloumi/scripts/* ~/scripts/

# Start the proxy
echo "Starting proxy ..."
cd $proxyDir
docker compose up -d > /dev/null 2>&1
cd ~

echo "Cleaning ..."
rm -rf /tmp/halloumi
rm -f .zcompdump* > /dev/null 2>&1
rm -f .wget-hsts > /dev/null 2>&1
rm -f .viminfo > /dev/null 2>&1
echo "" > .bash_history

echo ""
echo "All done ✨"
