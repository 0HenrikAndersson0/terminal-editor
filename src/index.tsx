import React from 'react';
import { render } from 'ink';
import App from './App.js';

const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
	console.error('Please specify at least one file path to open.');
	process.exit(1);
}

render(<App filePaths={filePaths} />);
