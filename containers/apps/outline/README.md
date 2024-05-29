# Outline app on Halloumi server

[Outline](https://www.getoutline.com/) is an open-source and self-hosted alternative to Notion.

## How to install

- Copy [docker-compose.yaml](./docker-compose.yaml) content on the VPS at `~/containers/apps/outline/` 
- Create `.env.postgres` and set `user` / `password` from random `[a-zA-Z0-9\-\_]` strings
```dotenv
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=outline
```
- Create `.env.core` from `https://github.com/outline/outline/blob/main/.env.sample`
- Change `DATABASE_URL` / `URL` / `PORT=80` / `SMTP` ...
- Create slack app for login and set `.env.core`

#### Start
```bash
docker compose up -d
```

## How to upgrade

Available versions and upgrade instructions are [available here](https://docs.getoutline.com/s/hosting/doc/docker-7pfeLP5a8t). 

- `cd ~/containers/apps/outline` and `docker compose down`
- Not mandatory, but you can safely copy the `data/` directory with `cp -R data data.old`
- `docker images | grep "docker.getoutline.com/outlinewiki/outline"` and get the image id
- Remove the old image with `docker image rm {imageID}`
- Restart the container with the new image `docker compose up -d`