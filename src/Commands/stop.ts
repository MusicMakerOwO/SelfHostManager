import { COLOR } from "../Constants";
import { BotProcess } from "../typings";

export default {
	name: 'stop',
	description: 'Stop a specific bot process',
	usage: 'stop <bot>',
	execute (bots: Map<string, BotProcess>, args: string[]) {
		const name = args[0];
		if (!name) {
			console.log('Please provide a bot name');
			return;
		}

		if (!bots.has(name.toLowerCase())) {
			console.log('Bot not found');
			return;
		}

		const bot = bots.get(name.toLowerCase())!;
		if (bot === null) {
			console.log(COLOR.RED + `Bot "${name}" is not running` + COLOR.RESET);
			return;
		}

		bot.kill('SIGINT');
	}
}