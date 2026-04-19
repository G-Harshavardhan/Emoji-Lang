// ============================================
// EmojiLang AST Visualizer
// ============================================
// Renders the AST as an interactive tree on HTML5 Canvas.

import { NodeType } from '../compiler/parser.js';

// Color scheme for node types
const NODE_COLORS = {
  [NodeType.PROGRAM]:          { bg: '#6C5CE7', text: '#ffffff' },
  [NodeType.VAR_DECLARATION]:  { bg: '#A29BFE', text: '#ffffff' },
  [NodeType.ASSIGNMENT]:       { bg: '#A29BFE', text: '#ffffff' },
  [NodeType.PRINT]:            { bg: '#00B894', text: '#ffffff' },
  [NodeType.INPUT]:            { bg: '#00CEC9', text: '#ffffff' },
  [NodeType.IF_STATEMENT]:     { bg: '#FD79A8', text: '#ffffff' },
  [NodeType.WHILE_LOOP]:       { bg: '#E17055', text: '#ffffff' },
  [NodeType.FOR_LOOP]:         { bg: '#E17055', text: '#ffffff' },
  [NodeType.FUNC_DECLARATION]: { bg: '#FDCB6E', text: '#2d3436' },
  [NodeType.FUNC_CALL]:        { bg: '#FFEAA7', text: '#2d3436' },
  [NodeType.RETURN]:           { bg: '#DFE6E9', text: '#2d3436' },
  [NodeType.BLOCK]:            { bg: '#636E72', text: '#ffffff' },
  [NodeType.BINARY_EXPR]:      { bg: '#FF7675', text: '#ffffff' },
  [NodeType.UNARY_EXPR]:       { bg: '#FF7675', text: '#ffffff' },
  [NodeType.NUMBER_LITERAL]:   { bg: '#55EFC4', text: '#2d3436' },
  [NodeType.STRING_LITERAL]:   { bg: '#81ECEC', text: '#2d3436' },
  [NodeType.BOOL_LITERAL]:     { bg: '#74B9FF', text: '#ffffff' },
  [NodeType.IDENTIFIER]:       { bg: '#0984E3', text: '#ffffff' },
  [NodeType.ARRAY_LITERAL]:    { bg: '#6C5CE7', text: '#ffffff' },
  [NodeType.INDEX_ACCESS]:     { bg: '#A29BFE', text: '#ffffff' },
};

const DEFAULT_COLOR = { bg: '#636E72', text: '#ffffff' };

/**
 * AST Visualizer class
 */
