import React from 'react';
import { render } from 'ink';
import App from './App.js';

// Aggressively prevent SIGINT from killing the process
const handleSignal = () => {
	// Do nothing on Ctrl+C at the process level
};

process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);

const args = process.argv.slice(2);
const filePaths = args.length > 0 ? args : ['.'];

render(<App filePaths={filePaths} />);
