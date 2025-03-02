import ChildProcess from "child_process";
import fs from "fs";
import Log from "./Logs";
import { BotProcess } from "./typings";

// /home/musicmaker/Desktop/Dev/SelfHostManager/build/../Bots/test -> /Bots/test
function CleanPath(path: string) {
	const parts = path.split('/');
	const index = parts.indexOf('Bots');
	if (index === -1) return path;
	return './' + parts.slice(index).join('/');
}

export default function (cache: Map<string, any>, botFolder: string, alias?: string) {

	const name = alias || botFolder.split('/').pop() as string;

	Log('INFO', `Spawning bot at "${CleanPath(botFolder)}"`);

	let stats = fs.lstatSync(botFolder);
	if (stats.isSymbolicLink()) {
		botFolder = fs.realpathSync(botFolder);
		stats = fs.lstatSync(botFolder);
	}

	if (!stats.isDirectory()) {
		Log('ERROR', `Bot path "${CleanPath(botFolder)}" is not a directory`);
		return;
	}

	let entryFile: string;
	if (!fs.existsSync(`${botFolder}/package.json`)) {
		entryFile = `${botFolder}/index.js`;
	} else {
		const pkg = require(`${botFolder}/package.json`);
		delete require.cache[ require.resolve(`${botFolder}/package.json`) ];
		entryFile = `${botFolder}/${pkg.main || 'index.js'}`;
	}

	if (!fs.existsSync(entryFile)) {
		Log('ERROR', `Could not find entry for "${CleanPath(botFolder)}" - Make sure it has a valid package.json`);
		return;
	}

	const bot = ChildProcess.fork(entryFile, [], {
		cwd: botFolder,
		stdio: 'pipe'
	}) as BotProcess;

	cache.set(name.toLowerCase(), bot);

	return bot;
}

export function BindListeners(processCache: Map<string, BotProcess | null>, child: BotProcess, name: string) {
	child.on('exit', (code, signal) => {
		Log('WARN', `Bot "${name}" exited with code ${code} and signal ${signal}`);
		processCache.set(name, null);
	});

	child.on('spawn', () => {
		child.startedAt = Date.now();
		Log('INFO', `Bot "${name}" has started`);
	});

	child.stderr!.on('data', (msg: Buffer) => {
		Log('ERROR', msg.toString(), name);
	});

	child.stdout!.on('data', (msg: Buffer) => {
		Log('INFO', msg.toString(), name);
	});
}