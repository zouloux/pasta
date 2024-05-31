# Uptime Kuma app on Halloumi Sercer

[Uptime Kuma](https://github.com/louislam/uptime-kuma) is an open-source self-hosted alternative to Uptime Robot.
Keep track of running containers, http endpoints and be notified via Slack or Email if anything goes wrong.

## How to install

- Copy [docker-compose.yaml](./docker-compose.yaml) content on the VPS at `~/containers/apps/kuma/`

#### Start
```bash
docker compose up -d
```

#### Setup

Connect to `kuma.$HALLOU_DOMAIN` and follow instructions.
We advise SMTP or Slack notifications.


## How to upgrade

- `cd ~/containers/apps/kuma` and `docker compose down`
- Not mandatory, but you can safely copy the `data/` directory.
- - `docker images | grep "louislam/uptime-kuma"` and get the image id
- Remove the old image with `docker image rm {imageID}`
- Restart the container with the new image `docker compose up -d`