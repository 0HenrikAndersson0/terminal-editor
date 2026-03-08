import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHighlighter } from 'shiki';

import { FileNode, FileState } from './types.js';
import Header from './components/Header.js';
import TabBar from './components/TabBar.js';
import Explorer from './components/Explorer.js';
import Editor from './components/Editor.js';
import Footer from './components/Footer.js';
import Help from './components/Help.js';
import { useFileSystem } from './hooks/useFileSystem.js';
import { useGit } from './hooks/useGit.js';
import { useEditor } from './hooks/useEditor.js';

const App: React.FC<{ filePaths: string[] }> = ({ filePaths }) => {
	const [files, setFiles] = useState<FileState[]>([]);
	const [activeFileIndex, setActiveFileIndex] = useState(0);
	const [highlighter, setHighlighter] = useState<any>(null);
	const [swapBackspaceDelete, setSwapBackspaceDelete] = useState(false);
	const [gotoLineInput, setGotoLineInput] = useState<string | null>(null);
	const [showExplorer, setShowExplorer] = useState(false);
	const [explorerNodes, setExplorerNodes] = useState<FileNode[]>([]);
	const [explorerSelectionIndex, setExplorerSelectionIndex] = useState(0);
	const [showGitGutter, setShowGitGutter] = useState(false);
	const [searchInput, setSearchInput] = useState<string | null>(null);
	const [deferredSearchInput, setDeferredSearchInput] = useState<string | null>(null);
	const [searchResults, setSearchResults] = useState<{ x: number; y: number }[]>([]);
	const [searchIndex, setSearchIndex] = useState(0);
	const [searchCursorIndex, setSearchCursorIndex] = useState(0);
	const [replaceInput, setReplaceInput] = useState<string | null>(null);
	const [replaceCursorIndex, setReplaceCursorIndex] = useState(0);
	const [searchFocus, setSearchFocus] = useState<'search' | 'replace'>('search');
	const [branchName, setBranchName] = useState<string | null>(null);
	const [showHelp, setShowHelp] = useState(false);

	const { loadDirectory, getLangFromPath, readFile, writeFile } = useFileSystem();
	const { updateGitChanges, getBranchName } = useGit(setFiles);
	const activeFile = files[activeFileIndex] || null;

	useEffect(() => {
		const timer = setTimeout(() => {
			setDeferredSearchInput(searchInput);
		}, 150);
		return () => clearTimeout(timer);
	}, [searchInput]);

	useEffect(() => {
		if (deferredSearchInput === null || !activeFile || deferredSearchInput === '') {
			setSearchResults([]);
			setSearchIndex(0);
			return;
		}

		const results: { x: number; y: number }[] = [];
		const lowerSearch = deferredSearchInput.toLowerCase();
		activeFile.lines.forEach((line, y) => {
			const lowerLine = line.toLowerCase();
			let x = lowerLine.indexOf(lowerSearch);
			while (x !== -1) {
				results.push({ x, y });
				x = lowerLine.indexOf(lowerSearch, x + 1);
			}
		});
		setSearchResults(results);
		if (searchIndex >= results.length) {
			setSearchIndex(Math.max(0, results.length - 1));
		}
	}, [deferredSearchInput, activeFile?.lines]);

	const updateActiveFile = useCallback((updater: (file: FileState) => FileState) => {
		setFiles(prev => {
			if (prev.length === 0 || activeFileIndex < 0) return prev;
			const next = [...prev];
			next[activeFileIndex] = updater(next[activeFileIndex]);
			return next;
		});
	}, [activeFileIndex]);

	const { stdout } = useStdout();
	const terminalHeight = stdout?.rows ?? 24;
	const terminalWidth = stdout?.columns ?? 80;
	const viewHeight = Math.max(1, terminalHeight - 6);

	let calculatedExplorerWidth = 30;
	if (showExplorer) {
		const maxNodeWidth = explorerNodes.reduce((max, node) => {
			const nodeWidth = (node.level * 2) + (node.isDirectory ? 2 : 2) + node.name.length + 4; // paddingX + borders
			return Math.max(max, nodeWidth);
		}, 30);
		calculatedExplorerWidth = Math.min(maxNodeWidth, Math.floor(terminalWidth * 0.5));
	}
	const explorerWidth = showExplorer ? calculatedExplorerWidth : 0;

	const lineNumWidth = 6;
	const paddingWidth = 2;
	const availableWidth = Math.max(1, terminalWidth - explorerWidth - lineNumWidth - paddingWidth);

	const { moveCursor, handleTextDelete, handleTextInput, handleEnter, copyToClipboard, pasteFromClipboard, cutToClipboard, undo, redo, replaceText, replaceAllText } = useEditor(activeFile, updateActiveFile, viewHeight, availableWidth);

	useEffect(() => {
		(async () => {
			const hl = await createHighlighter({ themes: ['github-dark'], langs: ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'markdown', 'json', 'html', 'css', 'rust', 'go', 'cpp', 'c', 'yaml'] });
			setHighlighter(hl);
			let rootDir = process.cwd();
			for (const fp of filePaths) {
				try { const s = await fs.stat(path.resolve(process.cwd(), fp)); if (s.isDirectory()) { rootDir = path.resolve(process.cwd(), fp); break; } } catch (e) {}
			}
			setExplorerNodes(await loadDirectory(rootDir));
			const initialFiles: FileState[] = [];
			for (const fp of filePaths) {
				try {
					const fullPath = path.resolve(process.cwd(), fp);
					let s; try { s = await fs.stat(fullPath); } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
					if (s && s.isDirectory()) continue;
					initialFiles.push({
						path: fp === '.' ? 'untitled' : fp, lines: (s ? await readFile(fullPath) : '').split('\n'),
						cursor: { x: 0, y: 0 }, scroll: 0, scrollX: 0, loading: false, error: null, lang: getLangFromPath(fp), isDirty: false, selection: null, gitChanges: null,
						undoStack: [], redoStack: []
					});
				} catch (err) {}
			}
			setFiles(initialFiles);
			if (initialFiles.length > 0) setActiveFileIndex(0);
			setBranchName(await getBranchName());
		})();
	}, []);

	useInput((input, key) => {
		if (key.ctrl && input === 'd') { setShowGitGutter(p => !p); if (!showGitGutter) updateGitChanges(activeFileIndex); return; }
		if (key.ctrl && input === 'e') { setShowExplorer(p => !p); return; }
		if (key.ctrl && input === 'f') {
			setSearchInput(p => {
				if (p === null) {
					setSearchCursorIndex(0);
					setSearchFocus('search');
					return '';
				}
				setReplaceInput(null);
				return null;
			});
			return;
		}
		if (key.ctrl && input === 'r') {
			setReplaceInput(p => {
				if (p === null) {
					if (searchInput === null) {
						setSearchInput('');
						setSearchCursorIndex(0);
					}
					setReplaceCursorIndex(0);
					setSearchFocus('replace');
					return '';
				}
				setSearchFocus('search'); // If closing replace, focus search if open
				return null;
			});
			return;
		}
		if (key.ctrl && input === 'g') { setGotoLineInput(p => p === null ? '' : null); return; }
		if (key.ctrl && input === 'h') return; // Ignore Ctrl+H as it conflicts with backspace in some terminals
		if (key.ctrl && input === 'l') { setShowHelp(p => !p); return; }

		if (showHelp) {
			if (key.escape || (key.ctrl && input === 'l')) { setShowHelp(false); return; }
			return;
		}

		if (replaceInput !== null && searchFocus === 'replace') {
			if (key.escape) setReplaceInput(null);
			else if (key.tab) {
				if (searchInput !== null) setSearchFocus('search');
			}
			else if (key.leftArrow) setReplaceCursorIndex(p => Math.max(0, p - 1));
			else if (key.rightArrow) setReplaceCursorIndex(p => Math.min(replaceInput.length, p + 1));
			else if (key.return) {
				if (searchResults.length > 0) {
					const match = searchResults[searchIndex];
					if (key.meta || key.ctrl) {
						replaceAllText(searchResults, searchInput?.length || 0, replaceInput);
						setReplaceInput(null);
						setSearchInput(null);
					} else {
						replaceText(match.y, match.x, searchInput?.length || 0, replaceInput);
					}
				}
			} else if (key.backspace || key.delete || input === '\x7f' || input === '\b') {
				const isForwardDelete = key.delete;
				if (isForwardDelete) {
					setReplaceInput(p => {
						if (replaceCursorIndex < p!.length) {
							return p!.slice(0, replaceCursorIndex) + p!.slice(replaceCursorIndex + 1);
						}
						return p;
					});
				} else {
					setReplaceInput(p => {
						if (replaceCursorIndex > 0) {
							setReplaceCursorIndex(prev => prev - 1);
							return p!.slice(0, replaceCursorIndex - 1) + p!.slice(replaceCursorIndex);
						}
						return p;
					});
				}
			} else if (input && !key.ctrl && !key.meta && !['\r', '\n', '\t'].includes(input) && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow) {
				setReplaceInput(p => {
					const next = p!.slice(0, replaceCursorIndex) + input + p!.slice(replaceCursorIndex);
					setReplaceCursorIndex(prev => prev + input.length);
					return next;
				});
			}
			return;
		}

		if (searchInput !== null && (searchFocus === 'search' || replaceInput === null)) {
			if (key.escape) setSearchInput(null);
			else if (key.tab && replaceInput !== null) {
				setSearchFocus('replace');
			}
			else if (key.leftArrow) setSearchCursorIndex(p => Math.max(0, p - 1));
			else if (key.rightArrow) setSearchCursorIndex(p => Math.min(searchInput.length, p + 1));
			else if (key.tab || key.return) {
				if (searchResults.length > 0) {
					const step = key.shift ? -1 : 1;
					const nextIndex = (searchIndex + step + searchResults.length) % searchResults.length;
					setSearchIndex(nextIndex);
					const match = searchResults[nextIndex];
					updateActiveFile(f => {
						const line = f.lines[match.y];
						let visualX = 0;
						for (let i = 0; i < match.x; i++) {
							visualX += line[i] === '\t' ? 4 : 1;
						}

						let newScrollX = f.scrollX;
						if (visualX < f.scrollX) newScrollX = visualX;
						else if (visualX >= f.scrollX + availableWidth) newScrollX = visualX - availableWidth + 1;

						let newScroll = f.scroll;
						if (match.y < f.scroll) newScroll = match.y;
						else if (match.y >= f.scroll + viewHeight) newScroll = match.y - viewHeight + 1;

						return { ...f, cursor: { y: match.y, x: match.x }, scrollX: newScrollX, scroll: newScroll };
					});
				}
			} else if (key.backspace || key.delete || input === '\x7f' || input === '\b') {
				const isForwardDelete = key.delete;
				if (isForwardDelete) {
					setSearchInput(p => {
						if (searchCursorIndex < p!.length) {
							return p!.slice(0, searchCursorIndex) + p!.slice(searchCursorIndex + 1);
						}
						return p;
					});
				} else {
					setSearchInput(p => {
						if (searchCursorIndex > 0) {
							setSearchCursorIndex(prev => prev - 1);
							return p!.slice(0, searchCursorIndex - 1) + p!.slice(searchCursorIndex);
						}
						return p;
					});
				}
				setSearchIndex(0);
			} else if (input && !key.ctrl && !key.meta && !['\r', '\n', '\t'].includes(input) && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow) {
				setSearchInput(p => {
					const next = p!.slice(0, searchCursorIndex) + input + p!.slice(searchCursorIndex);
					setSearchCursorIndex(prev => prev + input.length);
					return next;
				});
				setSearchIndex(0);
			}
			return;
		}

		if (gotoLineInput !== null) {
			if (key.escape) setGotoLineInput(null);
			else if (key.return) {
				const ln = parseInt(gotoLineInput, 10);
				if (!isNaN(ln)) updateActiveFile(f => ({ ...f, cursor: { y: Math.max(0, Math.min(f.lines.length - 1, ln - 1)), x: Math.min(f.cursor.x, f.lines[Math.max(0, Math.min(f.lines.length - 1, ln - 1))].length) } }));
				setGotoLineInput(null);
			} else if (key.backspace || input === '\x7f' || input === '\b') setGotoLineInput(p => p!.slice(0, -1));
			else if (/^\d$/.test(input)) setGotoLineInput(p => p + input);
			return;
		}

		if (showExplorer) {
			if (key.upArrow) setExplorerSelectionIndex(p => Math.max(0, p - 1));
			else if (key.downArrow) setExplorerSelectionIndex(p => Math.min(explorerNodes.length - 1, p + 1));
			else if (key.return || key.rightArrow || key.leftArrow) {
				const node = explorerNodes[explorerSelectionIndex];
				if (node.isDirectory) {
					if ((key.return || key.rightArrow) && !node.isOpen) {
						(async () => {
							const children = await loadDirectory(node.path, node.level + 1);
							setExplorerNodes(prev => { const next = [...prev]; next[explorerSelectionIndex] = { ...node, isOpen: true }; next.splice(explorerSelectionIndex + 1, 0, ...children); return next; });
						})();
					} else if ((key.return || key.leftArrow) && node.isOpen) {
						setExplorerNodes(prev => {
							const next = [...prev]; next[explorerSelectionIndex] = { ...node, isOpen: false };
							let rc = 0; for (let i = explorerSelectionIndex + 1; i < next.length; i++) { if (next[i].level > node.level) rc++; else break; }
							next.splice(explorerSelectionIndex + 1, rc); return next;
						});
					}
				} else if (key.return) {
					(async () => {
						if (node.isDirectory) return;
						const idx = files.findIndex(f => f.path === node.path);
						if (idx !== -1) setActiveFileIndex(idx);
						else {
							const content = await readFile(node.path);
							const nf: FileState = { path: node.path, lines: content.split('\n'), cursor: { x: 0, y: 0 }, scroll: 0, scrollX: 0, loading: false, error: null, lang: getLangFromPath(node.path), isDirty: false, selection: null, gitChanges: null, undoStack: [], redoStack: [] };
							setFiles(p => { const next = [...p, nf]; setActiveFileIndex(next.length - 1); return next; });
						}
						setShowExplorer(false);
					})();
				}
			}
			return;
		}

		if (key.escape || (key.ctrl && input === 'q')) process.exit();
		if (key.ctrl && input === 'b') { setSwapBackspaceDelete(s => !s); return; }
		if (key.ctrl && input === 'n') { setActiveFileIndex(p => (p + 1) % files.length); return; }
		if (key.ctrl && input === 'p') { setActiveFileIndex(p => (p - 1 + files.length) % files.length); return; }
		if (key.ctrl && input === 'z') { undo(); return; }
		if (key.ctrl && input === 'y') { redo(); return; }

		if (!activeFile || activeFile.loading || activeFile.error) return;

		if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.pageUp || key.pageDown || (key as any).home || (key as any).end) { moveCursor(key, key.shift); return; }
		if (key.ctrl && input === 'k') { copyToClipboard(); return; }
		if (key.ctrl && input === 'x') { cutToClipboard(); return; }
		if (key.ctrl && input === 'u') { pasteFromClipboard(); return; }
		if (key.return) { handleEnter(); return; }

		const isB = key.backspace || input === '\x7f' || input === '\b', isD = key.delete && !isB;
		if (isB || isD) { handleTextDelete(swapBackspaceDelete ? isD : isB, swapBackspaceDelete ? isB : isD); return; }
		if (input && !key.ctrl && !key.meta && !['\r', '\n', '\x7f', '\b'].includes(input)) { handleTextInput(input); return; }

		if (key.ctrl && input === 's') { (async () => { await writeFile(path.resolve(process.cwd(), activeFile.path), activeFile.lines.join('\n')); updateActiveFile(f => ({ ...f, isDirty: false })); updateGitChanges(activeFileIndex); })(); }
	});

	useEffect(() => {
		if (!activeFile) return;
		const maxScroll = Math.max(0, activeFile.lines.length - viewHeight);
		if (activeFile.cursor.y < activeFile.scroll) {
			updateActiveFile(f => ({ ...f, scroll: Math.min(maxScroll, f.cursor.y) }));
		} else if (activeFile.cursor.y >= activeFile.scroll + viewHeight) {
			updateActiveFile(f => ({ ...f, scroll: Math.max(0, Math.min(maxScroll, f.cursor.y - viewHeight + 1)) }));
		}
	}, [activeFile?.cursor.y, viewHeight, activeFile?.lines.length]);

	if (!highlighter) return <Box padding={1}><Text color="cyan">Initializing highlighter...</Text></Box>;
	if (activeFile?.error) return <Box padding={1}><Text color="red">Error: {activeFile.error}</Text></Box>;

	return (
		<Box flexDirection="column" height={terminalHeight}>
			<Header activeFile={activeFile} />
			<Box flexGrow={1} flexDirection="row">
				{showExplorer && <Explorer nodes={explorerNodes} selectionIndex={explorerSelectionIndex} terminalHeight={terminalHeight - 3} width={explorerWidth} />}
				<Box flexDirection="column" flexGrow={1}>
					<TabBar files={files} activeFileIndex={activeFileIndex} />
					<Editor activeFile={activeFile} highlighter={highlighter} viewHeight={viewHeight} availableWidth={availableWidth} showGitGutter={showGitGutter} showExplorer={showExplorer} searchInput={searchInput} searchResults={searchResults} searchIndex={searchIndex} />
					<Footer 
						activeFile={activeFile} 
						gotoLineInput={gotoLineInput} 
						searchInput={searchInput} 
						searchCursorIndex={searchCursorIndex} 
						searchResultsCount={searchResults.length} 
						searchIndex={searchIndex} 
						showGitGutter={showGitGutter} 
						showExplorer={showExplorer}
						replaceInput={replaceInput}
						replaceCursorIndex={replaceCursorIndex}
						searchFocus={searchFocus}
						branchName={branchName}
					/>
				</Box>
			</Box>
			{showHelp && <Help />}
		</Box>
	);
};

export default App;
