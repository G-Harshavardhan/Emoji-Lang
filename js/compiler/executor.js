// ============================================
// EmojiLang Executor — Sandboxed Execution
// ============================================
// Executes generated JavaScript code in a controlled environment.

/**
 * Execute generated JavaScript code
 * @param {string} code - The generated JavaScript code
 * @param {object} options - Execution options
 * @returns {{ output: string[], errors: string[], executionTime: number }}
 */
export function execute(code, options = {}) {
  const output = [];
  const errors = [];
  const startTime = performance.now();
  const timeout = options.timeout || 5000; // 5 second timeout

  try {
    // Create sandboxed console
    const sandboxConsole = {
      log: (...args) => {
        const line = args.map(a => {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') return JSON.stringify(a);
          return String(a);
        }).join(' ');
        output.push(line);
      },
      error: (...args) => {
        errors.push(args.map(a => String(a)).join(' '));
      },
      warn: (...args) => {
        output.push('[warn] ' + args.map(a => String(a)).join(' '));
      },
    };

    // Create sandboxed prompt (for input)
    const sandboxPrompt = (msg) => {
      // In browser context, use actual prompt
      if (typeof window !== 'undefined' && window.prompt) {
        return window.prompt(msg || 'EmojiLang Input:') || '';
      }
      return '';
    };

    // Build the execution wrapper with timeout protection
    // We inject a loop counter to prevent infinite loops
    const wrappedCode = addLoopProtection(code, timeout);

    // Create a function with sandboxed console
    const execFn = new Function('console', 'prompt', '__startTime', '__timeout',
      `"use strict";
      ${wrappedCode}
    `);

    // Execute
    execFn(sandboxConsole, sandboxPrompt, startTime, timeout);

  } catch (e) {
    if (e.message === '__EMOJI_TIMEOUT__') {
      errors.push(`⏰ Execution timeout: Program exceeded ${timeout}ms limit (possible infinite loop)`);
    } else {
      // Try to clean up error message
      let msg = e.message || String(e);
      // Remove internal variable names
      msg = msg.replace(/_e_[0-9a-f_]+/g, (match) => {
        return '⟨variable⟩';
      });
      errors.push(`💥 Runtime Error: ${msg}`);
    }
  }

  const executionTime = performance.now() - startTime;

  return {
    output,
    errors,
    executionTime: Math.round(executionTime * 100) / 100,
  };
}

/**
 * Add loop protection to prevent infinite loops
 * Injects a timeout check into every loop body
 */
function addLoopProtection(code, timeout) {
  const loopCheck = `if (performance.now() - __startTime > __timeout) throw new Error('__EMOJI_TIMEOUT__');`;

  // Inject timeout check after opening braces of while/for loops
  let result = code;

  // Match while (...) { and for (...) {
  result = result.replace(/((?:while|for)\s*\([^)]*\)\s*\{)/g, `$1\n  ${loopCheck}`);

  return result;
}
