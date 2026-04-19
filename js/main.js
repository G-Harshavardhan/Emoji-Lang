// ============================================
// EmojiLang Main — Application Entry Point
// ============================================
// Wires up the IDE: editor, keyboard, compiler pipeline, and visualization.

import { lex } from './compiler/lexer.js';
import { Parser } from './compiler/parser.js';
import { SemanticAnalyzer } from './compiler/semantic.js';
import { optimize } from './compiler/optimizer.js';
import { CodeGenerator, highlightJS } from './compiler/codegen.js';
import { execute } from './compiler/executor.js';

import { Editor } from './ui/editor.js';
import { EmojiKeyboard } from './ui/emoji-keyboard.js';
import { TokenViewer } from './ui/token-viewer.js';
import { ASTVisualizer } from './ui/ast-visualizer.js';
import { OutputConsole } from './ui/console.js';

// ── Example Programs ──
const EXAMPLES = {
  hello: `📢👉💬Hello World!💬👈⏹️`,

  arithmetic: `📦🅰️ ➡️ 1️⃣5️⃣ ⏹️
📦🅱️ ➡️ 7️⃣ ⏹️
📦🟠 ➡️ 🅰️ ➕ 🅱️ ⏹️
📦🟡 ➡️ 🅰️ ➖ 🅱️ ⏹️
📦🔵 ➡️ 🅰️ ✖️ 🅱️ ⏹️
📦🟣 ➡️ 🅰️ ➗ 🅱️ ⏹️
📢👉💬Sum:💬👈⏹️
📢👉🟠👈⏹️
📢👉💬Difference:💬👈⏹️
📢👉🟡👈⏹️
📢👉💬Product:💬👈⏹️
📢👉🔵👈⏹️
📢👉💬Quotient:💬👈⏹️
📢👉🟣👈⏹️`,

  conditional: `📦🅰️ ➡️ 1️⃣0️⃣ ⏹️
🤔👉🅰️ 📈 5️⃣👈🟢
  📢👉💬Number is greater than 5!💬👈⏹️
🔴😤🟢
  📢👉💬Number is 5 or less💬👈⏹️
🔴`,

  loop: `📦🅰️ ➡️ 0️⃣ ⏹️
🔄👉🅰️ 📉 5️⃣👈🟢
  📢👉🅰️👈⏹️
  🅰️ ➡️ 🅰️ ➕ 1️⃣ ⏹️
🔴
📢👉💬Loop complete!💬👈⏹️`,

  function: `🎯🅱️👉🅰️👈🟢
  🔙 🅰️ ✖️ 🅰️ ⏹️
🔴
📢👉💬Square of 4:💬👈⏹️
📢👉🅱️👉4️⃣👈👈⏹️
📢👉💬Square of 7:💬👈⏹️
📢👉🅱️👉7️⃣👈👈⏹️`,

  fibonacci: `🎯🌟👉🅰️👈🟢
  🤔👉🅰️ 📉 2️⃣👈🟢
    🔙 🅰️ ⏹️
  🔴
  🔙 🌟👉🅰️ ➖ 1️⃣👈 ➕ 🌟👉🅰️ ➖ 2️⃣👈 ⏹️
🔴
📢👉💬Fibonacci sequence:💬👈⏹️
📦🟠 ➡️ 0️⃣ ⏹️
🔄👉🟠 📉 1️⃣0️⃣👈🟢
  📢👉🌟👉🟠👈👈⏹️
  🟠 ➡️ 🟠 ➕ 1️⃣ ⏹️
🔴`,

  fizzbuzz: `📦🅰️ ➡️ 1️⃣ ⏹️
🔄👉🅰️ 📉 1️⃣6️⃣👈🟢
  🤔👉🅰️ 🔢 1️⃣5️⃣ ⚖️ 0️⃣👈🟢
    📢👉💬FizzBuzz💬👈⏹️
  🔴😤🟢
    🤔👉🅰️ 🔢 3️⃣ ⚖️ 0️⃣👈🟢
      📢👉💬Fizz💬👈⏹️
    🔴😤🟢
      🤔👉🅰️ 🔢 5️⃣ ⚖️ 0️⃣👈🟢
        📢👉💬Buzz💬👈⏹️
      🔴😤🟢
        📢👉🅰️👈⏹️
      🔴
    🔴
  🔴
  🅰️ ➡️ 🅰️ ➕ 1️⃣ ⏹️
🔴`,

  array: `📦🅰️ ➡️ 📋🔓1️⃣0️⃣🔹2️⃣0️⃣🔹3️⃣0️⃣🔹4️⃣0️⃣🔹5️⃣0️⃣🔒 ⏹️
📢👉💬Array:💬👈⏹️
📢👉🅰️👈⏹️
📢👉💬First element:💬👈⏹️
📢👉🅰️🔓0️⃣🔒👈⏹️
📢👉💬Third element:💬👈⏹️
📢👉🅰️🔓2️⃣🔒👈⏹️`,
};

