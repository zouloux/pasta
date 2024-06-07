#!/usr/bin/env node
import { CLICommands, askList, nicePrint, newLine } from "@zouloux/cli"
import { hasConfig, targetEnvConfig, getProjectNameFromDotEnv } from "./commands/_config.js";
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";
import { generateSSLCommand } from "./commands/generate-ssl.js";
import { openCommand } from "./commands/open.js";
import { syncCommand } from "./commands/sync.js";

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

commands.add("generate-ssl", async () => {
	const projectName = await getProjectNameFromDotEnv()
	await generateSSLCommand( projectName )
})

commands.add("deploy", async () => {
	const { config, branch } = await targetEnvConfig( commands.parsedArgs.arguments[1] )
	await deployCommand( config, branch )
})

commands.add("sync", async () => {
	const { config, branch } = await targetEnvConfig( commands.parsedArgs.arguments[1] )
	syncCommand( config, branch, commands.parsedArgs.arguments[2] )
})

commands.add("help", async () => {
	newLine()
	nicePrint(`
		{b}pasta init
		{d}Create a new Pasta project in the current directory.
	`)
	newLine()
	nicePrint(`
		{b}pasta open
		{d}Show links to open the project in current directory.
	`)
	newLine()
	nicePrint(`
		{b}pasta generate-ssl
		{d}Generate or regenerate SSL certificates for localhost.
		{d}Will also patch {b}PASTA_HOSTNAME{/d} in {b}.env
	`)
	newLine()
	nicePrint(`
		{b}pasta deploy <branch>
		{d}Deploy pasta project to server following {b}pasta.yaml{/d} file.
	`)
	newLine()
	nicePrint(`
		{b}pasta sync <branch> <direction>
		{d}Sync data from a specific branch.
		{d}Will ask if pull or push method 
	`)
})

commands.before( () => nicePrint(`{d}Pasta Devops - CLI`) )

commands.start( async (commandName) => {
	if ( !commands.exists(commandName) ) {
		const actions = commands.list()
		const choice = await askList("Choose action", actions, { returnType: "value" })
		commands.run( choice )
	}
})
