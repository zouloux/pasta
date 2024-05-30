# Halloumi

## About

**Halloumi** is a set of scripts and conventions to host docker applications on **Debian 12 VPS servers**.

It manages automatically sud-domains routing and SSL generation thanks to [Nginx proxy](https://github.com/nginx-proxy/nginx-proxy)

**The setup will install :**
- docker
- git
- zsh
- logrotate ( to minimize log file size )
- apache2-utils ( for password management )
- rsync ( for host <-> remote file transfer )

> All other dependencies will be managed through docker applications

#### Aliases helpers

Some commands you can run when connect with SSH

- `lazydocker` - Open [Lazydocker](https://github.com/jesseduffield/lazydocker) ( in docker, no install )
- `quick-download $file` - download a file from the current working directory through iterm2
- `rsync-download $file` - create a rsync command to run on your host to download a remote file
- `rsync-upload $file` - create a rsync command to run on your host to upload a local file

#### Features

With those script and conventions, you will be able to :
- Host your projects git repositories
- Host some self-hosted applications
- Check locally like on staging
- Deploy with CI on staging to present the current state of any project to your customer
- Deploy with CI to production

**But also :**
- Sync files between servers ( for ex : from staging to local, from local to production )
- Create secured user spaces for any project to work with other developers

## Typologies of servers and runtimes

#### Halloumi Master server

Master servers will hosts some applications like :
- Gitea ( Self-hosted Github-like to manage your projects and git repositories )
- Umami ( Self-hosted analytics )

It will also host all staging versions from Gitea, deployed through CI.

> You can setup one master server, but it's not mandatory. You can also use Github or something else to host your git repositories and CI, and use Halloumi only on production servers.

#### Halloumi Production server

Those servers will serve real world applications.
It should be own and paid by your customer.

> If you do not want to setup a master server, the staging can be hosted on the production server directly. 

#### Dev environment

This is not an Halloumi server, but some conventions are needed to run your docker application locally.

**TODO DEV DOC**


## Structure

[Check file structure](./doc/structure.md)

## Create a new Halloumi Server Instance

#### Install
Buy your VPS and [prepare it](./doc/prepare-vps.md) install Halloumi.

#### Update
[Update Halloumi](./doc/update.md)

#### Install apps

**Halloumi** comes with some open-source self-hosted applications :
- [Gitea](./containers/apps/gitea) - Github / Gitlab alternative
- [Noco](./containers/apps/noco) - AirTable alternative
- [Outline](./containers/apps/outline) - Notion alternative
- [Umami](./containers/apps/outline) - Googla Analytics alternative

> By default no application is installed.

But also, some no monitoring elements ( not documented ) :
- [Portainer Admin](./containers/apps/portainer-admin) - Manage running containers
- [Portainer Agent](./containers/apps/portainer-agent) - Agent to control other Halloumi Server
- [Net-data](./containers/apps/netdata) - Host linux system monitoring

> Follow Readme files to install those application on a **Master** or **Production** **Halloumi server**.

## How it works

**TODO HOW IT WORKS DOC**