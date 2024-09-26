#!/bin/bash

echo "Configuring docker logs..."
configFilePath="/etc/docker/daemon.json"
if [ ! -f "$configFilePath" ]; then
  cat > $configFilePath <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "64m",
    "max-file": "1"
  }
}
EOF
  echo "Restarting docker..."
  systemctl restart docker
#else
#  echo "- Config file already exists. Delete $configFilePath and re-run this script to allow Pasta creating this file."
fi