import qrTerminal from "qrcode-terminal"
import { execSync, newLine, nicePrint } from "@zouloux/cli";
import { getMainIp } from "./_common.js";
import { repeat } from "@zouloux/ecma-core";

export function openCommand ( projectName, localHostname, showQR = true ) {
	localHostname ??= execSync('hostname').trim()
	const localURL = `http://${localHostname}.local`
	const localIP = getMainIp()
	let lines = `
		Run {b}${projectName}{/} project locally
		{d}- Start project with {b}docker compose up
		{d}- Open {b}https://${projectName}.ssl.localhost{/d} to test locally
		{d}- Open {b}${localURL}{/d} to test from other devices on the same network
	`
	if ( localIP ) {
		lines += `	{d}- Open {b}http://${localIP}{/d} if .local does not works`
	}
	newLine()
	nicePrint( lines )
	newLine()
	if ( showQR ) {
		qrTerminal.setErrorLevel('Q')
		let localURLQR
		let localIPQR
		qrTerminal.generate(localURL, { small: true }, o => localURLQR = o)
		if ( !localIP ) {
			console.log( localURLQR )
			return
		}
		const localIPAddr = 'http://'+localIP
		qrTerminal.generate(localIPAddr, { small: true }, o => localIPQR = o)
		const firstQRLines = localURLQR.split("\n")
		const secondQRLines = localIPQR.split("\n")
		const firstWidth = firstQRLines[0].length
		const gap = 12
		const total = Math.max(firstQRLines.length, secondQRLines.length)
		console.log( localURL + repeat((firstWidth - localURL.length) + gap) + localIPAddr)
		for ( let i = 0; i < total; i++ ) {
			const firstQRLine = firstQRLines[i]
			const secondQRLine = secondQRLines[i]
			if ( !secondQRLine && firstQRLine )
				console.log( firstQRLine )
			else if ( !firstQRLine && secondQRLine )
				console.log( repeat( firstWidth + gap ) + secondQRLine )
			else if ( firstQRLine && secondQRLine )
				console.log( firstQRLine + repeat(gap) + secondQRLine )
		}
		newLine()
	}
}