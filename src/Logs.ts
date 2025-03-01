import { inspect } from 'node:util';
import fs from 'node:fs';
import { COLOR, LOGS_FOLDER } from './Constants';
import * as Screen from './ScreenUtils';

export const LOG_TYPE = {
	INFO: 'INFO',
	WARN: 'WARN',
	ERROR: 'ERROR',
	DEBUG: 'DEBUG',
	TRACE: 'TRACE',
}

const LOG_COLOR = {
	[LOG_TYPE.INFO]: COLOR.CYAN,
	[LOG_TYPE.WARN]: COLOR.YELLOW,
	[LOG_TYPE.ERROR]: COLOR.RED + COLOR.BRIGHT,
	[LOG_TYPE.DEBUG]: COLOR.GREEN,
	[LOG_TYPE.TRACE]: COLOR.BLUE,
}

// Just so we can make the logs look pretty and aligned
const LONGEST_LOG_TYPE = Math.max(...Object.keys(LOG_TYPE).map((type) => type.length));

type LogEntry = {
	type: keyof typeof LOG_TYPE;
	bot: string;
	timestamp: Date | string;
	message: string;

	flushed?: boolean;
}

let LogBuffer: LogEntry[] = [];

export function GetTimestamp() {
	const date = new Date();
	const year = date.getFullYear().toString().padStart(4, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const BotColors = new Map<string, string>([ ['MANAGER', COLOR.RED] ]); // Name -> Color
export function ResoloveBotColor(bot: string) {
	if (BotColors.has(bot)) return BotColors.get(bot);

	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	const ansii = `\x1b[38;2;${r};${g};${b}m`;
	BotColors.set(bot, ansii);

	return ansii;
}

function ResolveBotName(name: string | null) {
	if (name === null || name === 'MANAGER') return 'MANAGER';
	return name.toUpperCase();
}

function Stringify(message: any, colors = true) {
	return typeof message === 'string' ? message : inspect(message, { depth: 3, colors });
}

export async function FlushLogs(bot: string | null = null) {
	if (LogBuffer.length === 0) return;

	// if bot is specified, only flush logs for that bot
	// otherwise flush all logs
	bot = bot ? ResolveBotName(bot) : null;

	const start = process.hrtime.bigint();

	let logCount = 0;

	if (bot) {
		const targetLogs = [];
		for (let i = 0; i < LogBuffer.length; i++) {
			const entry = LogBuffer[i];
			if (bot === null || entry!.bot === bot) {
				targetLogs.push(entry);
				LogBuffer[i].flushed = true;
			}
		}
		if (targetLogs.length > 0) {
			logCount = targetLogs.length;
			LogBuffer = LogBuffer.filter((entry) => !entry.flushed);
			await LogToFile(LOGS_FOLDER, targetLogs);
		}
	} else  {
		const BotLogs: Record<string, LogEntry[]> = {};
		for (let i = 0; i < LogBuffer.length; i++) {
			const entry = LogBuffer[i];
			if (!BotLogs[entry.bot]) {
				BotLogs[entry.bot] = [entry];
			} else {
				BotLogs[entry.bot].push(entry);
			}
		}

		LogBuffer = [];

		for (const [ bot, logs ] of Object.entries(BotLogs)) {
			logCount += logs.length;
			await LogToFile(bot, logs);
		}
	}

	const end = process.hrtime.bigint();
	const elapsed = Number(end - start) / 1e6;
	Log('INFO', `Flushed ${logCount} logs in ${elapsed.toFixed(2)}ms`);

}

function GetLogDate() {
	const now = new Date();
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

async function LogToFile(bot: string, logs: LogEntry[]) {
	bot = ResolveBotName(bot);

	// logs/<bot>/YYYY-MM-DD.log
	const currentLogFile = `${LOGS_FOLDER}/${bot}/${GetLogDate()}.log`;

	let LogOutput = '';
	for (let i = 0; i < logs.length; i++) {
		const log = logs[i];
		LogOutput += `[${log.timestamp}] [${log.type.padEnd(LONGEST_LOG_TYPE, ' ')}] ${Stringify(log.message)}\n`;
	}

	if (!fs.existsSync(`${LOGS_FOLDER}/${bot}`)) {
		await fs.promises.mkdir(`${LOGS_FOLDER}/${bot}`, { recursive: true });
	}

	const file = await fs.promises.open(currentLogFile, fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_WRONLY);
	await file.appendFile(LogOutput);
	await file.close();
}

function StripColors(message: string) {
	return message.replace(/\x1b\[\d+m/g, '');
}

export function CleanMessage(message: string) {
	message = message.trim();
	message = message.replace(/^\n+/, '');
	message = message.replace(/\n+$/, '');
	return message;
}

export default function Log(type: keyof typeof LOG_TYPE, message: any, name: string | null = null) {
	if (Buffer.isBuffer(message)) message = message.toString();

	message = CleanMessage(message);

	const bot = ResolveBotName(name);
	const timestamp = GetTimestamp();
	const botColor = ResoloveBotColor(bot);
	const logColor = LOG_COLOR[type] || COLOR.RESET;

	const isError = type !== LOG_TYPE.ERROR;
	message = Stringify(message, !isError);

	Screen.ClearLine();
	Screen.CursorToBeginning();

	console.log(`${logColor}${type.padEnd(LONGEST_LOG_TYPE, ' ')} ${COLOR.RESET}|${logColor} ${timestamp} ${COLOR.RESET}[${botColor}${bot}${COLOR.RESET}] ${!isError ? logColor : ''}${message}${COLOR.RESET}`);

	Screen.PrintPrompt();

	LogBuffer.push({ type, bot, timestamp, message: StripColors(message) });
}


const ScheduledEvents : [Function, number][] = [
	[FlushLogs, 1000 * 60 * 5] // Flush logs every 5 minutes
];
const Intervals : number[] = [];

for (let i = 0; i < ScheduledEvents.length; i++) {
	const [fn, interval] = ScheduledEvents[i];
	Intervals.push( setInterval(fn, interval) );
}


export function ShutdownLogs() {
	for (let i = 0; i < Intervals.length; i++) {
		clearInterval(Intervals[i]);
	}
}