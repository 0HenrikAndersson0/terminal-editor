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
		<Box paddingX={1} flexShrink={0} height={1} gap={2}>
			{files.map((f, i) => (
				<Box key={i}>
					<Text
						bold={i === activeFileIndex}
						color={i === activeFileIndex ? 'cyan' : 'gray'}
						backgroundColor={i === activeFileIndex ? '#333' : undefined}
						wrap="truncate"
					>
						 {i + 1}: {path.basename(f.path)}{f.isDirty ? '*' : ''} 
					</Text>
				</Box>
			))}
		</Box>
	);
};

export default TabBar;
