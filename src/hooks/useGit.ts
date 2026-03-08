import { useCallback } from 'react';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { FileState } from '../types.js';

const execAsync = promisify(exec);

export const useGit = (setFiles: React.Dispatch<React.SetStateAction<FileState[]>>) => {
	const getBranchName = useCallback(async () => {
		try {
			const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD');
			return stdout.trim();
		} catch (err) {
			return null;
		}
	}, []);

	const updateGitChanges = useCallback(async (fileIndex: number) => {
		setFiles(prev => {
			if (prev.length === 0 || !prev[fileIndex]) return prev;
			const file = prev[fileIndex];
			const fullPath = path.resolve(process.cwd(), file.path);

			(async () => {
				try {
					const { stdout: diffOut } = await execAsync(`git diff -U0 "${fullPath}"`, { cwd: path.dirname(fullPath) });
					const addedLines = new Set<number>();
					const deletedLines = new Set<number>();

					const hunks = diffOut.matchAll(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/g);
					for (const hunk of hunks) {
						const oldStart = parseInt(hunk[1], 10);
						const oldCount = hunk[2] === '' ? 1 : parseInt(hunk[2], 10);
						const newStart = parseInt(hunk[3], 10);
						const newCount = hunk[4] === '' ? 1 : parseInt(hunk[4], 10);

						if (newCount > 0) {
							for (let i = 0; i < newCount; i++) {
								addedLines.add(newStart + i - 1);
							}
						}
						if (oldCount > 0 && newCount === 0) {
							deletedLines.add(newStart);
						}
					}

					setFiles(current => {
						const next = [...current];
						if (next[fileIndex]) {
							next[fileIndex] = { ...next[fileIndex], gitChanges: { addedLines, deletedLines } };
						}
						return next;
					});
				} catch (err) {}
			})();
			return prev;
		});
	}, [setFiles]);

	return { updateGitChanges, getBranchName };
};
