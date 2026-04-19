// ============================================
// EmojiLang Parser — Recursive Descent Parser
// ============================================
// Builds an Abstract Syntax Tree (AST) from the token stream.

import { TokenType } from './lexer.js';

// AST Node types
export const NodeType = {
  PROGRAM:          'Program',
  VAR_DECLARATION:  'VarDeclaration',
  ASSIGNMENT:       'Assignment',
  PRINT:            'Print',
  INPUT:            'Input',
  IF_STATEMENT:     'IfStatement',
  WHILE_LOOP:       'WhileLoop',
  FOR_LOOP:         'ForLoop',
  FUNC_DECLARATION: 'FuncDeclaration',
  FUNC_CALL:        'FuncCall',
  RETURN:           'Return',
  BLOCK:            'Block',
  BINARY_EXPR:      'BinaryExpr',
  UNARY_EXPR:       'UnaryExpr',
  NUMBER_LITERAL:   'NumberLiteral',
  STRING_LITERAL:   'StringLiteral',
  BOOL_LITERAL:     'BoolLiteral',
  IDENTIFIER:       'Identifier',
  ARRAY_LITERAL:    'ArrayLiteral',
  INDEX_ACCESS:     'IndexAccess',
};

/**
 * Create an AST node
 */
function node(type, props = {}) {
  return { type, ...props };
}

/**
 * Parser class — recursive descent
 */
export class Parser {
  constructor(tokens) {
    // Filter out string delimiters and reconstruct string tokens
    this.tokens = this._preprocessTokens(tokens);
    this.pos = 0;
    this.errors = [];
    this.nodeCount = 0;
  }

