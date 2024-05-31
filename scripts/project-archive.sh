#!/bin/bash

clear
cd ~
read -p "Enter the project name: " projectName
username="project_$projectName"
projectPath="containers/projects/$projectName"

# Check if this project exists
if [ ! -d "$projectPath" ]; then
  echo "Project $projectName not found."
  exit 1
fi

# Confirm
echo "Are you sure you want to remove the project $projectName ?"
echo "- All docker compose related to this project will be down"
echo "- All data in /branches will be permanently removed"
echo "- Directories /data and /keys will be archived into ~/archives"
echo "This action cannot be undone."
read -p "Type 'archive' to confirm: " confirm
if [ "$confirm" != "archive" ]; then
  echo "Cancelled."
  exit 1
fi

# Browse for every docker-compose.yaml and docker-compose.yml file recursively in /branches and run docker compose down
echo "Stopping all docker-compose services..."
find "$projectPath/branches" \( -name "docker-compose.yaml" -o -name "docker-compose.yml" \) | while read -r file; do
  dir=$(dirname "$file")
  echo "- $dir ..."
  (cd "$dir" && docker compose down)
done

# Archive the data and keys directories within the project directory
echo "Archiving project data and keys..."
mkdir -p archives
tar -czvf archives/${projectName}.tar.gz -C "$projectPath" data keys > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "Failed to archive project data and keys. Exiting."
  exit 1
fi

# Remove the user and the project directory
echo "Removing user $username and project directory..."
deluser --remove-home $username > /dev/null 2>&1
rm -rf "$projectPath"

if [ $? -ne 0 ]; then
  echo "Failed to remove user or project directory. Exiting."
  exit 1
fi

echo ""
echo "Project $projectName archived successfully."
