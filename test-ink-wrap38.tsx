import React from 'react';
import { render, Box, Text } from 'ink';

const App = () => {
    return (
        <Box width={30} flexDirection="row">
            <Box width={6} flexShrink={0}><Text>123 │ </Text></Box>
            <Box flexGrow={1} flexShrink={0}>
                <Text wrap="truncate">
                    {Array.from({ length: 26 }).map((_, i) => <Text key={i}>{i % 10}</Text>)}
                </Text>
            </Box>
        </Box>
    );
};

render(<App />);
