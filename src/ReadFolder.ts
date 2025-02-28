import fs from 'fs';
import Log from './Logs';

const files: string[] = [];

export default function (folder: string, depth = 3): string[] { // Array of file paths
	if (!folder.startsWith('/')) throw new Error('Folder must be an absolute path');

	files.length = 0;
	ReadFolder(folder, depth);

	return files;
}

function ReadFolder (folder: string, depth = 3) {

	if (depth < 0) {
		Log('WARN', `ReadFolder: Maximum depth reached at ${folder}`);
		return;
	}

	const items = fs.readdirSync(folder, { withFileTypes: true });

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.isDirectory()) {
			ReadFolder(`${folder}/${item.name}`, depth - 1);
			continue;
		}

		if (item.isFile()) {
			files.push(`${folder}/${item.name}`);
			continue;
		}

		if (item.isSymbolicLink()) {
			const link = fs.readlinkSync(`${folder}/${item.name}`);
			ReadFolder(link, depth - 1);
			continue;
		}

		const type = GetType(item);
		Log('WARN', `ReadFolder: Unsupported file type at ${folder}/${item.name} (${type})`);
	}
}

function GetType(entry: fs.Dirent) {
	if (entry.isFile()) return 'File';
	if (entry.isDirectory()) return 'Directory';
	if (entry.isSymbolicLink()) return 'Symbolic Link';
	if (entry.isBlockDevice()) return 'Block Device';
	if (entry.isCharacterDevice()) return 'Charcter Device';
	if (entry.isFIFO()) return 'FIFO';
	if (entry.isSocket()) return 'Socket';
	return 'Unknown';
}