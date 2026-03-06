import React from 'react';
import { render, Box, Text } from 'ink';

const App = () => {
    return (
        <Box width={30} flexDirection="row">
            <Box width={6} flexShrink={0}><Text>123 │ </Text></Box>
            <Box flexGrow={1} flexShrink={0} overflowX="hidden" width={24}>
                <Box flexDirection="row">
                    <Text>A</Text>
                    <Text>B</Text>
                    <Text>C</Text>
                    <Text>D</Text>
                    <Text>E</Text>
                    <Text>F</Text>
                    <Text>G</Text>
                    <Text>H</Text>
                    <Text>I</Text>
                    <Text>J</Text>
                    <Text>K</Text>
                    <Text>L</Text>
                    <Text>M</Text>
                    <Text>N</Text>
                    <Text>O</Text>
                    <Text>P</Text>
                    <Text>Q</Text>
                    <Text>R</Text>
                    <Text>S</Text>
                    <Text>T</Text>
                    <Text>U</Text>
                    <Text>V</Text>
                    <Text>W</Text>
                    <Text>X</Text>
                    <Text>Y</Text>
                    <Text>Z</Text>
                    <Text>0</Text>
                    <Text>1</Text>
                    <Text>2</Text>
                </Box>
            </Box>
        </Box>
    );
};

render(<App />);
