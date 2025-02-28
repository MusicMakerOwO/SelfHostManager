import "source-map-support/register";

import fs from 'fs';
import ChildProcess from 'child_process';

import FolderWatcher from './FolderWatch';
import SpawnProcess from "./SpawnProcess";
import Logs from "./Logs";

import * as Screen from './ScreenUtils';

// dummy server to keep the process running lol
require('node:https').createServer().listen();

const BotProcesses = new Map<string, ChildProcess.ChildProcess>();

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
		Logs('WARN', `Bot "${file}" is not a folder - Ignoring`);
		return;
	}
	SpawnBot(file);
}

const BotList = fs.readdirSync(`${__dirname}/../Bots`, { withFileTypes: true })
.filter(item => item.isDirectory())
.map(item => `${__dirname}/../Bots/${item.name}`);

if (BotList.length === 0) {
	Logs('INFO', 'No bots found - Nothing to do');
	process.exit(0);
}

Logs('INFO', `Found ${BotList.length} bots`);
for (let i = 0; i < BotList.length; i++) {
	SpawnBot(BotList[i]);
}

function SpawnBot (botFolder: string) {
	const name = botFolder.split('/').pop() as string;
	const bot = SpawnProcess(BotProcesses, botFolder, name);
	if (!bot) return;

	BindListeners(bot, name);
}

function BindListeners(child: ChildProcess.ChildProcess, name: string) {
	child.on('exit', (code, signal) => {
		Logs('WARN', `Bot "${name}" exited with code ${code} and signal ${signal}`);
		BotProcesses.delete(name);
		if (BotProcesses.size === 0) {
			Logs('WARN', 'All bots have terminated - Natural exit');
			process.exit(0);
		}
	});

	child.stderr!.on('data', (msg: Buffer) => {
		Logs('ERROR', msg.toString(), name);
	});

	child.stdout!.on('data', (msg: Buffer) => {
		Logs('INFO', msg.toString(), name);
	});
}

function OnInput (input: string) {
	console.log(); // move down a line lol

	console.log('Input received : ', input);
	Screen.PrintPrompt();
}

Screen.OnInput( OnInput );