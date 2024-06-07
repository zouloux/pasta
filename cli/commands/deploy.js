import { execAsync, newLine, nicePrint } from "@zouloux/cli";
import { File } from "@zouloux/files"
import { filesize } from "filesize";

export async function deployCommand ( config, branchName ) {

	const archiveName = `${branchName}.tar.gz`
	const files = (config.files ?? []).join(" ")
	const project = config.project
	const host = config.host
	const port = config.port ?? 22
	const dataBucket = config.data ?? branchName
	const domain = config.domain ?? ""
	const user = config.user ?? project

	if ( host.length === 0 )
		nicePrint(`{r}Invalid {b}host{/r} in pasta config.`, { code: 1 })
	if ( files.length === 0 )
		nicePrint(`{r}Missing {b}files{/r} list in pasta config.`, { code: 1 })
	if ( project.length === 0 )
		nicePrint(`{r}Invalid {b}project{/r} name in pasta config.`, { code: 1 })

	newLine()
	nicePrint(`{b}Adding ${host}:${port} to known hosts ...`)
	try {
		await execAsync(`ssh-keyscan -p ${port} ${host} >> ~/.ssh/known_hosts`, 0)
	}
	catch ( e ) {
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	newLine()
	nicePrint(`{b}Connecting to ${user}@${host}:${port}/${project} ...`)
	try {
		const command = `ssh -p ${port} ${user}@${host} "cd /home/${project}"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	newLine()
	nicePrint(`{b}Creating artifact ${archiveName} ...`)
	await execAsync(`tar -czf ${archiveName} ${files}`, 3)
	const archiveFile = await File.create(archiveName)
	const byteCount = await archiveFile.size()
	nicePrint(`{d}Artifact size {b}${filesize(byteCount ?? 0)}`)

	newLine()
	nicePrint(`{b}Sending artifact ${archiveName} ...`)
	try {
		const command = `scp -P ${port} ${archiveName} ${user}@${config.host}:/home/${project}/artifacts/`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	newLine()
	nicePrint(`{b}Deploying branch ${branchName} ...`)
	try {
		const command = `ssh -p ${port} ${user}@${host} "project-deploy ${project} ${branchName} ${dataBucket} ${domain}"`
		nicePrint(`{d}$ ${command}`)
		await execAsync(command, 3)
	}
	catch ( e ) {
		await archiveFile.delete()
		nicePrint(`{b/r}${e}`, { code: 1 })
	}

	await archiveFile.delete()
}