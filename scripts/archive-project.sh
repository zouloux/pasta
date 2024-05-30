#!/bin/bash

# TODO
exit

projectID=$1
projectUser="project_$projectID"
projectFolder=~/containers/projects/$projectID
archiveFolder=~/archives
keepFolder="${projectFolder}/_keep_"
# Check for project ID
if [ -z "$projectID" ]; then
    echo "No project ID provided."
    exit 1
fi

# Check if the project folder and keep folder exist
if [ ! -d "$projectFolder" ] || [ ! -d "$keepFolder" ]; then
    echo "Project or _keep_ folder does not exist."
    exit 1
fi

# Check if the user exists
if ! id "$projectUser" &>/dev/null; then
    echo "User $projectUser does not exist."
    exit 1
fi

# Ask for user confirmation
read -p "Are you sure you want to archive and remove project $projectID? [y/N] " confirmation
if [[ ! $confirmation =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

# Remove the user
userdel "$projectUser"

# Create archives directory if it doesn't exist
mkdir -p "$archiveFolder"

# Archive the _keep_ folder
zip -r "${archiveFolder}/${projectID}.zip" "$keepFolder"

# Remove the project folder
rm -rf "$projectFolder"

echo "Project $projectID has been archived."