import { useCallback } from 'react';
import { FileState } from '../types.js';
import clipboard from 'clipboardy';

export const useEditor = (
	activeFile: FileState | null,
	updateActiveFile: (updater: (file: FileState) => FileState) => void,
	viewHeight: number,
	availableWidth: number
) => {
	const moveCursor = useCallback((key: any, shift: boolean) => {
		if (!activeFile) return;

		const updateXScroll = (f: FileState, newX: number): number => {
			if (newX < f.scrollX) return newX;
			if (newX >= f.scrollX + availableWidth) return newX - availableWidth + 1;
			return f.scrollX;
		};

		if (shift) {
			updateActiveFile(f => {
				const start = f.selection ? f.selection.start : { ...f.cursor };
				const newCursor = { ...f.cursor };
				let newScrollX = f.scrollX;

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
				newScrollX = updateXScroll(f, newCursor.x);
				return { ...f, cursor: newCursor, scrollX: newScrollX, selection: { start, end: newCursor } };
			});
		} else {
			if (key.upArrow) {
				updateActiveFile(f => {
					const newY = Math.max(0, f.cursor.y - 1);
					const ci = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const ti = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					const newX = f.cursor.x === ci ? ti : Math.min(f.cursor.x, f.lines[newY].length);
					return { ...f, cursor: { y: newY, x: newX }, scrollX: updateXScroll(f, newX), selection: null };
				});
			} else if (key.downArrow) {
				updateActiveFile(f => {
					const newY = Math.min(f.lines.length - 1, f.cursor.y + 1);
					const ci = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const ti = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					const newX = f.cursor.x === ci ? ti : Math.min(f.cursor.x, f.lines[newY].length);
					return { ...f, cursor: { y: newY, x: newX }, scrollX: updateXScroll(f, newX), selection: null };
				});
			} else if (key.pageUp) {
				updateActiveFile(f => {
					const newY = Math.max(0, f.cursor.y - viewHeight);
					const newX = Math.min(f.cursor.x, f.lines[newY].length);
					return { ...f, cursor: { y: newY, x: newX }, scroll: Math.max(0, f.scroll - viewHeight), scrollX: updateXScroll(f, newX), selection: null };
				});
			} else if (key.pageDown) {
				updateActiveFile(f => {
					const newY = Math.min(f.lines.length - 1, f.cursor.y + viewHeight);
					const newX = Math.min(f.cursor.x, f.lines[newY].length);
					return { ...f, cursor: { y: newY, x: newX }, scroll: Math.min(Math.max(0, f.lines.length - viewHeight), f.scroll + viewHeight), scrollX: updateXScroll(f, newX), selection: null };
				});
			} else if (key.leftArrow) {
				updateActiveFile(f => {
					let newCursor = { ...f.cursor };
					if (f.cursor.x > 0) newCursor.x = f.cursor.x - 1;
					else if (f.cursor.y > 0) { newCursor.y = f.cursor.y - 1; newCursor.x = f.lines[newCursor.y].length; }
					return { ...f, cursor: newCursor, scrollX: updateXScroll(f, newCursor.x), selection: null };
				});
			} else if (key.rightArrow) {
				updateActiveFile(f => {
					let newCursor = { ...f.cursor };
					if (f.cursor.x < f.lines[f.cursor.y].length) newCursor.x = f.cursor.x + 1;
					else if (f.cursor.y < f.lines.length - 1) { newCursor.y = f.cursor.y + 1; newCursor.x = 0; }
					return { ...f, cursor: newCursor, scrollX: updateXScroll(f, newCursor.x), selection: null };
				});
			}
		}
	}, [activeFile, updateActiveFile, viewHeight, availableWidth]);

	const handleTextDelete = useCallback((backspace: boolean, del: boolean) => {
		updateActiveFile(f => {
			let nf = { ...f };
			if (backspace) {
				if (f.cursor.x > 0) {
					const l = f.lines[f.cursor.y];
					nf.lines = [...f.lines]; nf.lines[f.cursor.y] = l.slice(0, f.cursor.x - 1) + l.slice(f.cursor.x);
					nf.cursor = { ...f.cursor, x: f.cursor.x - 1 };
					nf.isDirty = true;
				} else if (f.cursor.y > 0) {
					const pl = f.lines[f.cursor.y - 1];
					nf.lines = [...f.lines]; nf.lines[f.cursor.y - 1] = pl + f.lines[f.cursor.y]; nf.lines.splice(f.cursor.y, 1);
					nf.cursor = { y: f.cursor.y - 1, x: pl.length };
					nf.isDirty = true;
				}
			} else if (del) {
				const l = f.lines[f.cursor.y];
				if (f.cursor.x < l.length) {
					nf.lines = [...f.lines]; nf.lines[f.cursor.y] = l.slice(0, f.cursor.x) + l.slice(f.cursor.x + 1);
					nf.isDirty = true;
				} else if (f.cursor.y < f.lines.length - 1) {
					nf.lines = [...f.lines]; nf.lines[f.cursor.y] = l + f.lines[f.cursor.y + 1]; nf.lines.splice(f.cursor.y + 1, 1);
					nf.isDirty = true;
				}
			}
			// Update scrollX after delete
			if (nf.cursor.x < nf.scrollX) nf.scrollX = nf.cursor.x;
			else if (nf.cursor.x >= nf.scrollX + availableWidth) nf.scrollX = nf.cursor.x - availableWidth + 1;
			return nf;
		});
	}, [updateActiveFile, availableWidth]);

	const handleTextInput = useCallback((input: string) => {
		updateActiveFile(f => {
			const l = f.lines[f.cursor.y], nl = [...f.lines]; nl[f.cursor.y] = l.slice(0, f.cursor.x) + input + l.slice(f.cursor.x);
			const newX = f.cursor.x + input.length;
			let newScrollX = f.scrollX;
			if (newX >= f.scrollX + availableWidth) newScrollX = newX - availableWidth + 1;
			return { ...f, lines: nl, cursor: { ...f.cursor, x: newX }, scrollX: newScrollX, isDirty: true };
		});
	}, [updateActiveFile, availableWidth]);

	const handleEnter = useCallback(() => {
		updateActiveFile(f => {
			const cl = f.lines[f.cursor.y], ind = cl.match(/^\s*/)?.[0] || '', before = cl.slice(0, f.cursor.x), after = cl.slice(f.cursor.x);
			const nl = [...f.lines]; nl[f.cursor.y] = before; nl.splice(f.cursor.y + 1, 0, ind + after);
			const newX = ind.length;
			return { ...f, lines: nl, cursor: { y: f.cursor.y + 1, x: newX }, scrollX: newX < availableWidth ? 0 : newX - availableWidth + 1, isDirty: true };
		});
	}, [updateActiveFile, availableWidth]);

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
