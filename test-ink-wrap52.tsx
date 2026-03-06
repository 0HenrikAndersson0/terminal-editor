import React from 'react';
import { render, Box, Text } from 'ink';

const App = () => {
    const chars = Array.from({ length: 25 }).map((_, i) => i % 10);
    return (
        <Box width={30} flexDirection="row">
            <Box width={6} flexShrink={0}><Text>123 │ </Text></Box>
            <Box flexGrow={1} flexShrink={0} width={24}>
                <Text wrap="truncate-middle">
                    {chars.join('')}
                </Text>
            </Box>
        </Box>
    );
};

render(<App />);
