import { ClearBuffer, PrintPrompt } from "../ScreenUtils";

export default {
	ctrl: true,
	shift: false,
	alt: false,
	key: 'u',
	description: 'Clears the current command',
	execute() {
		ClearBuffer();
		PrintPrompt();
	}
}