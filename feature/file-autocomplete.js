
// C Standard Library Functions
const C_STD_FUNCTIONS = [
  // stdio.h
  'printf', 'scanf', 'fprintf', 'fscanf', 'sprintf', 'sscanf',
  'fgets', 'fputs', 'getchar', 'putchar', 'gets', 'puts',
  'fopen', 'fclose', 'fread', 'fwrite', 'fseek', 'ftell',
  'rewind', 'feof', 'ferror', 'clearerr', 'remove', 'rename',
  'tmpfile', 'tmpnam', 'setvbuf', 'setbuf',
  
  // stdlib.h
  'malloc', 'calloc', 'realloc', 'free', 'abort', 'exit',
  'atexit', 'system', 'getenv', 'abs', 'labs', 'div', 'ldiv',
  'rand', 'srand', 'atoi', 'atol', 'atof', 'strtol', 'strtoul',
  'strtod', 'qsort', 'bsearch',
  
  // string.h
  'strlen', 'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp',
  'strncmp', 'strchr', 'strrchr', 'strstr', 'strspn', 'strcspn',
  'strpbrk', 'strtok', 'memset', 'memcpy', 'memmove', 'memcmp',
  'memchr',
  
  // math.h
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'exp', 'log', 'log10', 'pow',
  'sqrt', 'ceil', 'floor', 'fabs', 'fmod', 'frexp', 'ldexp',
  'modf',
  
  // ctype.h
  'isalnum', 'isalpha', 'iscntrl', 'isdigit', 'isgraph',
  'islower', 'isprint', 'ispunct', 'isspace', 'isupper',
  'isxdigit', 'tolower', 'toupper',
  
  // time.h
  'time', 'ctime', 'localtime', 'gmtime', 'mktime', 'asctime',
  'strftime', 'clock', 'difftime',
  
  // string.h 
  'strerror', 'strcoll', 'strxfrm',
  
  // stdlib.h 
  'atoll', 'strtoll', 'strtoull', 'strtof', 'strtold'
];

class FileAutocomplete {
  constructor() {
    this.prefixMap = new Map();
    this.fileMetadata = new Map();
    this.allFiles = new Set();
    
    // Function autocomplete data
    this.functionPrefixMap = new Map();
    this.functionMetadata = new Map();
    this.allFunctions = new Set();
    
    const headers = [
      'stdio.h', 'stdlib.h', 'string.h', 'math.h', 'time.h',
      'ctype.h', 'errno.h', 'float.h', 'limits.h', 'locale.h',
      'setjmp.h', 'signal.h', 'stdarg.h', 'stddef.h', 'assert.h',
      'stdbool.h', 'stdint.h', 'complex.h', 'fenv.h', 'inttypes.h',
      'iso646.h', 'tgmath.h', 'wchar.h', 'wctype.h', 'unistd.h',
      'fcntl.h', 'sys/types.h', 'sys/stat.h', 'dirent.h', 'pthread.h'
    ];
    
    headers.forEach(h => this.addFile(h, true));
    
    // Initialize function autocomplete
    C_STD_FUNCTIONS.forEach(f => this.addFunction(f));
  }

  addFile(fileName, isStandard = false) {
    if (!fileName) return;
    const name = fileName.trim();
    this.allFiles.add(name);
    this.fileMetadata.set(name, { fileName: name, isStandard });

    for (let i = 0; i <= name.length; i++) {
      const prefix = name.substring(0, i).toLowerCase();
      if (!this.prefixMap.has(prefix)) {
        this.prefixMap.set(prefix, new Set());
      }
      this.prefixMap.get(prefix).add(name);
    }
  }

  removeFile(fileName) {
    const name = fileName.trim();
    if (!this.allFiles.has(name)) return;
    this.allFiles.delete(name);
    this.fileMetadata.delete(name);
    for (let i = 0; i <= name.length; i++) {
      const prefix = name.substring(0, i).toLowerCase();
      const fileSet = this.prefixMap.get(prefix);
      if (fileSet) {
        fileSet.delete(name);
        if (fileSet.size === 0) {
          this.prefixMap.delete(prefix);
        }
      }
    }
  }

