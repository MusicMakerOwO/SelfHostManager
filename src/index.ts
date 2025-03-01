import "source-map-support/register";

import fs from 'fs';

import FolderWatcher from './FolderWatch';
import SpawnProcess from "./SpawnProcess";
import Log, { FlushLogs, ShutdownLogs } from "./Logs";

import * as Screen from './ScreenUtils';
import CommandLoader from "./CommandLoader";
import { BotProcess, CommandFile } from "./typings";
import RunNamedParams from "./RunNamedParams";

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

	BindListeners(bot, name);
}

let currentlyExiting = false;

function BindListeners(child: BotProcess, name: string) {
	child.on('exit', (code, signal) => {
		Log('WARN', `Bot "${name}" exited with code ${code} and signal ${signal}`);
		BotProcesses.set(name, null);
		BotProcesses.delete(name);
		if (!currentlyExiting && BotProcesses.size === 0) {
			Log('WARN', 'All bots have terminated - Natural exit');
			process.exit(0);
		}
	});

	child.on('spawn', () => {
		child.startedAt = Date.now() - 6000;
		Log('INFO', `Bot "${name}" has started`);
	});

	child.stderr!.on('data', (msg: Buffer) => {
		Log('ERROR', msg.toString(), name);
	});

	child.stdout!.on('data', (msg: Buffer) => {
		Log('INFO', msg.toString(), name);
	});
}

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

	const command = Commands.get(name);
	if (!command) {
		Log('ERROR', `Unknown command "${name}"`);
		return;
	}

	if (args.length < command.usage.split(' ').length - 1) {
		Log('ERROR', `Usage: ${command.usage}`);
		return;
	}

	const namedArgs = { ...COMMAND_NAMED_ARGS, args };

	RunNamedParams(command.execute, namedArgs);

	Screen.PrintPrompt();
}

Screen.OnInput( OnInput );
Screen.PrintPrompt();