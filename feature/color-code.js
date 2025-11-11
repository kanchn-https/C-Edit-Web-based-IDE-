// C syntax highlighter using HashMap for token classification
// Data Structure: Set (HashMap-like) for O(1) keyword/type lookup

const keywordSet = new Set([
  "if", "else", "switch", "case", "default", "for", "while", "do",
  "break", "continue", "return", "goto", "sizeof", "typedef",
  "struct", "union", "enum", "const", "volatile", "static", "extern",
  "register", "auto", "inline", "restrict", "_Bool", "_Complex",
  "_Imaginary", "_Alignas", "_Alignof", "_Atomic", "_Generic",
  "_Noreturn", "_Static_assert", "_Thread_local"
]);

const typeSet = new Set([
  "void", "char", "short", "int", "long", "float", "double",
  "signed", "unsigned", "size_t", "ptrdiff_t"
]);

const operatorSet = new Set([
  "+", "-", "*", "/", "%", "++", "--", "=", "+=", "-=", "*=", "/=", "%=",
  "==", "!=", "<", ">", "<=", ">=", "&&", "||", "!", "&", "|", "^", "~",
  "<<", ">>", "&=", "|=", "^=", "<<=", ">>=", "->", ".", "?", ":"
]);

const punctuationSet = new Set([
  "(", ")", "{", "}", "[", "]", ",", ";"
]);

const WHITESPACE_RE = /[\t\v\f\r\n ]/;
const IDENT_START_RE = /[A-Za-z_]/;
const IDENT_PART_RE = /[A-Za-z0-9_]/;

function isDigit(ch) {
  return ch >= "0" && ch <= "9";
}

