# Umami app on Halloumi server

## How to install

- Copy [docker-compose.yaml](./docker-compose.yaml) content on the VPS at `~/containers/apps/umami/`
- Create `.env` and set `user` / `password` / `secret` from random `[a-zA-Z0-9\-\_]` strings
```dotenv
POSTGRES_USER=
POSTGRES_PASSWORD=
UMAMI_APP_SECRET=
```

#### Start
```bash
docker compose up -d
```

## How to upgrade

Available versions and upgrade instructions are [available here](https://github.com/umami-software/umami/pkgs/container/umami/versions). 

- `cd ~/containers/apps/umami` and `docker compose down`
- Not mandatory, but you can safely copy the `data/` directory. Be careful, it can be huge ! `cp -r ./data ./data.old`
- Edit `docker-compose.yaml`
- Set version in `services.umami-core.image` to the next available minor ( 0.X.0 ) up ( patch can be set to the last or not )
- `docker compose up`
- Check online and check logs if everything is fine ), when finished you can exit with `ctrl + c`
- Repeat until latest version available is reached