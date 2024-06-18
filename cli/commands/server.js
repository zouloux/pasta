import { execSync, newLine, askInput, nicePrint, execAsync, askList, clearScreen } from "@zouloux/cli";
import { getPreferences } from "./_common.js";
import { spawn } from "node:child_process";
import { delay } from "@zouloux/ecma-core";
import { filesize, partial } from "filesize";

function getServerStats ( endpoint ) {
	const { user, host, port } = parseServerEndpoint( endpoint )
	const command = `ssh -p ${port} ${user}@${host} "host-stats-json"`
	const rawStats = execSync(command)
	try {
		return JSON.parse( rawStats )
	}
	catch (e) {
		return false
	}
}

export function parseServerEndpoint ( endpoint ) {
	let parts = endpoint.toLowerCase().split("@")
	if ( !parts[1] ) {
		parts[1] = parts[0]
		parts[0] = "root"
	}
	parts[1] = parts[1].split(":")
	let [ user, host, port ] = parts.flat()
	port ??= 22
	return { user, host, port }
}

function generateRamUsageBar(usagePercent, width) {
	const filledLength = Math.round((width * usagePercent) / 100);
	const emptyLength = width - filledLength;
	return '[' + '█'.repeat(filledLength) + ' '.repeat(emptyLength) + ']';
}

const roundedFilesize = partial({ round: 0 })

function showServerStats ( statsData, serverName ) {
	if ( !statsData ) {
		nicePrint(`{b/r}Unable to get stats from ${serverName}`)
		return
	}
	const terminalWidth = process.stdout.columns;
	const barWidth = terminalWidth - 50;
	// CPU
	const cpuPercentage = statsData.cpuUsed / (statsData.cpuTotal * 100) * 100
	const cpuUsageBar = generateRamUsageBar(cpuPercentage, barWidth);
	let cpuText = cpuPercentage.toFixed(2)
	if ( cpuText < 10 ) cpuText = `0${cpuText}`
	console.log(` CPU usage: ${cpuUsageBar} ${cpuText}% - SWP: ${roundedFilesize(statsData.swapUsed ?? 0)}`);
	// RAM
	const ramPercentage = statsData.ramUsed / statsData.ramTotal * 100
	const ramUsageBar = generateRamUsageBar(ramPercentage, barWidth);
	const ramUsageText = roundedFilesize( statsData.ramUsed )
	const ramTotalText = roundedFilesize( statsData.ramTotal )
	const ramCombinedText = `${ramUsageText} / ${ramTotalText}`
	console.log(` RAM usage: ${ramUsageBar} ${ramPercentage.toFixed(2)}% - ${ramCombinedText}`);
	// SWAP
	// const swapPercentage = statsData.swapUsed / statsData.swapTotal * 100
	// const swapUsageBar = generateRamUsageBar(swapPercentage, barWidth);
	// console.log(` SWAP usage: ${swapUsageBar} ${swapPercentage.toFixed(2)}%`);
	// DISK
	const diskPercentage = statsData.diskUsed / statsData.diskTotal * 100
	const diskUsageBar = generateRamUsageBar(diskPercentage, barWidth);
	const diskUsageText = filesize( statsData.diskUsed )
	const diskTotalText = roundedFilesize( statsData.diskTotal )
	const diskCombinedText = `${diskUsageText} / ${diskTotalText}`
	console.log(` DSK usage: ${diskUsageBar} ${diskPercentage.toFixed(2)}% - ${diskCombinedText}`);
	newLine()
	newLine()
}

function showAllServerStats () {
	nicePrint(`{d}Updating ...`)
	const serverStats = {}
	const servers = listRegisteredServers()
	Object.keys( servers ).forEach( serverName => {
		serverStats[ serverName ] = getServerStats( servers[ serverName ] )
	})
	clearScreen( false )
	Object.keys( serverStats ).forEach( serverName => {
		nicePrint(`{b}ℹ️ ${serverName}{d} - ${servers[serverName]}`)
		newLine()
		const statsData = serverStats[ serverName ]
		showServerStats( statsData, serverName )
	})
}

export function listRegisteredServers () {
	const preferences = getPreferences()
	return preferences.servers ?? {}
}

async function askServer ( serverName ) {
	const servers = listRegisteredServers()
	if ( serverName in servers )
		return serverName
	return await askList("Which registered server ?", Object.keys(servers), { returnType: "value" })
}

