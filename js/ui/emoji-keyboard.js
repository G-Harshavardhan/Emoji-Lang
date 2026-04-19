// ============================================
// EmojiLang Emoji Keyboard
// ============================================
// Categorized emoji button grid for inserting tokens into the editor.

const KEYBOARD_CATEGORIES = [
  {
    name: 'Declarations',
    id: 'declare',
    keys: [
      { emoji: '📦', label: 'let', desc: 'Declare variable' },
      { emoji: '➡️', label: '=', desc: 'Assign value' },
      { emoji: '📢', label: 'print', desc: 'Print output' },
      { emoji: '📥', label: 'input', desc: 'Read input' },
      { emoji: '⏹️', label: ';', desc: 'End statement' },
      { emoji: '🔹', label: ',', desc: 'Separator' },
    ],
  },
  {
    name: 'Control',
    id: 'control',
    keys: [
      { emoji: '🤔', label: 'if', desc: 'If condition' },
      { emoji: '😤', label: 'else', desc: 'Else branch' },
      { emoji: '🔄', label: 'while', desc: 'While loop' },
      { emoji: '🔁', label: 'for', desc: 'For loop' },
      { emoji: '🎯', label: 'func', desc: 'Define function' },
      { emoji: '🔙', label: 'return', desc: 'Return value' },
    ],
  },
  {
    name: 'Operators',
    id: 'operators',
    keys: [
      { emoji: '➕', label: '+', desc: 'Add' },
      { emoji: '➖', label: '-', desc: 'Subtract' },
      { emoji: '✖️', label: '*', desc: 'Multiply' },
      { emoji: '➗', label: '/', desc: 'Divide' },
      { emoji: '🔢', label: '%', desc: 'Modulo' },
      { emoji: '⚖️', label: '==', desc: 'Equals' },
      { emoji: '🚫', label: '!=', desc: 'Not equal' },
      { emoji: '📈', label: '>', desc: 'Greater than' },
      { emoji: '📉', label: '<', desc: 'Less than' },
      { emoji: '🤝', label: '&&', desc: 'And' },
      { emoji: '🔀', label: '||', desc: 'Or' },
      { emoji: '🙅', label: '!', desc: 'Not' },
    ],
  },
  {
    name: 'Values',
    id: 'values',
    keys: [
      { emoji: '✅', label: 'true', desc: 'Boolean true' },
      { emoji: '❌', label: 'false', desc: 'Boolean false' },
      { emoji: '💬', label: '\"', desc: 'String delimiter' },
      { emoji: '📋', label: 'array', desc: 'Array' },
    ],
  },
  {
    name: 'Brackets',
    id: 'brackets',
    keys: [
      { emoji: '🟢', label: '{', desc: 'Block open' },
      { emoji: '🔴', label: '}', desc: 'Block close' },
      { emoji: '👉', label: '(', desc: 'Paren open' },
      { emoji: '👈', label: ')', desc: 'Paren close' },
      { emoji: '🔓', label: '[', desc: 'Index open' },
      { emoji: '🔒', label: ']', desc: 'Index close' },
    ],
  },
  {
    name: 'Numbers',
    id: 'numbers',
    keys: [
      { emoji: '0️⃣', label: '0', desc: 'Zero' },
      { emoji: '1️⃣', label: '1', desc: 'One' },
      { emoji: '2️⃣', label: '2', desc: 'Two' },
      { emoji: '3️⃣', label: '3', desc: 'Three' },
      { emoji: '4️⃣', label: '4', desc: 'Four' },
      { emoji: '5️⃣', label: '5', desc: 'Five' },
      { emoji: '6️⃣', label: '6', desc: 'Six' },
      { emoji: '7️⃣', label: '7', desc: 'Seven' },
      { emoji: '8️⃣', label: '8', desc: 'Eight' },
      { emoji: '9️⃣', label: '9', desc: 'Nine' },
    ],
  },
  {
    name: 'Identifiers',
    id: 'identifiers',
    keys: [
      { emoji: '🅰️', label: 'A', desc: 'Variable A' },
      { emoji: '🅱️', label: 'B', desc: 'Variable B' },
      { emoji: '🅾️', label: 'O', desc: 'Variable O' },
      { emoji: '🟠', label: 'org', desc: 'Variable orange' },
      { emoji: '🟡', label: 'ylw', desc: 'Variable yellow' },
      { emoji: '🔵', label: 'blu', desc: 'Variable blue' },
      { emoji: '🟣', label: 'pur', desc: 'Variable purple' },
      { emoji: '⬛', label: 'blk', desc: 'Variable black' },
      { emoji: '⬜', label: 'wht', desc: 'Variable white' },
      { emoji: '🟤', label: 'brn', desc: 'Variable brown' },
      { emoji: '🌟', label: 'star', desc: 'Variable star' },
      { emoji: '🔶', label: 'dia', desc: 'Variable diamond' },
      { emoji: '🍎', label: 'apple', desc: 'Variable apple' },
      { emoji: '🐱', label: 'cat', desc: 'Variable cat' },
      { emoji: '💎', label: 'gem', desc: 'Variable gem' },
    ],
  },
];

/**
 * Emoji Keyboard class
 */
export class EmojiKeyboard {
  constructor(onInsert) {
    this.onInsert = onInsert;
    this.categoriesEl = document.getElementById('keyboard-categories');
    this.gridEl = document.getElementById('keyboard-grid');
    this.activeCategory = 'declare';

    this._init();
  }

  _init() {
    // Render category tabs
    this._renderCategories();
    // Render initial grid
    this._renderGrid(this.activeCategory);
  }

  _renderCategories() {
    this.categoriesEl.innerHTML = '';
    for (const cat of KEYBOARD_CATEGORIES) {
      const btn = document.createElement('button');
      btn.className = `keyboard__cat-btn${cat.id === this.activeCategory ? ' active' : ''}`;
      btn.textContent = cat.name;
      btn.dataset.catId = cat.id;
      btn.addEventListener('click', () => {
        this.activeCategory = cat.id;
        // Update active states
        this.categoriesEl.querySelectorAll('.keyboard__cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderGrid(cat.id);
      });
      this.categoriesEl.appendChild(btn);
    }
  }

  _renderGrid(categoryId) {
    this.gridEl.innerHTML = '';
    const category = KEYBOARD_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    for (const key of category.keys) {
      const btn = document.createElement('button');
      btn.className = 'keyboard__key';
      btn.title = key.desc;

      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = key.emoji;
      emojiSpan.style.fontSize = '1.5rem';
      btn.appendChild(emojiSpan);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'keyboard__key-label';
      labelSpan.textContent = key.label;
      btn.appendChild(labelSpan);

      btn.addEventListener('click', () => {
        this.onInsert(key.emoji);
      });

      this.gridEl.appendChild(btn);
    }
  }
}
