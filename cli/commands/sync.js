import { askInput, askList, execAsync, newLine, nicePrint, oraTask } from "@zouloux/cli";
import { getKeyCommand, loadDotEnv } from "./_common.js";
import path from "node:path";
import { repeat, trailing, untab } from "@zouloux/ecma-core";

/**
 * ╔═══════╗
 * ║       ║
 * ║       ║
 * ║       ║
 * ╚═══════╝
 */

function generateComputerASCII ( name ) {
	let buffer = "╔" + repeat( name.length + 2, "═" ) + "╗\n"
	buffer += "║ " + name + " ║\n"
	buffer += "╚" + repeat( name.length + 2, "═" ) + "╝"
	return buffer
}

function showConfirm (remoteName, localName, direction ) {
	const longest = Math.max( localName.length, remoteName.length )
	let remote = generateComputerASCII( remoteName )
	let arrow = direction === "pull" ? "↓" : "↑"
	let local = generateComputerASCII( localName )
	console.log( remote )
	console.log(`  ${arrow.repeat(longest)}  `)
	console.log( local )
}

export async function syncCommand ( config, branch, direction ) {
	const { sync, host, project, port, user, data, key } = config
	// Get direction
	const directions = ["pull", "push"]
	if ( !directions.includes(direction) )
		direction = await askList("Direction", [ "pull", "push" ], { returnType: "value" })
	// Check if direction allowed in config
	if ( sync !== "both" && direction !== sync )
		nicePrint(`{r}Sync direction {b/r}${direction}{r} is disabled for branch {b/r}${branch}`, { code: 1 })
	// Ask confirmation for main branch push
	if ( branch === "main" && direction === "push" ) {
		nicePrint(`{b/r}You are going to erase production data. Are you sure ?`)
		const key = Math.round( Math.random() * 899 + 100 )
		const confirmation = `production-${key}`
		const confirm = await askInput(`Type : ${confirmation} to continue`)
		if ( confirm !== confirmation )
			process.exit(0)
	}
	// Get local data directory
	const { dotEnvContent } = await loadDotEnv()
	// Force trailing slash in push, this is important
	const dockerDataEnv = dotEnvContent.DOCKER_DATA ?? dotEnvContent.PASTA_DATA ?? ""
	const localData = trailing(dockerDataEnv, direction === "push")
	if ( !dockerDataEnv )
		nicePrint(`{r}Unable to read {b}DOCKER_DATA{/r} from {b}.env{/r} file`, { code: 1 })
	// Load key
	const keyCommand = await getKeyCommand( key )
	// Generate rsync command
	let command = `rsync -az --delete --no-perms --omit-dir-times -e 'ssh${keyCommand} -p ${port}' `
	// Remove trailing slash in push, this is important
	const remote = trailing(`"${user}@${host}:/home/${project}/data/${data}"`, direction === "pull")
	const local = `"${localData}"`
	if ( direction === "pull" )
		command += `${remote} ${local}`
	else
		command += `${local} ${remote}`
	// TODO : Finish confirm
	// const hostname = dotEnvContent.PASTA_HOSTNAME
	// showConfirm(`${host}/${data}`, `${hostname}`, direction)
	// const selection = await askList(`Data can be lost. Do you confirm?`, [ 'Yes', 'No' ], { returnType: "index" })
	// console.log( selection );
	// process.exit()
	// Show and run rsync command
	nicePrint(`{d}$ ${command}`)
	await oraTask(`${direction === "pull" ? "Pulling from" : "Pushing to"} ${branch}`, async () => {
		try {
			await execAsync( command, 1 )
		}
		catch ( e ) {
			console.error( e )
			newLine()
			nicePrint(`ℹ️ {c}If this looks like a key issue, run {b/w}$ pasta patch-key ${branch}`, { code: 1 })
			newLine()
		}
	})
	nicePrint(`{b/g}Done ✨`)
}
