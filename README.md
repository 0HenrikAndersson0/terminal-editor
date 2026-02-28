# Gemini Terminal Editor

A modern, terminal-based text editor built with **Node.js**, **TypeScript**, **Ink**, and **Shiki**. It provides a sleek, React-driven interface with high-quality syntax highlighting and multi-file support.

## Features

- 🎨 **Syntax Highlighting**: Powered by [Shiki](https://shiki.matsu.io/) using VS Code themes.
- 📂 **Multi-file Tabs**: Open and edit multiple files simultaneously.
- ⌨️ **Intuitive Navigation**: Standard arrow key navigation and basic line editing.
- 🚀 **Modern TUI**: Built with [Ink](https://github.com/vadimdemedes/ink) for a polished, reactive terminal interface.
- 📜 **Auto-scrolling**: Smooth viewport management for large files.
- 💾 **Safe Saving**: Quick shortcuts to save changes to disk.

## Installation

1.  Navigate to the project directory:
    ```bash
    cd /Users/henrikandersson/Developer/terminal-editor
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```

## Usage

To start the editor, provide one or more file paths as arguments:

```bash
npm start <file1> <file2> <file3>
```

Example:
```bash
npm start src/App.tsx package.json README.md
```

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Arrows` | Move cursor |
| `Enter` | New line |
| `Backspace` | Delete character before cursor |
| `Ctrl + S` | Save current file |
| `Ctrl + N` | Switch to next tab |
| `Ctrl + P` | Switch to previous tab |
| `Ctrl + Q` / `Esc` | Quit the editor |

## Technologies

- **Language**: TypeScript
- **Runtime**: Node.js
- **TUI Framework**: [Ink](https://github.com/vadimdemedes/ink)
- **Syntax Highlighting**: [Shiki](https://shiki.matsu.io/)
- **Colors**: [Chalk](https://github.com/chalk/chalk)
