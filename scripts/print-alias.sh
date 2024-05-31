#!/bin/bash

currentUser=$(whoami)
sshPort=$(grep -E "^Port" /etc/ssh/sshd_config | awk '{print $2}' || echo "22")

echo "alias connect-$HALLOUMI_HOSTNAME=\"ssh -p $sshPort $currentUser@$HALLOUMI_DOMAIN\""