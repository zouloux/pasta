# TODO

## Documentation

- Create a nice doc website
- Post on twitter / linkedin

## Improve security
- Should use sudoers file and remove project user from docker group
- Data should not be 777
- Nginx password should not be 777
- Can we skip acl ? ( usage and package )

## General
- Script to check resources on VPS + send emails ( which platform to use ? )

## project-deply
- Allow `.proxy/nginx.conf` to be moved automatically to `/etc/nginx/vhost.d/$domain` on deploy.
  - Should be 777 while having a better solution
- Allow `alias` key in `pasta.yaml` to redirect using https://hub.docker.com/r/morbz/docker-web-redirect 

## pasta sync
- Add a way to create data filters for sync ( like cms or ugc )

## pasta init
- github ci example
- gitlab ci example

- add `.proxy/certs` to .gitignore if not already 
- add `.env` to .gitignore if not already
- add `pasta.key` if not already


## pasta server command
- `pasta server add <endpoint?>`
- `pasta server remove <hostname?>`
- `pasta server stats <hostname?>`
- `pasta server stats all` ( should gracefully fail if any cannot connect )
- `pasta server connect <hostname?>`

- `pasta server init` should have selection to registered pasta server