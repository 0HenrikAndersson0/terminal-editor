# luxt

A modern terminal text editor built with Ink and Shiki.

## Features

- **Syntax Highlighting:** Powered by Shiki with VS Code-grade accuracy.
- **Project Explorer:** Toggle a sidebar with `Ctrl+E` to navigate folder structures and open files.
- **Git Gutter:** Toggle with `Ctrl+D` to see added/modified lines (green) and deletions (red markers).
- **Horizontal Scrolling:** Seamlessly navigate long lines of code.
- **Auto-Indentation:** Automatically matches the indentation of the previous line when pressing Enter.
- **Current Line Highlighting:** Visually identifies the line your cursor is on.
- **Indentation-Aware Navigation:** Vertical movement snaps to the indentation level of lines.
- **Fast Navigation:** Support for PageUp and PageDown.
- **Go to Line:** Press `Ctrl+G` to jump to a specific line number.
- **Multi-file Support:** Open multiple files and switch between them.
- **Clipboard Support:** Integrated copy (`Ctrl+K`) and paste (`Ctrl+U`).
- **Layout Stability:** UI remains intact even with long paths or large files.

## Installation

```bash
npm install
npm run build
npm link # To use the 'luxt' command globally
```

## Usage

You can open a specific file or an entire directory:

```bash
# Open current directory
luxt .

# Open a specific file
luxt README.md

# Open multiple files
luxt src/App.tsx src/index.tsx
```

## Shortcuts

- `Arrows`: Move cursor
- `Shift + Arrows`: Select text
- `PageUp / PageDown`: Scroll one page
- `Ctrl + E`: Toggle Project Explorer (Sidebar)
- `Ctrl + D`: Toggle Git Gutter (Changes)
- `Ctrl + G`: Go to line
- `Ctrl + N`: Next file tab
- `Ctrl + P`: Previous file tab
- `Ctrl + K`: Copy selection
- `Ctrl + U`: Paste
- `Ctrl + S`: Save file
- `Ctrl + B`: Swap Backspace/Delete behavior
- `Ctrl + Q` or `Esc`: Quit

## Development

```bash
npm install
npm run dev # Watch mode
npm start -- .
```