  getSuggestions(prefix, maxResults = 10) {
    if (!prefix) {
      const all = Array.from(this.allFiles)
        .map(name => this.fileMetadata.get(name))
        .filter(s => s)
        .slice(0, maxResults);
      return this.sort(all);
    }

    const normalizedPrefix = prefix.trim().toLowerCase();
    const matchingFiles = this.prefixMap.get(normalizedPrefix);
    
    if (!matchingFiles || matchingFiles.size === 0) {
      return [];
    }

    const suggestions = Array.from(matchingFiles)
      .map(fileName => this.fileMetadata.get(fileName))
      .filter(s => s)
      .slice(0, maxResults);

    return this.sort(suggestions);
  }

  sort(suggestions) {
    return suggestions.sort((a, b) => {
      if (a.isStandard && !b.isStandard) return -1;
      if (!a.isStandard && b.isStandard) return 1;
      return a.fileName.localeCompare(b.fileName);
    });
  }

  hasFile(fileName) {
    return this.allFiles.has(fileName.trim());
  }

  addFunction(functionName) {
    if (!functionName) return;
    const name = functionName.trim();
    this.allFunctions.add(name);
    this.functionMetadata.set(name, { functionName: name, isStandard: true });

    for (let i = 0; i <= name.length; i++) {
      const prefix = name.substring(0, i).toLowerCase();
      if (!this.functionPrefixMap.has(prefix)) {
        this.functionPrefixMap.set(prefix, new Set());
      }
      this.functionPrefixMap.get(prefix).add(name);
    }
  }

  getFunctionSuggestions(prefix, maxResults = 10) {
    if (!prefix) {
      const all = Array.from(this.allFunctions)
        .map(name => this.functionMetadata.get(name))
        .filter(s => s)
        .slice(0, maxResults);
      return all.sort((a, b) => a.functionName.localeCompare(b.functionName));
    }

    const normalizedPrefix = prefix.trim().toLowerCase();
    const matchingFunctions = this.functionPrefixMap.get(normalizedPrefix);
    
    if (!matchingFunctions || matchingFunctions.size === 0) {
      return [];
    }

    const suggestions = Array.from(matchingFunctions)
      .map(functionName => this.functionMetadata.get(functionName))
      .filter(s => s)
      .slice(0, maxResults);

    return suggestions.sort((a, b) => a.functionName.localeCompare(b.functionName));
  }

  static detectInclude(text, cursorPos) {
    if (!text || cursorPos < 0 || cursorPos > text.length) return null;
    
    let lineStart = cursorPos;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
      lineStart--;
    }

    const line = text.substring(lineStart, cursorPos);
    // Match: #include <... or #include "... with optional whitespace
    // Allow partial matches like #include <s or #include "m
    const match = line.match(/^\s*#\s*include\s*([<"])([^>"]*)$/);
    if (!match) return null;

    const quoteType = match[1];
    const prefix = match[2] || '';
    const fullMatch = match[0];
    const prefixStart = lineStart + fullMatch.length - prefix.length;

    return {
      type: 'include',
      prefix: prefix,
      quoteType: quoteType,
      startPos: prefixStart
    };
  }

  static detectFunction(text, cursorPos) {
    if (!text || cursorPos < 0 || cursorPos > text.length) return null;
    
    // Look backwards from cursor to find the start of an identifier
    let start = cursorPos;
    
    // Skip whitespace immediately before cursor
    while (start > 0 && /\s/.test(text[start - 1])) {
      start--;
    }
    
    // Find the start of the identifier (alphanumeric or underscore)
    while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) {
      start--;
    }
    
    // Check if we're in a valid context for function autocomplete
    // We should be typing an identifier that could be a function call
    if (start >= cursorPos) return null;
    
    const prefix = text.substring(start, cursorPos);
    
