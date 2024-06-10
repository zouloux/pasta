import { askInput, askList, execAsync, newLine, nicePrint, oraTask } from "@zouloux/cli";
import { getKeyCommand, loadDotEnv } from "./_common.js";


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
		const confirm = await askInput("Type : production")
		if ( confirm !== "production" )
			process.exit(0)
	}
	// Get local data directory
	const { dotEnvContent } = await loadDotEnv()
	const localData = dotEnvContent.PASTA_DATA
	if ( !localData )
		nicePrint(`{r}Unable to read {b}PASTA_DATA{/r} from {b}.env{/r} file`, { code: 1 })
	// Load key
	const keyCommand = await getKeyCommand( key )
	// Generate rsync command
	let command = `rsync -az --delete --no-perms -e 'ssh${keyCommand} -p ${port}' `
	const remote = `"${user}@${host}:/home/${project}/data/${data}/"`
	const local = `"${localData}"`
	if ( direction === "pull" )
		command += `${remote} ${local}`
	else
		command += `${local} ${remote}`
	// Show and run rsync command
	nicePrint(`{d}$ ${command}`)
	await oraTask(`${direction === "pull" ? "Pulling from" : "Pushing to"} ${branch}`, async () => {
		try {
			await execAsync( command, 0 )
		}
		catch ( e ) {
			console.error( e )
			newLine()
			nicePrint(`ℹ️ {c}If this looks like  a key issue, run {b/w}$ pasta patch-key ${branch}`, { code: 1 })
		}
	})
	nicePrint(`{b/g}Done ✨`)
}