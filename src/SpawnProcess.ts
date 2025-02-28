import ChildProcess from "child_process";
import fs from "fs";
import Log from "./Logs";

// /home/musicmaker/Desktop/Dev/SelfHostManager/build/../Bots/test -> /Bots/test
function CleanPath(path: string) {
	const parts = path.split('/');
	const index = parts.indexOf('Bots');
	if (index === -1) return path;
	return './' + parts.slice(index).join('/');
}

export default function (cache: Map<string, ChildProcess.ChildProcess>, botFolder: string, alias?: string) {

	const name = alias || botFolder.split('/').pop() as string;

	Log('INFO', `Spawning bot at "${CleanPath(botFolder)}"`);

	const stats = fs.lstatSync(botFolder);
	if (!stats.isDirectory()) {
		Log('ERROR', `Bot path "${CleanPath(botFolder)}" is not a directory`);
		return;
	}

	let entryFile: string;
	if (!fs.existsSync(`${botFolder}/package.json`)) {
		entryFile = `${botFolder}/index.js`;
	} else {
		const pkg = require(`${botFolder}/package.json`);
		entryFile = `${botFolder}/${pkg.main || 'index.js'}`;
	}

	if (!fs.existsSync(entryFile)) {
		Log('ERROR', `Could not find entry for bot at "${CleanPath(botFolder)}" - Make sure it has a valid package.json`);
		return;
	}

	const bot = ChildProcess.fork(entryFile, [], {
		cwd: botFolder,
		stdio: 'pipe'
	});

	cache.set(name, bot);

	return bot;
}