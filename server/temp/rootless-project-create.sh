### WIP
### WIP
### WIP
### WIP
### WIP
### WIP
### WIP
### WIP
### WIP
### WIP
### WIP
### WIP

# CHECK rootless-project-deploy.sh

#!/bin/bash

clear

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi
if [ $# -gt 1 ]; then
  echo "Usage:"
  echo "$0 <project?>"
  exit 1
fi

if [ -z "$1" ]; then
  read -p "Enter the project name: " projectName
else
  projectName="$1"
fi

username="$projectName"
userProjectRoot="/home/$username"
rootProjectRoot="/root/containers/projects/$projectName"

# Check if this project or user already exists
if [ -d "$rootProjectRoot" ]; then
  echo "Project $projectName already exists."
  exit 1
fi
if id "$projectName" &>/dev/null; then
  echo "User $projectName already exists."
  exit 1
fi

# Create a new linux user associated to this project workspace
echo "Creating user $username ..."
adduser --disabled-password --gecos "" "$username" > /dev/null 2>&1

# Allow this user to the pasta group
group="pasta"
usermod -aG "$group" "$username"

echo "Creating project directories ..."
mkdir -p "$userProjectRoot/"{.config,artifacts,builds,branches,data,.ssh}

mkdir -p "$rootProjectRoot/keys"
project-revoke-key "$projectName"

echo "Configuring directories access ..."
chown -h -R "$username:$username" "$userProjectRoot"
chmod 700 -R "$userProjectRoot"
chmod 700 "$userProjectRoot/.ssh"
chmod 600 "$userProjectRoot/.ssh/authorized_keys"

# Data is from root for everybody
chown "$username:$group" "$userProjectRoot/data"
chmod 0770 "$userProjectRoot/data"

echo "Creating shortcuts in containers directory ..."
ln -s "$userProjectRoot/builds" "$rootProjectRoot/builds"
ln -s "$userProjectRoot/branches" "$rootProjectRoot/branches"
ln -s "$userProjectRoot/data" "$rootProjectRoot/data"

echo "Create .bashrc for project user ..."
rm -rf "$userProjectRoot/.bash_logout"
pastaDir="/usr/local/pasta"
echo "source $pastaDir/.bashrc" > "$userProjectRoot/.bashrc"

echo ""
echo "> Project $projectName created"
echo "> Deploy key is:"
echo ""
cat "$rootProjectRoot/keys/id_ed25519"