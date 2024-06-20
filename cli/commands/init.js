import { Directory, File } from "@zouloux/files"
import { askInput, askList, execSync, newLine, nicePrint, clearScreen } from "@zouloux/cli";
import { untab } from "@zouloux/ecma-core";
import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { generateSSLCommand } from "./generate-ssl.js";
import { openCommand } from "./open.js";
import { pastaConfigFileName, relativeDirname } from "./_common.js";
import { listRegisteredServers, parseServerEndpoint } from "./server.js";

async function askForOtherServer () {
	const serverHost = await askInput("Enter Pasta Server host")
	const serverPort = await askInput("Enter Pasta Server port", { defaultValue: 22 })
	return `root@${serverHost}:${serverPort}`.toLowerCase()
}

export async function initCommand () {
	clearScreen( false )

	const servers = listRegisteredServers()
	const serverNames = Object.keys(servers)
	let pastaServer
	if ( serverNames.length === 0 ) {
		pastaServer = await askForOtherServer()
	}
	else {
		const index = await askList(`Please select which Pasta Server to use`, [
			...serverNames,
			"✚ Another one"
		], { returnType: "index" })
		if ( index >= serverNames.length ) {
			pastaServer = await askForOtherServer()
		}
		else {
			pastaServer = servers[ serverNames[index] ]
		}
	}
	const projectName = await askInput("Project workspace name created on Pasta server", { defaultValue: "project-name" })
	const { host, port } = parseServerEndpoint( pastaServer )

	const createCI = await askList("Do you need CI integration?", {
		no: "No CI - Deploy directly from this machine 🫣",
		gitea: "Gitea CI",
		github: "Github CI",
		gitlab: "Gitlab CI",
	}, { returnType: "key" })

	const localHostname = execSync('hostname').trim()

	const proxyDir = await Directory.create(".proxy")
	await proxyDir.create()
	const dataDir = await Directory.create("data")
	await dataDir.create()
	const distDir = await Directory.create("dist")
	await distDir.create()

	const useCI = createCI === "no" ? "false" : "true"

	const pastaConfigFile = await File.create(pastaConfigFileName)
	pastaConfigFile.content(untab(`
		branches:
		  # Shared between all branches
		  _defaults:
		    # Pasta server config
		    host: ${host}
		    port: ${port}
		    # Project name on pasta server
		    project: ${projectName}
		    # Key to use for deploy and sync
		    key: .pasta.key
		    # Use root user and not project user
		    #user: root
		    # Files to transfer in the artefact
		    files:
		      - docker-compose.common.yaml
		      - docker-compose.pasta.yaml
		      - .proxy/nginx.conf
		      - .env
		      - dist/
		  preview:
		    # Domain to deploy to. You can use full domain, or a sub-domain
		    domain: ${projectName}-preview
		    # Add an HTTP login / password to protected this branch
		    password: "login:pass"
		    # Allow any branch matching preview/* to be deployed with those settings.
		    # Domain will be ${projectName}-preview__$subBranch
		    allowSubBranches: true
		    # By default, data goes to branch directory, but it can be shared with other branches
		    # data: main
		    # Allow pull and push sync for preview branch
		    sync: "both"
		    # Can only push from CI
		    noDirectDeploy: ${useCI}
		  # Production branch
		  main:
		    # Production domain. Set "." to use the root $PASTA_DOMAIN
		    domain: ${projectName}
		    data: main
		    sync: "pull"
		    # List of aliases to redirect to this container
		    #alias:
		    #  - www
		    noDirectDeploy: ${useCI}
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
		    attach: false
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
	await dockerComposeCommonFile.save()

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
		    env_file: ".env"
		    networks:
		      - pasta
	`))
	await dockerComposePastaFile.save()

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
	await dockerComposeFile.save()

	if ( createCI === "gitea" || createCI === "github" ) {
		const giteaFile = await File.create(`.${createCI}/workflows/ci.yaml`)
		await giteaFile.ensureParents()
		giteaFile.content(untab(`
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
			      - name: "Install Pasta CLI"
			        run: |
			          npm i -g @zouloux/pasta-cli
			      - name: "Build"
			        run: |
			          branch=\${{ github.ref }}
			          branch=\${branch#refs/heads/}
			          mv ".env.$branch" .env || touch .env
			          echo "TODO : implement build steps ..."
			      - name: "Deploy to server"
			        run: |
			          echo "\${{ secrets.DEPLOY_KEY }}" > .pasta.key
			          pasta ci
		`))
		await giteaFile.save()
	}
	else if ( createCI === "gitlab" ) {
		const gitlabFile = await File.create(`.gitlab-ci.yml`)
		gitlabFile.content(untab(`
			variables:
			  BRANCH: $CI_COMMIT_REF_NAME
			  GIT_SUBMODULE_STRATEGY: recursive
			image:
			  name: zouloux/docker-debian-ci
			stages:
			  - deploy
			job:deploy:
			  stage: deploy
			  only:
			    - preview
			    - main
			  script:
			    - mv ".env.$BRANCH" .env
			    - echo "TODO : implement build steps ..."
			    - echo SSH_PRIVATE | tr " " "\\n" > .pasta.key
			    - pasta ci
		`))
		await gitlabFile.save()
	}

	copyFileSync(
		join(relativeDirname( import.meta.url ), "../templates/bun/", "bun-example.js"),
		join(process.cwd(), "dist", "bun-example.js")
	)

	const gitignore = await File.create(".gitignore")
	await gitignore.load()
	if ( gitignore.content().indexOf("# Pasta ignore") === -1 ) {
		gitignore.append(untab(`
			# Common ignore
			.idea
			.DS_Store
			node_modules
			# Pasta ignore
			.proxy/certs
			.env
			.pasta.key
			/data/
		`))
		await gitignore.save()
	}

	await generateSSLCommand( projectName, false )
	newLine()
	nicePrint(`{b/g}Pasta project created ✨`)
	openCommand( projectName, localHostname, false )
}