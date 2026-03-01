import React from 'react';
import { Box, Text } from 'ink';
import { FileState } from '../types.js';

interface HeaderProps {
	activeFile: FileState | null;
}

const Header: React.FC<HeaderProps> = ({ activeFile }) => {
	return (
		<Box paddingX={1} flexShrink={0} height={1}>
			<Text backgroundColor="cyan" color="black" bold> edru </Text>
			<Box flexGrow={1} />
			<Text backgroundColor="cyan" color="black" wrap="truncate"> {activeFile?.path || 'No file'}{activeFile?.isDirty ? '*' : ''} </Text>
		</Box>
	);
};

export default Header;
