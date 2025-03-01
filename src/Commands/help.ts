import { CommandFile } from "../typings";
import { COLOR } from "../Constants";

export default {
	name: 'help',
	description: 'Get a list of all commands',
	usage: 'help [command]',
	execute (commands: Map<string, CommandFile>, args: string[]) {

		if (args.length > 0) {
			const command = commands.get(args[0]);
			if (!command) {
				console.log('Command not found');
				return;
			}

			console.log(`Name: ${command.name}`);
			console.log(`Description: ${command.description}`)
			console.log(`Usage: ${command.usage}`);
			return;
		}

		let output = '';

		const longestCommandName = Math.max(...[...commands.keys()].map(name => name.length));

		for (const command of commands.values()) {
			output += `${command.name.padEnd(longestCommandName)} - ${command.description}\n`;
		}

		output += COLOR.MAGENTA + "== Use 'help [command]' to get more information about a command ==";

		console.log(output);
	}
}