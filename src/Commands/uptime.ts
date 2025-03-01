export default {
	name: 'uptime',
	description: 'Get the uptime of the manager',
	usage: 'uptime',
	execute () {
		const uptime = process.uptime();
		const days = Math.floor(uptime / 86400);
		const hours = Math.floor(uptime / 3600) % 24;
		const minutes = Math.floor(uptime / 60) % 60;
		const seconds = Math.floor(uptime) % 60;

		let time = '';

		if (days > 0) time += `${days}d `;
		if (hours > 0) time += `${hours}h `;
		if (minutes > 0) time += `${minutes}m `;
		if (seconds > 0) time += `${seconds}s`;

		console.log(`Uptime: ${time}`);
	}
}