import React from 'react';
import { Box, Text } from 'ink';

const Help: React.FC = () => {
	// Content width calculation:
	// Outer Box width: 60
	// Borders: 2 (left and right)
	// paddingX: 4 (2 on each side)
	// Total content width: 60 - 2 - 4 = 54
	const CONTENT_WIDTH = 54;

	const pad = (text: string, width: number) => text.padEnd(width).slice(0, width);

	const renderRow = (key: string, description: string) => (
		<Box key={key} marginBottom={0}>
			<Text backgroundColor="black">
				<Text color="cyan" bold>{pad(key, 15)}</Text>
				<Text color="white">{pad(description, CONTENT_WIDTH - 15)}</Text>
			</Text>
		</Box>
	);

	const renderHeader = (title: string) => (
		<Box marginBottom={0}>
			<Text color="yellow" backgroundColor="black" bold>{pad(title, CONTENT_WIDTH)}</Text>
		</Box>
	);

	const renderSpacer = () => (
		<Box marginBottom={0}>
			<Text backgroundColor="black">{' '.repeat(CONTENT_WIDTH)}</Text>
		</Box>
	);

	return (
		<Box
			position="absolute"
			width="100%"
			height="100%"
			alignItems="center"
			justifyContent="center"
		>
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="blue"
				paddingX={2}
				paddingY={1}
				width={60}
			>
				<Box justifyContent="center">
					<Text color="blue" backgroundColor="black" bold underline>{pad(' Keyboard Shortcuts ', CONTENT_WIDTH)}</Text>
				</Box>

				{renderSpacer()}

				{renderHeader(' General ')}
				{renderRow('^L', 'Toggle Help')}
				{renderRow('^F', 'Search')}
				{renderRow('^R', 'Search & Replace')}
				{renderRow('^Q', 'Quit Editor')}
				{renderRow('^S', 'Save File')}
				{renderRow('Esc', 'Close Dialogs / Cancel')}

				{renderSpacer()}

				{renderHeader(' Navigation ')}
				{renderRow('Arrows', 'Move Cursor')}
				{renderRow('Home/End, ^A/^E', 'Line Start / End')}
				{renderRow('PgUp / PgDn', 'Scroll Page')}
				{renderRow('^G', 'Go to Line')}
				{renderRow('^N / ^P', 'Next / Prev Tab')}

				{renderSpacer()}

				{renderHeader(' Editing ')}
				{renderRow('Shift+Arrows', 'Select Text')}
				{renderRow('Shift+Home/End, ^A/^E', 'Select to Line Start/End')}
				{renderRow('^K', 'Copy Selection')}
				{renderRow('^X', 'Cut Selection')}
				{renderRow('^U', 'Paste Clipboard')}
				{renderRow('^Z', 'Undo')}
				{renderRow('^Y', 'Redo')}

				{renderSpacer()}

				{renderHeader(' Tools ')}
				{renderRow('^F', 'Find / Search')}
				{renderRow('^T', 'Toggle Explorer')}
				{renderRow('^D', 'Toggle Git Diff')}

				{renderSpacer()}

				<Box justifyContent="center">
					<Text color="gray" backgroundColor="black">{pad(' Press ^L or Esc to close ', CONTENT_WIDTH)}</Text>
				</Box>
			</Box>
		</Box>
	);
};

export default Help;
