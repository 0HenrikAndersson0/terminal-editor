import React from 'react';
import { Box, Text } from 'ink';
import { FileState } from '../types.js';

interface FooterProps {
	activeFile: FileState | null;
	gotoLineInput: string | null;
	searchInput?: string | null;
	searchResultsCount?: number;
	searchIndex?: number;
}

const Footer: React.FC<FooterProps> = ({ activeFile, gotoLineInput, searchInput, searchResultsCount = 0, searchIndex = 0 }) => {
	return (
		<Box paddingX={1} flexShrink={0} height={1}>
			{searchInput !== undefined && searchInput !== null ? (
				<Text backgroundColor="blue" color="white"> Search: {searchInput}_ ({searchResultsCount > 0 ? `${searchIndex + 1}/${searchResultsCount}` : '0/0'}) </Text>
			) : gotoLineInput !== null ? (
				<Text backgroundColor="blue" color="white"> Go to line: {gotoLineInput}_ </Text>
			) : (
				<>
					<Text backgroundColor="gray" color="black" wrap="truncate">
						{activeFile ? `Ln ${activeFile.cursor.y + 1}, Col ${activeFile.cursor.x + 1} │ ${activeFile.lang.toUpperCase()}` : 'No active file'}
					</Text>
					<Box flexGrow={1} />
					<Text backgroundColor="gray" color="black" wrap="truncate">
						Shift+Arrows: Mark │ ^F Search │ ^K Copy │ ^U Paste │ ^G Goto │ ^E Explorer │ ^D Diff │ ^N/^P Tabs │ ^S Save │ ^Q Quit
					</Text>
				</>
			)}
		</Box>
	);
};

export default Footer;