  /**
   * Preprocess token stream: collapse STRING_DELIM + STRING + STRING_DELIM into a single STRING token
   */
  _preprocessTokens(tokens) {
    const result = [];
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i].type === TokenType.STRING_DELIM) {
        // Opening string delimiter
        const openDelim = tokens[i];
        i++;
        let stringValue = '';
        let stringToken = null;

        // Collect string content
        if (i < tokens.length && tokens[i].type === TokenType.STRING) {
          stringValue = tokens[i].value;
          stringToken = tokens[i];
          i++;
        }

        // Check for closing delimiter
        if (i < tokens.length && tokens[i].type === TokenType.STRING_DELIM) {
          i++; // skip closing
        }

        result.push({
          type: TokenType.STRING,
          value: stringValue,
          line: openDelim.line,
          col: openDelim.col,
          raw: `💬${stringValue}💬`,
        });
      } else {
        result.push(tokens[i]);
        i++;
      }
    }
    return result;
  }

  /**
   * Current token
   */
  current() {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: 'EOF', line: 0, col: 0 };
  }

  /**
   * Peek at the next token
   */
  peek(offset = 1) {
    return this.tokens[this.pos + offset] || { type: TokenType.EOF, value: 'EOF', line: 0, col: 0 };
  }

  /**
   * Advance to next token
   */
  advance() {
    const tok = this.current();
    this.pos++;
    return tok;
  }

  /**
   * Expect a specific token type, advance and return it, or add error
   */
  expect(type, context = '') {
    const tok = this.current();
    if (tok.type === type) {
      return this.advance();
    }
    const msg = `Expected ${type}${context ? ' in ' + context : ''}, but got ${tok.type} (${tok.raw || tok.value}) at line ${tok.line}, col ${tok.col}`;
    this.errors.push({ message: msg, line: tok.line, col: tok.col });
    return tok;
  }

  /**
   * Check if current token matches a type
   */
  match(type) {
    return this.current().type === type;
  }

  /**
   * Parse the full program
   */
  parse() {
    const body = [];

    while (!this.match(TokenType.EOF)) {
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e) {
        this.errors.push({
          message: e.message || 'Unexpected parsing error',
          line: this.current().line,
          col: this.current().col,
        });
        // Skip to next statement
        this.advance();
      }
    }

    this.nodeCount++;
    return node(NodeType.PROGRAM, { body });
  }

  /**
   * Parse a single statement
   */
  parseStatement() {
    const tok = this.current();

    switch (tok.type) {
      case TokenType.DECLARE:
        return this.parseVarDeclaration();
      case TokenType.PRINT:
        return this.parsePrint();
      case TokenType.INPUT:
        return this.parseInput();
      case TokenType.IF:
        return this.parseIf();
      case TokenType.WHILE:
        return this.parseWhile();
      case TokenType.FOR:
        return this.parseFor();
      case TokenType.FUNC:
        return this.parseFuncDeclaration();
      case TokenType.RETURN:
        return this.parseReturn();
      case TokenType.IDENTIFIER:
        // Could be assignment or function call
        return this.parseIdentifierStatement();
      case TokenType.STMT_END:
        // Empty statement
        this.advance();
        return null;
      default:
        // Try to parse as expression statement
        const expr = this.parseExpression();
        this.consumeStmtEnd();
        return expr;
    }
  }

  /**
   * 📦 Variable Declaration
   * 📦 IDENT ➡️ EXPR ⏹️
   */
  parseVarDeclaration() {
    this.advance(); // consume 📦
    this.nodeCount++;

    const name = this.expect(TokenType.IDENTIFIER, 'variable declaration');
    this.expect(TokenType.ASSIGN, 'variable declaration');
    const init = this.parseExpression();
    this.consumeStmtEnd();

    return node(NodeType.VAR_DECLARATION, {
      name: name.value,
      init,
      line: name.line,
      col: name.col,
    });
  }

  /**
   * 📢 Print Statement
   * 📢👉EXPR👈⏹️
   */
  parsePrint() {
    const tok = this.advance(); // consume 📢
    this.nodeCount++;

    this.expect(TokenType.PAREN_OPEN, 'print');
    const arg = this.parseExpression();
    this.expect(TokenType.PAREN_CLOSE, 'print');
    this.consumeStmtEnd();

    return node(NodeType.PRINT, { arg, line: tok.line, col: tok.col });
  }

  /**
   * 📥 Input
   * 📥👉EXPR?👈
   */
  parseInput() {
    const tok = this.advance(); // consume 📥
    this.nodeCount++;

    let prompt = null;
    if (this.match(TokenType.PAREN_OPEN)) {
      this.advance();
      if (!this.match(TokenType.PAREN_CLOSE)) {
        prompt = this.parseExpression();
      }
      this.expect(TokenType.PAREN_CLOSE, 'input');
    }

    return node(NodeType.INPUT, { prompt, line: tok.line, col: tok.col });
  }

  /**
   * 🤔 If Statement
   * 🤔👉EXPR👈🟢 BODY 🔴 (😤🟢 BODY 🔴)?
   */
  parseIf() {
    const tok = this.advance(); // consume 🤔
    this.nodeCount++;

    this.expect(TokenType.PAREN_OPEN, 'if condition');
    const condition = this.parseExpression();
    this.expect(TokenType.PAREN_CLOSE, 'if condition');
    const consequent = this.parseBlock();

    let alternate = null;
    if (this.match(TokenType.ELSE)) {
      this.advance(); // consume 😤
      if (this.match(TokenType.IF)) {
        // else-if chain
        alternate = this.parseIf();
      } else {
        alternate = this.parseBlock();
      }
    }

    return node(NodeType.IF_STATEMENT, {
      condition, consequent, alternate,
      line: tok.line, col: tok.col,
    });
  }

  /**
   * 🔄 While Loop
   * 🔄👉EXPR👈🟢 BODY 🔴
   */
  parseWhile() {
    const tok = this.advance(); // consume 🔄
    this.nodeCount++;

    this.expect(TokenType.PAREN_OPEN, 'while condition');
    const condition = this.parseExpression();
    this.expect(TokenType.PAREN_CLOSE, 'while condition');
    const body = this.parseBlock();

    return node(NodeType.WHILE_LOOP, {
      condition, body,
      line: tok.line, col: tok.col,
    });
  }

  /**
   * 🔁 For Loop
   * 🔁👉INIT🔹COND🔹UPDATE👈🟢 BODY 🔴
   */
  parseFor() {
    const tok = this.advance(); // consume 🔁
    this.nodeCount++;

    this.expect(TokenType.PAREN_OPEN, 'for loop');

    // Init
    let init = null;
    if (this.match(TokenType.DECLARE)) {
      init = this.parseVarDeclaration();
    } else if (!this.match(TokenType.SEPARATOR)) {
      init = this.parseExpression();
      // Don't consume stmt end here — for loops use separator
    }

    // After init, expect separator or use stmt_end
    if (this.match(TokenType.SEPARATOR)) {
      this.advance();
    } else if (this.match(TokenType.STMT_END)) {
      this.advance();
    }

    // Condition
    let condition = null;
    if (!this.match(TokenType.SEPARATOR) && !this.match(TokenType.STMT_END)) {
      condition = this.parseExpression();
    }

    if (this.match(TokenType.SEPARATOR)) {
      this.advance();
    } else if (this.match(TokenType.STMT_END)) {
      this.advance();
    }

    // Update
    let update = null;
    if (!this.match(TokenType.PAREN_CLOSE)) {
      update = this.parseExpression();
    }

    this.expect(TokenType.PAREN_CLOSE, 'for loop');
    const body = this.parseBlock();

    return node(NodeType.FOR_LOOP, {
      init, condition, update, body,
      line: tok.line, col: tok.col,
    });
  }

  /**
   * 🎯 Function Declaration
   * 🎯 IDENT 👉PARAMS👈🟢 BODY 🔴
   */
  parseFuncDeclaration() {
    const tok = this.advance(); // consume 🎯
    this.nodeCount++;

    const name = this.expect(TokenType.IDENTIFIER, 'function declaration');
    this.expect(TokenType.PAREN_OPEN, 'function params');

    const params = [];
    while (!this.match(TokenType.PAREN_CLOSE) && !this.match(TokenType.EOF)) {
      const param = this.expect(TokenType.IDENTIFIER, 'function params');
      params.push(param.value);
      if (this.match(TokenType.SEPARATOR)) {
        this.advance();
      }
    }

    this.expect(TokenType.PAREN_CLOSE, 'function params');
    const body = this.parseBlock();

    return node(NodeType.FUNC_DECLARATION, {
      name: name.value,
      params,
      body,
      line: tok.line, col: tok.col,
    });
  }

  /**
   * 🔙 Return
   * 🔙 EXPR ⏹️
   */
  parseReturn() {
    const tok = this.advance(); // consume 🔙
    this.nodeCount++;

    let value = null;
    if (!this.match(TokenType.STMT_END) && !this.match(TokenType.BLOCK_CLOSE)) {
      value = this.parseExpression();
    }
    this.consumeStmtEnd();

    return node(NodeType.RETURN, { value, line: tok.line, col: tok.col });
  }

  /**
   * Parse an identifier-started statement (assignment or function call)
   */
  parseIdentifierStatement() {
    const identTok = this.current();

    // Check if next token is assignment
    if (this.peek().type === TokenType.ASSIGN) {
      return this.parseAssignment();
    }

    // Check if next token is paren open (function call)
    if (this.peek().type === TokenType.PAREN_OPEN) {
      const call = this.parseFuncCall();
      this.consumeStmtEnd();
      return call;
    }

    // Check if it's array index assignment: IDENT[EXPR] = EXPR
    if (this.peek().type === TokenType.INDEX_OPEN) {
      // It could be index access assignment
      const expr = this.parseExpression();
      if (this.match(TokenType.ASSIGN)) {
        this.advance();
        const value = this.parseExpression();
        this.consumeStmtEnd();
        return node(NodeType.ASSIGNMENT, {
          target: expr,
          value,
          line: identTok.line,
          col: identTok.col
        });
      }
      this.consumeStmtEnd();
      return expr;
    }

    // Default: expression statement
    const expr = this.parseExpression();
    this.consumeStmtEnd();
    return expr;
  }

  /**
   * Parse assignment: IDENT ➡️ EXPR ⏹️
   */
  parseAssignment() {
    const ident = this.advance(); // consume identifier
    this.nodeCount++;
    this.expect(TokenType.ASSIGN, 'assignment');
    const value = this.parseExpression();
    this.consumeStmtEnd();

    return node(NodeType.ASSIGNMENT, {
      target: node(NodeType.IDENTIFIER, { name: ident.value, line: ident.line, col: ident.col }),
      value,
      line: ident.line, col: ident.col,
    });
  }

  /**
   * Parse a block: 🟢 STMTS 🔴
   */
  parseBlock() {
    this.expect(TokenType.BLOCK_OPEN, 'block');
    this.nodeCount++;

    const body = [];
    while (!this.match(TokenType.BLOCK_CLOSE) && !this.match(TokenType.EOF)) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    this.expect(TokenType.BLOCK_CLOSE, 'block');

    return node(NodeType.BLOCK, { body });
  }

  /**
   * Parse an expression (entry point for expression parsing)
   * Precedence (low to high):
   * 1. OR
   * 2. AND
   * 3. Comparison (==, !=, >, <)
   * 4. Addition/Subtraction
   * 5. Multiplication/Division/Modulo
   * 6. Unary (NOT, negative)
   * 7. Primary (literals, identifiers, parens, function calls)
   */
  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.match(TokenType.OR)) {
      const op = this.advance();
      this.nodeCount++;
      const right = this.parseAnd();
      left = node(NodeType.BINARY_EXPR, { op: '||', left, right, line: op.line, col: op.col });
    }
    return left;
  }

  parseAnd() {
    let left = this.parseComparison();
    while (this.match(TokenType.AND)) {
      const op = this.advance();
      this.nodeCount++;
      const right = this.parseComparison();
      left = node(NodeType.BINARY_EXPR, { op: '&&', left, right, line: op.line, col: op.col });
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAddSub();
    while (
      this.match(TokenType.EQUAL) || this.match(TokenType.NOT_EQUAL) ||
      this.match(TokenType.GREATER) || this.match(TokenType.LESS)
    ) {
      const opTok = this.advance();
      this.nodeCount++;
      const opMap = {
        [TokenType.EQUAL]: '===',
        [TokenType.NOT_EQUAL]: '!==',
        [TokenType.GREATER]: '>',
        [TokenType.LESS]: '<',
      };
      const right = this.parseAddSub();
      left = node(NodeType.BINARY_EXPR, { op: opMap[opTok.type], left, right, line: opTok.line, col: opTok.col });
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
      const opTok = this.advance();
      this.nodeCount++;
      const op = opTok.type === TokenType.PLUS ? '+' : '-';
      const right = this.parseMulDiv();
      left = node(NodeType.BINARY_EXPR, { op, left, right, line: opTok.line, col: opTok.col });
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (
      this.match(TokenType.MULTIPLY) || this.match(TokenType.DIVIDE) || this.match(TokenType.MODULO)
    ) {
      const opTok = this.advance();
      this.nodeCount++;
      const opMap = {
        [TokenType.MULTIPLY]: '*',
        [TokenType.DIVIDE]: '/',
        [TokenType.MODULO]: '%',
      };
      const right = this.parseUnary();
      left = node(NodeType.BINARY_EXPR, { op: opMap[opTok.type], left, right, line: opTok.line, col: opTok.col });
    }
    return left;
  }

  parseUnary() {
    if (this.match(TokenType.NOT)) {
      const op = this.advance();
      this.nodeCount++;
      const operand = this.parseUnary();
      return node(NodeType.UNARY_EXPR, { op: '!', operand, line: op.line, col: op.col });
    }
    if (this.match(TokenType.MINUS)) {
      const op = this.advance();
      this.nodeCount++;
      const operand = this.parseUnary();
      return node(NodeType.UNARY_EXPR, { op: '-', operand, line: op.line, col: op.col });
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    // Handle index access and function calls as postfix
    while (true) {
      if (this.match(TokenType.INDEX_OPEN)) {
        this.advance();
        this.nodeCount++;
        const index = this.parseExpression();
        this.expect(TokenType.INDEX_CLOSE, 'index access');
        expr = node(NodeType.INDEX_ACCESS, { object: expr, index, line: expr.line, col: expr.col });
      } else if (this.match(TokenType.PAREN_OPEN) && expr.type === NodeType.IDENTIFIER) {
        // Function call
        expr = this._parseFuncCallArgs(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  /**
   * Parse primary expressions
   */
  parsePrimary() {
    const tok = this.current();

    // Number literal
    if (this.match(TokenType.NUMBER)) {
      this.advance();
      this.nodeCount++;
      return node(NodeType.NUMBER_LITERAL, { value: tok.value, line: tok.line, col: tok.col });
    }

    // String literal
    if (this.match(TokenType.STRING)) {
      this.advance();
      this.nodeCount++;
      return node(NodeType.STRING_LITERAL, { value: tok.value, line: tok.line, col: tok.col });
    }

    // Boolean literals
    if (this.match(TokenType.TRUE)) {
      this.advance();
      this.nodeCount++;
      return node(NodeType.BOOL_LITERAL, { value: true, line: tok.line, col: tok.col });
    }
    if (this.match(TokenType.FALSE)) {
      this.advance();
      this.nodeCount++;
      return node(NodeType.BOOL_LITERAL, { value: false, line: tok.line, col: tok.col });
    }

    // Identifier
    if (this.match(TokenType.IDENTIFIER)) {
      this.advance();
      this.nodeCount++;
      return node(NodeType.IDENTIFIER, { name: tok.value, line: tok.line, col: tok.col });
    }

    // Parenthesized expression
    if (this.match(TokenType.PAREN_OPEN)) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.PAREN_CLOSE, 'grouped expression');
      return expr;
    }

    // Array literal 📋🔓 ELEMENTS 🔒
    if (this.match(TokenType.ARRAY)) {
      return this.parseArrayLiteral();
    }

    // Input expression
    if (this.match(TokenType.INPUT)) {
      return this.parseInput();
    }

    // Error: unexpected token
    this.errors.push({
      message: `Unexpected token: ${tok.type} (${tok.raw || tok.value}) at line ${tok.line}, col ${tok.col}`,
      line: tok.line,
      col: tok.col,
    });
    this.advance();
    this.nodeCount++;
    return node(NodeType.NUMBER_LITERAL, { value: 0, line: tok.line, col: tok.col });
  }

  /**
   * Parse array literal: 📋🔓 EXPR, EXPR, ... 🔒
   */
  parseArrayLiteral() {
    const tok = this.advance(); // consume 📋
    this.nodeCount++;
    this.expect(TokenType.INDEX_OPEN, 'array literal');

    const elements = [];
    while (!this.match(TokenType.INDEX_CLOSE) && !this.match(TokenType.EOF)) {
      elements.push(this.parseExpression());
      if (this.match(TokenType.SEPARATOR)) {
        this.advance();
      }
    }

    this.expect(TokenType.INDEX_CLOSE, 'array literal');

    return node(NodeType.ARRAY_LITERAL, { elements, line: tok.line, col: tok.col });
  }

  /**
   * Parse function call: IDENT👉ARGS👈
   */
  parseFuncCall() {
    const ident = this.advance(); // consume identifier
    this.nodeCount++;
    return this._parseFuncCallArgs(
      node(NodeType.IDENTIFIER, { name: ident.value, line: ident.line, col: ident.col })
    );
  }

  _parseFuncCallArgs(callee) {
    this.expect(TokenType.PAREN_OPEN, 'function call');
    this.nodeCount++;

    const args = [];
    while (!this.match(TokenType.PAREN_CLOSE) && !this.match(TokenType.EOF)) {
      args.push(this.parseExpression());
      if (this.match(TokenType.SEPARATOR)) {
        this.advance();
      }
    }

    this.expect(TokenType.PAREN_CLOSE, 'function call');

    return node(NodeType.FUNC_CALL, {
      callee: callee.name || callee.value,
      args,
      line: callee.line, col: callee.col,
    });
  }

  /**
   * Consume statement end ⏹️ if present
   */
  consumeStmtEnd() {
    if (this.match(TokenType.STMT_END)) {
      this.advance();
    }
  }
}
