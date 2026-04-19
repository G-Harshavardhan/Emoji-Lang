// ============================================
// EmojiLang Lexer — Lexical Analyzer
// ============================================
// Tokenizes emoji source code into a stream of typed tokens.

// Token types
export const TokenType = {
  // Keywords
  DECLARE:      'DECLARE',      // 📦
  PRINT:        'PRINT',        // 📢
  INPUT:        'INPUT',        // 📥
  IF:           'IF',           // 🤔
  ELSE:         'ELSE',         // 😤
  WHILE:        'WHILE',        // 🔄
  FOR:          'FOR',          // 🔁
  FUNC:         'FUNC',         // 🎯
  RETURN:       'RETURN',       // 🔙

  // Assignment
  ASSIGN:       'ASSIGN',       // ➡️

  // Arithmetic
  PLUS:         'PLUS',         // ➕
  MINUS:        'MINUS',        // ➖
  MULTIPLY:     'MULTIPLY',     // ✖️
  DIVIDE:       'DIVIDE',       // ➗
  MODULO:       'MODULO',       // 🔢

  // Comparison
  EQUAL:        'EQUAL',        // ⚖️
  NOT_EQUAL:    'NOT_EQUAL',    // 🚫
  GREATER:      'GREATER',     // 📈
  LESS:         'LESS',        // 📉

  // Logical
  AND:          'AND',          // 🤝
  OR:           'OR',           // 🔀
  NOT:          'NOT',          // 🙅

  // Boolean literals
  TRUE:         'TRUE',         // ✅
  FALSE:        'FALSE',        // ❌

  // Delimiters
  BLOCK_OPEN:   'BLOCK_OPEN',   // 🟢
  BLOCK_CLOSE:  'BLOCK_CLOSE',  // 🔴
  PAREN_OPEN:   'PAREN_OPEN',   // 👉
  PAREN_CLOSE:  'PAREN_CLOSE',  // 👈
  INDEX_OPEN:   'INDEX_OPEN',   // 🔓
  INDEX_CLOSE:  'INDEX_CLOSE',  // 🔒
  ARRAY:        'ARRAY',        // 📋

  // Literals
  NUMBER:       'NUMBER',
  STRING:       'STRING',
  STRING_DELIM: 'STRING_DELIM', // 💬

  // Punctuation
  SEPARATOR:    'SEPARATOR',    // 🔹
  STMT_END:     'STMT_END',     // ⏹️

  // Identifiers
  IDENTIFIER:   'IDENTIFIER',

  // Special
  EOF:          'EOF',
  UNKNOWN:      'UNKNOWN',
};

// Map emojis to their base codepoints (stripped of variation selectors)
// We normalize by removing U+FE0F (VS16) to handle both text and emoji presentation
function normalizeEmoji(str) {
  return str.replace(/\uFE0F/g, '');
}

// Single-emoji token mapping
// Keys are normalized (no VS16)
const EMOJI_TOKEN_MAP = new Map();

function addMapping(emoji, tokenType) {
  EMOJI_TOKEN_MAP.set(normalizeEmoji(emoji), tokenType);
}

// Keywords
addMapping('📦', TokenType.DECLARE);
addMapping('📢', TokenType.PRINT);
addMapping('📥', TokenType.INPUT);
addMapping('🤔', TokenType.IF);
addMapping('😤', TokenType.ELSE);
addMapping('🔄', TokenType.WHILE);
addMapping('🔁', TokenType.FOR);
addMapping('🎯', TokenType.FUNC);
addMapping('🔙', TokenType.RETURN);

// Assignment
addMapping('➡️', TokenType.ASSIGN);
addMapping('➡', TokenType.ASSIGN);

// Arithmetic
addMapping('➕', TokenType.PLUS);
addMapping('➖', TokenType.MINUS);
addMapping('✖️', TokenType.MULTIPLY);
addMapping('✖', TokenType.MULTIPLY);
addMapping('➗', TokenType.DIVIDE);
addMapping('🔢', TokenType.MODULO);

// Comparison
addMapping('⚖️', TokenType.EQUAL);
addMapping('⚖', TokenType.EQUAL);
addMapping('🚫', TokenType.NOT_EQUAL);
addMapping('📈', TokenType.GREATER);
addMapping('📉', TokenType.LESS);

// Logical
addMapping('🤝', TokenType.AND);
addMapping('🔀', TokenType.OR);
addMapping('🙅', TokenType.NOT);

// Booleans
addMapping('✅', TokenType.TRUE);
addMapping('❌', TokenType.FALSE);

