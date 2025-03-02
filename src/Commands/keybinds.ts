import { KeybindFile } from "../typings";

export default {
	name: 'keybinds',
	description: 'Get a list of all keybinds',
	usage: 'keybinds',
	execute (keybinds: Map<string, KeybindFile>) {
		let output = '';

		const longestKeybindName = Math.max(...[...keybinds.keys()].map(name => name.length));

		for (const [keybind, data] of keybinds) {;
			output += `${keybind.padEnd(longestKeybindName)} - ${data.description}\n`;
		}

		console.log(output.trim());
	}
}