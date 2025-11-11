// Lightweight tokenizer adapted for browser from feature/color-code.ts

(function () {
  const keywordSet = new Set([
    "if","else","switch","case","default","for","while","do","break","continue","return","goto","sizeof","typedef","struct","union","enum","const","volatile","static","extern","register","auto","inline","restrict","_Bool","_Complex","_Imaginary","_Alignas","_Alignof","_Atomic","_Generic","_Noreturn","_Static_assert","_Thread_local"
  ]);
  const typeSet = new Set(["void","char","short","int","long","float","double","signed","unsigned","size_t","ptrdiff_t"]);
  const operatorSet = new Set([
    "+","-","*","/","%","++","--","=","+=","-=","*=","/=","%=","==","!=","<",">","<=",">=","&&","||","!","&","|","^","~","<<",">>","&=","|=","^=","<<=",">>=","->",".","?",":"
  ]);
  const punctuationSet = new Set(["(",")","{","}","[","]",",",";"]);
  const WS = /[\t\v\f\r\n ]/;
  const IDENT_START = /[A-Za-z_]/;
  const IDENT_PART = /[A-Za-z0-9_]/;

  function cls(type){
    switch(type){
      case 'keyword': return 'tok-keyword';
      case 'type': return 'tok-type';
      case 'identifier': return 'tok-identifier';
      case 'number': return 'tok-number';
      case 'string': return 'tok-string';
      case 'char': return 'tok-char';
      case 'operator': return 'tok-operator';
      case 'punctuation': return 'tok-punct';
      case 'comment': return 'tok-comment';
      case 'preprocessor': return 'tok-preproc';
      case 'whitespace': return '';
      default: return 'tok-unknown';
    }
  }

  function isDigit(ch){ return ch >= '0' && ch <= '9'; }
  function isHex(ch){ return /[0-9a-fA-F]/.test(ch); }
  function isOct(ch){ return /[0-7]/.test(ch); }
  function isBin(ch){ return ch === '0' || ch === '1'; }

  function tokenize(text){
    const out = [];
    const n = text.length;
    let i = 0;
    while(i < n){
      const start = i;
      const ch = text[i];

      if (WS.test(ch)){
        while(i < n && WS.test(text[i])) i++;
        out.push({ t:'whitespace', v:text.slice(start,i) });
        continue;
      }

      if (ch === '#' && (start === 0 || text[start-1] === '\n')){
        i++;
        while(i < n){
          if (text[i] === '\\' && text[i+1] === '\n'){ i+=2; continue; }
          if (text[i] === '\n'){ i++; break; }
          i++;
        }
        out.push({ t:'preprocessor', v:text.slice(start,i) });
        continue;
      }

      if (ch === '/'){
        const nx = text[i+1];
        if (nx === '/'){
          i+=2; while(i<n && text[i] !== '\n') i++; if (i<n && text[i]==='\n') i++;
          out.push({ t:'comment', v:text.slice(start,i) });
          continue;
        }
        if (nx === '*'){
          i+=2; while(i<n && !(text[i]==='*' && text[i+1]==='/')){ i++; }
          if (i<n){ i+=2; }
          out.push({ t:'comment', v:text.slice(start,i) });
          continue;
        }
      }

      if (ch === '"'){
        i++; while(i<n){ if (text[i]==='\\'){ i+=2; continue; } if(text[i]==='"'){ i++; break;} if(text[i]==='\n'){ i++; break;} i++; }
        out.push({ t:'string', v:text.slice(start,i) });
        continue;
      }
      if (ch === "'"){
        i++; while(i<n){ if (text[i]==='\\'){ i+=2; continue; } if(text[i]==="'"){ i++; break;} if(text[i]==='\n'){ i++; break;} i++; }
        out.push({ t:'char', v:text.slice(start,i) });
        continue;
      }

      if (isDigit(ch) || (ch==='.' && isDigit(text[i+1]||''))){
        if (ch==='0' && (text[i+1]==='x'||text[i+1]==='X')){ i+=2; while(i<n && isHex(text[i])) i++; }
        else if (ch==='0' && (text[i+1]==='b'||text[i+1]==='B')){ i+=2; while(i<n && isBin(text[i])) i++; }
        else if (ch==='0' && isOct(text[i+1]||'')){ i++; while(i<n && isOct(text[i])) i++; }
        else { while(i<n && isDigit(text[i])) i++; if(text[i]==='.'){ i++; while(i<n && isDigit(text[i])) i++; } if(text[i]==='e'||text[i]==='E'){ let j=i+1; if(text[j]==='+'||text[j]==='-') j++; if(isDigit(text[j]||'')){ i=j+1; while(i<n && isDigit(text[i])) i++; } } }
        while(i<n && /[uUlLfF]/.test(text[i])) i++;
        out.push({ t:'number', v:text.slice(start,i) });
        continue;
      }

      if (IDENT_START.test(ch)){
        i++; while(i<n && IDENT_PART.test(text[i])) i++;
        const word = text.slice(start,i);
        out.push({ t: keywordSet.has(word) ? 'keyword' : (typeSet.has(word)?'type':'identifier'), v: word });
        continue;
      }

      const three = text.slice(i,i+3), two = text.slice(i,i+2);
      if (operatorSet.has(three)){ i+=3; out.push({ t:'operator', v:three }); continue; }
      if (operatorSet.has(two)){ i+=2; out.push({ t:'operator', v:two }); continue; }
      if (operatorSet.has(ch)){ i++; out.push({ t:'operator', v:ch }); continue; }
      if (punctuationSet.has(ch)){ i++; out.push({ t:'punctuation', v:ch }); continue; }

      i++; out.push({ t:'unknown', v:text.slice(start,i) });
    }
    return out;
  }

  function renderTokens(tokens){
    let html = '';
    for (const tk of tokens){
      if (tk.t === 'whitespace'){
        html += tk.v.replace(/&/g,'&amp;').replace(/</g,'&lt;');
        continue;
      }
      const c = cls(tk.t);
      const safe = tk.v.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      html += c ? `<span class="${c}">${safe}</span>` : safe;
    }
    return html;
  }

  window.syntaxHighlight = function(text){
    return renderTokens(tokenize(text));
  }
})();


