// ============================================
// EmojiLang Editor — Code Editor Logic
// ============================================

/**
 * Editor module — manages the code textarea, line numbers, and cursor position
 */
export class Editor {
  constructor() {
    this.textarea = document.getElementById('editor-textarea');
    this.linesEl = document.getElementById('editor-lines');
    this.cursorPosEl = document.getElementById('cursor-pos');

    this._init();
  }

  _init() {
    // Update line numbers on input
    this.textarea.addEventListener('input', () => this.updateLineNumbers());
    this.textarea.addEventListener('scroll', () => this.syncScroll());
    this.textarea.addEventListener('keyup', () => this.updateCursorPos());
    this.textarea.addEventListener('click', () => this.updateCursorPos());
    this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Initial line numbers
    this.updateLineNumbers();
  }

  /**
   * Get the current source code
   */
  getValue() {
    return this.textarea.value;
  }

  /**
   * Set the source code
   */
  setValue(code) {
    this.textarea.value = code;
    this.updateLineNumbers();
    this.updateCursorPos();
  }

  /**
   * Insert text at the cursor position
   */
  insertAtCursor(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const before = this.textarea.value.substring(0, start);
    const after = this.textarea.value.substring(end);

    this.textarea.value = before + text + after;

    // Set cursor position after inserted text
    const newPos = start + text.length;
    this.textarea.selectionStart = newPos;
    this.textarea.selectionEnd = newPos;

    this.textarea.focus();
    this.updateLineNumbers();
    this.updateCursorPos();
  }

  /**
   * Clear the editor
   */
  clear() {
    this.textarea.value = '';
    this.updateLineNumbers();
    this.updateCursorPos();
  }

  /**
   * Update line number gutter
   */
  updateLineNumbers() {
    const lines = this.textarea.value.split('\n');
    const lineCount = lines.length;
    let html = '';
    for (let i = 1; i <= lineCount; i++) {
      html += i + '\n';
    }
    this.linesEl.textContent = html;
  }

  /**
   * Sync scroll between textarea and line numbers
   */
  syncScroll() {
    this.linesEl.scrollTop = this.textarea.scrollTop;
  }

  /**
   * Update cursor position display
   */
  updateCursorPos() {
    const pos = this.textarea.selectionStart;
    const text = this.textarea.value.substring(0, pos);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    this.cursorPosEl.textContent = `Ln ${line}, Col ${col}`;
  }

  /**
   * Handle special key behaviors
   */
  handleKeyDown(e) {
    // Tab key — insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      this.insertAtCursor('  ');
    }
  }

  /**
   * Focus the editor
   */
  focus() {
    this.textarea.focus();
  }
}
