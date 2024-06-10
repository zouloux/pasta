#!/usr/bin/env node
import { CLICommands, askList, nicePrint, newLine } from "@zouloux/cli"
import { hasConfig, targetBranchConfig, getProjectNameFromDotEnv } from "./commands/_common.js";
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";
import { generateSSLCommand } from "./commands/generate-ssl.js";
import { openCommand } from "./commands/open.js";
import { syncCommand } from "./commands/sync.js";
import { patchKey } from "./commands/patch-key.js";

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
commands.add("patch-key", async () => {
	const { config } = await targetBranchConfig( commands.parsedArgs.arguments[1] )
	await patchKey( config )
})

commands.add("deploy", async () => {
	const { config, branch } = await targetBranchConfig( commands.parsedArgs.arguments[1] )
	await deployCommand( config, branch )
})

commands.add("sync", async () => {
	const { config, branch } = await targetBranchConfig( commands.parsedArgs.arguments[1] )
	syncCommand( config, branch, commands.parsedArgs.arguments[2] )
})

// commands.add("help", async () => {
// 	newLine()
// 	nicePrint(`
// 		{b}pasta init
// 		{d}Create a new Pasta project in the current directory.
// 	`)
// 	newLine()
// 	nicePrint(`
// 		{b}pasta open
// 		{d}Show links to open the project in current directory.
// 	`)
// 	newLine()
// 	nicePrint(`
// 		{b}pasta generate-ssl
// 		{d}Generate or regenerate SSL certificates for localhost.
// 		{d}Will also patch {b}PASTA_HOSTNAME{/d} in {b}.env
// 	`)
// 	newLine()
// 	nicePrint(`
// 		{b}pasta deploy <branch>
// 		{d}Deploy pasta project to server following {b}pasta.yaml{/d} file.
// 	`)
// 	newLine()
// 	nicePrint(`
// 		{b}pasta sync <branch> <direction>
// 		{d}Sync data from a specific branch.
// 		{d}Will ask if pull or push method
// 	`)
// })

commands.before( () => nicePrint(`{c/b}Pasta Devops{d} - CLI`) )

commands.start( async (commandName) => {
	if ( !commands.exists(commandName) ) {
		const choices = {
			init: "Create a new Pasta project in current directory.",
			// "---0": "---",
			open: "Show links to open current project on local or mobile device.",
			'generate-ssl': "Re-generate SSL keys for local https.",
			'patch-key': "Try to patch deployment key.",
			deploy: "Deploy project branch to server.",
			sync: "Synchronize branch data between server and local.",
			// "---1": "---",
			//server: "Manage servers"
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
		const choice = await askList("Choose action", choices, { returnType: "key" })
		// const choiceIndex = choice[0]
		// const action = actions[ choiceIndex ]
		// console.log( actions, choiceIndex );
		commands.run( choice )
	}
})
