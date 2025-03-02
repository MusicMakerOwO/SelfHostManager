import { ChildProcess } from "node:child_process";

export type CommandFile = {
	name: string;
	description: string;
	usage: string;
	execute: Function;
};

export type KeybindFile = {
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
	key: string;
	description: string;
	execute: Function;
};

export type BotProcess = ChildProcess & {
	startedAt: number;
};