import { useCallback } from 'react';
import { FileState } from '../types.js';
import clipboard from 'clipboardy';

export const useEditor = (
	activeFile: FileState | null,
	updateActiveFile: (updater: (file: FileState) => FileState) => void,
	viewHeight: number
) => {
	const moveCursor = useCallback((key: any, shift: boolean) => {
		if (!activeFile) return;

		if (shift) {
			updateActiveFile(f => {
				const start = f.selection ? f.selection.start : { ...f.cursor };
				const newCursor = { ...f.cursor };
				if (key.upArrow) {
					const newY = Math.max(0, f.cursor.y - 1);
					const ci = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const ti = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					newCursor.y = newY;
					newCursor.x = f.cursor.x === ci ? ti : Math.min(f.cursor.x, f.lines[newY].length);
				} else if (key.downArrow) {
					const newY = Math.min(f.lines.length - 1, f.cursor.y + 1);
					const ci = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const ti = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					newCursor.y = newY;
					newCursor.x = f.cursor.x === ci ? ti : Math.min(f.cursor.x, f.lines[newY].length);
				} else if (key.pageUp) {
					newCursor.y = Math.max(0, f.cursor.y - viewHeight);
					newCursor.x = Math.min(f.cursor.x, f.lines[newCursor.y].length);
				} else if (key.pageDown) {
					newCursor.y = Math.min(f.lines.length - 1, f.cursor.y + viewHeight);
					newCursor.x = Math.min(f.cursor.x, f.lines[newCursor.y].length);
				} else if (key.leftArrow) {
					if (f.cursor.x > 0) newCursor.x = f.cursor.x - 1;
					else if (f.cursor.y > 0) { newCursor.y = f.cursor.y - 1; newCursor.x = f.lines[newCursor.y].length; }
				} else if (key.rightArrow) {
					if (f.cursor.x < f.lines[f.cursor.y].length) newCursor.x = f.cursor.x + 1;
					else if (f.cursor.y < f.lines.length - 1) { newCursor.y = f.cursor.y + 1; newCursor.x = 0; }
				}
				return { ...f, cursor: newCursor, selection: { start, end: newCursor } };
			});
		} else {
			if (key.upArrow) {
				updateActiveFile(f => {
					const newY = Math.max(0, f.cursor.y - 1);
					const ci = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const ti = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					return { ...f, cursor: { y: newY, x: f.cursor.x === ci ? ti : Math.min(f.cursor.x, f.lines[newY].length) }, selection: null };
				});
			} else if (key.downArrow) {
				updateActiveFile(f => {
					const newY = Math.min(f.lines.length - 1, f.cursor.y + 1);
					const ci = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const ti = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					return { ...f, cursor: { y: newY, x: f.cursor.x === ci ? ti : Math.min(f.cursor.x, f.lines[newY].length) }, selection: null };
				});
			} else if (key.pageUp) {
				updateActiveFile(f => {
					const newY = Math.max(0, f.cursor.y - viewHeight);
					return { ...f, cursor: { y: newY, x: Math.min(f.cursor.x, f.lines[newY].length) }, scroll: Math.max(0, f.scroll - viewHeight), selection: null };
				});
			} else if (key.pageDown) {
				updateActiveFile(f => {
					const newY = Math.min(f.lines.length - 1, f.cursor.y + viewHeight);
					return { ...f, cursor: { y: newY, x: Math.min(f.cursor.x, f.lines[newY].length) }, scroll: Math.min(Math.max(0, f.lines.length - viewHeight), f.scroll + viewHeight), selection: null };
				});
			} else if (key.leftArrow) {
				updateActiveFile(f => {
					if (f.cursor.x > 0) return { ...f, cursor: { ...f.cursor, x: f.cursor.x - 1 }, selection: null };
					if (f.cursor.y > 0) return { ...f, cursor: { y: f.cursor.y - 1, x: f.lines[f.cursor.y - 1].length }, selection: null };
					return { ...f, selection: null };
				});
			} else if (key.rightArrow) {
				updateActiveFile(f => {
					if (f.cursor.x < f.lines[f.cursor.y].length) return { ...f, cursor: { ...f.cursor, x: f.cursor.x + 1 }, selection: null };
					if (f.cursor.y < f.lines.length - 1) return { ...f, cursor: { y: f.cursor.y + 1, x: 0 }, selection: null };
					return { ...f, selection: null };
				});
			}
		}
	}, [activeFile, updateActiveFile, viewHeight]);

	const handleTextDelete = useCallback((backspace: boolean, del: boolean) => {
		updateActiveFile(f => {
			if (backspace) {
				if (f.cursor.x > 0) {
					const l = f.lines[f.cursor.y], nl = [...f.lines]; nl[f.cursor.y] = l.slice(0, f.cursor.x - 1) + l.slice(f.cursor.x);
					return { ...f, lines: nl, cursor: { ...f.cursor, x: f.cursor.x - 1 }, isDirty: true };
				} else if (f.cursor.y > 0) {
					const pl = f.lines[f.cursor.y - 1], cl = f.lines[f.cursor.y], nl = [...f.lines]; nl[f.cursor.y - 1] = pl + cl; nl.splice(f.cursor.y, 1);
					return { ...f, lines: nl, cursor: { y: f.cursor.y - 1, x: pl.length }, isDirty: true };
				}
			} else if (del) {
				const l = f.lines[f.cursor.y];
				if (f.cursor.x < l.length) {
					const nl = [...f.lines]; nl[f.cursor.y] = l.slice(0, f.cursor.x) + l.slice(f.cursor.x + 1);
					return { ...f, lines: nl, isDirty: true };
				} else if (f.cursor.y < f.lines.length - 1) {
					const nxl = f.lines[f.cursor.y + 1], nl = [...f.lines]; nl[f.cursor.y] = l + nxl; nl.splice(f.cursor.y + 1, 1);
					return { ...f, lines: nl, isDirty: true };
				}
			}
			return f;
		});
	}, [updateActiveFile]);

	const handleTextInput = useCallback((input: string) => {
		updateActiveFile(f => {
			const l = f.lines[f.cursor.y], nl = [...f.lines]; nl[f.cursor.y] = l.slice(0, f.cursor.x) + input + l.slice(f.cursor.x);
			return { ...f, lines: nl, cursor: { ...f.cursor, x: f.cursor.x + input.length }, isDirty: true };
		});
	}, [updateActiveFile]);

	const handleEnter = useCallback(() => {
		updateActiveFile(f => {
			const cl = f.lines[f.cursor.y], ind = cl.match(/^\s*/)?.[0] || '', before = cl.slice(0, f.cursor.x), after = cl.slice(f.cursor.x);
			const nl = [...f.lines]; nl[f.cursor.y] = before; nl.splice(f.cursor.y + 1, 0, ind + after);
			return { ...f, lines: nl, cursor: { y: f.cursor.y + 1, x: ind.length }, isDirty: true };
		});
	}, [updateActiveFile]);

	const copyToClipboard = useCallback(() => {
		if (activeFile?.selection) {
			const { start, end } = activeFile.selection;
			const rs = (start.y < end.y || (start.y === end.y && start.x < end.x)) ? start : end;
			const re = (start.y < end.y || (start.y === end.y && start.x < end.x)) ? end : start;
			let st = '';
			if (rs.y === re.y) st = activeFile.lines[rs.y].slice(rs.x, re.x);
			else {
				st += activeFile.lines[rs.y].slice(rs.x) + '\n';
				for (let i = rs.y + 1; i < re.y; i++) st += activeFile.lines[i] + '\n';
				st += activeFile.lines[re.y].slice(0, re.x);
			}
			clipboard.writeSync(st);
		}
	}, [activeFile]);

	const pasteFromClipboard = useCallback(() => {
		const text = clipboard.readSync();
		if (text) {
			const pl = text.split(/\r?\n/);
			updateActiveFile(f => {
				const nl = [...f.lines], before = f.lines[f.cursor.y].slice(0, f.cursor.x), after = f.lines[f.cursor.y].slice(f.cursor.x);
				if (pl.length === 1) {
					nl[f.cursor.y] = before + pl[0] + after;
					return { ...f, lines: nl, cursor: { y: f.cursor.y, x: f.cursor.x + pl[0].length }, isDirty: true };
				} else {
					nl[f.cursor.y] = before + pl[0];
					nl.splice(f.cursor.y + 1, 0, ...pl.slice(1, -1), pl[pl.length - 1] + after);
					return { ...f, lines: nl, cursor: { y: f.cursor.y + pl.length - 1, x: pl[pl.length - 1].length }, isDirty: true };
				}
			});
		}
	}, [updateActiveFile]);

	return { moveCursor, handleTextDelete, handleTextInput, handleEnter, copyToClipboard, pasteFromClipboard };
};
