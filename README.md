# Halloumi

## Prepare your VPS

1. Buy your VPS ( Ionos / Hostinger )
2. [Prepare it](./vps-prepare)

## Setup

First, login with SSH to your freshly booted VPS.
Start the setup script on your VPS with this command and follow instructions.

```bash
wget -qO halloumi-setup.sh https://raw.githubusercontent.com/zouloux/halloumi/main/setup.sh
bash halloumi-setup.sh
rm halloumi-setup.sh
```