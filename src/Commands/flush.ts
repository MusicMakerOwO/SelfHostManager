import { FlushLogs } from "../Logs"

export default {
	name: 'flush',
	description: 'Manually flush all logs to disk',
	usage: 'flush',
	async execute() {
		await FlushLogs();
	}
}