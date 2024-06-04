#!/bin/bash

clear
echo "______         _          _____"
echo "| ___ \       | |        /  ___|"
echo "| |_/ /_ _ ___| |_ __ _  \ \`--.  ___ _ ____   _____ _ __"
echo "|  __/ _\` / __| __/ _\` |  \`--. \/ _ \ '__\ \ / / _ \ '__|"
echo "| | | (_| \__ \ || (_| | /\__/ /  __/ |   \ V /  __/ |"
echo "\_|  \__,_|___/\__\__,_| \____/ \___|_|    \_/ \___|_|"
echo ""

echo "This script will :"
echo "- Install your ssh public key"
echo "- Disable SSH password access"
echo "- Change SSH default port"
echo ""
read -p "Do you want to continue ? (y/n)" choice
if [ "$choice" != "y" ]; then
  exit 1
fi

# Ask for the public key and save it to authorized_keys
read -p "Enter your public SSH key: " sshKey

# Ask for the new SSH port
read -p "Enter a new SSH port (between 2000 and 3000): " sshPort
if [[ $sshPort -le 2000 || $sshPort -ge 3000 ]]; then
  echo "$sshPort is invalid"
  read -p "$sshPort will be set to default port 22. Do you want to continue ? (y/n)" choice
  if [ "$choice" != "y" ]; then exit 1; fi
  sshPort=22
fi

echo "Installing SSH key ..."
mkdir -p ~/.ssh
echo "$sshKey" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys > /dev/null 2>&1

echo "Saving SSH config ..."
sed -i "s/^#Port 22/Port $sshPort/" /etc/ssh/sshd_config
sed -i "s/^#PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config
sed -i "s/^#ChallengeResponseAuthentication yes/ChallengeResponseAuthentication no/" /etc/ssh/sshd_config
# Delete the default password config (Ionos only)
rm -f /etc/ssh/sshd_config.d/50-cloud-init.conf > /dev/null 2>&1

# Restart SSH service
echo "Restarting SSH ..."
systemctl restart ssh > /dev/null 2>&1

echo ""
echo "All done ✨"
echo ""
echo "Please reconnect using the new port $sshPort"
echo "IMPORTANT : Do not forget to open the port $sshPort !"
