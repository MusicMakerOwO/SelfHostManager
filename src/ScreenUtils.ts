import { COLOR } from "./Constants";

const keypress = require('keypress');
keypress(process.stdin);

export const PROMPT = `${COLOR.CYAN}>> ${COLOR.RESET}`;

let inputBuffer = '';

export function Clear() {
	process.stdout.write('\x1B[2J\x1B[0f');
}

export function ClearLine() {
	process.stdout.write('\x1B[2K');
}

export function CursorUp(n: number) {
	process.stdout.write(`\x1B[${n}A`);
}

export function CursorDown(n: number) {
	process.stdout.write(`\x1B[${n}B`);
}

export function CursorToBeginning() {
	process.stdout.write('\r');
}

export function PrintPrompt() {
	ClearLine();
	CursorToBeginning();
	process.stdout.write(PROMPT + inputBuffer);
}

export function AppendBuffer(str: string) {
	inputBuffer += str;
}

export function ReadBuffer() {
	return inputBuffer;
}

export function ClearBuffer() {
	inputBuffer = '';
}

let InputCallback : ((input: string) => void) | null = null;
export function OnInput(fn: (input: string) => void) {
	InputCallback = fn;
}

process.stdin.setRawMode(true);
process.stdin.resume();

type Key = {
	name: string;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
	sequence: string;
};

const REGEX_PRINTABLE = /^[ -~]$/;

process.stdin.on('keypress', (character: string | undefined, key: Key) => {
	if (key.ctrl && key.name === 'c') {
		process.emit('SIGINT');
		return;
	}

	// Crtl + backspace
	if (key.ctrl && key.sequence === '\x17') {
		// delete the last word
		const words = inputBuffer.split(' ');
		if (words.length >= 1) {
			words.pop();
			inputBuffer = words.join(' ');
		}
		PrintPrompt();
		return;
	}

	if (key.name === 'return') {
		if (InputCallback) InputCallback(inputBuffer);
		ClearBuffer();
		PrintPrompt();
		return;
	}

	if (key.name === 'backspace' || key.name === 'delete') {
		inputBuffer = inputBuffer.slice(0, -1);
		PrintPrompt();
		return;
	}

	let isPrintable = REGEX_PRINTABLE.test(character || '');
	if (isPrintable) {
		AppendBuffer(character as string);
		PrintPrompt();
		return;
	}
});