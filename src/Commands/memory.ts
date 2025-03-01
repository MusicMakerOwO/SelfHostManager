export default {
	name: 'memory',
	description: 'Get the memory usage of the manager',
	usage: 'memory',
	execute () {
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`Memory Usage: ${Math.round(used * 100) / 100}MB`);
	}
}