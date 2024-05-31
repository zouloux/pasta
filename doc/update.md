# Update Halloumi

**This will :**
- stop the nginx proxy
- update all files in `~/scripts` ( with override )
- update `~/.bashrc` and keep and old version `~/.bashrc.old`
- update the nginx proxy's `docker-compose.yaml` file and keep an old version `docker-compose.yaml.old`
- start the nginx proxy

> If you changed the proxy's `docker-compose.yaml` or your `.bashrc` file, you will have to manually merge the modifications with the updated file.

> If you made any change to scripts located in `~/scripts`, those changes will be overridden

On your VPS instance :
```bash
~/scripts/halloumi-update.sh
```
