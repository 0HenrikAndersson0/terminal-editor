import React from 'react';
import { Box, Text } from 'ink';
import { FileNode } from '../types.js';

interface ExplorerProps {
	nodes: FileNode[];
	selectionIndex: number;
	terminalHeight: number;
}

const Explorer: React.FC<ExplorerProps> = ({ nodes, selectionIndex, terminalHeight }) => {
	return (
		<Box width={30} flexDirection="column" borderStyle="single" borderColor="gray" flexShrink={0}>
			{nodes.slice(0, terminalHeight - 5).map((node, i) => (
				<Box key={i} paddingX={1}>
					<Text wrap="truncate" color={i === selectionIndex ? 'white' : undefined} backgroundColor={i === selectionIndex ? 'blue' : undefined}>
						{'  '.repeat(node.level)}
						{node.isDirectory ? (node.isOpen ? '▾ ' : '▸ ') : '  '}
						{node.name}
					</Text>
				</Box>
			))}
		</Box>
	);
};

export default Explorer;
