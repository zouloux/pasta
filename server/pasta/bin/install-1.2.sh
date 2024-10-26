#!/bin/bash

echo "[1.2] Configuring sudoers for deployment..."
rm -rf /etc/sudoers.d/pasta-deploy > /dev/null 2>&1
echo "%pasta ALL=(ALL) NOPASSWD: /usr/local/pasta/bin/project-deploy" >> /etc/sudoers.d/pasta-deploy
echo "%pasta ALL=(ALL) NOPASSWD: /usr/local/pasta/bin/project-deploy-2" >> /etc/sudoers.d/pasta-deploy
