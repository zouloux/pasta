
## About

**Pasta** is a minimalist set of scripts and conventions to self-host **Docker Applications** and **Git Projects** on **Debian based VPS servers**.
In other words it's an headless **Open-source alternative to CloudFlare, Netlify, Vercel or Heroku**. It can live on $1 / month VPS for simple projects hosting.

- **[One line server install script](00.server/00.install/02.install-pasta-server)**
- Has **sud-domains routing** and **automatic SSL generation** thanks to [Nginx proxy](https://github.com/nginx-proxy/nginx-proxy) and [acme-companion](https://github.com/nginx-proxy/acme-companion).
- Comes with a client **[node package](https://www.npmjs.com/package/@zouloux/pasta-cli)** for **Git Projects** deployments and **servers managements**.
- Headless by default and **SSH based** for admin


## Features

**Pasta Server** comes with :
- A set of [scripts](00.server/01.server-scripts/00.available-scripts) an tools ( `lazydocker` / `htop` / `l` / `ll` )
- A nice preconfigured [.bashrc](https://github.com/zouloux/pasta/blob/main/server/.bashrc) file

With those script and conventions, you will be able to :
- Host [Docker Applications](00.server/02.applications/00.list)
- Host your projects in **staging phase** ( with an HTTP password for example )
- Host your projects in **production phase** with **zero-downtime**
- Host Git repositories and their CI ( with [Gitea](00.server/02.applications/05.gitea) or Gitlab )

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
