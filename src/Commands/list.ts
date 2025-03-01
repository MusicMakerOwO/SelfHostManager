import { COLOR } from "../Constants";
import { BotProcess } from "../typings";

export default {
	name: 'list',
	description: 'List all bots',
	usage: 'list [running|active|online|stopped|inactive|offline|all]',
	execute (args: string[], bots: Map<string, BotProcess | null>) {
		const selection = args[0] ?? 'all';

		const longestBotName = Math.max(...[...bots.keys()].map(name => name.length));

		let output = '';

		for (const [name, bot] of bots) {
			const isRunning = !!bot
			const selectedActive = selection === 'active' || selection === 'running' || selection === 'online';

			if (selection !== 'all' && selectedActive !== isRunning) continue;

			const color = isRunning ? COLOR.GREEN : COLOR.RED;

			output += `${name.padEnd(longestBotName)} - ${color}${isRunning ? 'Running' : 'Stopped'}${COLOR.RESET}${isRunning ? ` - PID: ${bot.pid}` : ''}\n`;
		}

		console.log(output.trim());
	}
}