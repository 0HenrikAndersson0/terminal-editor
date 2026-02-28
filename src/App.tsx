import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHighlighter, Highlighter } from 'shiki';
import clipboard from 'clipboardy';

interface Selection {
	start: { x: number; y: number };
	end: { x: number; y: number };
}

interface FileState {
	path: string;
	lines: string[];
	cursor: { x: number; y: number };
	scroll: number;
	loading: boolean;
	error: string | null;
	lang: string;
	isDirty: boolean;
	selection: Selection | null;
}

interface AppProps {
	filePaths: string[];
}

const App: React.FC<AppProps> = ({ filePaths }) => {
	const [files, setFiles] = useState<FileState[]>([]);
	const [activeFileIndex, setActiveFileIndex] = useState(0);
	const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
	const [swapBackspaceDelete, setSwapBackspaceDelete] = useState(false);
	const [gotoLineInput, setGotoLineInput] = useState<string | null>(null);

	const { stdout } = useStdout();
	const terminalHeight = stdout?.rows ?? 24;
	const viewHeight = Math.max(1, terminalHeight - 6);

	const getLangFromPath = (filePath: string) => {
		const extension = path.extname(filePath).slice(1) || 'text';
		const mapping: Record<string, string> = {
			js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
			py: 'python', md: 'markdown', json: 'json', html: 'html', css: 'css',
			rs: 'rust', go: 'go', cpp: 'cpp', c: 'c', yaml: 'yaml',
		};
		return mapping[extension] || 'text';
	};

	useEffect(() => {
		const setup = async () => {
			const hl = await createHighlighter({
				themes: ['github-dark'],
				langs: ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'markdown', 'json', 'html', 'css', 'rust', 'go', 'cpp', 'c', 'yaml'],
			});
			setHighlighter(hl);

			const initialFiles: FileState[] = await Promise.all(filePaths.map(async (filePath) => {
				try {
					const fullPath = path.resolve(process.cwd(), filePath);
					let content = '';
					try {
						content = await fs.readFile(fullPath, 'utf8');
					} catch (e: any) {
						if (e.code !== 'ENOENT') throw e;
					}
					return {
						path: filePath,
						lines: content.split('\n'),
						cursor: { x: 0, y: 0 },
						scroll: 0,
						loading: false,
						error: null,
						lang: getLangFromPath(filePath),
						isDirty: false,
						selection: null
					};
				} catch (err: any) {
					return {
						path: filePath,
						lines: [''],
						cursor: { x: 0, y: 0 },
						scroll: 0,
						loading: false,
						error: err.message,
						lang: 'text',
						isDirty: false,
						selection: null
					};
				}
			}));
			setFiles(initialFiles);
		};

		setup();
	}, []);

	const activeFile = files[activeFileIndex];

	const updateActiveFile = useCallback((updater: (file: FileState) => FileState) => {
		setFiles(prev => {
			if (prev.length === 0) return prev;
			const next = [...prev];
			next[activeFileIndex] = updater(next[activeFileIndex]);
			return next;
		});
	}, [activeFileIndex]);

	useInput((input, key) => {
		if (key.ctrl && input === 'g') {
			setGotoLineInput(prev => prev === null ? '' : null);
			return;
		}

		if (gotoLineInput !== null) {
			if (key.escape) {
				setGotoLineInput(null);
			} else if (key.return) {
				const lineNum = parseInt(gotoLineInput, 10);
				if (!isNaN(lineNum)) {
					updateActiveFile(f => {
						const targetY = Math.max(0, Math.min(f.lines.length - 1, lineNum - 1));
						return { ...f, cursor: { y: targetY, x: Math.min(f.cursor.x, f.lines[targetY].length) } };
					});
				}
				setGotoLineInput(null);
			} else if (key.backspace || input === '\x7f' || input === '\b') {
				setGotoLineInput(prev => prev!.slice(0, -1));
			} else if (/^\d$/.test(input)) {
				setGotoLineInput(prev => prev + input);
			}
			return;
		}

		if (key.escape || (key.ctrl && input === 'q')) {
			process.exit();
		}

		if (key.ctrl && input === 'b') {
			setSwapBackspaceDelete(s => !s);
			return;
		}

		if (key.ctrl && input === 'n') {
			setActiveFileIndex(prev => (prev + 1) % files.length);
			return;
		}
		if (key.ctrl && input === 'p') {
			setActiveFileIndex(prev => (prev - 1 + files.length) % files.length);
			return;
		}

		if (!activeFile || activeFile.loading || activeFile.error) return;

		const isMoving = key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.pageUp || key.pageDown;

		if (isMoving && key.shift) {
			updateActiveFile(f => {
				const start = f.selection ? f.selection.start : { ...f.cursor };
				const newCursor = { ...f.cursor };

				if (key.upArrow) {
					const newY = Math.max(0, f.cursor.y - 1);
					const currentIndent = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const targetIndent = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					newCursor.y = newY;
					newCursor.x = f.cursor.x === currentIndent ? targetIndent : Math.min(f.cursor.x, f.lines[newY].length);
				} else if (key.downArrow) {
					const newY = Math.min(f.lines.length - 1, f.cursor.y + 1);
					const currentIndent = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
					const targetIndent = f.lines[newY].match(/^\s*/)?.[0].length || 0;
					newCursor.y = newY;
					newCursor.x = f.cursor.x === currentIndent ? targetIndent : Math.min(f.cursor.x, f.lines[newY].length);
				} else if (key.pageUp) {
					newCursor.y = Math.max(0, f.cursor.y - viewHeight);
					newCursor.x = Math.min(f.cursor.x, f.lines[newCursor.y].length);
				} else if (key.pageDown) {
					newCursor.y = Math.min(f.lines.length - 1, f.cursor.y + viewHeight);
					newCursor.x = Math.min(f.cursor.x, f.lines[newCursor.y].length);
				} else if (key.leftArrow) {
					if (f.cursor.x > 0) newCursor.x = f.cursor.x - 1;
					else if (f.cursor.y > 0) {
						newCursor.y = f.cursor.y - 1;
						newCursor.x = f.lines[newCursor.y].length;
					}
				} else if (key.rightArrow) {
					if (f.cursor.x < f.lines[f.cursor.y].length) newCursor.x = f.cursor.x + 1;
					else if (f.cursor.y < f.lines.length - 1) {
						newCursor.y = f.cursor.y + 1;
						newCursor.x = 0;
					}
				}

				return { ...f, cursor: newCursor, selection: { start, end: newCursor } };
			});
			return;
		}

		if (isMoving && !key.shift) {
			updateActiveFile(f => ({ ...f, selection: null }));
		}

		if (key.upArrow) {
			updateActiveFile(f => {
				const newY = Math.max(0, f.cursor.y - 1);
				const currentIndent = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
				const targetIndent = f.lines[newY].match(/^\s*/)?.[0].length || 0;
				return { ...f, cursor: { y: newY, x: f.cursor.x === currentIndent ? targetIndent : Math.min(f.cursor.x, f.lines[newY].length) } };
			});
		} else if (key.downArrow) {
			updateActiveFile(f => {
				const newY = Math.min(f.lines.length - 1, f.cursor.y + 1);
				const currentIndent = f.lines[f.cursor.y].match(/^\s*/)?.[0].length || 0;
				const targetIndent = f.lines[newY].match(/^\s*/)?.[0].length || 0;
				return { ...f, cursor: { y: newY, x: f.cursor.x === currentIndent ? targetIndent : Math.min(f.cursor.x, f.lines[newY].length) } };
			});
		} else if (key.pageUp) {
			updateActiveFile(f => {
				const newY = Math.max(0, f.cursor.y - viewHeight);
				return {
					...f,
					cursor: { y: newY, x: Math.min(f.cursor.x, f.lines[newY].length) },
					scroll: Math.max(0, f.scroll - viewHeight)
				};
			});
		} else if (key.pageDown) {
			updateActiveFile(f => {
				const newY = Math.min(f.lines.length - 1, f.cursor.y + viewHeight);
				return {
					...f,
					cursor: { y: newY, x: Math.min(f.cursor.x, f.lines[newY].length) },
					scroll: Math.min(Math.max(0, f.lines.length - viewHeight), f.scroll + viewHeight)
				};
			});
		} else if (key.leftArrow) {
			updateActiveFile(f => {
				if (f.cursor.x > 0) return { ...f, cursor: { ...f.cursor, x: f.cursor.x - 1 } };
				if (f.cursor.y > 0) return { ...f, cursor: { y: f.cursor.y - 1, x: f.lines[f.cursor.y - 1].length } };
				return f;
			});
		} else if (key.rightArrow) {
			updateActiveFile(f => {
				if (f.cursor.x < f.lines[f.cursor.y].length) return { ...f, cursor: { ...f.cursor, x: f.cursor.x + 1 } };
				if (f.cursor.y < f.lines.length - 1) return { ...f, cursor: { y: f.cursor.y + 1, x: 0 } };
				return f;
			});
		} else if (key.ctrl && input === 'k') { // K for "Kill/Keep" (Copy)
			if (activeFile.selection) {
				const { start, end } = activeFile.selection;
				const realStart = (start.y < end.y || (start.y === end.y && start.x < end.x)) ? start : end;
				const realEnd = (start.y < end.y || (start.y === end.y && start.x < end.x)) ? end : start;

				let selectedText = '';
				if (realStart.y === realEnd.y) {
					selectedText = activeFile.lines[realStart.y].slice(realStart.x, realEnd.x);
				} else {
					selectedText += activeFile.lines[realStart.y].slice(realStart.x) + '\n';
					for (let i = realStart.y + 1; i < realEnd.y; i++) {
						selectedText += activeFile.lines[i] + '\n';
					}
					selectedText += activeFile.lines[realEnd.y].slice(0, realEnd.x);
				}
				clipboard.writeSync(selectedText);
			}
			return;
		} else if (key.ctrl && input === 'u') { // U for "Un-kill" (Paste)
			const text = clipboard.readSync();
			if (text) {
				const pasteLines = text.split(/\r?\n/);
				updateActiveFile(f => {
					const newLines = [...f.lines];
					const before = f.lines[f.cursor.y].slice(0, f.cursor.x);
					const after = f.lines[f.cursor.y].slice(f.cursor.x);

					if (pasteLines.length === 1) {
						newLines[f.cursor.y] = before + pasteLines[0] + after;
						return { ...f, lines: newLines, cursor: { y: f.cursor.y, x: f.cursor.x + pasteLines[0].length }, isDirty: true };
					} else {
						newLines[f.cursor.y] = before + pasteLines[0];
						newLines.splice(f.cursor.y + 1, 0, ...pasteLines.slice(1, -1), pasteLines[pasteLines.length - 1] + after);
						return { ...f, lines: newLines, cursor: { y: f.cursor.y + pasteLines.length - 1, x: pasteLines[pasteLines.length - 1].length }, isDirty: true };
					}
				});
			}
			return;
		} else if (key.return) {
			updateActiveFile(f => {
				const currentLine = f.lines[f.cursor.y];
				const indent = currentLine.match(/^\s*/)?.[0] || '';
				const before = currentLine.slice(0, f.cursor.x);
				const after = currentLine.slice(f.cursor.x);
				const newLines = [...f.lines];
				newLines[f.cursor.y] = before;
				newLines.splice(f.cursor.y + 1, 0, indent + after);
				return { ...f, lines: newLines, cursor: { y: f.cursor.y + 1, x: indent.length }, isDirty: true };
			});
		} else {
			const isBackspace = key.backspace || input === '\x7f' || input === '\b';
			const isDelete = key.delete && !isBackspace;

			let backspace = isBackspace;
			let del = isDelete;
			if (swapBackspaceDelete) {
				backspace = isDelete;
				del = isBackspace;
			}

			if (backspace) {
				updateActiveFile(f => {
					if (f.cursor.x > 0) {
						const line = f.lines[f.cursor.y];
						const newLines = [...f.lines];
						newLines[f.cursor.y] = line.slice(0, f.cursor.x - 1) + line.slice(f.cursor.x);
						return { ...f, lines: newLines, cursor: { ...f.cursor, x: f.cursor.x - 1 }, isDirty: true };
					} else if (f.cursor.y > 0) {
						const prevLine = f.lines[f.cursor.y - 1];
						const currentLine = f.lines[f.cursor.y];
						const newLines = [...f.lines];
						newLines[f.cursor.y - 1] = prevLine + currentLine;
						newLines.splice(f.cursor.y, 1);
						return { ...f, lines: newLines, cursor: { y: f.cursor.y - 1, x: prevLine.length }, isDirty: true };
					}
					return f;
				});
			} else if (del) {
				updateActiveFile(f => {
					const line = f.lines[f.cursor.y];
					if (f.cursor.x < line.length) {
						const newLines = [...f.lines];
						newLines[f.cursor.y] = line.slice(0, f.cursor.x) + line.slice(f.cursor.x + 1);
						return { ...f, lines: newLines, isDirty: true };
					} else if (f.cursor.y < f.lines.length - 1) {
						const nextLine = f.lines[f.cursor.y + 1];
						const newLines = [...f.lines];
						newLines[f.cursor.y] = line + nextLine;
						newLines.splice(f.cursor.y + 1, 1);
						return { ...f, lines: newLines, isDirty: true };
					}
					return f;
				});
			} else if (input && !key.ctrl && !key.meta && input !== '\r' && input !== '\n' && input !== '\x7f' && input !== '\b') {
				updateActiveFile(f => {
					const line = f.lines[f.cursor.y];
					const newLines = [...f.lines];
					newLines[f.cursor.y] = line.slice(0, f.cursor.x) + input + line.slice(f.cursor.x);
					return { ...f, lines: newLines, cursor: { ...f.cursor, x: f.cursor.x + input.length }, isDirty: true };
				});
			}
		}

		if (key.ctrl && input === 's') {
			fs.writeFile(path.resolve(process.cwd(), activeFile.path), activeFile.lines.join('\n'));
			updateActiveFile(f => ({ ...f, isDirty: false }));
		}
	});

	useEffect(() => {
		if (!activeFile) return;
		if (activeFile.cursor.y < activeFile.scroll) {
			updateActiveFile(f => ({ ...f, scroll: f.cursor.y }));
		} else if (activeFile.cursor.y >= activeFile.scroll + viewHeight) {
			updateActiveFile(f => ({ ...f, scroll: f.cursor.y - viewHeight + 1 }));
		}
	}, [activeFile?.cursor.y, viewHeight]);

	const renderHighlightedLine = (line: string, lineIndex: number) => {
		const isCursorLine = lineIndex === activeFile.cursor.y;
		const activeCursorX = activeFile.cursor.x;
		const selection = activeFile.selection;

		let realSelection: Selection | null = null;
		if (selection) {
			const { start, end } = selection;
			const isBackward = start.y > end.y || (start.y === end.y && start.x > end.x);
			realSelection = isBackward ? { start: end, end: start } : selection;
		}

		const tokens = highlighter && activeFile.lang !== 'text'
			? highlighter.codeToTokens(line, { lang: activeFile.lang as any, theme: 'github-dark' }).tokens[0]
			: [{ content: line || ' ', color: undefined }];

		const lineChars: { char: string; color?: string }[] = [];
		tokens.forEach(t => {
			t.content.split('').forEach(char => {
				lineChars.push({ char, color: t.color });
			});
		});

		if (lineChars.length === 0) lineChars.push({ char: ' ' });

		return (
			<Box key={lineIndex}>
				<Box width={6}>
					<Text color={isCursorLine ? 'white' : 'gray'} backgroundColor={isCursorLine ? 'gray' : undefined} wrap="truncate">{String(lineIndex + 1).padStart(3)} │ </Text>
				</Box>
				<Box flexGrow={1}>
					<Text backgroundColor={isCursorLine ? 'gray' : undefined} wrap="truncate">
						{lineChars.map((item, x) => {
							let isSelected = false;
							if (realSelection) {
								const { start, end } = realSelection;
								if (lineIndex > start.y && lineIndex < end.y) isSelected = true;
								else if (lineIndex === start.y && lineIndex === end.y) isSelected = x >= start.x && x < end.x;
								else if (lineIndex === start.y) isSelected = x >= start.x;
								else if (lineIndex === end.y) isSelected = x < end.x;
							}

							const isCursor = isCursorLine && x === activeCursorX;

							let bgColor: string | undefined = isCursorLine ? 'gray' : undefined;
							let fgColor: string | undefined = item.color;

							if (isCursor) {
								bgColor = 'white';
								fgColor = 'black';
							} else if (isSelected) {
								bgColor = 'blue';
								fgColor = 'white';
							}

							return (
								<Text key={x} backgroundColor={bgColor} color={fgColor}>
									{item.char}
								</Text>
							);
						})}
						{isCursorLine && activeCursorX === lineChars.length && (
							<Text backgroundColor="white" color="black"> </Text>
						)}
					</Text>
				</Box>
			</Box>
		);
	};

	if (files.length === 0) return <Box padding={1}><Text color="cyan">Initializing...</Text></Box>;
	if (activeFile.error) return <Box padding={1}><Text color="red">Error: {activeFile.error}</Text></Box>;

	const visibleLines = activeFile.lines.slice(activeFile.scroll, activeFile.scroll + viewHeight);

	return (
		<Box flexDirection="column" height={terminalHeight}>
			<Box paddingX={1} flexShrink={0} height={1}>
				<Text backgroundColor="cyan" color="black" bold> CLI EDITOR </Text>
				<Box flexGrow={1} />
				<Text backgroundColor="cyan" color="black" wrap="truncate"> {activeFile.path}{activeFile.isDirty ? '*' : ''} </Text>
			</Box>

			<Box paddingX={1} flexShrink={0} height={3}>
				{files.map((f, i) => (
					<Box key={i} borderStyle="single" borderColor={i === activeFileIndex ? 'cyan' : 'gray'} paddingX={1}>
						<Text bold={i === activeFileIndex} color={i === activeFileIndex ? 'cyan' : 'gray'} wrap="truncate">
							{i + 1}: {path.basename(f.path)}{f.isDirty ? '*' : ''}
						</Text>
					</Box>
				))}
			</Box>

			<Box flexDirection="column" flexGrow={1} flexShrink={1} paddingX={1}>
				{visibleLines.map((line, index) => renderHighlightedLine(line, activeFile.scroll + index))}
			</Box>

			<Box paddingX={1} flexShrink={0} height={1}>
				{gotoLineInput !== null ? (
					<Text backgroundColor="blue" color="white"> Go to line: {gotoLineInput}_ </Text>
				) : (
					<>
						<Text backgroundColor="gray" color="black" wrap="truncate"> Ln {activeFile.cursor.y + 1}, Col {activeFile.cursor.x + 1} │ {activeFile.lang.toUpperCase()} </Text>
						<Box flexGrow={1} />
						<Text backgroundColor="gray" color="black" wrap="truncate"> Shift+Arrows: Mark │ ^K Copy │ ^U Paste │ ^G Goto │ ^S Save │ ^Q Quit </Text>
					</>
				)}
			</Box>
		</Box>
	);
};

export default App;
