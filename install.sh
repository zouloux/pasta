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
authorizedKeys="/root/.ssh/authorized_keys"
sshConfig="/etc/ssh/sshd_config"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please switch to root user and restart install:"
  echo "\$ sudo su -"
  exit 1
fi

# Check if pasta exists
if [ -d "/usr/local/pasta/" ]; then
  echo "Pasta Server seems to be already installed on this server."
  echo "Please update with:"
  echo "\$ pasta-upgrade"
  exit 1
fi

# Check lock
if fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; then
  read -p "Lock detected. Do you want to remove it manually and proceed? (y/n) " answer
  if [ "$answer" != "y" ]; then
    echo "Exiting."
  else
    sudo rm /var/lib/dpkg/lock-frontend
    echo "Lock removed."
  fi
fi

# Ask to add SSH key
if [ ! -f "$authorizedKeys" ] || ! grep -q "ssh-" "$authorizedKeys"; then
  echo ""
  echo "You should add your public key to login to root."
  echo "This is highly recommended."
  read -p "Enter your public SSH key: " sshKey
  needRestart=false
  if [ -n "$sshKey" ]; then
    echo "Installing SSH key..."
    mkdir -p /root/.ssh
    echo "$sshKey" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys > /dev/null 2>&1
    echo ""
    echo "For better security, you can now disable your SSH password access."
    read -p "Do you want to disable SSH password access? (y/n) " disablePasswordAccess
    if [ "$disablePasswordAccess" == "y" ]; then
      sed -i "s/^#PasswordAuthentication yes/PasswordAuthentication no/" $sshConfig
      sed -i "s/^#ChallengeResponseAuthentication yes/ChallengeResponseAuthentication no/" $sshConfig
      rm -f /etc/ssh/sshd_config.d/50-cloud-init.conf > /dev/null 2>&1
      needRestart=true
    fi
  fi
  echo ""
  echo "For better security, you can change your SSH port."
  echo "Select a port number and do not forget to open this port on firewall!"
  read -p "Enter a new SSH port (between 2000 and 8000, empty to keep 22): " sshPort
  if [[ -n "$sshPort" && ( ( $sshPort -lt 2000 || $sshPort -gt 8000 ) && $sshPort -ne 22 ) ]]; then
    echo "$sshPort not in range, skipping..."
  elif [ -n "$sshPort" ]; then
    echo "Saving SSH config..."
    sed -i "s/^#Port 22/Port $sshPort/" $sshConfig
    needRestart=true
    if command -v ufw >/dev/null 2>&1; then
      ufw allow $port
      echo "Port $port unlocked in local firewall."
    else
      echo "Firewall not found or not supported."
    fi
  fi
  if [ "$needRestart" = true ]; then
    echo "Restarting SSH..."
    echo "Please reconnect with new parameters and restart the setup script."
    if [ "$sshPort" -ne 22 ]; then
      echo ""
      echo "IMPORTANT : Do not forget to open the port $sshPort on network firewall!"
    fi
    systemctl restart ssh > /dev/null 2>&1
    echo "Done"
    exit
  fi
  echo ""
fi

# Check if docker is present
if command -v docker &> /dev/null; then
  echo "Docker seems already installed on this server. Docker installation will be skipped. This is highly recommended to uninstall docker before continuing for better stability."
  read -p "Do you want to continue? (y/n): " choice
  if [ "$choice" != "y" ]; then
    exit 1
  fi
  echo ""
fi

# Ask for confirmation
read -p "This script will:
- Install Pasta Server core dependencies with apt
- Install Pasta Server in $pastaDir directory
- Override /root/.bashrc and create a copy at /root/.bashrc.old
- Create /root/containers/ directory to host dockerized application
Are you sure to continue? (y/n) : " confirmation
if [ "$confirmation" != "y" ]; then
  exit 1
fi
echo ""

# Ask some questions
read -p "On which root domain this server is installed ?
Only DNS, no scheme. (ex: my-domain.com) :
" rootDomain
echo ""
read -p "Which server name to use for this instance ?
It should be representative of its domain name, no special char [a-zA-Z0-9_-]. (ex: my-domain) :
" hostname
echo ""
read -p "Admin email address :
" adminEmail
echo ""
read -p "Enable ASCII banner login showing '$hostname' ? (y/n)" doBanner

# Set the hostname
echo "Configuring hosts..."
echo "$hostname" > /etc/hostname
hostnamectl set-hostname "$hostname" > /dev/null 2>&1
if ! grep -qE "127\.0\.0\.1\s+$hostname" /etc/hosts; then
  echo "" >> /etc/hosts
  echo "127.0.0.1 $hostname" >> /etc/hosts
