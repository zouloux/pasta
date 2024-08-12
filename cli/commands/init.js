import { Directory, File } from "@zouloux/files"
import { askInput, askList, execSync, newLine, nicePrint, clearScreen } from "@zouloux/cli";
import { untab } from "@zouloux/ecma-core";
import { generateSSLCommand } from "./generate-ssl.js";
import { openCommand } from "./open.js";
import { pastaConfigFileName } from "./_common.js";
import { listRegisteredServers, parseServerEndpoint } from "./server.js";

async function askForOtherServer () {
	const serverHost = await askInput("Enter Pasta Server host")
	const serverPort = await askInput("Enter Pasta Server port", { defaultValue: 22 })
	return `root@${serverHost}:${serverPort}`.toLowerCase()
}

export async function initCommand () {
	clearScreen( false )

	// ------------------------------------------------------------------------- ASK WHICH SERVER
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

	// ------------------------------------------------------------------------- ASK PROJECT
	const projectName = await askInput("Project workspace name created on Pasta server", { defaultValue: "project-name" })
	const { host, port } = parseServerEndpoint( pastaServer )

	// ------------------------------------------------------------------------- ASK CI
	const createCI = await askList("Do you need CI integration?", {
		no: "No CI - Deploy directly from this machine 🫣",
		gitea: "Gitea CI",
		github: "Github CI",
		gitlab: "Gitlab CI",
	}, { returnType: "key" })

	// const deployKeyContent = await askInput("Do you have a deploy key? (keep empty to use default ssh agent).")
	// if ( deployKeyContent !== "" ) {
	// 	const deployKey = await File.create(".pasta.key")
	// 	deployKey.content(`${deployKeyContent}\n`)
	// 	await deployKey.save()
	// }

	const createdFiles = []

	const localHostname = execSync('hostname').trim()

	// ------------------------------------------------------------------------- FILE - .proxy/
	const proxyDir = await Directory.create(".proxy")
	if ( !(await proxyDir.exists()) ) {
		createdFiles.push( proxyDir )
		await proxyDir.create()
	}
	// ------------------------------------------------------------------------- FILE - data/
	const dataDir = await Directory.create("data")
	if ( !(await dataDir.exists()) ) {
		createdFiles.push( dataDir )
		await dataDir.create()
	}

	// const distDir = await Directory.create("dist")
	// if ( !(await distDir.exists()) ) {
	// 	await distDir.create()
	// }

	// ------------------------------------------------------------------------- FILE - pasta.yaml
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
		    # Files to include in the artefact
		    files:
		      - .proxy/nginx.conf
		      - docker-compose.yaml
		      # Dot env is selected dynamically and renamed to .env on remote
		      - .env.$branch
		      - dist/
		  preview:
		    # Domain to deploy to. You can use full domain, or a sub-domain
		    domain: ${projectName}-preview
		    # Add an HTTP login / password to protect this branch
		    password: "login:password"
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
	if ( !(await pastaConfigFile.exists()) ) {
		createdFiles.push( pastaConfigFile )
		await pastaConfigFile.save()
	}

	// ------------------------------------------------------------------------- FILE - .env
	const dotEnv = await File.create(".env")
	await dotEnv.load()
	dotEnv.dotEnv( lines => {
		const newObject = {
			'# --- Pasta config': '',
			'PASTA_PROJECT_NAME': projectName,
			'PASTA_HOSTNAME': localHostname,
			'PASTA_DATA': "./data",
			'PASTA_BUILD': "0",
			'PASTA_BRANCH': "dev",
		}
		const newKeys = Object.keys( newObject )
		Object.keys( lines ).forEach( k => {
			if ( newKeys.indexOf( k ) === -1 )
				newObject[ k ] = lines[ k ];
		})
		return newObject
	})
	createdFiles.push( dotEnv )
	await dotEnv.save()

	// ------------------------------------------------------------------------- FILE - .env.default
	const dotEnvDefault = await File.create(".env.default")
	await dotEnvDefault.load()
	dotEnvDefault.dotEnv( lines => {
		const newObject = {
			'# --- Pasta config': '',
			'PASTA_PROJECT_NAME': '',
			'PASTA_HOSTNAME': '',
			'PASTA_DATA': "./data",
			'PASTA_BUILD': "0",
			'PASTA_BRANCH': "dev",
		}
		const newKeys = Object.keys( newObject )
		Object.keys( lines ).forEach( k => {
			if ( newKeys.indexOf( k ) === -1 )
				newObject[ k ] = lines[ k ];
		})
		return newObject
	})
	createdFiles.push( dotEnvDefault )
	await dotEnvDefault.save()

	// ------------------------------------------------------------------------- FILE - .env.preview
	const dotEnvPreview = await File.create(".env.preview")
	dotEnvPreview.content(``)
	if ( !(await dotEnvPreview.exists()) ) {
		createdFiles.push( dotEnvPreview )
		await dotEnvPreview.save()
	}

	// ------------------------------------------------------------------------- FILE - .env.main
	const dotEnvMain = await File.create(".env.main")
	dotEnvMain.content(``)
	if ( !(await dotEnvMain.exists()) ) {
		createdFiles.push( dotEnvMain )
		await dotEnvMain.save()
	}

	// ------------------------------------------------------------------------- FILE - .proxy/nginx.conf
	const nginxConfFile = await File.create(".proxy/nginx.conf")
	nginxConfFile.content(untab(`
		# Enable big uploads
		client_max_body_size 128m;
	`))
	if ( !(await nginxConfFile.exists()) ) {
		createdFiles.push( nginxConfFile )
		await nginxConfFile.save()
	}

	// ------------------------------------------------------------------------- FILE - .proxy/docker-compose.proxy.yaml
	const dockerComposeProxyFile = await File.create(".proxy/docker-compose.proxy.yaml")
	dockerComposeProxyFile.content(untab(`
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
		      - "./certs:/etc/nginx/certs"
		      - "./nginx.conf:/etc/nginx/conf.d/proxy.conf:ro"
		    attach: false
    `))
	if ( !(await dockerComposeProxyFile.exists()) ) {
		createdFiles.push( dockerComposeProxyFile )
		await dockerComposeProxyFile.save()
	}

	// ------------------------------------------------------------------------- FILE - docker-compose.yaml
	const dockerComposeFile = await File.create("docker-compose.yaml")
	dockerComposeFile.content(untab(`
		services:
		  proxy:
		    extends:
		      file: ".proxy/docker-compose.proxy.yaml"
		      service: proxy
    `))

	// BUN EXAMPLES
	// dockerComposeFile.content(untab(`
	// 	services:
	// 	  proxy:
	// 	    extends:
	// 	      file: ".proxy/docker-compose.proxy.yaml"
	// 	      service: proxy
	// 	  front:
	// 	    image: "oven/bun:alpine"
	// 	    working_dir: "/app"
	// 	    command: "bun --watch bun-example.js"
	// 	    env_file: ".env"
	// 	    volumes:
	// 	      - "./dist:/app"
	// 	      - "\${PASTA_DATA}/front:/root/data"
	// 	    environment:
	// 	      VIRTUAL_PORT: 3000
	// 	      VIRTUAL_HOST: "$PASTA_PROJECT_NAME.ssl.localhost,localhost,$PASTA_HOSTNAME.local"
    // `))
	// copyFileSync(
	// 	join(relativeDirname( import.meta.url ), "../templates/bun/", "bun-example.js"),
	// 	join(process.cwd(), "dist", "bun-example.js")
	// )

	if ( !(await dockerComposeFile.exists()) ) {
		createdFiles.push( dockerComposeFile )
		await dockerComposeFile.save()
	}

	// ------------------------------------------------------------------------- FILE - CI
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
			    - echo "TODO : implement build steps ..."
			    - echo SSH_PRIVATE | tr " " "\\n" > .pasta.key
			    - pasta ci
		`))
		await gitlabFile.save()
	}

	// ------------------------------------------------------------------------- FILE - .gitignore
	const gitignore = await File.create(".gitignore")
	await gitignore.load()
	const pastaIgnoreSeparator = "# --- PASTA"
	const ignored = [
		".proxy/certs",
		".env",
		".pasta.key",
		"/data/",
	]
	if ( gitignore.content().indexOf( pastaIgnoreSeparator ) === -1 ) {
		// Add pasta ignore lines and filter out duplicates.
		const lines = [
			...new Set([
				...gitignore.content().split("\n"),
				pastaIgnoreSeparator, // add marker separator
				...ignored,
			])
		]
		gitignore.content( lines.join("\n") )
		await gitignore.save()
	}

	// ------------------------------------------------------------------------- FILE - SSL
	await generateSSLCommand( projectName, false )
	newLine()
	nicePrint(`{b/g}Pasta project created ✨`)
	openCommand( projectName, localHostname, false )
}