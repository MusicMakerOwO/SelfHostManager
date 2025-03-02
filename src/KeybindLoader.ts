import ReadFolder from "./ReadFolder";
import { Key } from "./ScreenUtils";
import { KeybindFile } from "./typings";

export default function KeybindLoader(cache: Map<string, KeybindFile>, folder: string) {
	const files = ReadFolder(folder);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (!file.endsWith('.js')) continue;

		let keybind = require(file) as KeybindFile | { default: KeybindFile };
		if ('default' in keybind) keybind = keybind.default;

		try {
			if (typeof keybind !== 'object') throw 'Keybind is not an object';

			if (typeof keybind.ctrl !== 'boolean') throw 'Keybind ctrl must be a boolean - Got ' + typeof keybind.ctrl;
			if (typeof keybind.shift !== 'boolean') throw 'Keybind shift must be a boolean - Got ' + typeof keybind.shift;
			if (typeof keybind.alt !== 'boolean') throw 'Keybind alt must be a boolean - Got ' + typeof keybind.alt;
			if (typeof keybind.key !== 'string') throw 'Keybind key must be a string - Got ' + typeof keybind.key;
			if (typeof keybind.description !== 'string') throw 'Keybind description must be a string - Got ' + typeof keybind.description;
			if (typeof keybind.execute !== 'function') throw 'Keybind execute must be a function - Got ' + typeof keybind.execute;

			const key: Key = {
				ctrl: keybind.ctrl,
				shift: keybind.shift,
				meta: keybind.alt,
				name: keybind.key
			}

			const name = ResolveKeybindName(key);

			cache.set(name, keybind);
		} catch (err) {
			console.error(`Error loading keybind ${file}: ${err}`);
		}
	}
}

export function ResolveKeybindName(key: Key) {
	let name = '';
	if (key.ctrl) name += 'ctrl+';
	if (key.meta) name += 'alt+'; // meta is the same as alt
	if (key.shift) name += 'shift+';
	name += key.name;
	return name;
}