export class ASTVisualizer {
  constructor() {
    this.canvas = document.getElementById('ast-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById('ast-container');
    this.emptyState = document.getElementById('ast-empty-state');

    this.nodeWidth = 130;
    this.nodeHeight = 46;
    this.horizontalGap = 20;
    this.verticalGap = 60;
    this.padding = 40;

    // Pan/zoom state
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this._initInteraction();
  }

  _initInteraction() {
    // Mouse drag to pan
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this._redraw();
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    // Mouse wheel to zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale = Math.max(0.2, Math.min(3, this.scale * delta));
      this._redraw();
    });
  }

  /**
   * Render the AST tree
   */
  render(ast) {
    if (!ast) {
      this.container.style.display = 'none';
      this.emptyState.style.display = 'flex';
      return;
    }

    this.container.style.display = 'block';
    this.emptyState.style.display = 'none';

    // Resize canvas to fill container
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.displayWidth = rect.width;
    this.displayHeight = rect.height;

    // Layout the tree
    this.treeData = this._buildTreeData(ast);
    this._layoutTree(this.treeData);

    // Center the tree
    if (this.treeData) {
      this.scale = Math.min(1, Math.min(
        this.displayWidth / (this.treeData._totalWidth + this.padding * 2),
        this.displayHeight / ((this._getMaxDepth(this.treeData) + 1) * (this.nodeHeight + this.verticalGap) + this.padding * 2)
      ));
      this.offsetX = (this.displayWidth - this.treeData._totalWidth * this.scale) / 2;
      this.offsetY = 20;
    }

    this._redraw();
    this.canvas.style.cursor = 'grab';
  }

  /**
   * Get maximum depth of the tree
   */
  _getMaxDepth(node) {
    if (!node || node.children.length === 0) return 0;
    let max = 0;
    for (const child of node.children) {
      max = Math.max(max, this._getMaxDepth(child) + 1);
    }
    return max;
  }

  /**
   * Build a simplified tree structure for rendering
   */
  _buildTreeData(node) {
    if (!node || typeof node !== 'object') return null;

    const label = this._getNodeLabel(node);
    const color = NODE_COLORS[node.type] || DEFAULT_COLOR;

    const treeNode = {
      label,
      type: node.type,
      color,
      children: [],
    };

    // Collect child nodes based on type
    const childFields = this._getChildFields(node);
    for (const field of childFields) {
      const val = node[field];
      if (Array.isArray(val)) {
        for (const child of val) {
          const childTree = this._buildTreeData(child);
          if (childTree) treeNode.children.push(childTree);
        }
      } else if (typeof val === 'object' && val !== null && val.type) {
        const childTree = this._buildTreeData(val);
        if (childTree) treeNode.children.push(childTree);
      }
    }

    return treeNode;
  }

  /**
   * Get displayable label for a node
   */
  _getNodeLabel(node) {
    switch (node.type) {
      case NodeType.PROGRAM: return '📄 Program';
      case NodeType.VAR_DECLARATION: return `📦 ${this._shortName(node.name)}`;
      case NodeType.ASSIGNMENT: return '➡️ Assign';
      case NodeType.PRINT: return '📢 Print';
      case NodeType.INPUT: return '📥 Input';
      case NodeType.IF_STATEMENT: return '🤔 If';
      case NodeType.WHILE_LOOP: return '🔄 While';
      case NodeType.FOR_LOOP: return '🔁 For';
      case NodeType.FUNC_DECLARATION: return `🎯 ${this._shortName(node.name)}`;
      case NodeType.FUNC_CALL: return `📞 ${this._shortName(node.callee)}`;
      case NodeType.RETURN: return '🔙 Return';
      case NodeType.BLOCK: return '{ Block }';
      case NodeType.BINARY_EXPR: return `${node.op}`;
      case NodeType.UNARY_EXPR: return `${node.op}`;
      case NodeType.NUMBER_LITERAL: return `🔢 ${node.value}`;
      case NodeType.STRING_LITERAL: return `💬 "${this._truncate(node.value, 8)}"`;
      case NodeType.BOOL_LITERAL: return node.value ? '✅ true' : '❌ false';
      case NodeType.IDENTIFIER: return `📎 ${this._shortName(node.name)}`;
      case NodeType.ARRAY_LITERAL: return '📋 Array';
      case NodeType.INDEX_ACCESS: return '🔓 Index';
      default: return node.type || '?';
    }
  }

  _shortName(name) {
    if (!name) return '?';
    // If it's an emoji identifier, return it directly (first few chars)
    if (name.length > 6) return name.substring(0, 6) + '…';
    return name;
  }

  _truncate(str, maxLen) {
    if (!str) return '';
    if (str.length > maxLen) return str.substring(0, maxLen) + '…';
    return str;
  }

  /**
   * Get child fields to traverse for a node type
   */
  _getChildFields(node) {
    switch (node.type) {
      case NodeType.PROGRAM: return ['body'];
      case NodeType.VAR_DECLARATION: return ['init'];
      case NodeType.ASSIGNMENT: return ['target', 'value'];
      case NodeType.PRINT: return ['arg'];
      case NodeType.INPUT: return ['prompt'];
      case NodeType.IF_STATEMENT: return ['condition', 'consequent', 'alternate'];
      case NodeType.WHILE_LOOP: return ['condition', 'body'];
      case NodeType.FOR_LOOP: return ['init', 'condition', 'update', 'body'];
      case NodeType.FUNC_DECLARATION: return ['body'];
      case NodeType.FUNC_CALL: return ['args'];
      case NodeType.RETURN: return ['value'];
      case NodeType.BLOCK: return ['body'];
      case NodeType.BINARY_EXPR: return ['left', 'right'];
      case NodeType.UNARY_EXPR: return ['operand'];
      case NodeType.ARRAY_LITERAL: return ['elements'];
      case NodeType.INDEX_ACCESS: return ['object', 'index'];
      default: return [];
    }
  }

  /**
   * Layout tree positions using a simple algorithm
   */
  _layoutTree(treeNode, depth = 0) {
    if (!treeNode) return 0;

    treeNode._depth = depth;

    if (treeNode.children.length === 0) {
      treeNode._width = this.nodeWidth;
      treeNode._totalWidth = this.nodeWidth;
      treeNode._x = 0;
      treeNode._y = depth * (this.nodeHeight + this.verticalGap);
      return this.nodeWidth;
    }

    // Layout children first
    let totalChildWidth = 0;
    for (const child of treeNode.children) {
      const childWidth = this._layoutTree(child, depth + 1);
      totalChildWidth += childWidth + this.horizontalGap;
    }
    totalChildWidth -= this.horizontalGap; // Remove last gap

    // Position children side by side
    let currentX = 0;
    for (const child of treeNode.children) {
      this._shiftSubtree(child, currentX);
      currentX += child._totalWidth + this.horizontalGap;
    }

    // Center this node above its children
    const firstChild = treeNode.children[0];
    const lastChild = treeNode.children[treeNode.children.length - 1];
    treeNode._x = (firstChild._x + lastChild._x + this.nodeWidth) / 2 - this.nodeWidth / 2;
    treeNode._y = depth * (this.nodeHeight + this.verticalGap);
    treeNode._totalWidth = Math.max(totalChildWidth, this.nodeWidth);

    return treeNode._totalWidth;
  }

  _shiftSubtree(node, dx) {
    node._x += dx;
    for (const child of node.children) {
      this._shiftSubtree(child, dx);
    }
  }

  /**
   * Redraw the canvas
   */
  _redraw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    // Clear
    ctx.fillStyle = 'hsl(225, 22%, 12%)';
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    if (!this.treeData) {
      ctx.restore();
      return;
    }

    // Apply transform
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Draw edges first, then nodes
    this._drawEdges(ctx, this.treeData);
    this._drawNodes(ctx, this.treeData);

    ctx.restore();
  }

  /**
   * Draw connection lines
   */
  _drawEdges(ctx, node) {
    if (!node) return;

    const cx = node._x + this.nodeWidth / 2;
    const cy = node._y + this.nodeHeight;

    for (const child of node.children) {
      const childCx = child._x + this.nodeWidth / 2;
      const childCy = child._y;

      ctx.beginPath();
      ctx.moveTo(cx, cy);

      // Bezier curve for smooth edges
      const midY = (cy + childCy) / 2;
      ctx.bezierCurveTo(cx, midY, childCx, midY, childCx, childCy);

      ctx.strokeStyle = 'hsla(225, 20%, 50%, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      this._drawEdges(ctx, child);
    }
  }

  /**
   * Draw tree nodes
   */
  _drawNodes(ctx, node) {
    if (!node) return;

    const x = node._x;
    const y = node._y;
    const w = this.nodeWidth;
    const h = this.nodeHeight;
    const r = 8;

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = node.color.bg;
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    // Draw label
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = node.color.text;
    ctx.font = '12px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = node.label;
    const maxWidth = w - 12;
    let displayLabel = label;
    if (ctx.measureText(label).width > maxWidth) {
      while (ctx.measureText(displayLabel + '…').width > maxWidth && displayLabel.length > 1) {
        displayLabel = displayLabel.slice(0, -1);
      }
      displayLabel += '…';
    }

    ctx.fillText(displayLabel, x + w / 2, y + h / 2);

    // Recurse children
    for (const child of node.children) {
      this._drawNodes(ctx, child);
    }
  }

  /**
   * Clear the visualization
   */
  clear() {
    this.container.style.display = 'none';
    this.emptyState.style.display = 'flex';
    this.treeData = null;
  }
}
