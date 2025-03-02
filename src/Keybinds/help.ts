export default {
	ctrl: true,
	shift: false,
	alt: false,
	key: 'k',
	description: 'Shows this menu',
	execute(OnInput: Function) {
		process.stdout.write('keybinds'); // just makes it look like it was typed in lol
		OnInput('keybinds'); // mimic user input
	}
}