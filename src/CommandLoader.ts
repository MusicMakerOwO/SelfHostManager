import ReadFolder from "./ReadFolder";
import { CommandFile } from "./typings";

export default function CommandLoader(cache: Map<string, CommandFile>, folder: string) {
	const files = ReadFolder(folder);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (!file.endsWith('.js')) continue;
		
		let command = require(`${folder}/${file}`) as CommandFile | { default: CommandFile };
		if ('default' in command) command = command.default;

		try {
			if (typeof command !== 'object') throw 'Command is not an object';

			if (typeof command.name !== 'string') throw 'Command name must be a string - Got ' + typeof command.name;
			if (typeof command.description !== 'string') throw 'Command description must be a string - Got ' + typeof command.description;
			if (typeof command.usage !== 'string') throw 'Command usage must be a string - Got ' + typeof command.usage;
			if (typeof command.execute !== 'function') throw 'Command execute must be a function - Got ' + typeof command.execute;

			cache.set(command.name, command);
		} catch (err) {
			console.error(`Error loading command ${file}: ${err}`);
		}
	}
}