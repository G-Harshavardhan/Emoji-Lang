# 🧬 EmojiLang: An Emoji-Only Programming Language Compiler & IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Academic](https://img.shields.io/badge/Status-Academic-orange.svg)](#)

**EmojiLang** is a complete browser-based development environment and compiler for a programming language where every keyword, operator, and literal is an emoji. This project implements a full, modular compiler pipeline from lexical analysis to sandboxed execution, demonstrating deep compiler theory integrated into a modern web application.

## 🚀 Overview

The primary goal of EmojiLang is to explore compiler architecture through the unique challenge of parsing Unicode emojis. The IDE provides a real-time visualization of the compiler's internal state, including the token stream, Abstract Syntax Tree (AST), optimized AST, and the generated target code.

---

## 🏗️ Interior Architecture

The compiler is built using a classic 6-stage pipeline architecture, ensuring modularity and extensibility.

### 1. Lexical Analysis (`lexer.js`)
*   **Tokenization**: Splits raw source code into typed tokens.
*   **Normalization**: Implements a custom normalization layer to handle **Unicode Variation Selector 16 (VS16)**, ensuring consistent parsing across different operating systems.
*   **Keycap Parsing**: Dynamically reconstructs numbers from Unicode keycap sequences (e.g., `1️⃣`, `2️⃣`).

### 2. Syntax Analysis (`parser.js`)
*   **Grammar**: Uses a context-free grammar parsed via a **Recursive Descent** strategy.
*   **Precedence Climbing**: Implements an algorithm to correctly handle operator precedence for arithmetic (Multiplication/Division over Addition/Subtraction) and logical operations.
*   **AST Construction**: Builds a detailed tree representation of the program's logical structure.

### 3. Semantic Analysis (`semantic.js`)
*   **Symbol Tables**: Manages lexical scoping through a linked-list of scope objects.
*   **Type Validation**: Performs static type checking (e.g., preventing invalid operations on mixed types).
*   **Error Detection**: Catch-all for "logic" errors like **Undeclared Variables**, **Division by Zero**, or returns outside of a function.

### 4. Optimization Pass (`optimizer.js`)
*   **Constant Folding**: Pre-calculates constant expressions at compile-time (e.g., `1 + 2 * 3` ➔ `7`).
*   **Dead Code Elimination**: Automatically removes unreachable code branches and statements following return calls.

### 5. Code Generation (`codegen.js`)
*   **Transpilation**: Converts the optimized AST into ECMAScript-compliant JavaScript.
*   **Identifier Sanitization**: Deterministically transforms emoji identifiers into safe, alphanumeric JS variable names for cross-browser compatibility.

### 6. Execution Runtime (`executor.js`)
*   **Sandboxed Environment**: Runs the generated code in a controlled context using the `Function` constructor.
*   **Loop Protection**: Injects timing guards into every loop to detect and terminate infinite loops, preventing browser crashes.

---

## 📜 Language Grammar

### Keywords
- `📦` : Variable Declaration
- `📢` : Output (Print)
- `📥` : Input (Prompt)
- `🤔` : Conditional (If)
- `😤` : Alternative (Else)
- `🔄` : Iteration (While Loop)
- `🎯` : Function Definition
- `🔙` : Function Return
- `⏹️` : Statement Terminator

### Operators
- `➕` `➖` `✖️` `➗` : Arithmetic
- `📈` `📉` `⚖️` `🚫` : Comparisons (>, <, ==, !=)
- `🤝` `🔀` `🙅` : Logical (AND, OR, NOT)
- `➡️` : Assignment

### Literals
- **Numbers**: `0️⃣` to `9️⃣` (supports decimals using `⏺️`)
- **Strings**: `💬 Hello World 💬`
- **Booleans**: `✅` (True), `❌` (False)
- **Arrays**: `📋🔓 item1 🔹 item2 🔒`

---

## 🛠️ Installation & Setup

Please refer to the **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed, step-by-step instructions on running this project locally.

## 🎓 Academic Context

This project was developed as a study of compiler design. It demonstrates mastery of:
- Context-Free Grammars (CFG)
- Abstract Syntax Tree (AST) Visualization
- Lexical Scope and Symbol Management
- Compiler Optimization Strategies
- Transpiler Architecture