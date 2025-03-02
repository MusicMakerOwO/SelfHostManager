import "source-map-support/register";

import fs from 'fs';

import FolderWatcher from './FolderWatch';
import SpawnProcess, { BindListeners } from "./SpawnProcess";
import Log, { FlushLogs, ShutdownLogs } from "./Logs";

import * as Screen from './ScreenUtils';
import CommandLoader from "./CommandLoader";
import { BotProcess, CommandFile } from "./typings";
import RunNamedParams from "./RunNamedParams";
import ReadFolder from "./ReadFolder";

// dummy server to keep the process running lol
require('node:https').createServer().listen();

const BotProcesses = new Map<string, BotProcess | null>();
const Commands = new Map<string, CommandFile>();

CommandLoader(Commands, `${__dirname}/Commands`);

const BotWatcher = new FolderWatcher(`${__dirname}/../Bots`, false); // Add/Remove bots on the fly

BotWatcher.onRemove = (file) => {
	const name = file.split('/').pop() as string;
	const bot = BotProcesses.get(name);
	if (!bot) return;

	bot.kill();
	BotProcesses.delete(name);
}

BotWatcher.onAdd = (file) => {
	const stats = fs.lstatSync(file);
	if (!stats.isDirectory()) {
		Log('WARN', `Bot "${file}" is not a folder - Ignoring`);
		return;
	}
	SpawnBot(file);
}

const BotList = fs.readdirSync(`${__dirname}/../Bots`, { withFileTypes: true })
.filter(item => item.isDirectory())
.map(item => `${__dirname}/../Bots/${item.name}`);

if (BotList.length === 0) {
	Log('INFO', 'No bots found - Nothing to do');
	process.exit(0);
}

Log('INFO', `Found ${BotList.length} bots`);
for (let i = 0; i < BotList.length; i++) {
	SpawnBot(BotList[i]);
}

function SpawnBot (botFolder: string) {
	const name = botFolder.split('/').pop() as string;
	const bot = SpawnProcess(BotProcesses, botFolder, name);
	if (!bot) return;

	BindListeners(BotProcesses, bot, name);
}

let naturalExitInterval = setInterval(CheckNaturalExit, 5000);
function CheckNaturalExit() {
	if (currentlyExiting) {
		clearInterval(naturalExitInterval);
		return;
	}

	let allOffline = true;
	for (const bot of BotProcesses.values()) {
		if (bot) {
			allOffline = false;
			break;
		}
	}

	if (allOffline) {
		Log('WARN', 'All bots have terminated - Natural exit');
		process.exit(0);
	}
}

let currentlyExiting = false;

const COMMAND_NAMED_ARGS = {
	commands: Commands,
	bots: BotProcesses,
	botWatcher: BotWatcher
}

process.on('SIGINT', OnInput.bind(null, 'exit'));
async function OnInput (input: string) {
	console.log(); // move down a line lol

	if (input === '') return;

	const args = input.split(' ');
	const name = args.shift()!.toLowerCase();

	if (name === 'exit' || name === 'quit') {
		if (currentlyExiting) return;

		currentlyExiting = true;

		// Stop all bot proesses
		for (const [botName, child] of BotProcesses.entries()) {
			if (!child) continue;
			child.kill('SIGINT');
			Log('INFO', `Bot "${botName}" has been killed`);
		}
		
		// Wait for logs to flush to disk
		ShutdownLogs();
		await FlushLogs();

		process.exit(0);
	}

	if (name === 'reload') {
		Commands.clear();
		const commandFiles = ReadFolder(`${__dirname}/Commands`);
		for (let i = 0; i < commandFiles.length; i++) {
			delete require.cache[ commandFiles[i] ];
		}
		CommandLoader(Commands, `${__dirname}/Commands`);
		Log('INFO', `Reloaded ${Commands.size} commands`);
		return;
	}

	const command = Commands.get(name);
	if (!command) {
		Log('ERROR', `Unknown command "${name}"`);
		return;
	}

	const namedArgs = { ...COMMAND_NAMED_ARGS, args };

	RunNamedParams(command.execute, namedArgs);

	Screen.PrintPrompt();
}

Screen.OnInput( OnInput );
Screen.PrintPrompt();