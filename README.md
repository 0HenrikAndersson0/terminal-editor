# Terminal Editor

A modern terminal text editor built with Ink and Shiki.

## Features

- **Syntax Highlighting:** Powered by Shiki with VS Code-grade accuracy.
- **Auto-Indentation:** Automatically matches the indentation of the previous line when pressing Enter.
- **Current Line Highlighting:** Visually identifies the line your cursor is on.
- **Indentation-Aware Navigation:** Vertical movement snaps to the indentation level of lines.
- **Fast Navigation:** Support for PageUp and PageDown.
- **Go to Line:** Press `Ctrl+G` to jump to a specific line number.
- **Multi-file Support:** Open multiple files and switch between them with `Ctrl+N` and `Ctrl+P`.
- **Clipboard Support:** Integrated copy (`Ctrl+K`) and paste (`Ctrl+U`).
- **Layout Stability:** UI remains intact even with long paths or large files.

## Shortcuts

- `Arrows`: Move cursor
- `Shift + Arrows`: Select text
- `PageUp / PageDown`: Scroll one page
- `Ctrl + G`: Go to line
- `Ctrl + K`: Copy selection
- `Ctrl + U`: Paste
- `Ctrl + S`: Save file
- `Ctrl + N`: Next file
- `Ctrl + P`: Previous file
- `Ctrl + B`: Swap Backspace/Delete behavior
- `Ctrl + Q` or `Esc`: Quit

## Development

```bash
npm install
npm run build
npm start -- file1.txt file2.ts
```
