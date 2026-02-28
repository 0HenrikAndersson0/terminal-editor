import { useCallback } from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { FileNode, FileState } from '../types.js';

export const useFileSystem = () => {
	const loadDirectory = useCallback(async (dirPath: string, level: number = 0): Promise<FileNode[]> => {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true });
			const nodes: FileNode[] = [];
			for (const entry of entries) {
				if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
				const fullPath = path.join(dirPath, entry.name);
				nodes.push({
					name: entry.name,
					path: fullPath,
					isDirectory: entry.isDirectory(),
					isOpen: false,
					level
				});
			}
			return nodes.sort((a, b) => {
				if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
				return a.name.localeCompare(b.name);
			});
		} catch (err) {
			return [];
		}
	}, []);

	const getLangFromPath = useCallback((filePath: string) => {
		const extension = path.extname(filePath).slice(1) || 'text';
		const mapping: Record<string, string> = {
			js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
			py: 'python', md: 'markdown', json: 'json', html: 'html', css: 'css',
			rs: 'rust', go: 'go', cpp: 'cpp', c: 'c', yaml: 'yaml',
		};
		return mapping[extension] || 'text';
	}, []);

	const readFile = useCallback(async (filePath: string): Promise<string> => {
		return await fs.readFile(filePath, 'utf8');
	}, []);

	const writeFile = useCallback(async (filePath: string, content: string): Promise<void> => {
		await fs.writeFile(filePath, content);
	}, []);

	return { loadDirectory, getLangFromPath, readFile, writeFile };
};
