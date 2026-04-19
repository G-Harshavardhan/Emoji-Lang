
import { lex } from './js/compiler/lexer.js';
import { Parser } from './js/compiler/parser.js';
import { SemanticAnalyzer } from './js/compiler/semantic.js';
import { optimize } from './js/compiler/optimizer.js';
import { CodeGenerator } from './js/compiler/codegen.js';

const testCases = [
  {
    name: 'Fibonacci (Success)',
    code: `🎯🌟👉🅰️👈🟢
  🤔👉🅰️ 📉 2️⃣👈🟢
    🔙 🅰️ ⏹️
  🔴
  🔙 🌟👉🅰️ ➖ 1️⃣👈 ➕ 🌟👉🅰️ ➖ 2️⃣👈 ⏹️
🔴
📢👉💬Fibonacci of 6 is:💬👈⏹️
📢👉🌟👉6️⃣👈👈⏹️`
  },
  {
    name: 'Lexical Error (Invalid Char)',
    code: `📦🅰️ ➡️ 5️⃣ $ ⏹️`
  },
  {
    name: 'Syntax Error (Missing Closure)',
    code: `🤔👉✅👈🟢
  📢👉💬Hi💬👈⏹️`
  },
  {
    name: 'Semantic Error (Undeclared Var)',
    code: `📢👉🅱️👈⏹️`
  }
];

function runTest(test) {
  console.log(`\n=== Testing: ${test.name} ===`);
  const { tokens, errors: lexErrors } = lex(test.code);
  if (lexErrors.length > 0) {
    console.log('Lex Errors:', lexErrors);
  }

  const parser = new Parser(tokens);
  const ast = parser.parse();
  if (parser.errors.length > 0) {
    console.log('Parser Errors:', parser.errors);
  }

  const semantic = new SemanticAnalyzer();
  const { errors: semErrors } = semantic.analyze(ast);
  if (semErrors.length > 0) {
    console.log('Semantic Errors:', semErrors);
  }

  if (lexErrors.length === 0 && parser.errors.length === 0 && semErrors.length === 0) {
    const { optimizedAst } = optimize(ast);
    const codegen = new CodeGenerator();
    const js = codegen.generate(optimizedAst);
    console.log('✅ Success! Generated JS snippet length:', js.length);
  } else {
    console.log('❌ Failed as expected (or unexpectedly)');
  }
}

testCases.forEach(runTest);
