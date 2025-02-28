import { ChildProcess } from "child_process";

export type CommandFile = {
	name: string;
	description: string;
	usage: string;
	execute: () => void;
};

export type EventCallback = (process: ChildProcess, bot: string, ...args: any[]) => void;
export type EventLookup = Record<string, EventCallback>;