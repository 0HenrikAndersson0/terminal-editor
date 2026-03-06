import React from 'react';
import { render, Box, Text } from 'ink';
const App = () => {
    return (React.createElement(Box, { width: 30, flexDirection: "row" },
        React.createElement(Box, { width: 6, flexShrink: 0 },
            React.createElement(Text, null, "123 \u2502 ")),
        React.createElement(Box, { flexGrow: 1, flexShrink: 0, width: 24 },
            React.createElement(Text, { wrap: "wrap" }, Array.from({ length: 25 }).map((_, i) => React.createElement(Text, { key: i }, i % 10))))));
};
render(React.createElement(App, null));
