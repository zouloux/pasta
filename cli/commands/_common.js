import { File } from "@zouloux/files"
import { askList, nicePrint } from "@zouloux/cli";
import { parse } from "yaml"

const dotEnvFileName = ".env"
const configFileName = "pasta.yaml"

// ----------------------------------------------------------------------------- DOT ENV

export async function loadDotEnv () {
	const dotEnvFile = await File.create( dotEnvFileName )
	if ( !await dotEnvFile.exists() )
		nicePrint(`{b/r}.env{/r} file not found. Please run in project directory.`, { code: 1 })
	let dotEnvContent
	try {
		await dotEnvFile.load()
		dotEnvContent = dotEnvFile.dotEnv()
	}
	catch (e) {
		nicePrint(`{r}Error while loading {b/r}.env{/r} file.\n${e.message}`, { code: 1 })
	}
	return { dotEnvFile, dotEnvContent }
}

export async function getProjectNameFromDotEnv () {
	const { dotEnvContent } = await loadDotEnv()
	if ( !dotEnvContent.PASTA_PROJECT_NAME )
		nicePrint(`{r}Missing {b/r}PASTA_PROJECT_NAME{/r} property in {b/r}.env{/r} file.`, { code: 1 })
	return dotEnvContent.PASTA_PROJECT_NAME
}

// ----------------------------------------------------------------------------- CONFIG

export async function hasConfig () {
	const configFile = await File.create( configFileName )
	return await configFile.exists()
}

export async function loadConfig (  ) {
	const config = await readProjectConfig( configFileName )
	if ( !config ) {
		nicePrint(`{b/r}${configFileName} file not found in ${process.cwd}`, { code: 1 })
	}
	return config
}

export async function readProjectConfig () {
	const configFile = await File.create( configFileName )
	if ( ! await configFile.exists() )
		nicePrint(`{b/r}${configFileName} file not found in ${process.cwd}`, { code: 1 })
	try {
		await configFile.load()
	}
	catch ( e ) {
		nicePrint(`{r}Unable to load {b}${configFileName}{/r} file.\n${e.message}`, { code: 1 })
	}
	let config
	try {
		config = parse( configFile.data )
	}
	catch ( e ) {
		nicePrint(`{r}Invalid {b}${configFileName}{/r} file. Syntax error.\n${e.message}`, { code: 1 })
	}
	if ( typeof config.branches !== "object" )
		nicePrint(`{r}Invalid {b}${configFileName}{/r} file. Missing {b/r}branches{/r} object.`, { code: 1 })
	return config
}

export function listConfigBranches ( config ) {
	return Object.keys( config.branches ).filter( f => !f.startsWith("_") )
}

export async function processConfigBranch ( config, branch ) {
	const defaults = config.branches._defaults ?? {}
	const envConfig = config.branches[ branch ]
	return { ...defaults, ...envConfig }
}

export async function getPastaEnvNameFromCLI ( config, branch ) {
	const branches = listConfigBranches( config )
	if ( branch && !branches.includes(branch) )
		nicePrint(`{r}Pasta branch {b/r}${branch}{/} not found.`, { code: 1 })
	if ( !branch )
		branch = await askList(`Which branch ?`, branches, { returnType: "value" })
	return branch
}

export async function targetBranchConfig ( branchName ) {
	const config = await loadConfig()
	branchName = await getPastaEnvNameFromCLI( config, branchName )
	const branchConfig = await processConfigBranch( config, branchName )
	return {
		branch: branchName,
		config: {
			domain: "",
			port: 22,
			data: branchName,
			user: branchConfig.project,
			password: "",
			...branchConfig,
		}
	}
}

// ----------------------------------------------------------------------------- KEY

export async function getKeyCommand ( keyPath ) {
	if ( !keyPath )
		return ""
	const keyFile = await File.create( keyPath )
	const keyExists = await keyFile.exists()
	if ( !keyExists ) {
		// nicePrint(`{r}Key {b/r}${keyPath}{/}{r} not found.`, { code: 1 })
		nicePrint(`{o}Key {b/r}${keyPath}{/}{o} not found, falling back to ssh-agent.`)
		return ""
	}
	return ` -i ${keyFile.path} -o IdentitiesOnly=yes`
}