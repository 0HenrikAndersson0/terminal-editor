import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHighlighter, Highlighter } from 'shiki';

interface FileState {
	path: string;
	lines: string[];
	cursor: { x: number; y: number };
	scroll: number;
	loading: boolean;
	error: string | null;
	lang: string;
	isDirty: boolean;
}

interface AppProps {
	filePaths: string[];
}

const App: React.FC<AppProps> = ({ filePaths }) => {
	const [files, setFiles] = useState<FileState[]>([]);
	const [activeFileIndex, setActiveFileIndex] = useState(0);
	const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
	const [swapBackspaceDelete, setSwapBackspaceDelete] = useState(false);

	const { stdout } = useStdout();
	const terminalHeight = stdout?.rows ?? 24;
	const viewHeight = Math.max(1, terminalHeight - 7);

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
						isDirty: false
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
						isDirty: false
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

		let isBackspace = key.backspace || input === '\x7f' || input === '\b';
		let isDelete = key.delete && !isBackspace;

		if (swapBackspaceDelete) {
			const tmp = isBackspace;
			isBackspace = isDelete;
			isDelete = tmp;
		}

		if (key.upArrow) {
			updateActiveFile(f => {
				const newY = Math.max(0, f.cursor.y - 1);
				return { ...f, cursor: { y: newY, x: Math.min(f.cursor.x, f.lines[newY].length) } };
			});
		} else if (key.downArrow) {
			updateActiveFile(f => {
				const newY = Math.min(f.lines.length - 1, f.cursor.y + 1);
				return { ...f, cursor: { y: newY, x: Math.min(f.cursor.x, f.lines[newY].length) } };
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
		} else if (key.return) {
			updateActiveFile(f => {
				const before = f.lines[f.cursor.y].slice(0, f.cursor.x);
				const after = f.lines[f.cursor.y].slice(f.cursor.x);
				const newLines = [...f.lines];
				newLines[f.cursor.y] = before;
				newLines.splice(f.cursor.y + 1, 0, after);
				return { ...f, lines: newLines, cursor: { y: f.cursor.y + 1, x: 0 }, isDirty: true };
			});
		} else if (isBackspace) {
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
		} else if (isDelete) {
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

	const renderHighlightedLine = (line: string, isCursorLine: boolean, activeCursorX: number, activeLang: string) => {
		if (!highlighter || activeLang === 'text') {
			return (
				<Text>
					{isCursorLine ? (
						<>
							{line.slice(0, activeCursorX)}
							<Text backgroundColor="white" color="black">{line[activeCursorX] || ' '}</Text>
							{line.slice(activeCursorX + 1)}
						</>
					) : line}
				</Text>
			);
		}

		try {
			const tokens = highlighter.codeToTokens(line, { lang: activeLang as any, theme: 'github-dark' }).tokens[0];
			let offset = 0;
			return (
				<Text>
					{tokens.map((t, i) => {
						const start = offset;
						const end = offset + t.content.length;
						offset = end;
						if (isCursorLine && activeCursorX >= start && activeCursorX < end) {
							const rel = activeCursorX - start;
							return (
								<Text key={i} color={t.color}>
									{t.content.slice(0, rel)}
									<Text backgroundColor="white" color="black">{t.content[rel]}</Text>
									{t.content.slice(rel + 1)}
								</Text>
							);
						}
						return <Text key={i} color={t.color}>{t.content}</Text>;
					})}
					{isCursorLine && activeCursorX === line.length && <Text backgroundColor="white" color="black"> </Text>}
				</Text>
			);
		} catch {
			return <Text>{line}</Text>;
		}
	};

	if (files.length === 0) return <Box padding={1}><Text color="cyan">Initializing...</Text></Box>;
	if (activeFile.error) return <Box padding={1}><Text color="red">Error: {activeFile.error}</Text></Box>;

	const visibleLines = activeFile.lines.slice(activeFile.scroll, activeFile.scroll + viewHeight);

	return (
		<Box flexDirection="column" height={terminalHeight}>
			<Box paddingX={1} backgroundColor="cyan">
				<Text color="black" bold> TEXT EDITOR </Text>
				<Box flexGrow={1} />
				<Text color="black"> {activeFile.path}{activeFile.isDirty ? '*' : ''} </Text>
			</Box>

			<Box paddingX={1} marginTop={1} gap={2}>
				{files.map((f, i) => (
					<Box key={i} borderStyle="single" borderColor={i === activeFileIndex ? 'cyan' : 'gray'} paddingX={1}>
						<Text bold={i === activeFileIndex} color={i === activeFileIndex ? 'cyan' : 'gray'}>
							{i + 1}: {path.basename(f.path)}{f.isDirty ? '*' : ''}
						</Text>
					</Box>
				))}
			</Box>

			<Box flexDirection="column" flexGrow={1} paddingX={1} marginTop={1}>
				{visibleLines.map((line, index) => {
					const lineIdx = activeFile.scroll + index;
					return (
						<Box key={lineIdx}>
							<Box width={5}>
								<Text color="gray">{String(lineIdx + 1).padStart(3)} │ </Text>
							</Box>
							{renderHighlightedLine(line, lineIdx === activeFile.cursor.y, activeFile.cursor.x, activeFile.lang)}
						</Box>
					);
				})}
			</Box>

			<Box paddingX={1} backgroundColor="gray">
				<Text color="black"> Ln {activeFile.cursor.y + 1}, Col {activeFile.cursor.x + 1} │ {activeFile.lang.toUpperCase()} </Text>
				<Box flexGrow={1} />
				<Text color="black"> ^B Swap B/D │ ^S Save │ ^Q Quit </Text>
			</Box>
		</Box>
	);
};

export default App;
