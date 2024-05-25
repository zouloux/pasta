#!/bin/bash

proxyDir="/root/containers/services/proxy"

# Ask for confirmation
read -p "This will update all scripts and stop the proxy. Are you sure to continue? (y) " confirmation
if [ "$confirmation" != "y" ]; then
  echo "Update aborted."
  exit 1
fi

# Stop proxy
cd $proxyDir
docker compose stop

# Clone repo into /tmp
cd /root
git clone https://github.com/zouloux/halloumi.git /tmp/halloumi

# Copy the proxy config and scripts
cd $proxyDir/
cp docker-compose.yaml docker-compose.yaml.old
cp /tmp/halloumi/containers/services/proxy/docker-compose.yaml $proxyDir/
cp -r /tmp/halloumi/scripts/* /root/scripts/
rm -rf /tmp/halloumi

# Start the proxy
cd $proxyDir
docker compose up -d

echo "All done"
