import { execSync, newLine, askInput, nicePrint, execAsync, askList, clearScreen } from "@zouloux/cli";
import { getPreferences } from "./_common.js";
import { spawn } from "node:child_process";

function getServerStats ( endpoint ) {
	const { user, host, port } = parseServerEndpoint( endpoint )
	const command = `ssh -p ${port} ${user}@${host} "/root/stats.sh"`
	const rawStats = execSync(command)
	return JSON.parse( rawStats )
}

function parseServerEndpoint ( endpoint ) {
	let parts = endpoint.split("@")
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

function showServerStats ( statsData ) {
	const terminalWidth = process.stdout.columns;
	const barWidth = terminalWidth - 30;
	// CPU
	const cpuPercentage = statsData.cpuUsed / (statsData.cpuTotal * 100) * 100
	const cpuUsageBar = generateRamUsageBar(cpuPercentage, barWidth);
	console.log(` CPU usage: ${cpuUsageBar} ${cpuPercentage.toFixed(2)}%`);
	// RAM
	const ramPercentage = statsData.ramUsed / statsData.ramTotal * 100
	const ramUsageBar = generateRamUsageBar(ramPercentage, barWidth);
	console.log(` RAM usage: ${ramUsageBar} ${ramPercentage.toFixed(2)}%`);
	// DISK
	const diskPercentage = statsData.diskUsed / statsData.diskTotal * 100
	const diskUsageBar = generateRamUsageBar(diskPercentage, barWidth);
	console.log(` DSK usage: ${diskUsageBar} ${diskPercentage.toFixed(2)}%`);
	newLine()
	newLine()
}

function showAllServerStats () {
	nicePrint(`{d}Loading all server stats ...`)
	const serverStats = {}
	const servers = listRegisteredServers()
	Object.keys( servers ).forEach( key => {
		serverStats[ key ] = getServerStats( servers[ key ] )
	})
	clearScreen( false )
	Object.keys( serverStats ).forEach( key => {
		nicePrint(`{b}${key}`)
		const statsData = serverStats[ key ]
		showServerStats( statsData )
	})
}

function listRegisteredServers () {
	const preferences = getPreferences()
	return preferences.servers ?? {}
}

async function askServer ( serverName ) {
	const servers = listRegisteredServers()
	if ( serverName in servers )
		return serverName
	return await askList("Which server ?", Object.keys(servers), { returnType: "value" })
}

function getServerByName ( serverName ) {
	const servers = listRegisteredServers()
	return servers[ serverName ]
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
		const endpoint = await askInput("Server endpoint ( user@host:port )")
		const { port, user, host } = parseServerEndpoint( endpoint )
		// Call hostname on this server
		const command = `ssh -p ${port} ${user}@${host} "hostname"`
		nicePrint(`{d}$ ${command}`)
		let hostname = ""
		const reconstructedEndpoint = `${user}@${host}:${port}`
		try {
			hostname = await execAsync( command, 3 )
			hostname = hostname.trim()
		}
		// Cannot connect
		catch ( e ) {
			nicePrint(`{b/r}Unable to connect to ${reconstructedEndpoint}`, { code: 1 })
		}
		// Invalid endpoint
		if ( !hostname )
			nicePrint(`{b/r}Invalid hostname on ${reconstructedEndpoint}`, { code: 1 })
		// Save server to preferences
		const preferences = getPreferences()
		const servers = preferences.servers ?? {}
		servers[ hostname ] = reconstructedEndpoint
		preferences.servers = servers
		preferences.save()
	}
	else if ( action === "remove" ) {
		const server = await askServer( serverName )
		console.log( server );
		// todo : ask confirm
	}

	// ------------------------------------------------------------------------- CONNECT
	else if ( action === "connect" ) {
		serverName = await askServer( serverName )
		const server = getServerByName( serverName )
		const { user, host, port } = parseServerEndpoint( server )
		const sshCommand = 'ssh';
		const sshArgs = [ '-p', port, `${user}@${host}` ];
		nicePrint(`{d}Opening SSH connexion to ${host} ...`)
		spawn(sshCommand, sshArgs, { stdio: 'inherit' });
	}

	// ------------------------------------------------------------------------- STATS
	else if ( action === "stats" ) {
		serverName = await askServer( serverName )
		const server = getServerByName( serverName )
		const serverStats = getServerStats( server )
		showServerStats( serverStats )
	}
	else if ( action === "all-stats" ) {
		async function updateStatsScreen () {
			showAllServerStats()
			updateStatsScreen()
		}
		updateStatsScreen()
	}

	// ------------------------------------------------------------------------- MENU
	else {
		const choice = await askList(`Which action ?`, {
			list: nicePrint(`list - {d}List all registered Pasta Servers`, { output: "return" }).trim(),
			add: nicePrint(`add - {d}Register a new Pasta Server`, { output: "return" }).trim(),
			remove: nicePrint(`remove - {d}Unregister a Pasta Server`, { output: "return" }).trim(),
			connect: nicePrint(`connect - {d}Start SSH connexion to a Pasta Server`, { output: "return" }).trim(),
			stats: nicePrint(`stats - {d}Grab stats of a Pasta Server`, { output: "return" }).trim(),
			'all-stats': nicePrint(`all-stats - {d}Grab stats all registered servers`, { output: "return" }).trim(),
		}, { returnType: "key" })
		serverCommand( choice )
	}
}