// ── App State ──
let editor, keyboard, tokenViewer, astVisualizer, outputConsole;
let compilationResult = null;

/**
 * Initialize the application
 */
function init() {
  // Initialize UI components
  editor = new Editor();
  keyboard = new EmojiKeyboard((emoji) => editor.insertAtCursor(emoji));
  tokenViewer = new TokenViewer();
  astVisualizer = new ASTVisualizer();
  outputConsole = new OutputConsole();

  // Wire up buttons
  document.getElementById('btn-run').addEventListener('click', compile);
  document.getElementById('btn-clear-all').addEventListener('click', clearAll);
  document.getElementById('btn-clear-console').addEventListener('click', () => outputConsole.clear());

  // Example selector
  document.getElementById('example-select').addEventListener('change', (e) => {
    const key = e.target.value;
    if (key && EXAMPLES[key]) {
      editor.setValue(EXAMPLES[key]);
      e.target.value = ''; // Reset selector
    }
  });

  // Tab switching
  document.getElementById('viz-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.viz__tab');
    if (!btn) return;
    const tab = btn.dataset.tab;
    switchTab(tab);
  });

  // Ctrl+Enter to compile
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      compile();
    }
  });

  // Load hello world example on start
  editor.setValue(EXAMPLES.hello);

  console.log('🧬 EmojiLang IDE initialized');
}

