# NocoDB app on Halloumi server

[NocoDB](https://nocodb.com/) is an open-source and self-hosted alternative to AirTable.
It's a no-code tool to manage sqlite databases in real time with multiple users.

## How to install

- Copy [docker-compose.yaml](./docker-compose.yaml) content on the VPS at `~/containers/apps/noco/`
- Create `.env` and set all those :
```dotenv
NC_ADMIN_EMAIL=
NC_SMTP_FROM=
NC_SMTP_HOST=
NC_SMTP_PORT=
NC_SMTP_USERNAME=
NC_SMTP_PASSWORD=
NC_SMTP_SECURE=
```

> The dot env file can be empty omitted and everything can be configured at first connexion. No recommended.

> Also, [Other envs are available](https://docs.nocodb.com/getting-started/self-hosted/environment-variables)

#### Start
```bash
docker compose up -d
```


## How to upgrade

Available versions and upgrade instructions are [available here](https://github.com/nocodb/nocodb/releases). 

- `cd ~/containers/apps/noco` and `docker compose down`
- Not mandatory, but you can safely copy the `data/` directory. Be careful, it can be huge ! `cp -r ./data ./data.old`
- `docker images | grep "nocodb/nocodb"` and get the image id
- Remove the old image with `docker image rm {imageID}`
- Restart the container with the new image `docker compose up -d`