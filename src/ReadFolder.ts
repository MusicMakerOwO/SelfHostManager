import fs from 'fs';
import Logs from './Logs';

const files: string[] = [];

export default function (folder: string): string[] { // Array of file paths
	if (!folder.startsWith('/')) throw new Error('Folder must be an absolute path');

	files.length = 0;
	ReadFolder(folder);

	return files;
}

function ReadFolder (folder: string, depth = 3) {

	if (depth < 0) {
		Logs.warn(`ReadFolder: Maximum depth reached at ${folder}`);
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
		}

		if (item.isSymbolicLink()) {
			const link = fs.readlinkSync(`${folder}/${item.name}`);
			ReadFolder(link, depth - 1);
		}

		if (item.isBlockDevice() || item.isCharacterDevice() || item.isFIFO() || item.isSocket()) {
			console.warn(`ReadFolder: Unsupported file type at ${folder}/${item.name}`);
		}
	}
}