/**
 * Switch visualization tab
 */
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.viz__tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.viz__tab[data-tab="${tabName}"]`)?.classList.add('active');

  // Update tab content
  document.querySelectorAll('.viz__content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.add('active');

  // Re-render AST if that tab is selected (canvas needs to be visible)
  if (tabName === 'ast' && compilationResult?.ast) {
    setTimeout(() => astVisualizer.render(compilationResult.ast), 50);
  }
}

/**
 * Main compile & run function
 */
function compile() {
  const runBtn = document.getElementById('btn-run');
  runBtn.classList.add('compiling');
  runBtn.querySelector('span:last-child').textContent = '⏳';

  // Clear previous results
  outputConsole.clear();
  tokenViewer.clear();
  astVisualizer.clear();

  const source = editor.getValue().trim();
  if (!source) {
    outputConsole.addInfo('No source code to compile. Write some emoji code first!');
    resetRunButton();
    return;
  }

  const startTime = performance.now();
  const allErrors = [];
  const allWarnings = [];

  try {
    // ── Phase 1: Lexical Analysis ──
    outputConsole.addInfo('🔍 Phase 1: Lexical Analysis...');
    const lexResult = lex(source);
    const tokens = lexResult.tokens;
    allErrors.push(...lexResult.errors);

    // Display tokens
    tokenViewer.render(tokens);

    if (lexResult.errors.length > 0) {
      outputConsole.addWarning(`Lexer found ${lexResult.errors.length} issue(s)`);
    }

    // ── Phase 2: Syntax Analysis (Parsing) ──
    outputConsole.addInfo('🌳 Phase 2: Syntax Analysis...');
    const parser = new Parser(tokens);
    const ast = parser.parse();
    allErrors.push(...parser.errors);

    if (parser.errors.length > 0) {
      outputConsole.addWarning(`Parser found ${parser.errors.length} error(s)`);
    }

    // ── Phase 3: Semantic Analysis ──
    outputConsole.addInfo('✅ Phase 3: Semantic Analysis...');
    const semantic = new SemanticAnalyzer();
    const semResult = semantic.analyze(ast);
    allErrors.push(...semResult.errors);
    allWarnings.push(...semResult.warnings);

    if (semResult.errors.length > 0) {
      outputConsole.addWarning(`Semantic analyzer found ${semResult.errors.length} error(s)`);
    }
    if (semResult.warnings.length > 0) {
      outputConsole.addWarning(`${semResult.warnings.length} warning(s)`);
    }

    // ── Phase 4: Optimization ──
    outputConsole.addInfo('⚡ Phase 4: Optimization...');
    const optResult = optimize(ast);
    const optimizedAst = optResult.optimizedAst;
    const optStats = optResult.stats;

    // Display optimization stats
    renderOptStats(optStats);

    // ── Phase 5: Code Generation ──
    outputConsole.addInfo('💻 Phase 5: Code Generation...');
    const codegen = new CodeGenerator();
    const jsCode = codegen.generate(optimizedAst);

    // Display generated code
    renderGeneratedCode(jsCode);

    // Store AST for tab switching
    compilationResult = { ast: optimizedAst, tokens, jsCode };

    // Display AST (if tab is active)
    const astTab = document.querySelector('.viz__tab[data-tab="ast"]');
    if (astTab?.classList.contains('active')) {
      setTimeout(() => astVisualizer.render(optimizedAst), 50);
    }

    // Display errors in error tab
    renderErrors(allErrors, allWarnings);

    // ── Phase 6: Execution ──
    if (allErrors.length === 0) {
      outputConsole.addInfo('🏃 Phase 6: Execution...');
      outputConsole.addLine('─'.repeat(40), 'info');

      const execResult = execute(jsCode);

      // Display output
      if (execResult.output.length > 0) {
        outputConsole.addOutput(execResult.output);
      }
      if (execResult.errors.length > 0) {
        outputConsole.addErrors(execResult.errors);
        allErrors.push(...execResult.errors.map(e => ({ message: e, line: 0, col: 0 })));
      }

      outputConsole.addLine('─'.repeat(40), 'info');
      outputConsole.addSuccess(`Execution completed in ${execResult.executionTime}ms`);
    } else {
      outputConsole.addLine('─'.repeat(40), 'info');
      outputConsole.addLine(`❌ Compilation failed with ${allErrors.length} error(s). Fix them and try again!`, 'error');

      // Switch to errors tab
      switchTab('errors');
    }

    // ── Update Stats Bar ──
    const compileTime = (performance.now() - startTime).toFixed(1);
    updateStatsBar({
      tokens: tokens.length,
      astNodes: parser.nodeCount,
      compileTime,
      optimizations: optStats.constantsFolded + optStats.deadCodeEliminated,
      hasErrors: allErrors.length > 0,
    });

  } catch (e) {
    outputConsole.addLine(`💥 Internal Compiler Error: ${e.message}`, 'error');
    console.error('Compiler error:', e);
    updateStatsBar({ hasErrors: true });
  }

  resetRunButton();
}

/**
 * Reset the run button state
 */
function resetRunButton() {
  const runBtn = document.getElementById('btn-run');
  runBtn.classList.remove('compiling');
  runBtn.querySelector('span:last-child').textContent = 'Run';
}

/**
 * Clear all panels
 */
function clearAll() {
  editor.clear();
  outputConsole.clear();
  tokenViewer.clear();
  astVisualizer.clear();
  compilationResult = null;

  // Reset code viewer
  document.getElementById('code-viewer').style.display = 'none';
  document.getElementById('code-empty-state').style.display = 'flex';

  // Reset error panel
  document.getElementById('error-list').style.display = 'none';
  document.getElementById('errors-empty-state').style.display = 'flex';
  document.getElementById('errors-empty-state').innerHTML = `
    <span class="code-empty__emoji">✅</span>
    <span>No errors — your program looks great!</span>
  `;

  // Reset optimize panel
  document.getElementById('opt-stats').style.display = 'none';
  document.getElementById('optimize-empty-state').style.display = 'flex';

  // Reset stats bar
  updateStatsBar({});
}

/**
 * Render generated JavaScript code in the code viewer
 */
function renderGeneratedCode(code) {
  const viewer = document.getElementById('code-viewer');
  const emptyState = document.getElementById('code-empty-state');

  viewer.style.display = 'block';
  emptyState.style.display = 'none';

  viewer.innerHTML = highlightJS(code);
}

/**
 * Render errors and warnings in the error panel
 */
function renderErrors(errors, warnings) {
  const list = document.getElementById('error-list');
  const emptyState = document.getElementById('errors-empty-state');

  list.innerHTML = '';

  const allItems = [
    ...errors.map(e => ({ ...e, severity: 'error' })),
    ...warnings.map(w => ({ ...w, severity: w.severity || 'warning' })),
  ];

  if (allItems.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <span class="code-empty__emoji">✅</span>
      <span>No errors — your program looks great!</span>
    `;
    return;
  }

  list.style.display = 'block';
  emptyState.style.display = 'none';

  for (const item of allItems) {
    const li = document.createElement('li');
    li.className = 'error-item';

    const icon = document.createElement('span');
    icon.className = 'error-item__icon';
    icon.textContent = item.severity === 'error' ? '❌' : '⚠️';
    li.appendChild(icon);

    const details = document.createElement('div');

    const msg = document.createElement('div');
    msg.className = 'error-item__msg';
    msg.style.color = item.severity === 'error' ? 'var(--error)' : 'var(--warning)';
    msg.textContent = item.message;
    details.appendChild(msg);

    if (item.line) {
      const loc = document.createElement('div');
      loc.className = 'error-item__loc';
      loc.textContent = `Line ${item.line}${item.col ? ', Col ' + item.col : ''}`;
      details.appendChild(loc);
    }

    li.appendChild(details);
    list.appendChild(li);
  }
}

