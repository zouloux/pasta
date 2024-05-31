# Halloumi 🧀

## TLDR

```shell
bash <(wget -qO- https://raw.githubusercontent.com/zouloux/halloumi/main/setup.sh)
```

## About

**Halloumi** is a minimalist set of scripts and conventions to host docker applications on **Debian VPS servers**.

It manages automatically sud-domains routing and SSL generation thanks to [Nginx proxy](https://github.com/nginx-proxy/nginx-proxy) and [acme-companion](https://github.com/nginx-proxy/acme-companion).

#### Features

With those script and conventions, you will be able to :
- Host and run docker applications
- Host your projects git repositories ( with Gitea )
- Host and run staging project ( projects you are working on )
- Deploy with CI to a production server

**But also :**
- Sync projects dynamic files between servers ( databases, user generated content )
- Create secured user spaces for any project to work with other developers

#### Dependencies

**The setup will install :**
- docker
- git
- logrotate ( to minimize log file size ) - preconfigured
- apache2-utils ( for password management )
- rsync ( for host <-> remote file transfer )
- [htop](https://github.com/htop-dev/htop?tab=readme-ov-file)
- [lazydocker](https://github.com/jesseduffield/lazydocker)

> All other dependencies will be managed through docker applications

#### Bash config

Halloumi comes with a nice [.bashrc](./.bashrc) which shows the current user and server to avoid critical mistakes.

#### Aliases helpers

- `quick-download $file` - Download a file from the current working directory through iterm2
- `rsync-download $file` - Create a rsync command to run on your host to download a remote file
- `rsync-upload $file` - Create a rsync command to run on your host to upload a local file
- `docker-restart` - Restart docker compose project in cwd and follow logs
- `docker-clean` - Prune docker system

**But also**
- `htop` - Check process and resources ( clickable interface )
- `lazydocker` - Manage docker containers ( clickable interface )
- `l` / `ll` - Colored shortcut for `ls`

#### Structure

[Check file structure](./doc/10.file-structure.md)

## Install

#### Create a new Halloumi Server Instance

- [Choose your VPS](./doc/00.choose-vps.md)
- [Prepare network](./doc/01.prepare-vps-network.md)
- [Configure SSH](./doc/02.configure-vps-ssh.md)

Your VPS is now Ready 🎉
Login with SSH to your freshly booted VPS.

#### Install Halloumi

Start the setup script on your VPS with this command and follow instructions.

```bash
bash <(wget -qO- https://raw.githubusercontent.com/zouloux/halloumi/main/setup.sh)
```

> `wget` not available ? `apt update && apt install wget`

#### Install dockerized apps

> By default no application is installed.

**Halloumi** comes with some open-source self-hosted applications :
- [Gitea](./containers/apps/gitea) - Github / Gitlab alternative
- [Umami](./containers/apps/umami) - Googla Analytics alternative
- [Noco](./containers/apps/noco) - AirTable alternative
- [Outline](./containers/apps/outline) - Notion alternative
- [Uptime Kuma](./containers/apps/kuma) - Uptime Robot alternative

But also, some monitoring elements ( not documented ) :
- [Portainer Admin](./containers/apps/portainer-admin) - Manage running containers
- [Portainer Agent](./containers/apps/portainer-agent) - Agent to control other Halloumi Server
- [Net-data](./containers/apps/netdata) - Linux system monitoring platform
- [Tianji](./containers/apps/tianji) - All in one analytics / monitoring / Uptime

#### How to update
- [Update Halloumi](./doc/20.update.md
