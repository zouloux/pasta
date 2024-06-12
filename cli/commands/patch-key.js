import { execSync, nicePrint } from "@zouloux/cli";
import { File } from "@zouloux/files";
import { pastaConfigFileName } from "./_common.js";


export async function patchKey ( config ) {
	const keyPath = config.key ?? ""
	if ( !keyPath )
		nicePrint(`{b/r}No key specified in ${pastaConfigFileName}`, { code: 1 })
	const keyFile = await File.create( keyPath )
	const keyExists = await keyFile.exists()
	if ( !keyExists )
		nicePrint(`{r}Key {b/r}${keyPath}{/}{r} not found.`, { code: 1 })
	nicePrint(`{b/o}Patching key ${keyPath}...`)
	// Patch key content
	await keyFile.load()
	const patchedContent = keyFile.content().trim().split( "\n" ).map( l => l.trim() ).join("\n")
	keyFile.content( patchedContent + "\n" ) // important, key need a last trailing line
	await keyFile.save()
	// Patch file chmod
	execSync(`chmod 0600 ${keyPath}`, 3)
	nicePrint(`{g/b}Done`)
}
