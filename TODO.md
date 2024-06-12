# TODO

## Documentation !!!

## `project-deploy`
- Allow `.proxy/nginx.conf` to be moved automatically to `/etc/nginx/vhost.d/$domain` on deploy.
  - Should be 777 while having a better solution
- Allow `alias` key in `pasta.yaml` to redirect using https://hub.docker.com/r/morbz/docker-web-redirect
- Lock some domains :
  - Lock master domain `.` for other projects
  - Lock domains used by other projects ( project-a cannot override project-b domain )
  - Lock application domains

## Improve security
- Should use sudoers file and remove project user from docker group
- Data should not be 777
- Nginx password should not be 777
- Can we skip acl ? ( usage and package )

## Server
- Script to check resources on VPS ( ram / disk ) + send emails ( which platform to use ? )

## `pasta sync`
- Add a way to create data filters for sync ( like cms or ugc )
