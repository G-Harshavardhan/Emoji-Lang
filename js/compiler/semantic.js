// ============================================
// EmojiLang Semantic Analyzer
// ============================================
// Performs type checking, variable scope validation, and runtime error detection.

import { NodeType } from './parser.js';

// Type system
const EmojiType = {
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  FUNCTION: 'function',
  ANY: 'any',
  VOID: 'void',
};

/**
 * Scope class — manages variable/function declarations
 */
class Scope {
  constructor(parent = null, name = 'global') {
    this.parent = parent;
    this.name = name;
    this.symbols = new Map();
  }

  declare(name, info) {
    this.symbols.set(name, info);
  }

  lookup(name) {
    if (this.symbols.has(name)) {
      return this.symbols.get(name);
    }
    if (this.parent) {
      return this.parent.lookup(name);
    }
    return null;
  }

  has(name) {
    return this.symbols.has(name);
  }

  hasLocal(name) {
    return this.symbols.has(name);
  }
}

/**
 * Semantic Analyzer
 */
export class SemanticAnalyzer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.globalScope = new Scope(null, 'global');
    this.currentScope = this.globalScope;
    this.inFunction = false;
  }

  /**
   * Analyze the AST
   * @param {Object} ast - The AST from the parser
   * @returns {{ errors: Array, warnings: Array, annotatedAst: Object }}
   */
  analyze(ast) {
    this.errors = [];
    this.warnings = [];
    this.globalScope = new Scope(null, 'global');
    this.currentScope = this.globalScope;
    this.inFunction = false;

    this.visitNode(ast);

    return {
      errors: this.errors,
      warnings: this.warnings,
      annotatedAst: ast,
    };
  }

  /**
   * Enter a new scope
   */
  pushScope(name) {
    this.currentScope = new Scope(this.currentScope, name);
  }

  /**
   * Leave current scope
   */
  popScope() {
    this.currentScope = this.currentScope.parent || this.globalScope;
  }

  /**
   * Visit an AST node
   */
  visitNode(node) {
    if (!node || !node.type) return EmojiType.ANY;

    switch (node.type) {
      case NodeType.PROGRAM:
        return this.visitProgram(node);
      case NodeType.VAR_DECLARATION:
        return this.visitVarDeclaration(node);
      case NodeType.ASSIGNMENT:
        return this.visitAssignment(node);
      case NodeType.PRINT:
        return this.visitPrint(node);
      case NodeType.INPUT:
        return this.visitInput(node);
      case NodeType.IF_STATEMENT:
        return this.visitIf(node);
      case NodeType.WHILE_LOOP:
        return this.visitWhile(node);
      case NodeType.FOR_LOOP:
        return this.visitFor(node);
      case NodeType.FUNC_DECLARATION:
        return this.visitFuncDeclaration(node);
      case NodeType.FUNC_CALL:
        return this.visitFuncCall(node);
      case NodeType.RETURN:
        return this.visitReturn(node);
      case NodeType.BLOCK:
        return this.visitBlock(node);
      case NodeType.BINARY_EXPR:
        return this.visitBinaryExpr(node);
      case NodeType.UNARY_EXPR:
        return this.visitUnaryExpr(node);
      case NodeType.NUMBER_LITERAL:
        node._emojiType = EmojiType.NUMBER;
        return EmojiType.NUMBER;
      case NodeType.STRING_LITERAL:
        node._emojiType = EmojiType.STRING;
        return EmojiType.STRING;
      case NodeType.BOOL_LITERAL:
        node._emojiType = EmojiType.BOOLEAN;
        return EmojiType.BOOLEAN;
      case NodeType.IDENTIFIER:
        return this.visitIdentifier(node);
      case NodeType.ARRAY_LITERAL:
        return this.visitArrayLiteral(node);
      case NodeType.INDEX_ACCESS:
        return this.visitIndexAccess(node);
      default:
        return EmojiType.ANY;
    }
  }

  visitProgram(node) {
    for (const stmt of node.body) {
      this.visitNode(stmt);
    }
    return EmojiType.VOID;
  }

  visitVarDeclaration(node) {
    const initType = this.visitNode(node.init);

    // Check for redeclaration in same scope
    if (this.currentScope.hasLocal(node.name)) {
      this.warnings.push({
        message: `Variable '${this._prettyName(node.name)}' is already declared in this scope (line ${node.line})`,
        line: node.line,
        col: node.col,
        severity: 'warning',
      });
    }

    // Declare in current scope
    this.currentScope.declare(node.name, {
      type: initType,
      declared: true,
      line: node.line,
      mutable: true,
    });

    node._emojiType = initType;
    return initType;
  }

  visitAssignment(node) {
    const valueType = this.visitNode(node.value);

    if (node.target.type === NodeType.IDENTIFIER) {
      const symbol = this.currentScope.lookup(node.target.name);
      if (!symbol) {
        this.errors.push({
          message: `Cannot assign to undeclared variable '${this._prettyName(node.target.name)}'. Use 📦 to declare it first! (line ${node.line})`,
          line: node.line,
          col: node.col,
        });
      } else {
        // Update type
        symbol.type = valueType;
      }
    } else {
      // Index access assignment — visit the target
      this.visitNode(node.target);
    }

    node._emojiType = valueType;
    return valueType;
  }

  visitPrint(node) {
    this.visitNode(node.arg);
    node._emojiType = EmojiType.VOID;
    return EmojiType.VOID;
  }

  visitInput(node) {
    if (node.prompt) {
      this.visitNode(node.prompt);
    }
    node._emojiType = EmojiType.STRING;
    return EmojiType.STRING;
  }

  visitIf(node) {
    const condType = this.visitNode(node.condition);

    // Warn if condition is not boolean-like
    if (condType === EmojiType.STRING) {
      this.warnings.push({
        message: `If condition is a string — it will be truthy for non-empty strings (line ${node.line})`,
        line: node.line,
        col: node.col,
        severity: 'warning',
      });
    }

    this.pushScope('if');
    this.visitNode(node.consequent);
    this.popScope();

    if (node.alternate) {
      this.pushScope('else');
      this.visitNode(node.alternate);
      this.popScope();
    }

    return EmojiType.VOID;
  }

  visitWhile(node) {
    const condType = this.visitNode(node.condition);

    // Check for possible infinite loop (constant true condition)
    if (node.condition.type === NodeType.BOOL_LITERAL && node.condition.value === true) {
      this.warnings.push({
        message: `Potential infinite loop: while condition is always ✅ true (line ${node.line})`,
        line: node.line,
        col: node.col,
        severity: 'warning',
      });
    }

    this.pushScope('while');
    this.visitNode(node.body);
    this.popScope();

    return EmojiType.VOID;
  }

  visitFor(node) {
    this.pushScope('for');

    if (node.init) this.visitNode(node.init);
    if (node.condition) this.visitNode(node.condition);
    if (node.update) this.visitNode(node.update);
    this.visitNode(node.body);

    this.popScope();
    return EmojiType.VOID;
  }

  visitFuncDeclaration(node) {
    // Declare function in current scope
    this.currentScope.declare(node.name, {
      type: EmojiType.FUNCTION,
      params: node.params,
      declared: true,
      line: node.line,
    });

    // Enter function scope
    this.pushScope(`func:${node.name}`);
    const prevInFunction = this.inFunction;
    this.inFunction = true;

    // Declare parameters
    for (const param of node.params) {
      this.currentScope.declare(param, {
        type: EmojiType.ANY,
        declared: true,
        line: node.line,
        isParam: true,
      });
    }

    // Visit body
    this.visitNode(node.body);

    this.inFunction = prevInFunction;
    this.popScope();

    node._emojiType = EmojiType.FUNCTION;
    return EmojiType.FUNCTION;
  }

  visitFuncCall(node) {
    const symbol = this.currentScope.lookup(node.callee);
    if (!symbol) {
      this.errors.push({
        message: `Call to undeclared function '${this._prettyName(node.callee)}' (line ${node.line})`,
        line: node.line,
        col: node.col,
      });
    } else if (symbol.type !== EmojiType.FUNCTION) {
      this.errors.push({
        message: `'${this._prettyName(node.callee)}' is not a function (line ${node.line})`,
        line: node.line,
        col: node.col,
      });
    } else if (symbol.params && node.args.length !== symbol.params.length) {
      this.warnings.push({
        message: `Function '${this._prettyName(node.callee)}' expects ${symbol.params.length} argument(s) but got ${node.args.length} (line ${node.line})`,
        line: node.line,
        col: node.col,
        severity: 'warning',
      });
    }

    // Visit arguments
    for (const arg of node.args) {
      this.visitNode(arg);
    }

    node._emojiType = EmojiType.ANY;
    return EmojiType.ANY;
  }

  visitReturn(node) {
    if (!this.inFunction) {
      this.errors.push({
        message: `🔙 Return statement outside of a function (line ${node.line})`,
        line: node.line,
        col: node.col,
      });
    }

    let retType = EmojiType.VOID;
    if (node.value) {
      retType = this.visitNode(node.value);
    }

    node._emojiType = retType;
    return retType;
  }

  visitBlock(node) {
    for (const stmt of node.body) {
      this.visitNode(stmt);
    }
    return EmojiType.VOID;
  }

  visitBinaryExpr(node) {
    const leftType = this.visitNode(node.left);
    const rightType = this.visitNode(node.right);

    const op = node.op;

    // Type checking for arithmetic operators
    if (['+', '-', '*', '/', '%'].includes(op)) {
      if (op === '+') {
        // + allows string concatenation
        if (leftType === EmojiType.STRING || rightType === EmojiType.STRING) {
          node._emojiType = EmojiType.STRING;
          return EmojiType.STRING;
        }
      }

      if (op !== '+' && (leftType === EmojiType.STRING || rightType === EmojiType.STRING)) {
        this.errors.push({
          message: `Cannot use '${op}' operator with strings (line ${node.line})`,
          line: node.line,
          col: node.col,
        });
      }

      if (leftType === EmojiType.NUMBER && rightType === EmojiType.NUMBER) {
        // Check division by zero
        if (op === '/' && node.right.type === NodeType.NUMBER_LITERAL && node.right.value === 0) {
          this.errors.push({
            message: `Division by zero detected (line ${node.line})`,
            line: node.line,
            col: node.col,
          });
        }
        node._emojiType = EmojiType.NUMBER;
        return EmojiType.NUMBER;
      }
    }

    // Comparison operators return boolean
    if (['===', '!==', '>', '<'].includes(op)) {
      node._emojiType = EmojiType.BOOLEAN;
      return EmojiType.BOOLEAN;
    }

    // Logical operators return boolean
    if (['&&', '||'].includes(op)) {
      node._emojiType = EmojiType.BOOLEAN;
      return EmojiType.BOOLEAN;
    }

    node._emojiType = EmojiType.ANY;
    return EmojiType.ANY;
  }

  visitUnaryExpr(node) {
    const operandType = this.visitNode(node.operand);

    if (node.op === '!') {
      node._emojiType = EmojiType.BOOLEAN;
      return EmojiType.BOOLEAN;
    }
    if (node.op === '-') {
      if (operandType === EmojiType.STRING) {
        this.errors.push({
          message: `Cannot negate a string value (line ${node.line})`,
          line: node.line,
          col: node.col,
        });
      }
      node._emojiType = EmojiType.NUMBER;
      return EmojiType.NUMBER;
    }

    node._emojiType = operandType;
    return operandType;
  }

  visitIdentifier(node) {
    const symbol = this.currentScope.lookup(node.name);
    if (!symbol) {
      this.errors.push({
        message: `Undeclared variable '${this._prettyName(node.name)}'. Use 📦 to declare it first! (line ${node.line})`,
        line: node.line,
        col: node.col,
      });
      node._emojiType = EmojiType.ANY;
      return EmojiType.ANY;
    }
    node._emojiType = symbol.type || EmojiType.ANY;
    return node._emojiType;
  }

  visitArrayLiteral(node) {
    for (const el of node.elements) {
      this.visitNode(el);
    }
    node._emojiType = EmojiType.ARRAY;
    return EmojiType.ARRAY;
  }

  visitIndexAccess(node) {
    const objType = this.visitNode(node.object);
    const indexType = this.visitNode(node.index);

    if (objType !== EmojiType.ARRAY && objType !== EmojiType.ANY && objType !== EmojiType.STRING) {
      this.warnings.push({
        message: `Index access on a non-array/non-string value (line ${node.line || 0})`,
        line: node.line || 0,
        col: node.col || 0,
        severity: 'warning',
      });
    }

    node._emojiType = EmojiType.ANY;
    return EmojiType.ANY;
  }

  /**
   * Format emoji identifier for display
   */
  _prettyName(name) {
    return name || '?';
  }
}
