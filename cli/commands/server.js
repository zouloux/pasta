import { clearScreen, execSync, banner, newLine, askInput, nicePrint, execAsync, askList } from "@zouloux/cli";
import { delay } from "@zouloux/ecma-core";
import { getPreferences } from "./_common.js";


const servers = {
}

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

function printServerStats ( stats ) {

}

function generateRamUsageBar(usagePercent, width) {
	const filledLength = Math.round((width * usagePercent) / 100);
	const emptyLength = width - filledLength;
	return '[' + '█'.repeat(filledLength) + ' '.repeat(emptyLength) + ']';
}

function showAllServerStats () {
	console.log("Loading stats ...")
	const serverStats = {}
	Object.keys( servers ).forEach( key => {
		serverStats[ key ] = getServerStats( servers[ key ] )
	})
	clearScreen( false )
	const terminalWidth = process.stdout.columns;
	Object.keys( serverStats ).forEach( key => {
		newLine()
		banner(key, terminalWidth - 2)
		newLine()
		const statsData = serverStats[ key ]
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
	})
}

async function askServer ( serverName ) {
	const preferences = getPreferences()
	const servers = preferences.servers ?? {}
	if ( serverName in servers )
		return serverName
	return await askList("Which server ?", servers, { returnType: "key" })
}

export async function serverCommand ( action, serverName ) {

	console.log( action );

	if ( action === "list" ) {
		const preferences = getPreferences()
		const servers = preferences.servers ?? {}
		Object.keys(servers).forEach( serverName => {
			console.log("- "+serverName)
		})
	}
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
	else if ( action === "stats" ) {
		// console.log("STATS", serverName)
		const server = servers[ serverName ]
		// console.log( server );

		// console.log( user, host, port );

		// console.log( command );
		// console.log( r );

		// console.log( statsData );

		async function updateStatsScreen () {
			showAllServerStats()
			// await delay(1)
			updateStatsScreen()
		}
		updateStatsScreen()
	}
}