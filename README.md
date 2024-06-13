<p align="center">
  <h1 align="center">Pasta Devops</h1>
</p>
<br/>

## About

**Pasta** is a minimalist set of scripts and conventions to host **Docker Applications** and **Git Projects** on **Debian based VPS servers**.

- **[one line install script](https://zouloux.github.io/pasta/#/00.server/00.install/03.install-pasta-server)**
- Has **sud-domains routing** and **automatic SSL generation** thanks to [Nginx proxy](https://github.com/nginx-proxy/nginx-proxy) and [acme-companion](https://github.com/nginx-proxy/acme-companion).
- Headless by default and **SSH based** for admin
- Comes with a **[node package](https://www.npmjs.com/package/@zouloux/pasta-cli)** for **Git Projects** deployments and **servers managements**.

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

**Pasta Server** comes with :
- a set of [scripts](https://zouloux.github.io/pasta/#/./00.server/01.after-installation/02.available-scripts)
- a nice [.bashrc](./server/.bashrc) which shows the current user and server to avoid critical mistakes when connected through SSH.
- `lazydocker` / `htop` / `l` / `ll`

**Pasta-CLI** node package :
- `pasta init` to create a new project
- `pasta deploy` to deploy to the current project on the server
- `pasta connect` to connect with SSH to the server
- and more

## Documentation

## [Install Pasta Server](https://zouloux.github.io/pasta/#/./00.server/00.install/03.install-pasta-server)
## Install Pasta-CLI
## [Quick start](https://zouloux.github.io/pasta/)
## [Complete documentation](https://zouloux.github.io/pasta/)
