export default {
	ctrl: true,
	shift: false,
	alt: false,
	key: 's',
	description: 'Short for "flush" command',
	execute(OnInput: Function) {
		process.stdout.write('flush'); // just makes it look like it was typed in lol
		OnInput('flush'); // mimic user input
	}
}