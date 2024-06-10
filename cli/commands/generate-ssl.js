import { execSync, nicePrint } from "@zouloux/cli";
import { untab } from "@zouloux/ecma-core";
import { Directory } from "@zouloux/files";
import { loadDotEnv } from "./_common.js";

export async function generateSSLCommand ( projectName, printSuccessMessage = true ) {
	// Test if mkcert is installed
	if ( !execSync(`mkcert --version`, 0) ) {
		nicePrint(untab(`
			{r/b}mkcert{/r} is not installed :
			{w}Install it with {w/b}brew install mkcert
		`), { code: 1 })
	}
	// Get hostname for .local domain
	const hostName = execSync(`hostname`).trim()
	// Empty and create proxy directory
	const certsPath = ".proxy/certs"
	const certsDirectory = await Directory.create( certsPath )
	if ( await certsDirectory.exists() )
		await certsDirectory.delete()
	await certsDirectory.create()
	// Generate and rename for nginx
	const domains = [`${projectName}.ssl.localhost`, `${hostName}.local`]
	nicePrint(`{b}Creating certificates ...`)
	domains.forEach( domain => {
		nicePrint(`{d}- {b}${domain}{/}`)
		execSync(`mkcert ${domain}`, 0, { cwd: certsPath, stdio: "ignore" })
		execSync(`cd ${certsPath} && mv "${domain}-key.pem" "${domain}.key"`)
		execSync(`cd ${certsPath} && mv "${domain}.pem" "${domain}.crt"`)
	})
	// Patch hostname in dot env
	const { dotEnvFile } = await loadDotEnv()
	let dotEnvContent = await dotEnvFile.content()
	dotEnvContent = dotEnvContent.replace(/^PASTA_HOSTNAME=.*$/gm, `PASTA_HOSTNAME=${hostName}`);
	dotEnvFile.content(dotEnvContent)
	await dotEnvFile.save()
	if ( printSuccessMessage )
		nicePrint(`{b/g}SSL certificates saved in ${certsPath}`)
}