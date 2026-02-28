import React from 'react';
import { Box, Text } from 'ink';
import { FileState } from '../types.js';

interface FooterProps {
	activeFile: FileState | null;
	gotoLineInput: string | null;
}

const Footer: React.FC<FooterProps> = ({ activeFile, gotoLineInput }) => {
	return (
		<Box paddingX={1} flexShrink={0} height={1}>
			{gotoLineInput !== null ? (
				<Text backgroundColor="blue" color="white"> Go to line: {gotoLineInput}_ </Text>
			) : (
				<>
					<Text backgroundColor="gray" color="black" wrap="truncate">
						{activeFile ? `Ln ${activeFile.cursor.y + 1}, Col ${activeFile.cursor.x + 1} │ ${activeFile.lang.toUpperCase()}` : 'No active file'}
					</Text>
					<Box flexGrow={1} />
					<Text backgroundColor="gray" color="black" wrap="truncate">
						Shift+Arrows: Mark │ ^K Copy │ ^U Paste │ ^G Goto │ ^E Explorer │ ^D Diff │ ^N/^P Tabs │ ^S Save │ ^Q Quit
					</Text>
				</>
			)}
		</Box>
	);
};

export default Footer;
