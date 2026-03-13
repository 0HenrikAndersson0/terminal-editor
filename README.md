# Edru

<img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/99c0a79c-fec7-455a-9e13-971a1c3a031a" />


A modern terminal text editor built with Ink and Shiki.

## Features

- **High Performance:** Optimized for large files (10,000+ lines) with virtualization and debounced undo/search.
- **Syntax Highlighting:** Powered by Shiki with VS Code-grade accuracy and a token cache for smooth editing.
- **Search & Replace:** Press `Ctrl+F` to search and `Ctrl+R` to replace. Support for "Replace All" with `Ctrl+Enter`.
- **Integrated Help:** Press `Ctrl+L` anytime to see a full-width modal of all available shortcuts.
- **Git Integration:** Git Branch display in the status bar and Toggle Git Gutter (`Ctrl+D`).
- **Project Explorer:** Toggle a sidebar with `Ctrl+T` to navigate folder structures and open files.
- **Auto-Indentation:** Automatically matches the indentation of the previous line when pressing Enter.
- **Multi-file Support:** Open multiple files and switch between them with `Ctrl+N`/`Ctrl+P`.
- **Clipboard & Selection:** Full selection (`Shift+Arrows/Home/End/Ctrl+A/Ctrl+E`) and Copy (`Ctrl+K`), Cut (`Ctrl+X`), Paste (`Ctrl+U`).
- **Undo/Redo:** Reliable `Ctrl+Z` and `Ctrl+Y` support.
- **Go to Line:** Press `Ctrl+G` to jump to a specific line number.

## Installation

```bash
npm install
npm run build
npm link # To use the 'edru' command globally
```

## Usage

You can open a specific file or an entire directory:

```bash
# Open current directory
edru .

# Open a specific file
edru README.md

# Open multiple files
edru src/App.tsx src/index.tsx
```

## Shortcuts

- `Arrows`: Move cursor
- `Home / End, Ctrl + A / Ctrl + E`: Jump to line start / end
- `Shift + Arrows / Home / End / Ctrl + A / Ctrl + E`: Select text
- `PageUp / PageDown`: Scroll one page
- `Ctrl + L`: Toggle Help Modal
- `Ctrl + F`: Search & Highlight
- `Ctrl + R`: Search & Replace
- `Ctrl + T`: Toggle Project Explorer (Sidebar)
- `Ctrl + D`: Toggle Git Gutter (Changes)
- `Ctrl + G`: Go to line
- `Ctrl + N`: Next file tab
- `Ctrl + P`: Previous file tab
- `Ctrl + K`: Copy selection
- `Ctrl + X`: Cut selection
- `Ctrl + U`: Paste
- `Ctrl + Z`: Undo
- `Ctrl + Y`: Redo
- `Ctrl + S`: Save file
- `Ctrl + Q`: Quit
- `Esc`: Cancel search/replace/help/explorer

## Development

```bash
npm install
npm run dev # Watch mode
npm start -- .
```
