#!/usr/bin/env bash

# ------------------------------------------------------------------------------ CONFIG
# Json file to read version from
jsonVersionFile="package.json"
# Files to change versions in
filesToUpdate=( "package.json" )

# ------------------------------------------------------------------------------ SHOW STATUS & ASK CONFIRM
# Show changes
git status -s
# Ask for yes or no https://stackoverflow.com/questions/1885525/how-do-i-prompt-a-user-for-confirmation-in-bash-script
function askYesOrNo () {
    read -p "$1 ([y]es or [N]o): "
    case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
        y|yes) echo "yes" ;;
        *)     echo "no" ;;
    esac
}
# Confirm continuation
if [[ "no" == $(askYesOrNo "Continue ?") ]]; then exit 0; fi

# ------------------------------------------------------------------------------ UPDATE VERSION
# Show current version, ask for new version
currentVersion=$(node -e "console.log(require(\"./${jsonVersionFile}\").version)")
echo "Current version is $currentVersion"
echo "New version number ?"
read newVersion
# Replace new version in files from config
for i in "${filesToUpdate[@]}"
do
  echo "Updating $i"
  res=$(sed -E "s/${currentVersion}/${newVersion}/" "$i")
  echo "$res" > "$i";
done

# ------------------------------------------------------------------------------ COMMIT & PUSH
# Ask commit and tag message
echo "Commit and tag message ?"
read commitMessage
# Add files, commit and tag
git add .
git commit -m"$commitMessage"
# Push commit and tags
git push
# Publish to npm
npm publish