// Main editor application
(function () {
  function init() {
    const editor = document.getElementById('editor');
    const out = document.getElementById('output');
    const syntax = document.getElementById('syntax');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnRun = document.getElementById('btn-run');
    const btnNew = document.getElementById('btn-new');
    const btnOpen = document.getElementById('btn-open');
    const btnSave = document.getElementById('btn-save');

    if (!editor || !syntax) {
      console.error('Editor or syntax element not found');
      return;
    }

    const undoStack = [];
    const redoStack = [];
    const maxHistory = 500;

    function pushState(text) {
      if (undoStack.length && undoStack[undoStack.length - 1] === text) return;
      undoStack.push(text);
      if (undoStack.length > maxHistory) undoStack.shift();
      redoStack.length = 0;
      updateButtons();
    }

    function updateButtons() {
      if (btnUndo) btnUndo.disabled = undoStack.length <= 1;
      if (btnRedo) btnRedo.disabled = redoStack.length === 0;
    }

    function getText() {
      return editor.textContent || editor.innerText || '';
    }

    function setText(text) {
      editor.textContent = text;
      updateSyntaxHighlight();
    }

    function updateSyntaxHighlight() {
      if (!syntax) return;
      const text = getText();
      if (!text) {
        syntax.innerHTML = '';
        return;
      }
      
      if (window.syntaxHighlight && typeof window.syntaxHighlight === 'function') {
        try {
          const highlighted = window.syntaxHighlight(text);
          if (highlighted) {
            syntax.innerHTML = highlighted;
            // Sync scroll position
            syntax.scrollTop = editor.scrollTop;
            syntax.scrollLeft = editor.scrollLeft;
          } else {
            syntax.textContent = text;
          }
        } catch (e) {
          console.error('Syntax highlight error:', e);
          syntax.textContent = text;
        }
      } else {
        console.warn('syntaxHighlight function not available');
        syntax.textContent = text;
      }
    }

    // Initialize with default code
    let initialText = getText().trim();
    if (!initialText) {
      initialText = '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';
      editor.textContent = initialText;
    }
    
    pushState(initialText);
    updateSyntaxHighlight();
    ensureStdIoHeader();
    updateButtons();
    
    // Ensure syntax highlighting updates after header check
    setTimeout(() => {
      updateSyntaxHighlight();
    }, 50);

    let inputTimer = null;
    editor.addEventListener('input', () => {
      if (inputTimer) clearTimeout(inputTimer);
      inputTimer = setTimeout(() => pushState(getText()), 150);
      updateSyntaxHighlight();
    });

    editor.addEventListener('keydown', (e) => {
      const fileAutocomplete = window.fileAutocomplete;
      const isAutocompleteVisible = 
        (fileAutocomplete && fileAutocomplete.isDropdownVisible);
      
      if (e.key === 'Enter' && !isAutocompleteVisible) {
        e.preventDefault();
        insertAtCaret('\n');
      }
      if (e.key === 'Tab' && !isAutocompleteVisible) {
        e.preventDefault();
        insertAtCaret('    ');
      }
    });

    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      insertAtCaret(text.replace(/\r\n?/g, '\n'));
    });

    function insertAtCaret(text) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
      const value = getText();
      pushState(value);
      updateSyntaxHighlight();
    }

    function ensureStdIoHeader() {
      let text = getText();
      text = text.replace(/^\s*#\s*include\s*\n/gm, "");
      const hasStd = /^\s*#\s*include\s*<\s*stdio\.h\s*>/m.test(text);
      if (!hasStd) {
        const insertion = '#include <stdio.h>\n';
        const includes = [...text.matchAll(/^\s*#\s*include\s*<[^>]+>.*$/mg)];
        let idx = 0;
        if (includes.length) {
          const last = includes[includes.length - 1];
          idx = (last.index ?? 0) + last[0].length;
          if (text[idx] === '\n') idx += 1;
        }
        text = text.slice(0, idx) + insertion + text.slice(idx);
      }
      text = text.replace(/\n{3,}/g, '\n\n');
      setText(text);
      pushState(text);
    }

    editor.addEventListener('scroll', () => {
      if (!syntax) return;
      syntax.scrollTop = editor.scrollTop;
      syntax.scrollLeft = editor.scrollLeft;
    });

    const ro = new ResizeObserver(() => {
      if (!syntax) return;
      const editorStyle = window.getComputedStyle(editor);
      syntax.style.padding = editorStyle.padding;
      syntax.style.fontSize = editorStyle.fontSize;
      syntax.style.fontFamily = editorStyle.fontFamily;
      syntax.style.lineHeight = editorStyle.lineHeight;
    });
    ro.observe(editor);

    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        // Only undo if there is a previous state to go back to
        if (undoStack.length <= 1) return;
        const current = undoStack.pop();
        redoStack.push(current);
        const prev = undoStack[undoStack.length - 1];
        setText(prev);
        updateButtons();
      });
    }
    if (btnRedo) {
      btnRedo.addEventListener('click', () => {
        if (!redoStack.length) return;
        // Move one step forward without clearing remaining redo history
        const next = redoStack.pop();
        undoStack.push(next);
        setText(next);
        updateButtons();
      });
    }
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    if (btnRun && out) {
      btnRun.addEventListener('click', async () => {
        ensureStdIoHeader();
        const code = getText();
        const stdinInput = document.getElementById('stdin');
        const stdin = stdinInput ? stdinInput.value : '';
        
        out.textContent = 'Running...';
        try {
          const { stdout, stderr } = await pistonRunC(code, stdin);
          if (stderr) {
            out.innerHTML = `<span style="color: #ef4444;">${escapeHtml(stderr)}</span>`;
            if (stdout) {
              out.innerHTML += `\n<span style="color: #e5e7eb;">${escapeHtml(stdout)}</span>`;
            }
          } else {
            out.textContent = stdout || '(no output)';
          }
        } catch (err) {
          out.textContent = `Run error: ${err}`;
        }
      });
    }

    async function pistonRunC(source, stdin = '') {
      // Primary: Wandbox API
      try {
        const resp = await fetch('https://wandbox.org/api/compile.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compiler: 'gcc-head',
            code: source,
            stdin: stdin || ''
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const stdout = data.program_output || data.compiler_output || '';
          const stderr = [data.compiler_error, data.program_error].filter(Boolean).join('\n');
          return { stdout, stderr };
        }
      } catch (e) {
        console.warn('Wandbox execution failed, trying Judge0...', e);
      }

      // Secondary: Judge0 API
      try {
        const resp = await fetch('https://ce.judge0.com/submissions?wait=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: source,
            language_id: 50, // C (GCC 9.2.0)
            stdin: stdin || ''
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const stdout = data.stdout || '';
          const stderr = [data.compile_output, data.stderr, data.message].filter(Boolean).join('\n');
          return { stdout, stderr };
        }
      } catch (e) {
        console.warn('Judge0 execution failed, trying Piston...', e);
      }

      // Tertiary: Piston API
      const resp = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'c',
          version: '*',
          files: [{ name: 'main.c', content: source }],
          args: [],
          stdin: stdin || ''
        })
      });
      if (!resp.ok) throw new Error(`Code execution API failed with HTTP ${resp.status}`);
      const data = await resp.json();
      
      const compileOut = (data.compile && (data.compile.stdout || data.compile.output || '')) || '';
      const compileErr = (data.compile && (data.compile.stderr || '')) || '';
      const runOut = (data.run && (data.run.stdout || data.run.output || '')) || '';
      const runErr = (data.run && (data.run.stderr || '')) || '';
      
      const stdout = [compileOut, runOut].filter(Boolean).join('\n');
      const stderr = [compileErr, runErr].filter(Boolean).join('\n');
      
      return { stdout, stderr };
    }
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        const tpl = '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n';
        setText(tpl);
        pushState(tpl);
      });
    }

    if (btnOpen) {
      btnOpen.addEventListener('click', async () => {
        try {
          const [fileHandle] = await window.showOpenFilePicker({ types: [{ description: 'C Source', accept: { 'text/plain': ['.c', '.h'] } }] });
          const file = await fileHandle.getFile();
          const text = await file.text();
          setText(text);
          pushState(text);
        } catch (_) {}
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        try {
          const handle = await window.showSaveFilePicker({ suggestedName: 'main.c', types: [{ description: 'C Source', accept: { 'text/plain': ['.c'] } }] });
          const writable = await handle.createWritable();
          await writable.write(getText());
          await writable.close();
        } catch (_) {}
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();