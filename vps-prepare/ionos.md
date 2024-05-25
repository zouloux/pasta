# Prepare a Ionos VPS

First, buy your VPS server on [Ionos](https://www.ionos.fr/serveurs/vps)

## Configure network

You should now be able to connect to your VPS admin panel
1. Create IPV6 address
2. Setup reverse DNS on ip addresses ( set as final root domain )
3. Open a new port for SSH on the firewall ( greater than 2000 and not used by other services )

Now, go to your DNS provider, and add those 4
- `A $ipv4 @` ( root domain for ipv4, sometimes the `@` is a dot )
- `A $ipv4 *` ( all subdomain for ipv4 )
- `AAAA $ipv6 @` ( root domain for ipv6, sometimes the `@` is a dot )
- `AAAA $ipv6 *` ( all subdomain for ipv6 )

## Configure SSH

#### Install public SSH
Copy your ssh public key on your computer, and paste it on the VPS at `~/.ssh/authorized_keys`

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
Delete the default Ionos password
```bash
rm /etc/ssh/sshd_config.d/50-cloud-init.conf
```
Restart SSH and exit
```bash
sudo systemctl restart ssh
exit
```

## Test security

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

## Stuck outside ?

You can open the terminal console with the password on the Ionos admin panel. Be careful, password typing is qwerty.
You can also re-configure the Debian 12 setup from the Ionos admin panel.

## Setup Halloumi

Your VPS is now Ready 🎉
Go back to [README.md](../README.md) and follow instructions to setup Halloumi.

