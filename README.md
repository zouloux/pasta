<p align="center">
  <img src="./docs/pasta.png" width="100px" title="Pasta Devops" />
</p>
<h1 align="center">Pasta Devops</h1>
<p align="center">
	<img src="https://img.shields.io/badge/Pasta_Server-v1.0-blue?style=flat-square" />
	<img src="https://img.shields.io/badge/Pasta_CLI-v0.9-blue?style=flat-square" />
	<img src="https://img.shields.io/badge/Debian-v12-Green?style=flat-square" />
	<img src="https://img.shields.io/badge/Node-v18-Green?style=flat-square" />
	<img src="https://img.shields.io/badge/Licence-MIT-Blue?style=flat-square" />
</p>
<br/>

## About

**Pasta** is a minimalist set of scripts and conventions to self-host **Docker Applications** and deploy **Web Projects** on **Debian based VPS servers**.

In other words, it's an **Open-source Self-Hosted alternative to CloudFlare, Netlify, Vercel or Heroku**.


## Features

- **[One line server install script](https://zouloux.github.io/pasta/#/00.server/00.install/02.install-pasta-server)**
- Has **sub-domains routing** and **automatic SSL generation** thanks to [Nginx proxy](https://github.com/nginx-proxy/nginx-proxy) and [acme-companion](https://github.com/nginx-proxy/acme-companion).
- Comes with a client **[node package](https://www.npmjs.com/package/@zouloux/pasta-cli)** for **Git Projects** deployments and **servers managements**.
- Headless by default and **SSH based** for admin

**Pasta Server** comes with :
- A set of [scripts](https://zouloux.github.io/pasta/#/00.server/01.server-scripts/00.available-scripts) an tools ( `lazydocker` / `htop` / `l` / `ll` )
- A nice preconfigured [.bashrc](https://github.com/zouloux/pasta/blob/main/server/.bashrc) file

With those script and conventions, you will be able to :
- Host [Docker Applications](https://zouloux.github.io/pasta/#/00.server/02.applications/00.list)
- Host your projects in **staging phase** ( with an HTTP password for example )
- Host your projects in **production phase** with **zero-downtime**
- Host Git repositories and their CI ( with [Gitea](https://zouloux.github.io/pasta/#/./00.server/02.applications/00.gitea) or Gitlab )

**But also :**
- Create **secured workspaces** for any project to **work with other developers** and share data
- **Sync** projects files between branches ( for example, `cms.sqlite` and `uploads` directories )
- Deploy specific branches of your git projects with **zero-downtime**

**Pasta CLI** node package :
- `pasta init` to create a new deployable project
- `pasta deploy` to deploy the current project on the server
- `pasta connect` to connect with SSH to the server
- `pasta sync` to sync data between servers and branches
- `pasta server stats` to get stats of a server ( ram / cpu / disk )
- and more


## Documentation

## 💿 [Install Pasta Server](https://zouloux.github.io/pasta/#/00.server/00.install/02.install-pasta-server)
## 🚀 [Install Pasta CLI](https://zouloux.github.io/pasta/#/01.client/00.install-pasta-cli.md)
## ⚡️ [Quick start](https://zouloux.github.io/pasta/#/quick-start)
## 📺️ [Project Demo](https://zouloux.github.io/pasta/#/demo)
## 📕 [Complete documentation](https://zouloux.github.io/pasta/)

## Update lazydocker for version error

With user root, in ~
```bash
curl -fsSL https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh -o install-lazy-docker.sh > /dev/null 2>&1
bash install-lazy-docker.sh > /dev/null 2>&1
rm install-lazy-docker.sh
mv .local/bin/lazydocker /usr/bin
```
> Check `.local` directory to remove it if empty
