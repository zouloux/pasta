import { askInput, askList, execAsync, execSync, newLine, nicePrint, oraTask } from "@zouloux/cli";
import { getKeyCommand, loadDotEnv } from "./_common.js";
import { repeat, trailing } from "@zouloux/ecma-core";

/**
 * ╔═══════╗
 * ║       ║
 * ║       ║
 * ║       ║
 * ╚═══════╝
 */

function generateComputerASCII ( name, size, padding ) {
	let buffer = `╔${ repeat( size + padding, "═" ) }╗\n`
	const offset = size - name.length
	const leftPadding = Math.floor( offset / 2 )
	const rightPadding = Math.ceil( offset / 2 )
	buffer += `║${ repeat( leftPadding + padding / 2, " " ) }${ name }${ repeat( rightPadding + padding / 2, " " ) }║\n`
	buffer += `╚${ repeat( size + padding, "═" ) }╝`
	return buffer
}

function showConfirm (remoteName, localName, direction ) {
	const padding = 4;
	const longest = Math.max( localName.length, remoteName.length )
	let remote = generateComputerASCII( remoteName, longest, padding )
	let arrow = (direction === "pull" ? "↓" : "↑") + " ";
	let local = generateComputerASCII( localName, longest, padding )
	console.log( remote )
	console.log(`${repeat( padding, " " )}${arrow.repeat(longest / 2)}`)
	console.log( local )
}

export async function syncCommand ( config, branch, direction ) {
	const { sync, host, project, port, user, data, key, syncExclude } = config
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
	command += syncExclude.map( e => `--exclude '${e}' `)
	// Remove trailing slash in push, this is important
	const remote = trailing(`"${user}@${host}:/home/${project}/data/${data}"`, direction === "pull")
	const local = `"${localData}"`
	if ( direction === "pull" )
		command += `${remote} ${local}`
	else
		command += `${local} ${remote}`
	const hostname = execSync(`hostname`).trim()
	showConfirm(`${host}/${project}/${data}`, `${hostname}/${branch}`, direction)
	const selection = await askList(`Data can be lost. Do you confirm?`, [ 'No', 'Yes' ], { returnType: "index" })
	if ( selection === 0 ) {
		process.exit(0);
	}
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