    // Check if the character before the identifier is valid for function context
    // Valid contexts: whitespace, operators, opening paren, semicolon, comma, etc.
    const beforeStart = start > 0 ? text[start - 1] : ' ';
    const validBefore = /[\s\(\[\{\+\-\*\/\%\=\!\<\>\&\|\^\,\;\:\.]/.test(beforeStart);
    
    if (!validBefore && start > 0) {
      // Check if it's part of a longer identifier (like variable.function)
      if (beforeStart === '.') {
        // This is fine, could be struct member access
      } else if (/[A-Za-z0-9_]/.test(beforeStart)) {
        // Part of a longer identifier, not a function
        return null;
      }
    }
    
    // Check if we're inside a string literal or comment
    const textBefore = text.substring(0, start);
    
    // Simple check: if there's an unclosed string or comment, skip
    const singleQuotes = (textBefore.match(/'/g) || []).length;
    const doubleQuotes = (textBefore.match(/"/g) || []).length;
    const lineComments = (textBefore.match(/\/\//g) || []).length;
    const blockComments = (textBefore.match(/\/\*/g) || []).length - (textBefore.match(/\*\//g) || []).length;
    
    // If we're inside a string (odd number of quotes) or comment, don't autocomplete
    if ((singleQuotes % 2 !== 0 && textBefore.lastIndexOf("'") > textBefore.lastIndexOf('"')) ||
        (doubleQuotes % 2 !== 0 && textBefore.lastIndexOf('"') > textBefore.lastIndexOf("'")) ||
        blockComments > 0 ||
        textBefore.includes('//') && textBefore.lastIndexOf('//') > (textBefore.lastIndexOf('\n') || 0)) {
      return null;
    }
    
    // Only trigger if we have at least one character typed
    if (prefix.length === 0) return null;
    
    // Check if it looks like a valid identifier start
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(prefix)) return null;
    
    return {
      type: 'function',
      prefix: prefix,
      startPos: start
    };
  }

  getSuggestionsAtCursor(text, cursorPos, maxResults = 10) {
    const context = FileAutocomplete.detectInclude(text, cursorPos);
    if (!context) return null;
    return this.getSuggestions(context.prefix, maxResults);
  }
}

let defaultInstance = null;
function getFileAutocomplete() {
  if (!defaultInstance) {
    defaultInstance = new FileAutocomplete();
  }
  return defaultInstance;
}

// Editor integration
(function() {
  const autocomplete = getFileAutocomplete();
  autocomplete.addFile('myheader.h', false);
  autocomplete.addFile('utils.h', false);

  let dropdown = null;
  let selectedIndex = -1;
  let suggestions = [];
  let isVisible = false;
  
  const autocompleteWrapper = {
    instance: autocomplete,
    _isVisible: false,
    get isDropdownVisible() { 
      return isVisible || this._isVisible; 
    }
  };

  function createDropdown() {
    if (dropdown) return dropdown;
    dropdown = document.createElement('div');
    dropdown.id = 'file-autocomplete';
    dropdown.className = 'fixed z-[100] bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto hidden';
    dropdown.style.minWidth = '200px';
    dropdown.style.maxWidth = '400px';
    dropdown.style.zIndex = '10000';
    document.body.appendChild(dropdown);
    return dropdown;
  }

  function showDropdown(sugs, pos) {
    if (!sugs || sugs.length === 0) {
      hideDropdown();
      return;
    }

    const el = createDropdown();
    suggestions = sugs;
    selectedIndex = -1;

    let html = '<ul class="py-1 list-none m-0">';
    sugs.forEach((s, i) => {
      const cls = s.isStandard 
        ? 'px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-blue-300'
        : 'px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300';
      const displayName = s.fileName || s.functionName || '';
      html += `<li class="${cls}" data-index="${i}">${escapeHtml(displayName)}</li>`;
    });
    html += '</ul>';
    el.innerHTML = html;

    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.style.position = 'fixed';
    el.classList.remove('hidden');
    isVisible = true;
    autocompleteWrapper._isVisible = true;

    el.querySelectorAll('li').forEach((li, i) => {
      li.addEventListener('click', () => selectSuggestion(i));
      li.addEventListener('mouseenter', () => {
        selectedIndex = i;
        updateHighlight();
      });
    });
  }

  function hideDropdown() {
    if (dropdown) {
      dropdown.classList.add('hidden');
      isVisible = false;
      selectedIndex = -1;
      suggestions = [];
      autocompleteWrapper._isVisible = false;
    }
  }

  function updateHighlight() {
    if (!dropdown) return;
    dropdown.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('bg-slate-700', i === selectedIndex);
    });
  }

  function selectSuggestion(index) {
    if (index < 0 || index >= suggestions.length) return;
    const suggestion = suggestions[index];
    if (suggestion.fileName) {
      insertFileName(suggestion.fileName);
    } else if (suggestion.functionName) {
      insertFunctionName(suggestion.functionName);
    }
    hideDropdown();
  }

  function insertFileName(fileName) {
    insertSuggestion(fileName);
  }

  function insertFunctionName(functionName) {
    insertSuggestion(functionName);
  }

  function insertSuggestion(suggestion) {
    const editor = document.getElementById('editor');
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const text = editor.textContent || '';
    const cursorPos = getCursorPos(editor, range);

    const includeContext = FileAutocomplete.detectInclude(text, cursorPos);
    const functionContext = FileAutocomplete.detectFunction(text, cursorPos);
    const context = includeContext || functionContext;
    
    if (!context) return;

    const textBefore = text.substring(0, context.startPos);
    const textAfter = text.substring(cursorPos);
    const newText = textBefore + suggestion + textAfter;
    
    editor.textContent = newText;
    setCursorPosition(editor, context.startPos + suggestion.length);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  function setCursorPosition(element, position) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    
    if (element.childNodes.length > 0 && element.firstChild.nodeType === Node.TEXT_NODE) {
      const textNode = element.firstChild;
      const maxPos = Math.min(position, textNode.textContent.length);
      range.setStart(textNode, maxPos);
      range.setEnd(textNode, maxPos);
    } else {
      range.collapse(false);
    }
    
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function getCursorPos(element, range) {
    try {
      if (!range || !element) return 0;
      const preCaretRange = document.createRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    } catch (e) {
      const text = element.textContent || '';
      return text.length;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getCaretPos() {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        const editor = document.getElementById('editor');
        if (editor) {
          const rect = editor.getBoundingClientRect();
          return { x: rect.left + 10, y: rect.top + 30 };
        }
        return { x: 0, y: 0 };
      }
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      return { 
        x: rect.left + window.scrollX, 
        y: rect.bottom + window.scrollY + 2
      };
    } catch (e) {
      return { x: 100, y: 100 };
    }
  }

  function checkAutocomplete(editor) {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        hideDropdown();
        return;
      }

      const range = sel.getRangeAt(0);
      const text = editor.textContent || editor.innerText || '';
      if (!text) {
        hideDropdown();
        return;
      }
      
      const cursorPos = getCursorPos(editor, range);
      
      // First check for include context
      const includeContext = FileAutocomplete.detectInclude(text, cursorPos);
      if (includeContext) {
        // Filter suggestions based on quote type
        let sugs = autocomplete.getSuggestions(includeContext.prefix, 15);
        if (sugs && sugs.length > 0) {
          // If using quotes ("), show only local files; if using <>, show only standard headers
          if (includeContext.quoteType === '"') {
            sugs = sugs.filter(s => !s.isStandard);
          } else if (includeContext.quoteType === '<') {
            sugs = sugs.filter(s => s.isStandard);
          }
          
          if (sugs && sugs.length > 0) {
            showDropdown(sugs, getCaretPos());
            return;
          }
        }
        hideDropdown();
        return;
      }
      
      // Then check for function context
      const functionContext = FileAutocomplete.detectFunction(text, cursorPos);
      if (functionContext) {
        const sugs = autocomplete.getFunctionSuggestions(functionContext.prefix, 15);
        if (sugs && sugs.length > 0) {
          showDropdown(sugs, getCaretPos());
          return;
        }
      }
      
      hideDropdown();
    } catch (e) {
      console.error('Autocomplete error:', e);
      hideDropdown();
    }
  }

  function setup() {
    const editor = document.getElementById('editor');
    if (!editor) {
      setTimeout(setup, 100);
      return;
    }

    let timer = null;
    editor.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => checkAutocomplete(editor), 50);
    });
    
    // Also check on keydown for immediate feedback when typing < or "
    const immediateCheckHandler = (e) => {
      if (['<', '"'].includes(e.key)) {
        // Check immediately after the character is inserted
        setTimeout(() => checkAutocomplete(editor), 20);
      }
    };
    editor.addEventListener('keydown', immediateCheckHandler, true);

    const keydownHandler = (e) => {
      if (isVisible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
          updateHighlight();
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateHighlight();
          return;
        } else if (e.key === 'Enter') {
          if (selectedIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();
            selectSuggestion(selectedIndex);
            return;
          } else {
            hideDropdown();
          }
        } else if (e.key === 'Tab') {
          if (selectedIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();
            selectSuggestion(selectedIndex);
            return;
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          hideDropdown();
          return;
        }
      }
      
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Escape', 'Enter', 'Tab'].includes(e.key)) {
        setTimeout(() => checkAutocomplete(editor), 100);
      }
    };
    
    editor.addEventListener('keydown', keydownHandler, true);

    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && e.target !== editor && !editor.contains(e.target)) {
        hideDropdown();
      }
    });
  }

  function initAutocomplete() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setup, 100);
      });
    } else {
      setTimeout(setup, 100);
    }
  }
  
  initAutocomplete();
  window.fileAutocomplete = autocompleteWrapper;
  window.fileAutocompleteInstance = autocomplete;
})();