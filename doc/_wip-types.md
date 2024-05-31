
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
