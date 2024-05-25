# Halloumi


## Prepare

1. Login with SSH to your freshly booted VPS.
2. Configure SSH ( add your public key, remove password access )

## Setup

Start the setup script on your VPS with this command 

```bash
wget -qO- https://raw.githubusercontent.com/zouloux/halloumi/main/setup.sh
bash setup.sh
rm setup.sh
```