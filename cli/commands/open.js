import qrTerminal from "qrcode-terminal"
import { execSync, newLine, nicePrint } from "@zouloux/cli";

export function openCommand ( projectName, localHostname ) {
	localHostname ??= execSync('hostname').trim()
	const localURL = `https://${localHostname}.local`
	newLine()
	nicePrint(`
		Run {b}${projectName}{/} project locally
		{d}- Start project with {b}docker compose up
		{d}- Open {b}https://${projectName}.ssl.localhost{/d} to test locally
		{d}- Open {b}${localURL}{/d} to test from other devices on the same network
	`)
	newLine()
	qrTerminal.setErrorLevel('Q');
	qrTerminal.generate(localURL, { small: true });
}