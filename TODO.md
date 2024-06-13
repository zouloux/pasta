# TODO

## Gitea
- Use back original runner !

## Documentation !!!



## `project-deploy`
- Lock some domains :
  - Lock master domain `.` for other projects
  - Lock domains used by other projects ( project-a cannot override project-b domain )
  - Lock application domains

## Server
- Script to check resources on VPS ( ram / disk ) + send emails ( which platform to use ? )

## `pasta sync`
- Add a way to create data filters for sync ( like cms or ugc )

## Improve security
- Should use sudoers file and remove project user from docker group
- Data should not be 777
- Nginx password should not be 777
- Can we skip acl ? ( usage and package )

## Proxy
- Progressive weight zero-downtime load balancing ?