// Delimiters
addMapping('🟢', TokenType.BLOCK_OPEN);
addMapping('🔴', TokenType.BLOCK_CLOSE);
addMapping('👉', TokenType.PAREN_OPEN);
addMapping('👈', TokenType.PAREN_CLOSE);
addMapping('🔓', TokenType.INDEX_OPEN);
addMapping('🔒', TokenType.INDEX_CLOSE);
addMapping('📋', TokenType.ARRAY);

// String delimiter
addMapping('💬', TokenType.STRING_DELIM);

// Punctuation
addMapping('🔹', TokenType.SEPARATOR);
addMapping('⏹️', TokenType.STMT_END);
addMapping('⏹', TokenType.STMT_END);

// Digit emojis (keycap sequences)
const DIGIT_EMOJIS = new Map();
for (let d = 0; d <= 9; d++) {
  // Keycap sequence: digit + U+FE0F + U+20E3
  const keycap = String.fromCodePoint(0x30 + d) + '\uFE0F\u20E3';
  const keycapNoVS = String.fromCodePoint(0x30 + d) + '\u20E3';
  DIGIT_EMOJIS.set(keycap, d);
  DIGIT_EMOJIS.set(keycapNoVS, d);
}

// Identifier emojis
const IDENTIFIER_EMOJIS = new Set();
const identNames = [
  '🅰️','🅱️','🅾️','Ⓜ️','🅿️',
  '🅰','🅱','🅾','Ⓜ','🅿',
  '🟠','🟡','🟢','🔵','🟣','⬛','⬜','🟤','🟥','🟦','🟧','🟨','🟩','🟪','🟫',
  '🔶','🔷','🔸','🔹','🔺','🔻',
  '💎','💠','🏷️','🏷',
  '🌟','⭐','🌙','☀️','☀','🌈',
  '🔑','🔒','💡','🎵','🎶','🎈','🎀',
  '🍎','🍊','🍋','🍇','🍉','🍓','🍌','🍑',
  '🐱','🐶','🐸','🦊','🐼','🐨','🐯',
];

identNames.forEach(e => {
  IDENTIFIER_EMOJIS.add(normalizeEmoji(e));
});
// Remove 🔹 from identifiers since it's used as separator
IDENTIFIER_EMOJIS.delete(normalizeEmoji('🔹'));

// Decimal point
const DECIMAL_POINT = '⏺️';
const DECIMAL_POINT_NORM = normalizeEmoji('⏺️');
const DECIMAL_POINT2 = '⏺';

/**
 * Create a token object
 */
function createToken(type, value, line, col, raw) {
  return { type, value, line, col, raw: raw || value };
}

/**
 * Check if a character/string matches a digit emoji
 */
function matchDigit(source, pos) {
  // Try 3-char keycap first (digit + VS16 + combining enclosing keycap)
  if (pos + 2 < source.length) {
    const three = source.substring(pos, pos + 3);
    if (DIGIT_EMOJIS.has(three)) {
      return { digit: DIGIT_EMOJIS.get(three), length: 3 };
    }
  }
  // Try 2-char keycap (digit + combining enclosing keycap, no VS16)
  if (pos + 1 < source.length) {
    const two = source.substring(pos, pos + 2);
    if (DIGIT_EMOJIS.has(two)) {
      return { digit: DIGIT_EMOJIS.get(two), length: 2 };
    }
  }
  return null;
}

/**
 * Try to match an emoji token at position
 */
function matchEmoji(source, pos) {
  // Try longest match first (up to 4 chars for some emoji with VS/ZWJ)
  for (let len = 4; len >= 1; len--) {
    if (pos + len > source.length) continue;
    const substr = source.substring(pos, pos + len);
    const normalized = normalizeEmoji(substr);

    // Check token map
    if (EMOJI_TOKEN_MAP.has(normalized)) {
      return { type: EMOJI_TOKEN_MAP.get(normalized), length: len, raw: substr };
    }

    // Check identifier emojis
    if (IDENTIFIER_EMOJIS.has(normalized)) {
      return { type: 'IDENT_CHAR', length: len, raw: substr, normalized };
    }
  }
  return null;
}

/**
 * Main lexer function
 * @param {string} source - The emoji source code
 * @returns {{ tokens: Array, errors: Array }}
 */
