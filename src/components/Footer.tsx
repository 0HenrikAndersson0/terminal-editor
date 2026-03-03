import React from 'react';
import { Box, Text } from 'ink';
import { FileState } from '../types.js';

interface FooterProps {
	activeFile: FileState | null;
	gotoLineInput: string | null;
	searchInput?: string | null;
	searchResultsCount?: number;
	searchIndex?: number;
	showGitGutter?: boolean;
	showExplorer?: boolean;
}

const Footer: React.FC<FooterProps> = ({
	activeFile,
	gotoLineInput,
	searchInput,
	searchResultsCount = 0,
	searchIndex = 0,
	showGitGutter = false,
	showExplorer = false,
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
				<Text backgroundColor="blue" color="white"> Search: {searchInput}_ ({searchResultsCount > 0 ? `${searchIndex + 1}/${searchResultsCount}` : '0/0'}) </Text>
			) : gotoLineInput !== null ? (
				<Text backgroundColor="blue" color="white"> Go to line: {gotoLineInput}_ </Text>
			) : (
				<>
					<Text backgroundColor="gray" color="black" wrap="truncate">
						{activeFile ? ` Ln ${activeFile.cursor.y + 1}, Col ${activeFile.cursor.x + 1} │ ${activeFile.lang.toUpperCase()} ` : ' No active file '}
					</Text>
					<Box flexGrow={1} />
					<Box flexDirection="row">
						<Text color="black" backgroundColor="gray"> Shift+Arrows: Mark │ </Text>
						{renderShortcut('^F Search', searchInput !== null)}
						<Text color="black" backgroundColor="gray"> │ ^K Copy │ ^U Paste │ </Text>
						{renderShortcut('^G Goto', gotoLineInput !== null)}
						<Text color="black" backgroundColor="gray"> │ </Text>
						{renderShortcut('^E Explorer', showExplorer)}
						<Text color="black" backgroundColor="gray"> │ </Text>
						{renderShortcut('^D Diff', showGitGutter)}
						<Text color="black" backgroundColor="gray"> │ ^N/^P Tabs │ ^S Save │ ^Q Quit </Text>
					</Box>
				</>
			)}
		</Box>
	);
};

export default Footer;
