import { useCallback, useRef } from 'react';
import { FileState } from '../types.js';
import clipboard from 'clipboardy';

const removeSelection = (f: FileState): FileState => {
	if (!f.selection) return f;
	const { start, end } = f.selection;
	const rs = (start.y < end.y || (start.y === end.y && start.x < end.x)) ? start : end;
	const re = (start.y < end.y || (start.y === end.y && start.x < end.x)) ? end : start;
	const nl = [...f.lines];
	if (rs.y === re.y) {
		nl[rs.y] = nl[rs.y].slice(0, rs.x) + nl[rs.y].slice(re.x);
	} else {
		nl[rs.y] = nl[rs.y].slice(0, rs.x) + nl[re.y].slice(re.x);
		nl.splice(rs.y + 1, re.y - rs.y);
	}
	return { ...f, lines: nl, cursor: { y: rs.y, x: rs.x }, selection: null, isDirty: true };
};

export const useEditor = (
	activeFile: FileState | null,
	updateActiveFile: (updater: (file: FileState) => FileState) => void,
	viewHeight: number,
	availableWidth: number
) => {
	const getVisualX = (line: string, rawX: number): number => {
		let visualX = 0;
		for (let i = 0; i < rawX; i++) {
			visualX += line[i] === '\t' ? 4 : 1;
		}
		return visualX;
	};

	const lastEditTime = useRef<number>(0);

	const moveCursor = useCallback((key: any, shift: boolean) => {
		if (!activeFile) return;

		const updateXScroll = (f: FileState, newX: number): number => {
			const line = f.lines[f.cursor.y] || '';
			const visualX = getVisualX(line, newX);
			if (visualX < f.scrollX) return visualX;
			if (visualX >= f.scrollX + availableWidth) return visualX - availableWidth + 1;
			return f.scrollX;
		};

		updateActiveFile(f => {
			const start = f.selection ? f.selection.start : { ...f.cursor };
			const newCursor = { ...f.cursor };
			let newScrollX = f.scrollX;
			let newPreferredX = f.preferredX ?? f.cursor.x;

			if (key.upArrow) {
				newCursor.y = Math.max(0, f.cursor.y - 1);
				newCursor.x = Math.min(newPreferredX, f.lines[newCursor.y].length);
			} else if (key.downArrow) {
				newCursor.y = Math.min(f.lines.length - 1, f.cursor.y + 1);
				newCursor.x = Math.min(newPreferredX, f.lines[newCursor.y].length);
			} else if (key.pageUp) {
				newCursor.y = Math.max(0, f.cursor.y - viewHeight);
				newCursor.x = Math.min(newPreferredX, f.lines[newCursor.y].length);
			} else if (key.pageDown) {
				newCursor.y = Math.min(f.lines.length - 1, f.cursor.y + viewHeight);
				newCursor.x = Math.min(newPreferredX, f.lines[newCursor.y].length);
			} else if (key.leftArrow) {
				if (f.cursor.x > 0) newCursor.x = f.cursor.x - 1;
				else if (f.cursor.y > 0) { newCursor.y = f.cursor.y - 1; newCursor.x = f.lines[newCursor.y].length; }
				newPreferredX = newCursor.x;
			} else if (key.rightArrow) {
				if (f.cursor.x < f.lines[f.cursor.y].length) newCursor.x = f.cursor.x + 1;
				else if (f.cursor.y < f.lines.length - 1) { newCursor.y = f.cursor.y + 1; newCursor.x = 0; }
				newPreferredX = newCursor.x;
			} else if (key.home) {
				newCursor.x = 0;
				newPreferredX = 0;
			} else if (key.end) {
				newCursor.x = f.lines[f.cursor.y].length;
				newPreferredX = newCursor.x;
			}
			newScrollX = updateXScroll(f, newCursor.x);
			return { 
				...f, 
				cursor: newCursor, 
				scrollX: newScrollX, 
				preferredX: newPreferredX,
				selection: shift ? { start, end: newCursor } : null 
			};
		});
	}, [activeFile, updateActiveFile, viewHeight, availableWidth]);

	const pushToUndo = (f: FileState, merge: boolean = false): FileState => {
		if (merge && f.undoStack.length > 0) {
			return { ...f, redoStack: [] };
		}
		const newUndoStack = [...f.undoStack, { lines: [...f.lines], cursor: { ...f.cursor }, preferredX: f.preferredX }];
		if (newUndoStack.length > 50) newUndoStack.shift();
		return { ...f, undoStack: newUndoStack, redoStack: [] };
	};

	const undo = useCallback(() => {
		updateActiveFile(f => {
			if (f.undoStack.length === 0) return f;
			const last = f.undoStack[f.undoStack.length - 1];
			const newUndoStack = f.undoStack.slice(0, -1);
			const newRedoStack = [{ lines: [...f.lines], cursor: { ...f.cursor }, preferredX: f.preferredX }, ...f.redoStack];
			if (newRedoStack.length > 50) newRedoStack.pop();
			return { ...f, lines: last.lines, cursor: last.cursor, preferredX: last.preferredX, undoStack: newUndoStack, redoStack: newRedoStack, selection: null, isDirty: true };
		});
	}, [updateActiveFile]);

	const redo = useCallback(() => {
		updateActiveFile(f => {
			if (f.redoStack.length === 0) return f;
			const next = f.redoStack[0];
			const newRedoStack = f.redoStack.slice(1);
			const newUndoStack = [...f.undoStack, { lines: [...f.lines], cursor: { ...f.cursor }, preferredX: f.preferredX }];
			if (newUndoStack.length > 50) newUndoStack.shift();
			return { ...f, lines: next.lines, cursor: next.cursor, preferredX: next.preferredX, undoStack: newUndoStack, redoStack: newRedoStack, selection: null, isDirty: true };
		});
	}, [updateActiveFile]);

	const handleTextDelete = useCallback((backspace: boolean, del: boolean) => {
		const now = Date.now();
		const merge = now - lastEditTime.current < 500;
		lastEditTime.current = now;

		updateActiveFile(f => {
			let nf = pushToUndo(f, merge);
			if (f.selection) nf = removeSelection(nf);
			else if (backspace) {
				if (f.cursor.x > 0) {
					const l = f.lines[f.cursor.y];
					nf.lines = [...nf.lines]; nf.lines[f.cursor.y] = l.slice(0, f.cursor.x - 1) + l.slice(f.cursor.x);
					nf.cursor = { ...f.cursor, x: f.cursor.x - 1 };
					nf.isDirty = true;
				} else if (f.cursor.y > 0) {
					const pl = f.lines[f.cursor.y - 1];
					nf.lines = [...nf.lines]; nf.lines[f.cursor.y - 1] = pl + f.lines[f.cursor.y]; nf.lines.splice(f.cursor.y, 1);
					nf.cursor = { y: f.cursor.y - 1, x: pl.length };
					nf.isDirty = true;
				}
			} else if (del) {
				const l = f.lines[f.cursor.y];
				if (f.cursor.x < l.length) {
					nf.lines = [...nf.lines]; nf.lines[f.cursor.y] = l.slice(0, f.cursor.x) + l.slice(f.cursor.x + 1);
					nf.isDirty = true;
				} else if (f.cursor.y < f.lines.length - 1) {
					nf.lines = [...nf.lines]; nf.lines[f.cursor.y] = l + f.lines[f.cursor.y + 1]; nf.lines.splice(f.cursor.y + 1, 1);
					nf.isDirty = true;
				}
			}
			nf.preferredX = nf.cursor.x;
			// Update scrollX after delete
			const line = nf.lines[nf.cursor.y] || '';
			const visualX = getVisualX(line, nf.cursor.x);
			if (visualX < nf.scrollX) nf.scrollX = visualX;
			else if (visualX >= nf.scrollX + availableWidth) nf.scrollX = visualX - availableWidth + 1;
			return nf;
		});
	}, [updateActiveFile, availableWidth, getVisualX]);

	const handleTextInput = useCallback((input: string) => {
		const now = Date.now();
		const merge = now - lastEditTime.current < 500;
		lastEditTime.current = now;

		updateActiveFile(f => {
			let nf = pushToUndo(f, merge);
			if (f.selection) nf = removeSelection(nf);
			const l = nf.lines[nf.cursor.y], nl = [...nf.lines]; nl[nf.cursor.y] = l.slice(0, nf.cursor.x) + input + l.slice(nf.cursor.x);
			const newX = nf.cursor.x + input.length;
			let newScrollX = nf.scrollX;
			const visualX = getVisualX(nl[nf.cursor.y], newX);
			if (visualX >= nf.scrollX + availableWidth) newScrollX = visualX - availableWidth + 1;
			return { ...nf, lines: nl, cursor: { ...nf.cursor, x: newX }, preferredX: newX, scrollX: newScrollX, isDirty: true };
		});
	}, [updateActiveFile, availableWidth, getVisualX]);

	const handleEnter = useCallback(() => {
		lastEditTime.current = 0; // Force new undo state on Enter
		updateActiveFile(f => {
			let nf = pushToUndo(f);
			if (f.selection) nf = removeSelection(nf);
			const cl = nf.lines[nf.cursor.y], ind = cl.match(/^\s*/)?.[0] || '', before = cl.slice(0, nf.cursor.x), after = cl.slice(nf.cursor.x);
			const nl = [...nf.lines]; nl[nf.cursor.y] = before; nl.splice(nf.cursor.y + 1, 0, ind + after);
			const newX = ind.length;
			const visualX = getVisualX(ind, newX);
			return { ...nf, lines: nl, cursor: { y: nf.cursor.y + 1, x: newX }, preferredX: newX, scrollX: visualX < availableWidth ? 0 : visualX - availableWidth + 1, isDirty: true };
		});
	}, [updateActiveFile, availableWidth, getVisualX]);

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
				let nf = pushToUndo(f);
				if (f.selection) nf = removeSelection(nf);
				const nl = [...nf.lines], before = nf.lines[nf.cursor.y].slice(0, nf.cursor.x), after = nf.lines[nf.cursor.y].slice(nf.cursor.x);
				if (pl.length === 1) {
					nl[nf.cursor.y] = before + pl[0] + after;
					return { ...nf, lines: nl, cursor: { y: nf.cursor.y, x: nf.cursor.x + pl[0].length }, isDirty: true };
				} else {
					nl[nf.cursor.y] = before + pl[0];
					nl.splice(nf.cursor.y + 1, 0, ...pl.slice(1, -1), pl[pl.length - 1] + after);
					return { ...nf, lines: nl, cursor: { y: nf.cursor.y + pl.length - 1, x: pl[pl.length - 1].length }, isDirty: true };
				}
			});
		}
	}, [updateActiveFile]);

	const cutToClipboard = useCallback(() => {
		if (activeFile?.selection) {
			copyToClipboard();
			updateActiveFile(f => {
				const nf = pushToUndo(f);
				return removeSelection(nf);
			});
		}
	}, [activeFile, copyToClipboard, updateActiveFile]);

	const replaceText = useCallback((y: number, x: number, oldLength: number, newText: string) => {
		updateActiveFile(f => {
			const nf = pushToUndo(f);
			const nl = [...nf.lines];
			const line = nl[y];
			nl[y] = line.slice(0, x) + newText + line.slice(x + oldLength);
			return { ...nf, lines: nl, isDirty: true, cursor: { y, x: x + newText.length } };
		});
	}, [updateActiveFile]);

	const replaceAllText = useCallback((matches: { x: number; y: number }[], oldLength: number, newText: string) => {
		updateActiveFile(f => {
			const nf = pushToUndo(f);
			const nl = [...nf.lines];
			// Sort matches from bottom-to-top, right-to-left to avoid offset issues
			const sortedMatches = [...matches].sort((a, b) => b.y - a.y || b.x - a.x);
			sortedMatches.forEach(m => {
				const line = nl[m.y];
				nl[m.y] = line.slice(0, m.x) + newText + line.slice(m.x + oldLength);
			});
			return { ...nf, lines: nl, isDirty: true };
		});
	}, [updateActiveFile]);

	return { moveCursor, handleTextDelete, handleTextInput, handleEnter, copyToClipboard, pasteFromClipboard, cutToClipboard, undo, redo, replaceText, replaceAllText };
};
