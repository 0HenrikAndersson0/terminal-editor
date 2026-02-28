import React from 'react';
import { Box, Text } from 'ink';
import { Highlighter } from 'shiki';
import { FileState, Selection } from '../types.js';

interface EditorProps {
	activeFile: FileState | null;
	highlighter: Highlighter | null;
	viewHeight: number;
	showGitGutter: boolean;
}

const Editor: React.FC<EditorProps> = ({ activeFile, highlighter, viewHeight, showGitGutter }) => {
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

		let lineNumberColor = isCursorLine ? 'white' : 'gray';
		if (showGitGutter && gitChanges?.addedLines.has(lineIndex)) {
			lineNumberColor = 'green';
		}

		return (
			<Box key={lineIndex}>
				<Box width={6}>
					{showGitGutter && gitChanges?.deletedLines.has(lineIndex) && (
						<Box position="absolute" marginLeft={-1}><Text color="red">^</Text></Box>
					)}
					<Text color={lineNumberColor} backgroundColor={isCursorLine ? 'gray' : undefined} wrap="truncate">{String(lineIndex + 1).padStart(3)} │ </Text>
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

	return (
		<Box flexDirection="column" flexGrow={1} flexShrink={1} paddingX={1}>
			{visibleLines.map((line, index) => renderHighlightedLine(line, activeFile.scroll + index))}
		</Box>
	);
};

export default Editor;