function getServerByName ( serverName ) {
	const servers = listRegisteredServers()
	return servers[ serverName ]
}

async function askForOtherServer () {
	return await askInput("Enter server endpoint ( user@host:port )")
}

export async function serverCommand ( action, serverName ) {

	// ------------------------------------------------------------------------- LIST SERVERS
	if ( action === "list" ) {
		const servers = listRegisteredServers()
		Object.keys(servers).forEach( serverName => {
			nicePrint(`{d}- ${serverName}`)
		})
	}

	// ------------------------------------------------------------------------- ADD / REMOVE SERVER
	else if ( action === "add" ) {
		// Ask for server endpoint to add
		const endpoint = serverName ?? await askForOtherServer()
		const { port, user, host } = parseServerEndpoint( endpoint )
		// Call hostname on this server
		const command = `ssh -p ${port} ${user}@${host} "hostname"`
		nicePrint(`{d}$ ${command}`)
		let hostname = ""
		const reconstructedEndpoint = `${user}@${host}:${port}`
		try {
			hostname = await execAsync( command, 0 )
			hostname = hostname.trim()
		}
		// Cannot connect
		catch ( e ) {
			console.error( e )
			nicePrint(`{b/r}Unable to connect to ${reconstructedEndpoint}`, { code: 1 })
		}
		// Invalid endpoint
		if ( !hostname )
			nicePrint(`{b/r}Invalid hostname on ${reconstructedEndpoint}`, { code: 1 })
		// Ask hostname and save
		async function handleHostname () {
			const preferences = getPreferences()
			const servers = preferences.servers ?? {}
			const baseHostname = hostname
			hostname = await askInput(`Optionally change server name`, { defaultValue: baseHostname, notEmpty: true })
			// Save server to preferences
			if ( hostname in servers ) {
				nicePrint(`{o/b}Name ${ hostname } is already used`)
				handleHostname()
				return
			}
			servers[ hostname ] = reconstructedEndpoint
			preferences.servers = servers
			preferences.save()
			nicePrint(`{b/g}Saved`)
		}
		handleHostname()
	}
	else if ( action === "remove" ) {
		serverName = await askServer( serverName )
		const answer = await askList(`Are you sure to remove ${serverName}?`, ['No', 'Yes'], { returnType: "index" })
		if ( answer === 0 )
			return
		const preferences = getPreferences()
		const servers = preferences.servers ?? {}
		delete servers[ serverName ]
		preferences.servers = servers
		preferences.save()
		nicePrint(`{b/g}Saved`)
	}

	// ------------------------------------------------------------------------- CONNECT
	else if ( action === "connect" ) {
		serverName = await askServer( serverName )
		const server = getServerByName( serverName )
		const { user, host, port } = parseServerEndpoint( server )
		const sshCommand = 'ssh';
		const sshArgs = [ '-p', port, `${user}@${host}` ];
		nicePrint(`Opening SSH connexion to ${host} ...`)
		nicePrint(`{d}$ ${sshCommand} ${sshArgs.join(" ")}`)
		spawn(sshCommand, sshArgs, { stdio: 'inherit' });
	}

	// ------------------------------------------------------------------------- STATS
	else if ( action === "stats" ) {
		serverName = await askServer( serverName )
		const server = getServerByName( serverName )
		const serverStats = getServerStats( server )
		showServerStats( serverStats, serverName )
	}
	else if ( action === "all-stats" ) {
		clearScreen(false)
		async function updateStatsScreen () {
			showAllServerStats()
			await delay(2)
			updateStatsScreen()
		}
		updateStatsScreen()
	}

	// ------------------------------------------------------------------------- MENU
	else {
		const choice = await askList(`Which server action ?`, {
			list: nicePrint(`list - {d}List all registered Pasta Servers`, { output: "return" }).trim(),
			add: nicePrint(`add - {d}Register a new Pasta Server`, { output: "return" }).trim(),
			remove: nicePrint(`remove - {d}Unregister a Pasta Server`, { output: "return" }).trim(),
			stats: nicePrint(`stats - {d}Grab stats of a Pasta Server`, { output: "return" }).trim(),
			'all-stats': nicePrint(`all-stats - {d}Grab stats all registered servers`, { output: "return" }).trim(),
		}, { returnType: "key" })
		serverCommand( choice )
	}
}