import React from 'react';
import { render } from 'ink';
import App from './App.js';

// Aggressively prevent SIGINT from killing the process
const handleSignal = () => {
	// Do nothing on Ctrl+C at the process level
};

process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);

const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
	console.error('Please specify at least one file path to open.');
	process.exit(1);
}

render(<App filePaths={filePaths} />);
