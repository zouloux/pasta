import { execAsync, newLine, nicePrint } from "@zouloux/cli";
import { File } from "@zouloux/files"
import { filesize } from "filesize";
import { getKeyCommand } from "./_common.js";

export async function deployCommand ( config, branchName, subBranch ) {
	// ------------------------------------------------------------------------- INIT
	// Config and defaults
	const archiveName = `${branchName}.tar.gz`
	const files = (config.files ?? []).join(" ")
	const { project, host, port, domain, user, password, data, key, alias } = config

	// Checks
	if ( host.length === 0 )
		nicePrint(`{r}Invalid {b/r}host{/}{r} in pasta config.`, { code: 1 })
	if ( files.length === 0 )
		nicePrint(`{r}Missing {b/r}files{/}{r} list in pasta config.`, { code: 1 })
	if ( project.length === 0 )
		nicePrint(`{r}Invalid {b/r}project{/}{r} name in pasta config.`, { code: 1 })
	// Try to load pasta key
	const keyCommand = await getKeyCommand( key )

	// ------------------------------------------------------------------------- CONNECTING
	newLine()
	nicePrint(`{b}Connecting to ${user}@${host}:${port}/${project} ...`)
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

	// ------------------------------------------------------------------------- CREATING ARTIFACT
	newLine()
	nicePrint(`{b}Creating artifact ${archiveName} ...`)
	const command = `COPYFILE_DISABLE=1 tar --exclude='.DS_Store' --exclude='__MACOSX' --exclude='._*' --exclude='.AppleDouble' -czf ${archiveName} ${files}`
	nicePrint(`{d}$ ${command}`)
	await execAsync(command, 3)
	const archiveFile = await File.create(archiveName)
	const byteCount = await archiveFile.size()
	nicePrint(`{d}Artifact size {b}${filesize(byteCount ?? 0)}`)

	// ------------------------------------------------------------------------- SENDING ARTIFACT
	newLine()
	nicePrint(`{b}Sending artifact ${archiveName} ...`)
	try {
		const command = `scp${keyCommand} -o StrictHostKeyChecking=no -P ${port} ${archiveName} ${user}@${host}:/home/${project}/artifacts/`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	// ------------------------------------------------------------------------- DEPLOY
	newLine()
	nicePrint(`{b}Deploying branch ${branchName} ...`)
	try {
		const command = `ssh${keyCommand} -o StrictHostKeyChecking=no -p ${port} ${user}@${host} "sudo -n /usr/local/pasta/bin/project-deploy '${project}' '${branchName}' '${subBranch}' '${data}' '${domain}' '${alias}' '${password}'"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}


	// ------------------------------------------------------------------------- CLEAN
	await archiveFile.delete()
	newLine()
	nicePrint(`{b/g}Done ✨`)
}