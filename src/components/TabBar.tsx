import React from 'react';
import { Box, Text } from 'ink';
import path from 'node:path';
import { FileState } from '../types.js';

interface TabBarProps {
	files: FileState[];
	activeFileIndex: number;
}

const TabBar: React.FC<TabBarProps> = ({ files, activeFileIndex }) => {
	return (
		<Box paddingX={1} flexShrink={0} height={3}>
			{files.map((f, i) => (
				<Box key={i} borderStyle="single" borderColor={i === activeFileIndex ? 'cyan' : 'gray'} paddingX={1}>
					<Text bold={i === activeFileIndex} color={i === activeFileIndex ? 'cyan' : 'gray'} wrap="truncate">
						{i + 1}: {path.basename(f.path)}{f.isDirty ? '*' : ''}
					</Text>
				</Box>
			))}
		</Box>
	);
};

export default TabBar;
