import { existsSync } from "node:fs";
import { BOT_FOLDER, COLOR } from "../Constants";
import { BotProcess } from "../typings";
import SpawnProcess, { BindListeners } from "../SpawnProcess";

export default {
	name: 'start',
	description: 'Start a specific bot process',
	usage: 'start <bot>',
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
		if (bot !== null) {
			console.log(COLOR.RED + `Bot "${name}" is already running`);
			return;
		}

		// check it exists in the bots folder
		if (!existsSync(`${BOT_FOLDER}/${name}`)) {
			console.log(COLOR.RED + 'Bot does not exists - Make sure the folder is in the "Bots" directory');
			return;
		}

		const process = SpawnProcess(bots, `${BOT_FOLDER}/${name}`, name);
		if (!process) return;

		BindListeners(bots, process, name);
	}
}