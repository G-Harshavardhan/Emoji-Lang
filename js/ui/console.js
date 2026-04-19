// ============================================
// EmojiLang Output Console
// ============================================
// Terminal-styled output display for program execution results.

/**
 * Output Console class
 */
export class OutputConsole {
  constructor() {
    this.outputEl = document.getElementById('console-output');
    this.lineCount = 0;
  }

  /**
   * Clear the console
   */
  clear() {
    this.outputEl.innerHTML = '<span class="console__empty">Output will appear here after running your program...</span>';
    this.lineCount = 0;
  }

  /**
   * Add a line to the console
   * @param {string} text - The text to display
   * @param {string} type - Line type: 'stdout', 'error', 'info', 'success', 'warning'
   */
  addLine(text, type = 'stdout') {
    // Remove empty state if present
    const empty = this.outputEl.querySelector('.console__empty');
    if (empty) empty.remove();

    const line = document.createElement('span');
    line.className = `console__line console__line--${type}`;
    line.style.animationDelay = `${this.lineCount * 30}ms`;

    // Add prompt symbol
    const prompt = document.createElement('span');
    prompt.className = 'console__prompt';

    switch (type) {
      case 'stdout':
        prompt.textContent = '❯ ';
        break;
      case 'error':
        prompt.textContent = '✗ ';
        break;
      case 'info':
        prompt.textContent = 'ℹ ';
        break;
      case 'success':
        prompt.textContent = '✓ ';
        break;
      case 'warning':
        prompt.textContent = '⚠ ';
        break;
    }

    line.appendChild(prompt);
    line.appendChild(document.createTextNode(text));
    this.outputEl.appendChild(line);

    this.lineCount++;

    // Auto-scroll to bottom
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  /**
   * Add multiple stdout lines
   */
  addOutput(lines) {
    for (const line of lines) {
      this.addLine(line, 'stdout');
    }
  }

  /**
   * Add error lines
   */
  addErrors(errors) {
    for (const err of errors) {
      if (typeof err === 'string') {
        this.addLine(err, 'error');
      } else {
        this.addLine(`[line ${err.line}] ${err.message}`, 'error');
      }
    }
  }

  /**
   * Add info line
   */
  addInfo(text) {
    this.addLine(text, 'info');
  }

  /**
   * Add success line
   */
  addSuccess(text) {
    this.addLine(text, 'success');
  }

  /**
   * Add warning line
   */
  addWarning(text) {
    this.addLine(text, 'warning');
  }
}
