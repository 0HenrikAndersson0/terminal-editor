import React from 'react';
import { render, Box, Text } from 'ink';
const App = () => {
    const chars = Array.from({ length: 25 }).map((_, i) => i % 10);
    return (React.createElement(Box, { width: 30, flexDirection: "row" },
        React.createElement(Box, { width: 6, flexShrink: 0 },
            React.createElement(Text, null, "123 \u2502 ")),
        React.createElement(Box, { flexGrow: 1, flexShrink: 0, width: 24 },
            React.createElement(Text, { wrap: "truncate-middle" }, chars.join('')))));
};
render(React.createElement(App, null));