function isHexDigit(ch) {
  return (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
}

function isOctDigit(ch) {
  return ch >= "0" && ch <= "7";
}

function isBinDigit(ch) {
  return ch === "0" || ch === "1";
}

function getClassForTokenType(type) {
  switch (type) {
    case "keyword": return "tok-keyword";
    case "type": return "tok-type";
    case "identifier": return "tok-identifier";
    case "number": return "tok-number";
    case "string": return "tok-string";
    case "char": return "tok-char";
    case "operator": return "tok-operator";
    case "punctuation": return "tok-punct";
    case "comment": return "tok-comment";
    case "preprocessor": return "tok-preproc";
    case "whitespace": return "tok-space";
    default: return "tok-unknown";
  }
}

function tokenizeCCode(source) {
  const tokens = [];
  const length = source.length;
  let i = 0;
  let line = 0;
  let column = 0;

  function pushToken(type, start, end) {
    tokens.push({
      type,
      value: source.slice(start, end),
      start,
      end,
      line,
      column: column - (end - start)
    });
  }

  while (i < length) {
    const start = i;
    const ch = source[i];

    // Whitespace
    if (WHITESPACE_RE.test(ch)) {
      while (i < length && WHITESPACE_RE.test(source[i])) {
        if (source[i] === "\n") {
          pushToken("whitespace", start, i + 1);
          i = i + 1;
          line += 1;
          column = 0;
          break;
        }
        i += 1;
        column += 1;
      }
      if (i > start && source[i - 1] !== "\n") {
        pushToken("whitespace", start, i);
      }
      continue;
    }

    // Preprocessor
    if (ch === "#" && (start === 0 || source[start - 1] === "\n")) {
      i += 1;
      column += 1;
      while (i < length) {
        if (source[i] === "\\") {
          i += 1;
          column += 1;
          if (i < length && source[i] === "\n") {
            i += 1;
            line += 1;
            column = 0;
          }
          continue;
        }
        if (source[i] === "\n") {
          i += 1;
          line += 1;
          column = 0;
          break;
        }
        i += 1;
        column += 1;
      }
      pushToken("preprocessor", start, i);
      continue;
    }

    // Comments
    if (ch === "/") {
      const next = source[i + 1];
      if (next === "/") {
        i += 2;
        column += 2;
        while (i < length && source[i] !== "\n") {
          i += 1;
          column += 1;
        }
        if (i < length && source[i] === "\n") {
          i += 1;
          line += 1;
          column = 0;
        }
        pushToken("comment", start, i);
        continue;
      }
      if (next === "*") {
        i += 2;
        column += 2;
        while (i < length) {
          if (source[i] === "*" && source[i + 1] === "/") {
            i += 2;
            column += 2;
            break;
          }
          if (source[i] === "\n") {
            i += 1;
            line += 1;
            column = 0;
          } else {
            i += 1;
            column += 1;
          }
        }
        pushToken("comment", start, i);
        continue;
      }
    }

    // String literal
    if (ch === '"') {
      i += 1;
      column += 1;
      while (i < length) {
        if (source[i] === "\\") {
          i += 2;
          column += 2;
          continue;
        }
        if (source[i] === '"') {
          i += 1;
          column += 1;
          break;
        }
        if (source[i] === "\n") {
          i += 1;
          line += 1;
          column = 0;
          break;
        }
        i += 1;
        column += 1;
      }
      pushToken("string", start, i);
      continue;
    }

    // Char literal
    if (ch === "'") {
      i += 1;
      column += 1;
      while (i < length) {
        if (source[i] === "\\") {
          i += 2;
          column += 2;
          continue;
        }
        if (source[i] === "'") {
          i += 1;
          column += 1;
          break;
        }
        if (source[i] === "\n") {
          i += 1;
          line += 1;
          column = 0;
          break;
        }
        i += 1;
        column += 1;
      }
      pushToken("char", start, i);
      continue;
    }

    // Numbers
    if (isDigit(ch) || (ch === '.' && isDigit(source[i + 1] || ''))) {
      if (ch === '0' && (source[i + 1] === 'x' || source[i + 1] === 'X')) {
        i += 2;
        column += 2;
        while (i < length && isHexDigit(source[i])) {
          i += 1;
          column += 1;
        }
      } else if (ch === '0' && (source[i + 1] === 'b' || source[i + 1] === 'B')) {
        i += 2;
        column += 2;
        while (i < length && isBinDigit(source[i])) {
          i += 1;
          column += 1;
        }
      } else if (ch === '0' && isOctDigit(source[i + 1] || '')) {
        i += 1;
        column += 1;
        while (i < length && isOctDigit(source[i])) {
          i += 1;
          column += 1;
        }
      } else {
        while (i < length && isDigit(source[i])) {
          i += 1;
          column += 1;
        }
        if (source[i] === '.') {
          i += 1;
          column += 1;
          while (i < length && isDigit(source[i])) {
            i += 1;
            column += 1;
          }
        }
        if (source[i] === 'e' || source[i] === 'E') {
          let j = i + 1;
          if (source[j] === '+' || source[j] === '-') j += 1;
          if (isDigit(source[j] || '')) {
            i = j + 1;
            column += (i - (j - 1));
            while (i < length && isDigit(source[i])) {
              i += 1;
              column += 1;
            }
          }
        }
      }
      while (i < length && /[uUlLfF]/.test(source[i])) {
        i += 1;
        column += 1;
      }
      pushToken("number", start, i);
      continue;
    }

    // Identifiers and keywords/types (HashMap lookup)
    if (IDENT_START_RE.test(ch)) {
      i += 1;
      column += 1;
      while (i < length && IDENT_PART_RE.test(source[i])) {
        i += 1;
        column += 1;
      }
      const text = source.slice(start, i);
      // HashMap lookup: O(1) check
      if (keywordSet.has(text)) {
        pushToken("keyword", start, i);
      } else if (typeSet.has(text)) {
        pushToken("type", start, i);
      } else {
        pushToken("identifier", start, i);
      }
      continue;
    }

    // Operators (HashMap lookup)
    const two = source.slice(i, i + 2);
    const three = source.slice(i, i + 3);
    if (operatorSet.has(three)) {
      i += 3;
      column += 3;
      pushToken("operator", start, i);
      continue;
    }
    if (operatorSet.has(two)) {
      i += 2;
      column += 2;
      pushToken("operator", start, i);
      continue;
    }
    if (operatorSet.has(ch)) {
      i += 1;
      column += 1;
      pushToken("operator", start, i);
      continue;
    }

    // Punctuation (HashMap lookup)
    if (punctuationSet.has(ch)) {
      i += 1;
      column += 1;
      pushToken("punctuation", start, i);
      continue;
    }

    // Unknown
    i += 1;
    column += 1;
    pushToken("unknown", start, i);
  }

  return tokens;
}

function colorizeTokens(tokens) {
  return tokens.map(t => ({
    value: t.value,
    className: getClassForTokenType(t.type)
  }));
}

// Render tokens to HTML string
function renderTokens(tokens) {
  if (!tokens || tokens.length === 0) {
    return '';
  }
  
  let html = '';
  for (const token of tokens) {
    if (!token || !token.value) continue;
    
    const value = token.value;
    const className = getClassForTokenType(token.type);
    
    // Escape HTML but preserve all characters including whitespace
    const safe = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // Always wrap in span if there's a class, even for whitespace
    if (className && className !== 'tok-space') {
      html += `<span class="${className}">${safe}</span>`;
    } else {
      // For whitespace or no class, just output the escaped text
      html += safe;
    }
  }
  return html;
}

// Syntax highlight function for editor (compatible with app.js)
function syntaxHighlight(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  try {
    const tokens = tokenizeCCode(text);
    return renderTokens(tokens);
  } catch (e) {
    console.error('Error in syntaxHighlight:', e);
    // Fallback: escape and return plain text
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Export immediately
if (typeof window !== 'undefined') {
  window.tokenizeCCode = tokenizeCCode;
  window.colorizeTokens = colorizeTokens;
  window.getClassForTokenType = getClassForTokenType;
  window.renderTokens = renderTokens;
  window.syntaxHighlight = syntaxHighlight;
  
  // Debug: log that color-code is loaded
  console.log('Color-code.js loaded, syntaxHighlight available:', typeof window.syntaxHighlight === 'function');
}
