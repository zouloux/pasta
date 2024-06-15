# TODO

## Gitea
- Use back original runner !

## Documentation !!!

## New security

To do
- Allow on users: 
  - project-clean
  - project-remove-branch
  - update doc

- Install script / update script :
  - Check after-install
  - Remove add group docker
  - Create sudoer file on install
  - Create group pasta on install
  - Remove chmod 777 on install for /etc/nginx

- reinstall on servers

- specific bashrc for users ?

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