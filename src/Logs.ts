import { inspect } from 'node:util';
import fs from 'node:fs';
import { LOGS_FOLDER } from './Constants';

export const COLOR = {
	RED: '\x1b[31m',
	GREEN: '\x1b[32m',
	YELLOW: '\x1b[33m',
	BLUE: '\x1b[34m',
	MAGENTA: '\x1b[35m',
	CYAN: '\x1b[36m',
	WHITE: '\x1b[37m',
	RESET: '\x1b[0m',
	BRIGHT: '\x1b[1m',
	DIM: '\x1b[2m'
}

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

async function FlushLogs(bot: string | null = null) {
	if (LogBuffer.length === 0) return;

	// if bot is specified, only flush logs for that bot
	// otherwise flush all logs
	bot = bot ? ResolveBotName(bot) : null;

	if (bot) {
		const targetLogs = [];
		for (let i = 0; i < LogBuffer.length; i++) {
			const entry = LogBuffer[i];
			if (bot === null || entry!.bot === bot) {
				targetLogs.push(entry);
				LogBuffer[i].flushed = true;
			}
		}
		if (targetLogs.length === 0) return;

		LogBuffer = LogBuffer.filter((entry) => !entry.flushed);

		await LogToFile(LOGS_FOLDER, targetLogs);
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
			await LogToFile(bot, logs);
		}
	}

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

	const file = await fs.promises.open(currentLogFile, fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_WRONLY);
	await file.appendFile(LogOutput);
	await file.close();
}

function StripColors(message: string) {
	return message.replace(/\x1b\[\d+m/g, '');
}

export default function Log(type: keyof typeof LOG_TYPE, message: any, name: string | null = null) {
	const bot = ResolveBotName(name);
	const timestamp = GetTimestamp();
	const botColor = ResoloveBotColor(bot);
	const logColor = LOG_COLOR[type] || COLOR.RESET;

	const shouldReset = type === LOG_TYPE.ERROR && bot !== 'MANAGER';
	message = Stringify(message, !shouldReset);

	console.log(`${logColor}[${timestamp}] [${type.padEnd(LONGEST_LOG_TYPE, ' ')}] ${botColor}${bot}${shouldReset ? COLOR.RESET : ''} - ${message}`);

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

process.on('SIGINT', async () => {
	for (let i = 0; i < Intervals.length; i++) {
		clearInterval(Intervals[i]);
	}

	await FlushLogs();
	process.exit(0);
});