fi

# Update and install core dependencies
#echo "Installing core dependencies..."
#apt update -qq > /dev/null 2>&1
#apt upgrade -y -qq > /dev/null 2>&1
#apt install git logrotate figlet openssl rsync htop -y -qq > /dev/null 2>&1
echo "Installing core dependencies..."
echo -n "- update "
apt update -qq > /dev/null 2>&1 && echo "[OK]"
echo -n "- upgrade "
apt upgrade -y -qq > /dev/null 2>&1 && echo "[OK]"
install_packages=( "git" "logrotate" "figlet" "openssl" "rsync" "htop" )
for package in "${install_packages[@]}"; do
  echo -n "- install $package "
  apt install "$package" -y -qq > /dev/null 2>&1 && echo "[OK]"
done


# Create ASCII banner and remove figlet
if [ "$doBanner" == "y" ]; then
  echo "Creating login banner..."
  banner=$(echo $hostname | figlet -w 120)
  echo "$banner" > /etc/motd
  # Enable banner for SSH login
  echo "PrintMotd yes" >> $sshConfig
  systemctl restart sshd > /dev/null 2>&1
fi
apt remove figlet -y -qq > /dev/null 2>&1

# Install Docker
if ! command -v docker &> /dev/null; then
  echo "Installing docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh > /dev/null 2>&1
#  sh get-docker.sh -y > /dev/null 2>&1
  sh get-docker.sh -y
  rm get-docker.sh
fi

# Install lazydocker
echo "Installing lazydocker..."
curl -fsSL https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh -o install-lazy-docker.sh > /dev/null 2>&1
bash install-lazy-docker.sh > /dev/null 2>&1
rm install-lazy-docker.sh
mv .local/bin/lazydocker /usr/bin
rm -rf .local

# Configure logs
echo "Configuring logs..."
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
SystemMaxUse=512M
SystemKeepFree=1G
SystemMaxFileSize=32M
MaxRetentionSec=3month
RateLimitInterval=60s
RateLimitBurst=1000
Compress=yes
EOF
systemctl restart systemd-journald > /dev/null 2>&1

# Save config
echo "Creating directories..."
cd /root
mkdir -p containers/apps/
mkdir -p containers/services/proxy/
mkdir -p containers/projects/

# Save config
echo "Saving config..."
mkdir -p "$pastaDir/config"
cd "$pastaDir/config"
echo "$hostname" > hostname.txt
echo "$rootDomain" > domain.txt
echo "$adminEmail" > email.txt
cd /root

# Clone repo
echo "Cloning Pasta repo..."
rm -rf /tmp/pasta > /dev/null 2>&1
git clone https://github.com/zouloux/pasta.git /tmp/pasta > /dev/null 2>&1

echo "Installing pasta bin..."
mkdir -p "$pastaDir" > /dev/null 2>&1
cp -r /tmp/pasta/server/pasta/* "$pastaDir" > /dev/null 2>&1

echo "Configuring bashrc..."
mv /root/.bashrc /root/.bashrc.old > /dev/null 2>&1
cp /tmp/pasta/server/.bashrc "$pastaDir" > /dev/null 2>&1
chmod 0755 "$pastaDir/.bashrc" > /dev/null 2>&1
echo "source $pastaDir/.bashrc" > /root/.bashrc
source /root/.bashrc

echo "Setting up nginx proxy..."
cp /tmp/pasta/server/containers/services/proxy/docker-compose.yaml /root/containers/services/proxy/
cp -r /tmp/pasta/server/containers/services/proxy/config/ /root/containers/services/proxy/config/

echo "Configuring deployment group..."
groupadd pasta > /dev/null 2>&1

echo "Creating docker network..."
docker network create pasta > /dev/null 2>&1

echo "Downloading proxy image..."
cd /root/containers/services/proxy/
docker compose build > /dev/null 2>&1

echo "Starting proxy..."
docker compose up -d > /dev/null 2>&1
cd /root

# Run migration installs
/usr/local/pasta/bin/install-1.1.sh
/usr/local/pasta/bin/install-1.2.sh

# After install script common
/usr/local/pasta/bin/after-install

echo ""
echo "> All done"
echo "> Type 'pasta-help' to list all available commands."
echo "> Add a shortcut to this server in your Pasta CLI :"
/usr/local/pasta/bin/print-alias
