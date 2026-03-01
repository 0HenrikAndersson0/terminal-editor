import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Highlighter } from 'shiki';
import { FileState, Selection } from '../types.js';

interface EditorProps {
	activeFile: FileState | null;
	highlighter: Highlighter | null;
	viewHeight: number;
	availableWidth: number;
	showGitGutter: boolean;
	showExplorer: boolean;
	searchInput?: string | null;
	searchResults?: { x: number; y: number }[];
	searchIndex?: number;
}

const Editor: React.FC<EditorProps> = ({ activeFile, highlighter, viewHeight, availableWidth, showGitGutter, showExplorer, searchInput, searchResults = [], searchIndex = 0 }) => {
	if (!activeFile) {
		return (
			<Box flexGrow={1} alignItems="center" justifyContent="center">
				<Text color="gray">Press ^E to open explorer</Text>
			</Box>
		);
	}

	const visibleLines = activeFile.lines.slice(activeFile.scroll, activeFile.scroll + viewHeight);

	const renderHighlightedLine = (line: string, lineIndex: number) => {
		const isCursorLine = lineIndex === activeFile.cursor.y;
		const activeCursorX = activeFile.cursor.x;
		const selection = activeFile.selection;
		const gitChanges = activeFile.gitChanges;

		// Replace tabs with spaces for consistent width
		const processedLine = line.replace(/\t/g, '    ');

		let realSelection: Selection | null = null;
		if (selection) {
			const { start, end } = selection;
			const isBackward = start.y > end.y || (start.y === end.y && start.x > end.x);
			realSelection = isBackward ? { start: end, end: start } : selection;
		}

		const tokens = highlighter && activeFile.lang !== 'text'
			? highlighter.codeToTokens(processedLine, { lang: activeFile.lang as any, theme: 'github-dark' }).tokens[0]
			: [{ content: processedLine || ' ', color: undefined }];

		const rawXMapping: number[] = [];
		for (let i = 0; i < line.length; i++) {
			if (line[i] === '\t') {
				for (let j = 0; j < 4; j++) rawXMapping.push(i);
			} else {
				rawXMapping.push(i);
			}
		}

		const lineChars: { char: string; color?: string; rawX: number }[] = [];
		let visualIdx = 0;
		tokens.forEach(t => {
			t.content.split('').forEach(char => {
				lineChars.push({ char, color: t.color, rawX: rawXMapping[visualIdx] ?? visualIdx });
				visualIdx++;
			});
		});

		if (lineChars.length === 0) lineChars.push({ char: ' ', rawX: 0 });

		const visibleChars = lineChars.slice(activeFile.scrollX, activeFile.scrollX + availableWidth);

		let lineNumberColor = isCursorLine ? 'white' : 'gray';
		if (showGitGutter && gitChanges?.addedLines.has(lineIndex)) {
			lineNumberColor = 'green';
		}

		return (
			<Box key={lineIndex} height={1} flexShrink={0}>
				<Box width={6} flexShrink={0}>
					{showGitGutter && gitChanges?.deletedLines.has(lineIndex) && (
						<Box position="absolute" marginLeft={-1}><Text color="red">^</Text></Box>
					)}
					<Text color={lineNumberColor} backgroundColor={isCursorLine ? 'gray' : undefined} wrap="truncate">{String(lineIndex + 1).padStart(3)} │ </Text>
				</Box>
				<Box flexGrow={1} flexShrink={0}>
					<Text backgroundColor={isCursorLine ? 'gray' : undefined} wrap="truncate">
						{visibleChars.map((item, i) => {
							const x = i + activeFile.scrollX;
							let isSelected = false;
							if (realSelection) {
								const { start, end } = realSelection;
								if (lineIndex > start.y && lineIndex < end.y) isSelected = true;
								else if (lineIndex === start.y && lineIndex === end.y) isSelected = item.rawX >= start.x && item.rawX < end.x;
								else if (lineIndex === start.y) isSelected = item.rawX >= start.x;
								else if (lineIndex === end.y) isSelected = item.rawX < end.x;
							}

							const isCursor = isCursorLine && item.rawX === activeCursorX;

							let isSearchMatch = false;
							let isActiveSearchMatch = false;

							if (searchInput) {
								for (let i = 0; i < searchResults.length; i++) {
									const res = searchResults[i];
									if (res.y === lineIndex && item.rawX >= res.x && item.rawX < res.x + searchInput.length) {
										isSearchMatch = true;
										if (i === searchIndex) isActiveSearchMatch = true;
										break;
									}
								}
							}

							let bgColor: string | undefined = isCursorLine ? 'gray' : undefined;
							let fgColor: string | undefined = item.color;

							if (isCursor) {
								bgColor = 'white';
								fgColor = 'black';
							} else if (isSelected) {
								bgColor = 'blue';
								fgColor = 'white';
							} else if (isActiveSearchMatch) {
								bgColor = 'green';
								fgColor = 'black';
							} else if (isSearchMatch) {
								bgColor = 'yellow';
								fgColor = 'black';
							}

							return (
								<Text key={i} backgroundColor={bgColor} color={fgColor}>
									{item.char}
								</Text>
							);
						})}
						{isCursorLine && activeCursorX >= (activeFile.scrollX + visibleChars.length) && activeCursorX < (activeFile.scrollX + availableWidth) && (
							<Text backgroundColor="white" color="black"> </Text>
						)}
					</Text>
				</Box>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" flexGrow={1} flexShrink={1} paddingX={1} height={viewHeight}>
			{visibleLines.map((line, index) => renderHighlightedLine(line, activeFile.scroll + index))}
		</Box>
	);
};

export default Editor;
