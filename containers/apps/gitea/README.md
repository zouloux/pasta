# Gitea app on Halloumi server

## How to install

- Copy [docker-compose.yaml](./docker-compose.yaml) content on the VPS at `~/containers/apps/gitea/`
- Start with `docker compose up` to check logs
- Go to `https://gitea.$domain`, it should be available after 10 or 15 seconds
- Install it carefully ( disable user registration, setup admin account, setup SMTP for emails )
- Once connected
- Go to `/admin/actions/runners` > Click on **Create new Runner** > Copy the token
- On the VPS `ctrl +x` to stop the containers
- Set the token in the dot env like so
```bash
echo "GITEA_RUNNER_REGISTRATION_TOKEN={TOKEN}" >> .env
```
- Restart with `docker compose up -d`
- Go to `/admin/actions/runners`, you should see your runner registered.

## How to update

Available versions and upgrade instructions are [available here](https://github.com/go-gitea/gitea/releases). 

- `cd ~/containers/apps/gitea` and `docker compose down`
- Not mandatory, but you can safely copy the `data/` directory. Be careful, it can be huge ! `cp -r ./data ./data.old`
- Edit `docker-compose.yaml`
- Set version in `services.gitea-core.image` to the next available minor ( 0.X.0 ) up ( patch can be set to the last or not )
- `docker compose up`
- Check online and check logs if everything is fine ), when finished you can exit with `ctrl + c`
- Repeat until latest version available is reached