/**
 * Render optimization stats
 */
function renderOptStats(stats) {
  const container = document.getElementById('opt-stats');
  const emptyState = document.getElementById('optimize-empty-state');

  container.style.display = 'flex';
  emptyState.style.display = 'none';

  container.innerHTML = '';

  const items = [
    { label: 'Constants Folded', value: stats.constantsFolded },
    { label: 'Dead Code Removed', value: stats.deadCodeEliminated },
    { label: 'Nodes Before', value: stats.totalNodesBefore },
    { label: 'Nodes After', value: stats.totalNodesAfter },
    { label: 'Reduction', value: (stats.minification?.reductionPercent || 0) + '%' },
  ];

  for (const item of items) {
    const div = document.createElement('div');
    div.className = 'opt-stat';

    const val = document.createElement('div');
    val.className = 'opt-stat__value';
    val.textContent = item.value;
    div.appendChild(val);

    const label = document.createElement('div');
    label.className = 'opt-stat__label';
    label.textContent = item.label;
    div.appendChild(label);

    container.appendChild(div);
  }

  // Add pass details
  for (const pass of stats.passes) {
    const div = document.createElement('div');
    div.className = 'opt-stat';

    const val = document.createElement('div');
    val.className = 'opt-stat__value';
    val.textContent = pass.changes;
    div.appendChild(val);

    const label = document.createElement('div');
    label.className = 'opt-stat__label';
    label.textContent = pass.name;
    div.appendChild(label);

    container.appendChild(div);
  }
}

/**
 * Update the stats bar at the bottom
 */
function updateStatsBar({ tokens, astNodes, compileTime, optimizations, hasErrors } = {}) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  if (hasErrors) {
    dot.className = 'stats-bar__dot stats-bar__dot--error';
    text.textContent = 'Errors';
  } else if (tokens) {
    dot.className = 'stats-bar__dot';
    text.textContent = 'Compiled';
  } else {
    dot.className = 'stats-bar__dot';
    text.textContent = 'Ready';
  }

  document.getElementById('stat-tokens').querySelector('span').textContent =
    `Tokens: ${tokens || '—'}`;
  document.getElementById('stat-ast-nodes').querySelector('span').textContent =
    `AST Nodes: ${astNodes || '—'}`;
  document.getElementById('stat-compile-time').querySelector('span').textContent =
    `Compile: ${compileTime ? compileTime + 'ms' : '—'}`;
  document.getElementById('stat-optimizations').querySelector('span').textContent =
    `Optimizations: ${optimizations ?? '—'}`;
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

// ── Initialize when DOM is ready ──
document.addEventListener('DOMContentLoaded', init);
