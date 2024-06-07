import { File } from "@zouloux/files"
import { nicePrint } from "@zouloux/cli";
import { parse } from "yaml"



export async function readProjectConfig ( fileName ) {
	const configFile = await File.create( fileName )
	if ( ! await configFile.exists() )
		nicePrint(`{b/r}${fileName} file not found in ${process.cwd}`, { code: 1 })
	try {
		await configFile.load()
	}
	catch ( e ) {
		nicePrint(`{r}Unable to load {b}${fileName}{/r} file.\n${e.message}`, { code: 1 })
	}
	let config
	try {
		config = parse( configFile.data )
	}
	catch ( e ) {
		nicePrint(`{r}Invalid {b}${fileName}{/r} file. Syntax error.\n${e.message}`, { code: 1 })
	}
	if ( typeof config.environments !== "object" )
		nicePrint(`{r}Invalid {b}${fileName}{/r} file. Missing {b/r}environments{/r} object.`, { code: 1 })

	return config
}

export async function listConfigEnvironments ( config ) {

}

export async function processConfigEnvironment ( config, environmentName ) {

}