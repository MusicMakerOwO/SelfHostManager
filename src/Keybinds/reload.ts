export default {
	ctrl: true,
	shift: false,
	alt: false,
	key: 'r',
	description: 'Short for "reload" command',
	execute(OnInput: Function) {
		process.stdout.write('reload'); // just makes it look like it was typed in lol
		OnInput('reload'); // mimic user input
	}
}