export type CommandFile = {
	name: string;
	description: string;
	usage: string;
	execute: Function;
};