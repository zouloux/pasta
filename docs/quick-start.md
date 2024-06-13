# Quick start

No time? **No problem**. Let's do it **Al dente** !

?> Follow those instructions to deploy a test project in **10 steps**.

1. Buy a cheap VPS and a domain name
2. Points DNS `your-domain.com` and `*.your-domain.com` to VPS IP address
3. Configure SSH on your VPS
```bash
bash <(wget -qO- https://raw.githubusercontent.com/zouloux/pasta/main/prepare.sh)
```
4. Install **Pasta Server** on your VPS
```bash
bash <(wget -qO- https://raw.githubusercontent.com/zouloux/pasta/main/install.sh)
```
5. Create your first project on the server
```bash
project-create pasta-test
```
> Copy the private key somewhere
6. Create a new directory on your computer
7. Install `Pasta-CLI` globally on your computer
```bash
npm i -g pasta-cli
```
8. Create a new pasta project
```bash
pasta init
```
> And follow instructions
9. Paste the private key in `.pasta.key`
10. Deploy
```bash
pasta deploy preview
```
> Visit `pasta-test.your-domain.com`

