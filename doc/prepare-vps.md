# Prepare a VPS for Halloumi

## Buy your VPS

First, buy your VPS server
- [Ionos](https://www.ionos.fr/serveurs/vps)
- Hostinger
- ~~OVH~~

## Operating System

**Halloumi is tested on Debian 12 only.**

## Select the correct amount of resources

#### For master servers ( with gitea and project previews )
- At least 2gb or 4gb will be required
- At least 120gb of SSD storage
- 2 or 4 cpus.

#### For single or other composed project
It can go from 1cpu + 1gb + 10gb, but select carefully depending on the installed applications. 


## Configure network

#### VPS admin panel

You should now be able to connect to your VPS admin panel
1. Create IPV6 address ( needed on Ionos )
2. Setup reverse DNS on ip addresses ( set as root domain )
3. Open a new port for SSH on the firewall ( greater than 2000 and not used by other services )


#### DNS admin panel

Go to your registar admin panel, and add those 4 lines to the DNS registry :

**Root domain :**
- `A {ipv4} @`
- `AAAA {ipv6} @`

**All 1st level sub-domains :**
- `A {ipv4} *`
- `AAAA {ipv6} *`

> On some DNS providers, the `@` is simply a `.`

## Configure SSH

#### Install public SSH
Copy your ssh public key from your computer, and paste it on the VPS at `~/.ssh/authorized_keys`

#### Change SSH port

On your VPS
```bash
sudo vi /etc/ssh/sshd_config
```

Change port to the port you selected before
```
Port {newPort}
PasswordAuthentication no
ChallengeResponseAuthentication no
```

Delete the default password ( Ionos only )
```bash
rm /etc/ssh/sshd_config.d/50-cloud-init.conf
```

Restart SSH and exit
```bash
sudo systemctl restart ssh
exit
```

#### Test security

Check if old port is disabled ( should fail ) :
```bash
ssh root@{domain}
```

Check if password disabled ( should fail ) :
```bash
ssh -p {newPort} -o PreferredAuthentications=password root@{domain}
```

Reconnect through the new port ( should work ) :
```bash
ssh -p {newPort} root@{domain}
```

#### Stuck outside ?

You can open the terminal console with the password on the Ionos admin panel. Be careful, password typing is qwerty.
You can also re-configure the Debian 12 setup from the Ionos admin panel.

## Setup Halloumi

Your VPS is now Ready 🎉

Login with SSH to your freshly booted VPS.
Start the setup script on your VPS with this command and follow instructions.

```bash
wget -qO halloumi-setup.sh https://raw.githubusercontent.com/zouloux/halloumi/main/setup.sh
bash halloumi-setup.sh
rm halloumi-setup.sh
```