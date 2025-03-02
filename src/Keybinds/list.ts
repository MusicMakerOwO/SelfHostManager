export default {
	ctrl: true,
	shift: false,
	alt: false,
	key: 'l',
	description: 'Short for "list" command',
	execute(OnInput: Function) {
		process.stdout.write('list'); // just makes it look like it was typed in lol
		OnInput('list'); // mimic user input
	}
}