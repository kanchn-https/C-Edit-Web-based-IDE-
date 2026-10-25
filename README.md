# C Edit

C Edit is a browser-based workspace for writing, editing, and running C programs. Its focused interface brings together a code editor, live syntax coloring, context-aware suggestions, standard input, and program output.

## Highlights

- **Focused C editing:** Write code in a plain-text browser editor with four-space Tab indentation and normalized pasted line endings.
- **Live syntax coloring:** A custom JavaScript tokenizer identifies C keywords, types, comments, literals, operators, punctuation, and preprocessor lines.
- **Context-aware suggestions:** Get prefix-matched suggestions for standard C headers and library functions, with keyboard and mouse selection.
- **Undo and redo:** Move through recent editing states with a bounded snapshot history.
- **File actions:** Start a fresh sample program, open `.c` or `.h` files, and save source as `.c` using browser file pickers.
- **Remote compile and run:** Submit C source and standard input to compiler services, then view program output and errors in the built-in console.
- **Responsive dark interface:** A responsive Tailwind CSS layout pairs the editor with dedicated input and output panels.

## Get started

Serve the repository root with Python 3:

```sh
python3 -m http.server 8080
```

Open <http://localhost:8080/public/index.html> in a browser. The page uses Tailwind CSS from its CDN.

## Use C Edit

1. Open the page and edit the sample program in the **Editor.c** pane.
2. Enter any program input in the **Input** pane.
3. Click **Run** to compile and execute the program remotely; review results in **Output**.
4. Use **New**, **Open**, or **Save** to manage source files, and **Undo** or **Redo** to move through recent edits.
5. Type an include prefix such as `#include <st` or a function prefix such as `pri` to browse suggestions. Use the arrow keys to navigate and Enter or Tab to select.

## How it works

The editor uses a transparent `contenteditable` surface over a synchronized `<pre>` layer. As the text changes, the active tokenizer converts source into escaped token markup and the overlay displays it with the theme in `public/token-colors.css`. The editor and overlay share scroll positions and font metrics to keep the colored text aligned with the caret.

Autocomplete uses prefix indexes built from standard header and function-name lists. It checks the text around the caret to distinguish include directives from function-name completion, then positions a suggestion menu near the current selection.

When **Run** is clicked, the app prepares the source by ensuring `#include <stdio.h>` is present, reads the input pane, and submits both values to the remote execution flow:

1. Wandbox with the `gcc-head` compiler.
2. Judge0 with language ID `50` when the Wandbox request returns a non-OK HTTP status or a network error.
3. Piston with the C language when the Judge0 request returns a non-OK HTTP status or a network error.

The returned output and error text are presented in the output pane. Standard input is sent with the run request.

## Project structure

```text
public/
  index.html          Page layout and script loading
  app.js              Editor interactions, history, file actions, and execution flow
  highlight.js        Additional syntax-highlighting implementation
  token-colors.css    Syntax token theme
feature/
  color-code.js       Active tokenizer and syntax-highlighting renderer
  file-autocomplete.js Header and function suggestion engine
  redo.cpp            C++ undo/redo data-structure example
```

### Main components

| Component | Role |
| --- | --- |
| `public/index.html` | Defines the toolbar, editor overlay, input and output panes, responsive layout, and application scripts. |
| `public/app.js` | Initializes the interface and coordinates editing, snapshot history, file pickers, source preparation, and remote compiler requests. |
| `feature/color-code.js` | Tokenizes C-like source and renders escaped markup for the syntax layer. |
| `feature/file-autocomplete.js` | Builds header/function prefix indexes, detects completion contexts, and manages the suggestion dropdown. |
| `public/token-colors.css` | Styles keywords, types, literals, operators, comments, and other token categories. |

## Technologies

- HTML5 and CSS
- Vanilla JavaScript and browser DOM APIs
- Tailwind CSS via CDN
- Browser File System Access API for file open/save
- Wandbox, Judge0, and Piston APIs for remote compilation and execution
- C++ standard library containers in the standalone `feature/redo.cpp` example

The app can be served as static files; Python 3's built-in HTTP server is a convenient local option.
