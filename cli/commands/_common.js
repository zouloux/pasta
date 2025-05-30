import { File } from "@zouloux/files"
import { askList, nicePrint } from "@zouloux/cli";
import { parse } from "yaml"
import Preferences from "preferences"
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { patchKey } from "./patch-key.js";
import { networkInterfaces } from "node:os";

const dotEnvFileName = ".env"
export const pastaConfigFileName = "pasta.yaml"
export const currentServerVersion = "1.0"

// ----------------------------------------------------------------------------- PACKAGE

export function relativeDirname ( importMetaURL ) {
	const __filename = fileURLToPath(import.meta.url);
	return dirname(__filename);
}

export function getPackageVersion() {
	try {
		const filePath = join(relativeDirname(import.meta.url), '../', 'package.json');
		const data = readFileSync(filePath, 'utf8');
		const packageJson = JSON.parse(data);
		return packageJson.version;
	} catch (error) {
		console.error('Error reading package.json:', error);
		return null;
	}
}

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
	const configFile = await File.create( pastaConfigFileName )
	return await configFile.exists()
}

export async function loadConfig (  ) {
	const config = await readProjectConfig( pastaConfigFileName )
	if ( !config ) {
		nicePrint(`{b/r}${pastaConfigFileName} file not found in ${process.cwd()}`, { code: 1 })
	}
	return config
}

export async function readProjectConfig () {
	const configFile = await File.create( pastaConfigFileName )
	if ( ! await configFile.exists() )
		nicePrint(`{b/r}${pastaConfigFileName} file not found in ${process.cwd()}`, { code: 1 })
	try {
		await configFile.load()
	}
	catch ( e ) {
		nicePrint(`{r}Unable to load {b}${pastaConfigFileName}{/r} file.\n${e.message}`, { code: 1 })
	}
	let config
	try {
		config = parse( configFile.data )
	}
	catch ( e ) {
		nicePrint(`{r}Invalid {b}${pastaConfigFileName}{/r} file. Syntax error.\n${e.message}`, { code: 1 })
	}
	if ( typeof config.branches !== "object" )
		nicePrint(`{r}Invalid {b}${pastaConfigFileName}{/r} file. Missing {b/r}branches{/r} object.`, { code: 1 })
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
	if ( typeof branch === "string" ) {
		const hasSlash = branch.indexOf("/") >= 0
		if ( !hasSlash && !branches.includes(branch) )
			nicePrint(`{r}Branch {b/r}${branch}{/}{r} not found in {r/b}${pastaConfigFileName}{/}{r}.`, { code: 1 })
		if ( hasSlash ) {
			const splitBranch = branch.split("/")
			const masterBranch = splitBranch[0]
			const subBranch = splitBranch[1]
			if ( !branches.includes(masterBranch) )
				nicePrint(`{r}Branch {b/r}${branch}{/}{r} not found in {r/b}${pastaConfigFileName}{/}{r}.`, { code: 1 })
			if ( !config.branches[ masterBranch ].allowSubBranches )
				nicePrint(`{r}Branch {b/r}${branch}{/}{r} does not allow sub branches in {r/b}${pastaConfigFileName}{/}{r}.`, { code: 1 })
			return [ masterBranch, subBranch ]
		}
	}
	else
		branch = await askList(`Which branch ?`, branches, { returnType: "value" })
	return [ branch, "" ]
}

export async function targetBranchConfig ( _branchName ) {
	const config = await loadConfig()
	const [ branchName, subBranchName ] = await getPastaEnvNameFromCLI( config, _branchName )
	const branchConfig = await processConfigBranch( config, branchName )
	if ( Array.isArray(branchConfig.alias) )
		branchConfig.alias = branchConfig.alias.join(",")
	return {
		branch: branchName,
		subBranch: subBranchName,
		config: {
			version: (config.version ?? '1.0') + '', // default + force string
			domain: "",
			port: 22,
			data: branchName,
			user: branchConfig.project,
			swapMethod: "up-down",
			password: "",
			verbose: "0",
			alias: "",
			syncExclude: [],
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
	if ( !keyExists )  {
		nicePrint(`{o}Key {b/r}${keyPath}{/}{o} not found, falling back to ssh-agent.`)
		return ""
	}
	await patchKey( keyFile, keyPath )
	return ` -i ${keyFile.path} -o IdentitiesOnly=yes`
}

// ----------------------------------------------------------------------------- PREFERENCES

export function getPreferences () {
	return new Preferences('zouloux.pasta', {
		ready: false
	}, {
		encrypt: false
	})
}

// ----------------------------------------------------------------------------- IP

export function getMainIp () {
	const interfaces = networkInterfaces();
	for ( const interfaceName in interfaces )
		for ( const iface of interfaces[interfaceName] )
			if ( iface.family === 'IPv4' && !iface.internal )
				return iface.address;
	return null;
}

