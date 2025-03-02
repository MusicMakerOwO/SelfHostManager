import { PrintPrompt, ReadBuffer, SetBuffer } from "../ScreenUtils";

export default {
	ctrl: true,
	shift: false,
	alt: false,
	key: 'w', // backspace works too due to a package bug lol
	description: 'Deletes the last word in the input',
	execute() {
		const words = ReadBuffer().split(' ');
		words.pop();
		SetBuffer(words.join(' '));
		PrintPrompt();
	}
}