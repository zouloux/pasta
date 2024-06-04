#!/bin/bash

clear
cd ~
read -p "Enter the project name: " projectName
username="project_$projectName"

# Check if this project already exists
if [ -d "containers/projects/$projectName" ]; then
  echo "Project $projectName already exists."
  exit 1
fi

# Create a new linux user associated to this project workspace
echo "Creating user $username ..."
adduser --disabled-password --gecos "" $username > /dev/null 2>&1

# Create the project directory structure
echo "Creating project and user directory ..."
mkdir -p containers/projects/$projectName/{builds,branches,data,keys}
chown root:$username containers/projects/$projectName/{builds,branches,data}
chmod 770 containers/projects/$projectName/{builds,branches,data}
# Set permissions for the keys directory to be root-only
chown root:root containers/projects/$projectName/keys
chmod 700 containers/projects/$projectName/keys
# Create the user's home directory
mkdir -p /home/$username/{project,.ssh}
# Link workspace to user home
ln -s ~/containers/projects/$projectName/builds /home/$username/project/builds
ln -s ~/containers/projects/$projectName/branches /home/$username/project/branches
ln -s ~/containers/projects/$projectName/data /home/$username/project/data
# Set ownership and permissions for the linked directories
chown -h $username:$username /home/$username/project/{builds,branches,data}
chmod 770 /home/$username/project/{builds,branches,data}

# Generate SSH key pair
echo "Creating SSH keypair ..."
ssh-keygen -t ed25519 -f containers/projects/$projectName/keys/${username} -N "" > /dev/null 2>&1
# Add the public key to the user's authorized_keys
cat containers/projects/$projectName/keys/${username}.pub >> /home/$username/.ssh/authorized_keys
# Set appropriate permissions for the .ssh directory and authorized_keys file
chown -R $username:$username /home/$username/.ssh
chmod 700 /home/$username/.ssh
chmod 600 /home/$username/.ssh/authorized_keys

echo ""
echo "Project $projectName created ✨"