export function lex(source) {
  const tokens = [];
  const errors = [];
  let pos = 0;
  let line = 1;
  let col = 1;
  let inString = false;
  let stringContent = '';
  let stringStartLine = 0;
  let stringStartCol = 0;

  while (pos < source.length) {
    const ch = source[pos];

    // Handle newlines
    if (ch === '\n') {
      if (inString) {
        stringContent += ch;
      }
      pos++;
      line++;
      col = 1;
      continue;
    }

    // Handle carriage return
    if (ch === '\r') {
      pos++;
      continue;
    }

    // Handle spaces/tabs (whitespace)
    if (ch === ' ' || ch === '\t') {
      if (inString) {
        stringContent += ch;
      }
      pos++;
      col++;
      continue;
    }

    // Check for string delimiter 💬 (try multiple lengths since emoji is 2 UTF-16 units)
    let strDelimLen = 0;
    const targetDelim = normalizeEmoji('💬');
    for (let l = 1; l <= 4 && pos + l <= source.length; l++) {
      if (normalizeEmoji(source.substring(pos, pos + l)) === targetDelim) {
        strDelimLen = l;
      }
    }

    if (strDelimLen > 0) {
      if (!inString) {
        // Start of string
        inString = true;
        stringContent = '';
        stringStartLine = line;
        stringStartCol = col;
        tokens.push(createToken(TokenType.STRING_DELIM, '💬', line, col, source.substring(pos, pos + strDelimLen)));
        pos += strDelimLen;
        col += 1;
        continue;
      } else {
        // End of string
        inString = false;
        if (stringContent.length > 0) {
          tokens.push(createToken(TokenType.STRING, stringContent, stringStartLine, stringStartCol + 1, stringContent));
        }
        tokens.push(createToken(TokenType.STRING_DELIM, '💬', line, col, source.substring(pos, pos + strDelimLen)));
        pos += strDelimLen;
        col += 1;
        continue;
      }
    }

    // If inside a string, accumulate ALL characters (ASCII, emoji, etc.)
    if (inString) {
      // Handle surrogate pairs for emoji inside strings
      const cp = source.codePointAt(pos);
      const charLen = cp > 0xFFFF ? 2 : 1;
      stringContent += source.substring(pos, pos + charLen);
      pos += charLen;
      col++;
      continue;
    }

    // Try digit emoji match
    const digitMatch = matchDigit(source, pos);
    if (digitMatch) {
      // Accumulate consecutive digits into a number
      let numStr = '' + digitMatch.digit;
      let numRaw = source.substring(pos, pos + digitMatch.length);
      let numLen = digitMatch.length;
      let startCol = col;

      let nextPos = pos + digitMatch.length;
      while (nextPos < source.length) {
        const nextDigit = matchDigit(source, nextPos);
        if (nextDigit) {
          numStr += nextDigit.digit;
          numRaw += source.substring(nextPos, nextPos + nextDigit.length);
          numLen += nextDigit.length;
          nextPos += nextDigit.length;
        } else {
          // Check for decimal point
          const maybeDecimal = normalizeEmoji(source.substring(nextPos, Math.min(nextPos + 3, source.length)));
          if (maybeDecimal === DECIMAL_POINT_NORM || maybeDecimal === DECIMAL_POINT2) {
            let decLen = 1;
            for (let l = 1; l <= 3 && nextPos + l <= source.length; l++) {
              const n = normalizeEmoji(source.substring(nextPos, nextPos + l));
              if (n === DECIMAL_POINT_NORM || n === DECIMAL_POINT2) {
                decLen = l;
              }
            }
            numStr += '.';
            numRaw += source.substring(nextPos, nextPos + decLen);
            numLen += decLen;
            nextPos += decLen;
          } else {
            break;
          }
        }
      }

      tokens.push(createToken(TokenType.NUMBER, parseFloat(numStr), line, startCol, numRaw));
      pos = nextPos;
      col += numLen;
      continue;
    }

    // Try emoji token match
    const emojiMatch = matchEmoji(source, pos);
    if (emojiMatch) {
      if (emojiMatch.type === 'IDENT_CHAR') {
        // Accumulate consecutive identifier emojis
        let identName = emojiMatch.normalized;
        let identRaw = emojiMatch.raw;
        let identLen = emojiMatch.length;
        let startCol = col;

        let nextPos = pos + emojiMatch.length;
        while (nextPos < source.length) {
          const nextMatch = matchEmoji(source, nextPos);
          if (nextMatch && nextMatch.type === 'IDENT_CHAR') {
            identName += nextMatch.normalized;
            identRaw += nextMatch.raw;
            identLen += nextMatch.length;
            nextPos += nextMatch.length;
          } else {
            break;
          }
        }

        tokens.push(createToken(TokenType.IDENTIFIER, identName, line, startCol, identRaw));
        pos = nextPos;
        col += identRaw.length;
        continue;
      }

      tokens.push(createToken(emojiMatch.type, emojiMatch.raw, line, col, emojiMatch.raw));
      pos += emojiMatch.length;
      col += emojiMatch.length;
      continue;
    }

    // If we reach here, the character is NOT categorized and not whitespace
    const cp = source.codePointAt(pos);
    const charLen = cp > 0xFFFF ? 2 : 1;
    const raw = source.substring(pos, pos + charLen);
    
    errors.push({
      message: `Unknown symbol: ${raw} (U+${cp.toString(16).toUpperCase()})`,
      line,
      col,
    });
    
    tokens.push(createToken(TokenType.UNKNOWN, raw, line, col, raw));
    pos += charLen;
    col += charLen;
  }

  // Check unclosed string
  if (inString) {
    errors.push({
      message: `Unterminated string starting at line ${stringStartLine}, col ${stringStartCol}`,
      line: stringStartLine,
      col: stringStartCol,
    });
    if (stringContent.length > 0) {
      tokens.push(createToken(TokenType.STRING, stringContent, stringStartLine, stringStartCol + 1, stringContent));
    }
  }

  // Add EOF
  tokens.push(createToken(TokenType.EOF, 'EOF', line, col));

  return { tokens, errors };
}

