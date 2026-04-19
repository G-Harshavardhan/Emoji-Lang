// ============================================
// EmojiLang Optimizer
// ============================================
// Performs constant folding, dead code elimination, and emoji minification analysis.

import { NodeType } from './parser.js';

/**
 * Optimization stats tracker
 */
class OptimizationStats {
  constructor() {
    this.constantsFolded = 0;
    this.deadCodeEliminated = 0;
    this.totalNodesBefore = 0;
    this.totalNodesAfter = 0;
    this.passes = [];
  }

  addPass(name, changes) {
    this.passes.push({ name, changes });
  }
}

/**
 * Deep clone an AST node
 */
function cloneNode(node) {
  if (node === null || node === undefined) return node;
  if (typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(cloneNode);

  const result = {};
  for (const key of Object.keys(node)) {
    result[key] = cloneNode(node[key]);
  }
  return result;
}

/**
 * Count nodes in an AST
 */
function countNodes(node) {
  if (!node || typeof node !== 'object') return 0;
  let count = 1;
  for (const key of Object.keys(node)) {
    if (key.startsWith('_')) continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const child of val) {
        count += countNodes(child);
      }
    } else if (typeof val === 'object' && val !== null && val.type) {
      count += countNodes(val);
    }
  }
  return count;
}

/**
 * Constant Folding Pass
 * Evaluates constant expressions at compile time
 */
function constantFolding(node, stats) {
  if (!node || typeof node !== 'object') return node;

  // Recurse into children first (bottom-up)
  for (const key of Object.keys(node)) {
    if (key.startsWith('_')) continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        val[i] = constantFolding(val[i], stats);
      }
    } else if (typeof val === 'object' && val !== null && val.type) {
      node[key] = constantFolding(val, stats);
    }
  }

  // Binary expression with two literal operands
  if (node.type === NodeType.BINARY_EXPR) {
    const left = node.left;
    const right = node.right;

    if (left.type === NodeType.NUMBER_LITERAL && right.type === NodeType.NUMBER_LITERAL) {
      let result = null;
      switch (node.op) {
        case '+': result = left.value + right.value; break;
        case '-': result = left.value - right.value; break;
        case '*': result = left.value * right.value; break;
        case '/': if (right.value !== 0) result = left.value / right.value; break;
        case '%': if (right.value !== 0) result = left.value % right.value; break;
        case '===': return { type: NodeType.BOOL_LITERAL, value: left.value === right.value, line: node.line, col: node.col };
        case '!==': return { type: NodeType.BOOL_LITERAL, value: left.value !== right.value, line: node.line, col: node.col };
        case '>': return { type: NodeType.BOOL_LITERAL, value: left.value > right.value, line: node.line, col: node.col };
        case '<': return { type: NodeType.BOOL_LITERAL, value: left.value < right.value, line: node.line, col: node.col };
      }
      if (result !== null) {
        stats.constantsFolded++;
        return { type: NodeType.NUMBER_LITERAL, value: result, line: node.line, col: node.col, _folded: true };
      }
    }

    // String concatenation with two string literals
    if (left.type === NodeType.STRING_LITERAL && right.type === NodeType.STRING_LITERAL && node.op === '+') {
      stats.constantsFolded++;
      return { type: NodeType.STRING_LITERAL, value: left.value + right.value, line: node.line, col: node.col, _folded: true };
    }

    // Boolean constant folding
    if (left.type === NodeType.BOOL_LITERAL && right.type === NodeType.BOOL_LITERAL) {
      let result = null;
      switch (node.op) {
        case '&&': result = left.value && right.value; break;
        case '||': result = left.value || right.value; break;
        case '===': result = left.value === right.value; break;
        case '!==': result = left.value !== right.value; break;
      }
      if (result !== null) {
        stats.constantsFolded++;
        return { type: NodeType.BOOL_LITERAL, value: result, line: node.line, col: node.col, _folded: true };
      }
    }
  }

  // Unary expression on literal
  if (node.type === NodeType.UNARY_EXPR) {
    if (node.op === '-' && node.operand.type === NodeType.NUMBER_LITERAL) {
      stats.constantsFolded++;
      return { type: NodeType.NUMBER_LITERAL, value: -node.operand.value, line: node.line, col: node.col, _folded: true };
    }
    if (node.op === '!' && node.operand.type === NodeType.BOOL_LITERAL) {
      stats.constantsFolded++;
      return { type: NodeType.BOOL_LITERAL, value: !node.operand.value, line: node.line, col: node.col, _folded: true };
    }
  }

  return node;
}

