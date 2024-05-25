# Update Halloumi

On your VPS instance :
```bash
cd /root/scripts
./halloumi-update.sh
```

**This will :**
- stop the nginx proxy
- update all files in `~/scripts`
- update the proxy's `docker-compose.yaml` file and keep an old version as `.old`
- start the nginx proxy

> If you changed the proxy's `docker-compose.yaml`, you will have to manually merge the modifications with the updated file.