import { askInput, askList, execAsync, execSync, nicePrint, oraTask } from "@zouloux/cli";
import { loadDotEnv } from "./_config.js";


export async function syncCommand ( config, branch, direction ) {
	// Get direction
	const directions = ["pull", "push"]
	if ( !directions.includes(direction) )
		direction = await askList("Direction", [ "pull", "push" ], { returnType: "value" })
	// Check if direction allowed in config
	if ( !!config.sync && config.sync !== "both" ) {
		if ( config.sync !== direction )
			nicePrint(`{r}Sync direction {b/r}${direction}{r} is disabled for branch {b/r}${branch}`, { code: 1 })
	}
	// Ask confirmation for main branch push
	if ( branch === "main" && direction === "push" ) {
		nicePrint(`{b/r}You are going to erase production data. Are you sure ?`)
		const confirm = await askInput("Type : production")
		if ( confirm !== "production" )
			process.exit(0)
	}
	// Extract config
	const host = config.host
	const project = config.project
	const port = config.port ?? 22
	const user = config.user ?? project
	const data = config.data ?? branch
	// Get local data directory
	const { dotEnvContent } = await loadDotEnv()
	const localData = dotEnvContent.PASTA_DATA
	if ( !localData )
		nicePrint(`{r}Unable to read {b}PASTA_DATA{/r} from {b}.env{/r} file`, { code: 1 })
	// Generate rsync command
	let command = `rsync -az --delete --no-perms -e 'ssh -p ${port}' `
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
		}
	})
}