/**
 * Dead Code Elimination Pass
 * Removes unreachable code after return statements,
 * removes if blocks with constant false conditions, etc.
 */
function deadCodeElimination(node, stats) {
  if (!node || typeof node !== 'object') return node;

  // Handle blocks — remove statements after return
  if (node.type === NodeType.BLOCK || node.type === NodeType.PROGRAM) {
    const newBody = [];
    let foundReturn = false;

    for (const stmt of node.body) {
      if (foundReturn) {
        stats.deadCodeEliminated++;
        continue;
      }
      const processed = deadCodeElimination(stmt, stats);
      if (processed) {
        newBody.push(processed);
      }
      if (stmt && stmt.type === NodeType.RETURN) {
        foundReturn = true;
      }
    }

    node.body = newBody;
    return node;
  }

  // Handle if with constant condition
  if (node.type === NodeType.IF_STATEMENT) {
    if (node.condition.type === NodeType.BOOL_LITERAL) {
      stats.deadCodeEliminated++;
      if (node.condition.value === true) {
        // Always true — replace with consequent body
        return deadCodeElimination(node.consequent, stats);
      } else {
        // Always false — replace with alternate (or remove)
        if (node.alternate) {
          return deadCodeElimination(node.alternate, stats);
        }
        return null;
      }
    }
  }

  // Recurse into children
  for (const key of Object.keys(node)) {
    if (key.startsWith('_')) continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        val[i] = deadCodeElimination(val[i], stats);
      }
      node[key] = val.filter(v => v !== null);
    } else if (typeof val === 'object' && val !== null && val.type) {
      node[key] = deadCodeElimination(val, stats);
    }
  }

  return node;
}

/**
 * Emoji Minification Analysis
 * Reports potential savings from reducing emoji sequences
 */
function emojiMinificationAnalysis(originalAst, optimizedAst) {
  const originalCount = countNodes(originalAst);
  const optimizedCount = countNodes(optimizedAst);
  const savings = originalCount - optimizedCount;

  return {
    originalNodes: originalCount,
    optimizedNodes: optimizedCount,
    nodesRemoved: savings,
    reductionPercent: originalCount > 0 ? ((savings / originalCount) * 100).toFixed(1) : '0.0',
  };
}

/**
 * Main optimizer function
 * @param {Object} ast - The AST to optimize
 * @returns {{ optimizedAst: Object, stats: OptimizationStats }}
 */
export function optimize(ast) {
  const stats = new OptimizationStats();
  const originalAst = cloneNode(ast);

  stats.totalNodesBefore = countNodes(ast);

  // Pass 1: Constant Folding
  const foldedStart = stats.constantsFolded;
  ast = constantFolding(ast, stats);
  stats.addPass('Constant Folding', stats.constantsFolded - foldedStart);

  // Pass 2: Dead Code Elimination
  const dceStart = stats.deadCodeEliminated;
  ast = deadCodeElimination(ast, stats);
  stats.addPass('Dead Code Elimination', stats.deadCodeEliminated - dceStart);

  stats.totalNodesAfter = countNodes(ast);

  // Emoji minification analysis
  const minification = emojiMinificationAnalysis(originalAst, ast);
  stats.minification = minification;

  return {
    optimizedAst: ast,
    stats,
  };
}