/**
 * Get the CSS class for a token type (for styling)
 */
export function getTokenBadgeClass(type) {
  switch (type) {
    case TokenType.DECLARE:
    case TokenType.PRINT:
    case TokenType.INPUT:
    case TokenType.FUNC:
    case TokenType.RETURN:
      return 'token-badge--keyword';
    
    case TokenType.IF:
    case TokenType.ELSE:
    case TokenType.WHILE:
    case TokenType.FOR:
      return 'token-badge--control';
    
    case TokenType.PLUS:
    case TokenType.MINUS:
    case TokenType.MULTIPLY:
    case TokenType.DIVIDE:
    case TokenType.MODULO:
    case TokenType.ASSIGN:
    case TokenType.EQUAL:
    case TokenType.NOT_EQUAL:
    case TokenType.GREATER:
    case TokenType.LESS:
    case TokenType.AND:
    case TokenType.OR:
    case TokenType.NOT:
      return 'token-badge--operator';
    
    case TokenType.NUMBER:
    case TokenType.TRUE:
    case TokenType.FALSE:
      return 'token-badge--literal';
    
    case TokenType.STRING:
    case TokenType.STRING_DELIM:
      return 'token-badge--string';
    
    case TokenType.IDENTIFIER:
      return 'token-badge--identifier';
    
    case TokenType.BLOCK_OPEN:
    case TokenType.BLOCK_CLOSE:
    case TokenType.PAREN_OPEN:
    case TokenType.PAREN_CLOSE:
    case TokenType.INDEX_OPEN:
    case TokenType.INDEX_CLOSE:
    case TokenType.SEPARATOR:
    case TokenType.STMT_END:
    case TokenType.ARRAY:
      return 'token-badge--delimiter';
    
    case TokenType.EOF:
      return 'token-badge--eof';
    
    default:
      return '';
  }
}

/**
 * Get human-readable name for a token type
 */
export function getTokenTypeName(type) {
  const names = {
    DECLARE: 'Declare', PRINT: 'Print', INPUT: 'Input',
    IF: 'If', ELSE: 'Else', WHILE: 'While', FOR: 'For',
    FUNC: 'Function', RETURN: 'Return', ASSIGN: 'Assign',
    PLUS: 'Plus', MINUS: 'Minus', MULTIPLY: 'Multiply',
    DIVIDE: 'Divide', MODULO: 'Modulo',
    EQUAL: 'Equal', NOT_EQUAL: 'NotEqual', GREATER: 'Greater', LESS: 'Less',
    AND: 'And', OR: 'Or', NOT: 'Not',
    TRUE: 'True', FALSE: 'False',
    BLOCK_OPEN: 'BlockOpen', BLOCK_CLOSE: 'BlockClose',
    PAREN_OPEN: 'ParenOpen', PAREN_CLOSE: 'ParenClose',
    INDEX_OPEN: 'IndexOpen', INDEX_CLOSE: 'IndexClose',
    ARRAY: 'Array', NUMBER: 'Number', STRING: 'String',
    STRING_DELIM: 'StrDelim', SEPARATOR: 'Separator',
    STMT_END: 'StmtEnd', IDENTIFIER: 'Identifier',
    EOF: 'EOF', UNKNOWN: 'Unknown',
  };
  return names[type] || type;
}
