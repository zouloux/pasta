import { execAsync, newLine, nicePrint } from "@zouloux/cli";
import { File } from "@zouloux/files"
import { filesize } from "filesize";
import { getKeyCommand } from "./_common.js";

// ----------------------------------------------------------------------------- LEGACY

async function deployCommandLegacy (config, branchName, subBranch) {

	// --- INIT
	// Config and defaults
	const archiveName = `${branchName}.tar.gz`
	const { version, project, host, port, domain, user, password, data, key, alias } = config

	// Patch $branch variable in files
	const files = (config.files ?? []).map( f => f.replaceAll("$branch", branchName) ).join(" ")

	// Checks
	if ( host.length === 0 )
		nicePrint(`{r}Invalid {b/r}host{/}{r} in pasta config.`, { code: 1 })
	if ( files.length === 0 )
		nicePrint(`{r}Missing {b/r}files{/}{r} list in pasta config.`, { code: 1 })
	if ( project.length === 0 )
		nicePrint(`{r}Invalid {b/r}project{/}{r} name in pasta config.`, { code: 1 })

	// Try to load pasta key
	const keyCommand = await getKeyCommand( key )

	// --- CONNECTING
	newLine()
	nicePrint(`{b}Connecting to ${user}@${host}:${port}/${project}...`)
	try {
		const command = `ssh${keyCommand} -o StrictHostKeyChecking=no -p ${port} ${user}@${host} "cd /home/${project}"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		nicePrint(`{b/r}Unable to connect.`)
		if ( keyCommand ) {
			newLine()
			nicePrint(`ℹ️ {c}If this looks like a key issue, run {b/w}$ pasta patch-key ${branchName}`)
			newLine()
		}
		process.exit(1)
	}

	// --- CREATING ARTIFACT
	newLine()
	nicePrint(`{b}Creating artifact ${archiveName}...`)
	const command = `COPYFILE_DISABLE=1 tar --exclude='.DS_Store' --exclude='__MACOSX' --exclude='._*' --exclude='.AppleDouble' -czf ${archiveName} ${files}`
	nicePrint(`{d}$ ${command}`)
	await execAsync(command, 3)
	const archiveFile = await File.create(archiveName)
	const byteCount = await archiveFile.size()
	nicePrint(`{d}Artifact size {b}${filesize(byteCount ?? 0)}`)

	// --- SENDING ARTIFACT
	newLine()
	nicePrint(`{b}Sending artifact ${archiveName}...`)
	try {
		const command = `scp${keyCommand} -o StrictHostKeyChecking=no -P ${port} ${archiveName} ${user}@${host}:/home/${project}/artifacts/`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	// --- DEPLOY
	newLine()
	nicePrint(`{b}Deploying branch ${branchName}...`)
	try {
		const command = `ssh${keyCommand} -o StrictHostKeyChecking=no -p ${port} ${user}@${host} "sudo -n /usr/local/pasta/bin/project-deploy '${project}' '${branchName}' '${subBranch}' '${data}' '${domain}' '${alias}' '${password}'"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	// --- CLEAN
	await archiveFile.delete()
	newLine()
	nicePrint(`{b/g}Done ✨`)
}

// ----------------------------------------------------------------------------- V2

async function deployCommand2 ( config, branchName, subBranch ) {

	// --- INIT
	// Config and defaults
	const archiveName = `${branchName}.tar.gz`
	const { version, project, host, port, user, password, swapMethod, data, key, verbose } = config
	// console.log(config, branchName, subBranch)
	// process.exit()

	// Patch $branch variable in files
	const files = (config.files ?? []).map( f => f.replaceAll("$branch", branchName) ).join(" ")

	// Checks
	if ( host.length === 0 )
		nicePrint(`{r}Invalid {b/r}host{/}{r} in pasta config.`, { code: 1 })
	if ( files.length === 0 )
		nicePrint(`{r}Missing {b/r}files{/}{r} list in pasta config.`, { code: 1 })
	if ( project.length === 0 )
		nicePrint(`{r}Invalid {b/r}project{/}{r} name in pasta config.`, { code: 1 })
	if ( swapMethod !== "up-down" && swapMethod !== "down-up" )
		nicePrint(`{r}Invalid {b/r}swapMethod{/}{r} pasta config ( up-down or down-up ).`, { code: 1 })

	// Try to load pasta key
	const keyCommand = await getKeyCommand( key )

	// --- CONNECTING
	newLine()
	nicePrint(`{b}Connecting to ${user}@${host}:${port}/${project}...`)
	try {
		const command = `ssh${keyCommand} -o StrictHostKeyChecking=no -p ${port} ${user}@${host} "cd /home/${project}"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		nicePrint(`{b/r}Unable to connect.`)
		if ( keyCommand ) {
			newLine()
			nicePrint(`ℹ️ {c}If this looks like a key issue, run {b/w}$ pasta patch-key ${branchName}`)
			newLine()
		}
		process.exit(1)
	}

	// --- CREATING ARTIFACT
	newLine()
	nicePrint(`{b}Creating artifact ${archiveName}...`)
	// todo : add an option to modify that
	const defaultExcludes = [
		'.DS_Store',
		'__MACOSX',
		'.AppleDouble',
		'._*',
		'.git',
	]
	const excludeParameters = defaultExcludes.map( e => `--exclude='${e}'` )
	const commandParts = [
		'COPYFILE_DISABLE=1',
		'tar',
		...excludeParameters,
		'-czf',
		archiveName,
		files
	]
	const command = commandParts.join(" ")
	nicePrint(`{d}$ ${command}`)
	await execAsync(command, 3)
	const archiveFile = await File.create(archiveName)
	const byteCount = await archiveFile.size()
	nicePrint(`{d}Artifact size {b}${filesize(byteCount ?? 0)}`)

	// --- SENDING ARTIFACT
	newLine()
	nicePrint(`{b}Sending artifact ${archiveName}...`)
	try {
		const command = `scp${keyCommand} -o StrictHostKeyChecking=no -P ${port} ${archiveName} ${user}@${host}:/home/${project}/artifacts/`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	// --- DEPLOY
	newLine()
	if ( subBranch )
		nicePrint(`{b}Deploying branch ${branchName}/${subBranch}...`)
	else
		nicePrint(`{b}Deploying branch ${branchName}...`)
	try {
		const command = `ssh${keyCommand} -o StrictHostKeyChecking=no -p ${port} ${user}@${host} "sudo -n /usr/local/pasta/bin/project-deploy-2 '${verbose}' '${project}' '${branchName}' '${subBranch}' '${swapMethod}' '${data}' '${password}'"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	// --- CLEAN
	await archiveFile.delete()
	newLine()
	nicePrint(`{b/g}Done ✨`)
}

// ----------------------------------------------------------------------------- DEPLOY COMMAND


export async function deployCommand ( config, branchName, subBranch ) {
	const { version } = config
	if ( version === "1.0" ) {
		nicePrint(`{o}Using legacy deploy v${version}`)
		deployCommandLegacy( config, branchName, subBranch )
	}
	else if ( version === "1.2") {
		nicePrint(`{g}Using deploy v${version}`)
		deployCommand2( config, branchName, subBranch )
	}
	else {
		nicePrint(`{r}Invalid version ${version}`, { code: 1 })
	}
}