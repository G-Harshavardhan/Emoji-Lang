// ============================================
// EmojiLang Token Viewer
// ============================================
// Renders the token stream as a styled table.

import { getTokenBadgeClass, getTokenTypeName } from '../compiler/lexer.js';

/**
 * Token Viewer class
 */
export class TokenViewer {
  constructor() {
    this.tableBody = document.getElementById('token-table-body');
    this.table = document.getElementById('token-table');
    this.emptyState = document.getElementById('token-empty-state');
  }

  /**
   * Render the token stream
   * @param {Array} tokens - Array of token objects
   */
  render(tokens) {
    this.tableBody.innerHTML = '';

    if (!tokens || tokens.length === 0) {
      this.table.style.display = 'none';
      this.emptyState.style.display = 'flex';
      return;
    }

    this.table.style.display = 'table';
    this.emptyState.style.display = 'none';

    tokens.forEach((token, index) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${index * 20}ms`;

      // Index
      const tdIndex = document.createElement('td');
      tdIndex.textContent = index + 1;
      tdIndex.style.color = 'var(--text-muted)';
      tdIndex.style.fontSize = '0.72rem';
      tr.appendChild(tdIndex);

      // Token emoji display
      const tdEmoji = document.createElement('td');
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'token-emoji';
      emojiSpan.textContent = token.raw || token.value;
      tdEmoji.appendChild(emojiSpan);
      tr.appendChild(tdEmoji);

      // Type badge
      const tdType = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `token-badge ${getTokenBadgeClass(token.type)}`;
      badge.textContent = getTokenTypeName(token.type);
      tdType.appendChild(badge);
      tr.appendChild(tdType);

      // Value
      const tdValue = document.createElement('td');
      tdValue.textContent = typeof token.value === 'string' ? token.value : JSON.stringify(token.value);
      tdValue.style.fontFamily = 'var(--font-mono)';
      tdValue.style.fontSize = '0.75rem';
      tr.appendChild(tdValue);

      // Position
      const tdPos = document.createElement('td');
      tdPos.textContent = `${token.line}:${token.col}`;
      tdPos.style.color = 'var(--text-muted)';
      tdPos.style.fontSize = '0.72rem';
      tr.appendChild(tdPos);

      this.tableBody.appendChild(tr);
    });
  }

  /**
   * Clear the token table
   */
  clear() {
    this.tableBody.innerHTML = '';
    this.table.style.display = 'none';
    this.emptyState.style.display = 'flex';
  }
}
