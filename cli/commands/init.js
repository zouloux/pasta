import { Directory, File } from "@zouloux/files"
import { fileURLToPath } from 'url';
import { askInput, askList, execSync, newLine, nicePrint, clearScreen } from "@zouloux/cli";
import { untab } from "@zouloux/ecma-core";
import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { generateSSLCommand } from "./generate-ssl.js";
import { openCommand } from "./open.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initCommand () {
	clearScreen()
	const projectName = await askInput("Project name", { defaultValue: "project-name" })
	const hostDomain = await askInput("Host domain", { defaultValue: "" })
	const hostPort = await askInput("Host SSH port", { defaultValue: 22 })

	const createCI = await askList("Create CI file", {
		no: "No",
		gitea: "Gitea / Github",
		// github: "Github", // TODO the same as Gitea ?
		gitlab: "Gitlab ( coming soon )", // TODO
	}, { returnType: "key" })

	const localHostname = execSync('hostname').trim()

	const proxyDir = await Directory.create(".proxy")
	await proxyDir.create()
	const dataDir = await Directory.create("data")
	await dataDir.create()
	const distDir = await Directory.create("dist")
	await distDir.create()

	const pastaConfigFile = await File.create("pasta.yaml")
	pastaConfigFile.content(untab(`
		branches:
		  _defaults:
		    host: ${hostDomain}
		    port: ${hostPort}
		    project: ${projectName}
		    files:
		      - docker-compose.common.yaml
		      - docker-compose.pasta.yaml
		      - .env
		      - dist/

		  preview:
		    domain: ${projectName}-preview
		    data: preview

		  main:
		    domain: ${projectName}
		    data: main
	`))
	await pastaConfigFile.save()

	const dotEnv = await File.create(".env")
	dotEnv.content(untab(`
		# --- Pasta config
		PASTA_PROJECT_NAME=${projectName}
		PASTA_HOSTNAME=${localHostname}
		PASTA_DATA=./data/
		PASTA_BUILD=0
		PASTA_BRANCH=dev
		# --- 
	`))
	dotEnv.save()

	const nginxConfFile = await File.create(".proxy/nginx.conf")
	nginxConfFile.content(untab(`
		# Enable big uploads
		client_max_body_size 128m;
	`))
	nginxConfFile.save()

	const dockerComposeCommonFile = await File.create("docker-compose.common.yaml")
	dockerComposeCommonFile.content(untab(`
		services:
		  proxy:
		    image: "nginxproxy/nginx-proxy"
		    environment:
		      TRUST_DOWNSTREAM_PROXY: false
		      HTTPS_METHOD: "noredirect"
		      DISABLE_ACCESS_LOGS: true
		      DEFAULT_HOST: "localhost"
		    restart: "no"
		    ports:
		      - "80:80"
		      - "443:443"
		    volumes:
		      - "/var/run/docker.sock:/tmp/docker.sock:ro"
		      - "./.proxy/certs:/etc/nginx/certs"
		      - "./.proxy/nginx.conf:/etc/nginx/conf.d/proxy.conf:ro"
		    logging:
		      driver: "none"
		  front:
		    image: "oven/bun:alpine"
		    working_dir: "/app"
		    command: "bun --watch bun-example.js"
		    env_file: ".env"
		    volumes:
		      - "./dist:/app"
		      - "\${PASTA_DATA}/front:/root/data"
		    environment:
		      VIRTUAL_PORT: 3000
    `))
	dockerComposeCommonFile.save()

	const dockerComposePastaFile = await File.create("docker-compose.pasta.yaml")
	dockerComposePastaFile.content(untab(`
		networks:
		  pasta:
		    external: true
		services:
		  front:
		    extends:
		      file: "docker-compose.common.yaml"
		      service: front
		    restart: "unless-stopped"
		    environment:
		      LETSENCRYPT_HOST: "\${VIRTUAL_HOST}"
		    networks:
		      - pasta
	`))
	dockerComposePastaFile.save()

	const dockerComposeFile = await File.create("docker-compose.yaml")
	dockerComposeFile.content(untab(`
		services:
		  proxy:
		    extends:
		      file: "docker-compose.common.yaml"
		      service: proxy
		  front:
		    extends:
		      file: "docker-compose.common.yaml"
		      service: front
		    restart: "no"
		    environment:
		      VIRTUAL_HOST: "$PASTA_PROJECT_NAME.ssl.localhost,localhost,$PASTA_HOSTNAME.local"
	`))
	dockerComposeFile.save()

	if ( createCI === "gitea" ) {
		const giteaFile = await File.create(".gitea/workflows/ci.yaml")
		await giteaFile.ensureParents()
		giteaFile.content(untab(`
			# https://docs.gitea.com/usage/actions/actions-variables
			name: "Deploy"
			on:
			  push:
			    branches:
			      - preview
			      - main
			jobs:
			  deploy:
			    runs-on: ubuntu-latest
			    container:
			      image: zouloux/docker-debian-ci
			    steps:
			      - name: "Checkout repository"
			        uses: actions/checkout@v4
			      - name: "Register SSH Key"
			        run: |
			          mkdir -p ~/.ssh
			          echo "\${{ secrets.SSH_KEY }}"" > ~/.ssh/id_ed25519
			          chmod 600 ~/.ssh/id_ed25519
			      - name: "Build"
			        run: |
			          echo "Implement build step"
			      - name: "Deploy to server"
			        run: |
			          branch=\${{ github.ref }}
			          mv ".env.$branch" .env
			          pasta deploy $branch
		`))
		await giteaFile.save()
	}

	copyFileSync(
		join(__dirname, "..", "bun-example.js"),
		join(process.cwd(), "dist", "bun-example.js")
	)

	await generateSSLCommand( projectName )
	newLine()

	nicePrint(`{b/g}Pasta project created ✨`)
	newLine()
	openCommand( projectName )
}