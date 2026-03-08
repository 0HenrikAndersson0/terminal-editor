import React from 'react';
import { Box, Text } from 'ink';
import { FileState } from '../types.js';

interface FooterProps {
	activeFile: FileState | null;
	gotoLineInput: string | null;
	searchInput?: string | null;
	searchCursorIndex?: number;
	searchResultsCount?: number;
	searchIndex?: number;
	showGitGutter?: boolean;
	showExplorer?: boolean;
	replaceInput?: string | null;
	replaceCursorIndex?: number;
	searchFocus?: 'search' | 'replace';
	branchName?: string | null;
}

const Footer: React.FC<FooterProps> = ({
	activeFile,
	gotoLineInput,
	searchInput,
	searchCursorIndex,
	searchResultsCount = 0,
	searchIndex = 0,
	showGitGutter = false,
	showExplorer = false,
	replaceInput,
	replaceCursorIndex,
	searchFocus,
	branchName,
}) => {
	const renderShortcut = (label: string, active: boolean = false) => {
		return (
			<Text backgroundColor={active ? 'white' : 'gray'} color="black">
				{' '}{label}{' '}
			</Text>
		);
	};

	return (
		<Box paddingX={1} flexShrink={0} height={1}>
			{searchInput !== undefined && searchInput !== null ? (
				<Box flexDirection="row">
					<Text backgroundColor={searchFocus === 'search' ? "blue" : "gray"} color="white">
						{' Search: '}
						{searchInput.slice(0, searchCursorIndex ?? searchInput.length)}
						<Text backgroundColor="white" color={searchFocus === 'search' ? "blue" : "gray"}>
							{(searchCursorIndex ?? searchInput.length) < searchInput.length ? searchInput[searchCursorIndex ?? searchInput.length] : '_'}
						</Text>
						{searchInput.slice((searchCursorIndex ?? searchInput.length) + 1)}
						{` (${searchResultsCount > 0 ? `${searchIndex + 1}/${searchResultsCount}` : '0/0'}) `}
					</Text>
					{replaceInput !== undefined && replaceInput !== null && (
						<Text backgroundColor={searchFocus === 'replace' ? "magenta" : "gray"} color="white">
							{' Replace with: '}
							{replaceInput.slice(0, replaceCursorIndex ?? replaceInput.length)}
							<Text backgroundColor="white" color={searchFocus === 'replace' ? "magenta" : "gray"}>
								{(replaceCursorIndex ?? replaceInput.length) < replaceInput.length ? replaceInput[replaceCursorIndex ?? replaceInput.length] : '_'}
							</Text>
							{replaceInput.slice((replaceCursorIndex ?? replaceInput.length) + 1)}
							{' (Enter: replace, ^Enter: all) '}
						</Text>
					)}
				</Box>
			) : gotoLineInput !== null ? (
				<Text backgroundColor="blue" color="white"> Go to line: {gotoLineInput}_ </Text>
			) : (
				<>
					<Box flexGrow={1} flexBasis={0}>
						<Text backgroundColor="gray" color="black" wrap="truncate">
							{activeFile ? ` Ln ${activeFile.cursor.y + 1}, Col ${activeFile.cursor.x + 1} │ ${activeFile.lang.toUpperCase()} ${branchName ? `│ ᚠ ${branchName} ` : ''}` : ' No active file '}
						</Text>
					</Box>
					<Box flexGrow={1} flexBasis={0} justifyContent="flex-end">
						<Box flexDirection="row">
							{renderShortcut('^L Help')}
							<Text color="black" backgroundColor="gray"> │ </Text>
							{renderShortcut('^S Save', activeFile?.isDirty)}
							<Text color="black" backgroundColor="gray"> │ </Text>
							{renderShortcut('^Q Quit')}
						</Box>
					</Box>
				</>
			)}
		</Box>
	);
};

export default Footer;
