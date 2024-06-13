<p align="center">
  <h1>Pasta Devops</h1>
</p>
<br/>

## About

**Pasta** is a minimalist set of scripts and conventions to host **Docker Applications** and **Git Projects** on **Debian based VPS servers**.

It's a **one line install** script and super easy to use.

It manages **sud-domains routing** and **automatic SSL generation** thanks to [Nginx proxy](https://github.com/nginx-proxy/nginx-proxy) and [acme-companion](https://github.com/nginx-proxy/acme-companion).

It's **SSH based** for admin, and comes with a **[node package](https://www.npmjs.com/package/@zouloux/pasta-cli)** for **Git Projects** deployments.

## Documentation

- [Read complete documentation](https://zouloux.github.io/pasta/)
- [Install Pasta Server](https://zouloux.github.io/pasta/#/./00.server/00.install/03.install-pasta-server)
- [Install Pasta-CLI]()
- [Quick start](https://zouloux.github.io/pasta/)

## Installation


## Features

With those script and conventions, you will be able to :
- Host and run [Docker Applications](https://zouloux.github.io/pasta/#/./00.server/02.applications/0.index)
- Host your Projects Git repositories ( with [Gitea](https://zouloux.github.io/pasta/#/./00.server/02.applications/00.gitea) or Gitlab )
- Host and run projects in **staging phase**
- Deploy with **CI** to a **production server**

**But also :**
- Create **secured workspaces** for any project to **work with other developers**
- **Sync** projects files between branches ( for example, `cms.sqlite` and `uploads` directories )
- Deploy specific branches of your git projects with **zero-downtime**

## Elements

- **Pasta Server** - Script and conventions to manage docker on any Debian VPS
- **Pasta Node** - Node package to manage CI


## Pasta Server

#### Dependencies

**The setup will install :**
- **docker**
- **git** - for updates
- **openssl** - for password and key management
- **acl** - for linux user roles management
- **logrotate** - to minimize log file size - preconfigured
- **rsync** - for host <-> remote file transfer
- [htop](https://github.com/htop-dev/htop?tab=readme-ov-file) - to check server resources
- [lazydocker](https://github.com/jesseduffield/lazydocker) - to manage running containers easily

> All other dependencies will be managed through dockerized applications.

#### Bash config

**Pasta Server** comes with a nice [.bashrc](./server/.bashrc) which shows the current user and server to avoid critical mistakes when connected through SSH.

#### Aliases helpers

- `download $file` - Download a file from the current working directory through iterm2
- `rsync-download $file` - Create a rsync command to run on your host to download a remote file
- `rsync-upload $file` - Create a rsync command to run on your host to upload a local file
- `docker-restart` - Restart docker compose project in cwd and follow logs ( ctrl + c to exit logs )
- `docker-clean` - Prune docker system

**But also**
- `htop` - Check process and resources ( clickable interface )
- `lazydocker` - Manage docker containers ( clickable interface )
- `l` / `ll` - Colored shortcut for `ls`

#### Structure

[Check server file structure](./doc/10.server-file-structure.md)


## Install Pasta Server

#### Prepare your VPS

- [Choose your VPS](./doc/00.choose-vps.md)
- [Prepare network](./doc/01.prepare-vps-network.md)
- [Configure SSH](./doc/02.configure-vps-ssh.md)

Your VPS is now Ready 🎉

#### Install Pasta Server

#### Update Pasta server

```bash
bash <(wget -qO- https://raw.githubusercontent.com/zouloux/pasta/main/update.sh)
```

> `wget` is not available ? `apt update && apt install wget`

## Pasta Server Dockerized Applications

#### Install

By default **no application is installed**, here are some open-source self-hosted applications you can install easily. 

**Git Platforms :**
- [Gitea](./containers/apps/gitea) - Github / Gitlab alternative
- [Gitlab](./containers/apps/gitlab) - Self Hosted Gitlab ( prefer Gitea ) 

**Analytics :**
- [Umami](./containers/apps/umami) - Googla Analytics alternative

**Content Management :**
- [Outline](./containers/apps/outline) - Really good Notion alternative
- [Noco](./containers/apps/noco) - Super fast AirTable alternative

But also, some monitoring elements :
- [Uptime Kuma](./containers/apps/kuma) - Uptime Robot alternative
- [Portainer Admin](./containers/apps/portainer-admin) - Not documented - Manage running containers
- [Portainer Agent](./containers/apps/portainer-agent) - Not documented - Agent to control other Pasta Server
- [Net-data](./containers/apps/netdata) - Not documented - Linux system monitoring platform
- [Tianji](./containers/apps/tianji) - Not documented - All in one analytics / monitoring / Uptime

> Feel free to reach if you know any good self-hosted and open-source application