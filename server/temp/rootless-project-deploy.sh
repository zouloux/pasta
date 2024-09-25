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

# Trying to avoid the 777 by running rootless images with correct mapped users between host and container
# I had issues with PHP + Apache that cannot link 1002 from host to www-data inside the container

#!/bin/bash

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root"
  exit 1
fi
if [ $# -lt 2 ] || [ $# -gt 7 ]; then
  echo "Usage:"
  echo "sudo $0 <project> <branch> <sub-branch?> <data-bucket?> <sub-domain|full-domain?> <alias?> <login:password?>"
  exit 1
fi

# ------------------------------------------------------------------------------ INIT

# Using sudo, bashrc is not read. We have to reload envs and path.
# Pasta Server config
export PASTA_DOMAIN=$(cat /usr/local/pasta/config/domain.txt)
export PASTA_HOSTNAME=$(cat /usr/local/pasta/config/hostname.txt)
export PASTA_EMAIL=$(cat /usr/local/pasta/config/email.txt)

# Pasta Server scripts aliases
export PATH="$PATH:/usr/local/pasta/bin"

# Process arguments
projectName="$1"
branch="$2"
subBranch="$3"
dataBucketName="${4:-$branch}"
domain="$5"
alias="$6"
password="$7"

if [ -n "$subBranch" ]; then
  fullBranch="${branch}__${subBranch}"
else
  fullBranch=$branch
fi

# Check arguments
if [[ ! "$projectName" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid project name [a-zA-Z0-9_-]"
  exit 1
fi
if [[ ! "$branch" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid branch name [a-zA-Z0-9_-]"
  exit 1
fi
if [[ -n "$subBranch" && ! "$subBranch" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid sub branch name [a-zA-Z0-9_-]"
  exit 1
fi
if [[ -n "$dataBucketName" && ! "$dataBucketName" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid dataBucketName [a-zA-Z0-9_-]"
  exit 1
fi
if [[ -n "$domain" && ! "$domain" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "Invalid domain [a-zA-Z0-9._-]"
  exit 1
fi
if [[ -n "$alias" && ! "$alias" =~ ^[a-zA-Z0-9,._-]+$ ]]; then
  echo "Invalid alias [a-zA-Z0-9,._-]"
  exit 1
fi
if [[ -n "$password" && ! "$password" =~ ^[a-zA-Z0-9._:-]+$ ]]; then
  echo "Invalid login:password [a-zA-Z0-9._:-]"
  exit 1
fi

# Init variables
username="$projectName"
userDir="/home/$username"
baseDataDir="$userDir/data"
tarFile="$userDir/artifacts/$branch.tar.gz"
buildNumber=$(openssl rand -hex 8)
destinationBuildDir="$userDir/builds/$fullBranch-$buildNumber"
destinationBranchLink="$userDir/branches/$fullBranch"
group="pasta"
userID="$(id -u $username)"
#groupID="$(getent group $group | cut -d: -f3)"
groupID="$(id -g $username)"

# ------------------------------------------------------------------------------ TARGET ELEMENTS

# Target user directory
if [[ ! -d $userDir ]]; then
  echo "Project $projectName does not exist."
  exit 1
fi

# Target tar.gz file
if [ ! -f "$tarFile" ]; then
  echo "File $tarFile not found"
  exit 1
fi

cd "$userDir"

echo "> Build number is $buildNumber"

# ------------------------------------------------------------------------------ ERROR EXIT

fatalError () {
  echo "⚠ $1 : $2"
  if [ -n "$3" ]; then
    echo "Error stack"
    echo "$3"
  fi
  rm -f "$tarFile"
  (cd "$destinationBuildDir" && docker compose -f "docker-compose.pasta.yaml" down --volumes --remove-orphans ) > /dev/null 2>&1
  rm -rf "$destinationBuildDir"
  exit 1
}

# ------------------------------------------------------------------------------ EXTRACT

mkdir -p "$destinationBuildDir"
echo "Extracting $tarFile..."
output=$(tar -xzf "$tarFile" -C "$destinationBuildDir" 2>&1)
if [ $? -ne 0 ]; then
  fatalError "build" "Failed to extract $tarFile" "$output"
fi

# ------------------------------------------------------------------------------ PATCH BUILD OWNING

# Patch destination directory
chown -R "$username:$group" "$destinationBuildDir" > /dev/null 2>&1

# ------------------------------------------------------------------------------ DOCKER COMPOSE INIT

echo "Searching for docker compose file..."
originalComposeFile="$destinationBuildDir/docker-compose.yaml"
dockerComposeFile="$destinationBuildDir/docker-compose.pasta.yaml"
if [ ! -f "$dockerComposeFile" ]; then
  if [ ! -f "$originalComposeFile" ]; then
    fatalError "docker compose" "No docker-compose.pasta.yaml and no docker-compose.yaml file found in $tarFile"
  fi

  echo "networks:" > $dockerComposeFile
  echo "  pasta:" >> $dockerComposeFile
  echo "    external: true" >> $dockerComposeFile
  echo "" >> $dockerComposeFile
  echo "services:" >> $dockerComposeFile

  insideServiceBlock=false
  currentServiceName=""

  while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]{2}([a-zA-Z0-9_]+): ]]; then
      currentServiceName="${BASH_REMATCH[1]}"
      if [[ $currentServiceName != "proxy" ]]; then
        insideServiceBlock=true
        trimmedServiceName=$(echo "$currentServiceName" | sed 's/^[[:space:]]*//;s/:[[:space:]]*$//')
        {
          echo "$line"
          echo "    extends:"
          echo "      file: docker-compose.yaml"
          echo "      service: $trimmedServiceName"
          echo "    restart: always"
	  echo "    user: \"$userID:$groupID\""
          echo "    networks:"
          echo "      - pasta"
          echo "    environment:"
          # Force VIRTUAL_HOST and LETSENCRYPT_HOST to use dot env
          echo "      VIRTUAL_HOST: \"\$VIRTUAL_HOST\""
          echo "      LETSENCRYPT_HOST: \"\$LETSENCRYPT_HOST\""
        } >> $dockerComposeFile
      else
        insideServiceBlock=false
      fi
    fi
  done < "$originalComposeFile"
  echo "> Using automatic docker-compose.pasta.yaml"
else
  echo "> Using docker-compose.pasta.yaml from artifact"
fi

# ------------------------------------------------------------------------------ DOT ENV INIT

echo "Init env..."
# Move .env.$branch to .env if it exists
dotEnv="$destinationBuildDir/.env"
dotEnvBranch="$destinationBuildDir/.env.$branch"
if [ -f "$dotEnvBranch" ]; then
  mv -f "$dotEnvBranch" "$dotEnv" > /dev/null 2>&1
  echo "> Using .env.$branch"
else
  echo "> Using .env"
fi

# Init dot env pasta part
echo "" >> "$dotEnv"
echo "# --- PASTA" >> "$dotEnv"

# ------------------------------------------------------------------------------ COMPUTE DOMAIN

# If we have a domain to set
if [ -n "$domain" ]; then
  # If it's a dot, it's the main pasta domain
  if [[ "$domain" == "." ]]; then
    if [ -n "$subBranch" ]; then
      fatalError "domain" "Sub-branches are not compatible with root domain deployments."
    fi
    domain="$PASTA_DOMAIN"
  # No dot, it's a sub-domain of the main pasta domain
  elif [[ "$domain" != *"."* ]]; then
    if [ -n "$subBranch" ]; then
      domain="${domain}--${subBranch}.$PASTA_DOMAIN"
    else
      domain="$domain.$PASTA_DOMAIN"
    fi
  fi
  # If it has a dot, it's a full-domain ( can be external to main pasta domain )

# No domain to set, but no domain in dot env, use auto mode
else
  domain="$projectName-$fullBranch.$PASTA_DOMAIN"
fi

# Save domain
echo "> Domain is $domain"
echo "$domain" > "$destinationBuildDir/domain.txt"

# ------------------------------------------------------------------------------ COMPUTE ALIAS

# Add alias service if alias is detected
if [ -n "$alias" ]; then
  echo "Building alias redirections..."
  # Aliases are comma separated
  parsedAliases=()
  IFS=',' read -ra aliases <<< "$alias"
  for a in "${aliases[@]}"; do
    # If it's a dot, it's the main pasta domain
    if [[ "$a" == "." ]]; then
      a="$PASTA_DOMAIN"
    # No dot, it's a sub-domain of the main pasta domain
    elif [[ "$a" != *"."* ]]; then
      a="$a.$PASTA_DOMAIN"
    fi
    # Else if it has a dot, it's a full-domain ( can be external to main pasta domain )
    # Check if this alias is already present
    if [[ " ${parsedAliases[*]} " =~ " $a " ]]; then
      fatalError "aliases" "Alias '$a' already present in list '$alias'"
    fi
    parsedAliases+=( "$a" )
    echo "- $a"
  done
  allAliasesStr=$(IFS=','; echo "${parsedAliases[*]}")
  pasta_alias="
  pasta_alias:
    image: morbz/docker-web-redirect
    restart: unless-stopped
    environment:
      VIRTUAL_HOST: $allAliasesStr
      LETSENCRYPT_HOST: $allAliasesStr
      REDIRECT_TARGET: $domain
      # 302 redirects
      REDIRECT_TYPE: redirect
    networks:
      - pasta
"
  # Split docker compose around "services" declaration
  before=$(sed '/^services\s*:/q' "$dockerComposeFile")
  after=$(sed -n '/^services\s*:/,$p' "$dockerComposeFile" | tail -n +2)
  # Recreate the docker compose file with injected alias
  echo "$before" > "$dockerComposeFile"
  echo "$pasta_alias" >> "$dockerComposeFile"
  echo "$after" >> "$dockerComposeFile"
fi

# ------------------------------------------------------------------------------ INJECT DOT ENV

# Set the docker compose project name from the unique build number
# With this, "docker compose" commands can be ran from the branch link and the build directory
composeProjectName="${projectName}_${branch}_${buildNumber}"
sed -i '/^COMPOSE_PROJECT_NAME=/d' "$dotEnv"
echo "COMPOSE_PROJECT_NAME=$composeProjectName" >> "$dotEnv"

# Force pasta project name
sed -i '/^PASTA_PROJECT_NAME=/d' "$dotEnv"
echo "PASTA_PROJECT_NAME=$projectName" >> "$dotEnv"

# Inject build number
sed -i '/^PASTA_BUILD=/d' "$dotEnv"
echo "PASTA_BUILD=$buildNumber" >> "$dotEnv"

# Remove pasta data from dot env and force it
sed -i '/^PASTA_DATA=/d' "$dotEnv"
echo "PASTA_DATA=../../data/$dataBucketName" >> "$dotEnv"

# Inject branch
sed -i '/^PASTA_BRANCH=/d' "$dotEnv"
echo "PASTA_BRANCH=$branch" >> "$dotEnv"
sed -i '/^PASTA_SUB_BRANCH=/d' "$dotEnv"
echo "PASTA_SUB_BRANCH=$subBranch" >> "$dotEnv"

# Remove hostname
sed -i '/^PASTA_HOSTNAME=/d' "$dotEnv"

# Save virtual host and https host
sed -i '/^VIRTUAL_HOST=/d' "$dotEnv"
echo "VIRTUAL_HOST=$domain" >> "$dotEnv"
sed -i '/^LETSENCRYPT_HOST=/d' "$dotEnv"
echo "LETSENCRYPT_HOST=$domain" >> "$dotEnv"

# Force https redirect
sed -i '/^HTTPS_METHOD=/d' "$dotEnv"
echo "HTTPS_METHOD=redirect" >> "$dotEnv"

# ------------------------------------------------------------------------------ PATCH DATA OWNING

# Preparing data directories
echo "Checking docker compose file validity..."
dockerComposeConfig=$(cd "$destinationBuildDir" && docker compose -f "$dockerComposeFile" config )
if [ $? -ne 0 ]; then
  fatalError "docker compose" "Failed to get docker compose config. Check docker-compose.pasta.yaml file."
fi

# Read all mapped volumes of all services
echo "Extracting data directories..."
dataVolumes=$(echo "$dockerComposeConfig" | grep "source:" | awk -F"source: " '{print $2}' | tr -d ' ')

# Browse all mapped volumes and check if any tries to get out of the sandbox.
# - /home/$user/data/*
# - /home/$user/branches/*
# - /home/$user/builds/*
# Anything else will be banned for security reasons
for volume in $dataVolumes; do
  if [[ "$volume" != "$userDir/data"* && "$volume" != "$userDir/branches"* && "$volume" != "$userDir/builds"* ]]; then
    fatalError "docker compose" "Volume $volume is outside of sandbox ( mapping a directory outside $userDir is forbidden )"
  fi
  if [[ "$volume" =~ ^[a-zA-Z0-9._:-]+$ ]]; then
    fatalError "docker compose" "Volume $volume is outside of sandbox ( docker volumes are forbidden )"
  fi
done

# Create directories for each valid volume mapping to $userDir/data or children
echo "Patching data directories..."
for volume in $dataVolumes; do
  if [[ "$volume" == "$userDir/data"* ]]; then
    echo "- $volume"
    mkdir -p "$volume"
    #chown -R "$username:$username" "$volume"
    chown "$username:$username" "$volume"
    chmod 0700 "$volume"
  fi
done

# ------------------------------------------------------------------------------ CHECK DOMAIN AVAILABILITY

# TODO : Grab all used domains from all containers
# TODO : Exclude current project with current branch
# TODO : Check for $domain and $alias, should fail if any is already reserved
# TODO : see grab-reserved-hostnames.sh
# TODO : Maybe also remove VIRTUAL_HOST and LETSENCRYPT_HOST from docker-compose.yaml for better security ?
# TODO : Or check from docker compose config !

# ------------------------------------------------------------------------------ PASSWORD & PROXY CONFIG

# Check if we had a domain in previous build
oldDomainFile="$destinationBranchLink/domain.txt"
if [ -f "$oldDomainFile" ]; then
  oldDomain=$(cat "$oldDomainFile")
  # Remove old password
  proxy-password "$oldDomain"
  # Remove old config
  rm -f "/etc/nginx/vhost.d/$oldDomain" > /dev/null 2>&1
fi

# Setting password
if [ -n "$password" ]; then
  proxy-password "$domain" "$password"
fi

# Setting nginx config
proxyConfigSource="$destinationBuildDir/.proxy/nginx.conf"
proxyConfigDestination="/etc/nginx/vhost.d/$domain"
if [ -f "$proxyConfigSource" ]; then
  echo "Setting nginx config..."
  mv -f "$proxyConfigSource" "$proxyConfigDestination" > /dev/null 2>&1
  rm -rf "$destinationBuildDir/.proxy"
fi

# ------------------------------------------------------------------------------ RELOAD NGINX

# Reload proxy config
echo "Reloading proxy config..."
docker exec proxy-nginx nginx -s reload > /dev/null 2>&1

# ------------------------------------------------------------------------------ STARTING NEW BUILD

echo "Building containers..."
buildOutput=$(cd "$destinationBuildDir" && docker compose -f "$dockerComposeFile" build 2>&1)
if [ $? -ne 0 ]; then
  fatalError "docker compose" "Unable to build docker stack" "$buildOutput"
fi
echo "Starting containers..."
startOutput=$(cd "$destinationBuildDir" && docker compose -f "$dockerComposeFile" up -d 2>&1)
if [ $? -ne 0 ]; then
  fatalError "docker compose" "Unable to start docker stack" "$startOutput"
fi

# ------------------------------------------------------------------------------ STOPPING PREVIOUS BUILD

sleep 1
echo "Stopping and removing old containers..."
if [ -d "$destinationBranchLink" ]; then
  oldBranchDir=$(readlink -f "$destinationBranchLink")
  oldDockerComposeFile="$oldBranchDir/docker-compose.pasta.yaml"
  (cd "$oldBranchDir" && docker compose -f "$oldDockerComposeFile" down --volumes --remove-orphans) > /dev/null 2>&1
  rm -rf "$oldBranchDir"
fi

# ------------------------------------------------------------------------------ BRANCH LINK TO BUILD

echo "Linking new build directory..."
ln -sf "$destinationBuildDir" "$destinationBranchLink"
rm -f "$tarFile"

# ------------------------------------------------------------------------------ END

echo ""
echo "> Branch $fullBranch of $projectName deployed successfully"
echo "> https://$domain"
if [ -n "$password" ]; then
  login="${password%%:*}"
  pass="${password#*:}"
  stars=$(printf '%*s' "${#pass}" '' | tr ' ' '*')
  echo "> Credentials are $login:$stars"
fi