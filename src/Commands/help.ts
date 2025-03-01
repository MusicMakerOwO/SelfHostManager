import { CommandFile } from "../typings";

export default {
	name: 'help',
	description: 'Get a list of all commands',
	usage: 'help',
	execute (commands: Map<string, CommandFile>) {
		let output = '';

		const longestCommandName = Math.max(...[...commands.keys()].map(name => name.length));

		for (const command of commands.values()) {
			output += `${command.name.padEnd(longestCommandName)} - ${command.description}\n`;
		}

		console.log(output);
	}
}