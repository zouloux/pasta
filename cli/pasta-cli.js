#!/usr/bin/env node
import { CLICommands, askList, nicePrint, execSync } from "@zouloux/cli"
import { hasConfig, targetBranchConfig, getProjectNameFromDotEnv, getPackageVersion } from "./commands/_common.js";
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";
import { generateSSLCommand } from "./commands/generate-ssl.js";
import { openCommand } from "./commands/open.js";
import { syncCommand } from "./commands/sync.js";
import { serverCommand } from "./commands/server.js";
import { Directory } from "@zouloux/files";
import { File } from "@zouloux/files"
import { untab } from "@zouloux/ecma-core";


const commands = new CLICommands({})

commands.add("init", async () => {
	if ( await hasConfig() ) {
		const confirm = await askList(`{b/r}Pasta is already init in this directory. Files will be overridden.\nContinue?`, {
			'n': 'No',
			'y': 'Yes',
		})
		if ( confirm[2] === "n" )
			process.exit(1)
	}
	await initCommand()
})

commands.add("open", async () => {
	const projectName = await getProjectNameFromDotEnv()
	await openCommand(projectName)
})

commands.add("ssl", async () => {
	const projectName = await getProjectNameFromDotEnv()
	await generateSSLCommand( projectName )
})

async function getDeployConfig () {
	// Branch is given from argv
	let gitBranch = commands.parsedArgs.arguments[1]
	// Not found in argv, default is the current git branch
	const gitDirectory = await Directory.create(".git")
	const gitDirectoryExists = await gitDirectory.exists()
	if ( !gitBranch && gitDirectoryExists ) {
		try {
			gitBranch = execSync(`git branch --show-current`, 0).trim()
		}
		catch ( e ) {}
	}
	// Still not found ? We ask for user
	return await targetBranchConfig( gitBranch )
}

commands.add("deploy", async () => {
	const { config, branch, subBranch } = await getDeployConfig()
	if ( config.noDirectDeploy && !commands.parsedArgs.flags.ci )
		nicePrint(untab(`
			{b/r}Direct deployment is disabled for branch ${branch}.
			Use CI pipeline to deploy with --ci option.
		`), { code: 1 })
	await deployCommand( config, branch, subBranch )
})

commands.add("env", async () => {
	const { config, branch, subBranch } = await getDeployConfig()
	// execSync(`mv .env.${branch} .env`)
	const dotEnv = await File.create(`.env.${branch}`)
	await dotEnv.load()
	let content = dotEnv.content() + "\n# --- PASTA ENV\n"
	content += [
		`PASTA_PROJECT_NAME=${config.project}`,
		`PASTA_HOSTNAME=ci`,
		`PASTA_DATA=./data`,
		`PASTA_BUILD=0`,
		`PASTA_BRANCH=${branch ?? "ci"}`,
		`PASTA_SUB_BRANCH=${subBranch ?? ""}`,
	].join("\n")
	dotEnv.content( content )
	await dotEnv.save(".env")
})

commands.add("sync", async () => {
	const { config, branch } = await targetBranchConfig( commands.parsedArgs.arguments[1] )
	syncCommand( config, branch, commands.parsedArgs.arguments[2] )
})

commands.add("server", () => serverCommand( commands.parsedArgs.arguments[1], commands.parsedArgs.arguments[2] ))
commands.add("connect", () => serverCommand( "connect", commands.parsedArgs.arguments[1] ))

commands.before( () => nicePrint(`{c/b}Pasta Devops{d} - CLI - ${getPackageVersion()}`) )

commands.start( async (commandName) => {
	if ( !commands.exists(commandName) ) {
		const choices = {
			init: "Create a new Pasta project in current directory.",
			"---0": "---",
			open: "Show links to open current project on local or mobile device.",
			deploy: "Deploy project branch to server.",
			sync: "Synchronize branch data between server and local.",
			ssl: "Re-generate SSL keys for local https.",
			// "---1": "---",
			// 'patch-key': "Try to patch deployment key.",
			"---2": "---",
			server: "Manage registered servers",
			connect: "Start SSH connexion to a registered Pasta Server",
		}
		// commands.list().forEach( a => {
		const actions = Object.keys(choices)
		actions.forEach( a => {
			choices[a] = (
				( choices[a] !== "---" )
				? nicePrint(`${a}{d} - ${choices[a]}`, { output: "return" }).trim()
				: choices[a]
			)
		})
		const choice = await askList("Choose action", choices, { returnType: "index" })
		const actionsWithoutSeparators = actions.filter( a => !a.startsWith("---") )
		const action = actionsWithoutSeparators[ choice ]
		commands.run( action )
	}
})
