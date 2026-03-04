import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { FileNode } from '../types.js';

interface ExplorerProps {
	nodes: FileNode[];
	selectionIndex: number;
	terminalHeight: number;
	width: number;
}

const Explorer: React.FC<ExplorerProps> = ({ nodes, selectionIndex, terminalHeight, width }) => {
	const [scrollOffset, setScrollOffset] = useState(0);
	const visibleCount = Math.max(1, terminalHeight - 5);

	useEffect(() => {
		if (selectionIndex < scrollOffset) {
			setScrollOffset(selectionIndex);
		} else if (selectionIndex >= scrollOffset + visibleCount) {
			setScrollOffset(selectionIndex - visibleCount + 1);
		} else {
			const maxScroll = Math.max(0, nodes.length - visibleCount);
			if (scrollOffset > maxScroll) {
				setScrollOffset(maxScroll);
			}
		}
	}, [selectionIndex, visibleCount, scrollOffset, nodes.length]);

	const visibleNodes = nodes.slice(scrollOffset, scrollOffset + visibleCount);

	return (
		<Box width={width} flexDirection="column" borderStyle="single" borderColor="gray" flexShrink={0}>
			{visibleNodes.map((node, i) => {
				const absoluteIndex = scrollOffset + i;
				return (
					<Box key={absoluteIndex} paddingX={1}>
						<Text wrap="truncate" color={absoluteIndex === selectionIndex ? 'white' : undefined} backgroundColor={absoluteIndex === selectionIndex ? 'blue' : undefined}>
							{'  '.repeat(node.level)}
							{node.isDirectory ? (node.isOpen ? '▾ ' : '▸ ') : '  '}
							{node.name}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default Explorer;
