#!/usr/bin/env node

/**
 * AIQualityHQ CLI Linter — Zero-Dependency Sub-10ms Prompt Quality & Security Checker
 * Usage: node scripts/cli.mjs check <path-to-prompt-file>
 */

import fs from 'fs';
import path from 'path';

// Minimal standalone engine rules evaluator for Node CLI
function evaluatePromptCLI(prompt) {
  let score = 100;
  const issues = [];
  const piiDetected = [];

  // PII Checks
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(prompt)) {
    score -= 15;
    issues.push('[CRITICAL] Hardcoded email address detected.');
    piiDetected.push('Email');
  }
  if (/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(prompt)) {
    score -= 15;
    issues.push('[CRITICAL] Hardcoded phone number detected.');
    piiDetected.push('Phone');
  }
  if (/(?:sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_\-]{33}|(?:api[-_]?key|secret[-_]?key)\s*[:=]\s*["']?[a-zA-Z0-9_\-\.]{16,}["']?)/i.test(prompt)) {
    score -= 35;
    issues.push('[CRITICAL] Potential hardcoded API secret key detected!');
    piiDetected.push('API Secret');
  }

  // Length check
  if (prompt.length < 30) {
    score -= 20;
    issues.push('[MAJOR] Prompt is too short (<30 chars). Lacks instructions and context.');
  }

  // Role definition
  if (!/(?:you are|act as|role:|persona:|expert|engineer|assistant)/i.test(prompt)) {
    score -= 10;
    issues.push('[MINOR] Missing explicit role or system persona definition.');
  }

  // Delimiters
  if (!/(```|<[a-zA-Z0-9_-]+>|\{\{.*?\}\}|\[.*?\])/.test(prompt)) {
    score -= 10;
    issues.push('[MINOR] No data boundaries or XML tags (``` or <context>) enclosing input text.');
  }

  // Injection defense
  if (!/(?:ignore|do not bypass|system prompt|confidential|rules)/i.test(prompt)) {
    score -= 10;
    issues.push('[MINOR] No injection defense or system instruction boundaries specified.');
  }

  const finalScore = Math.max(0, score);
  const passed = finalScore >= 60;

  return {
    score: finalScore,
    passed,
    issues,
    piiDetected,
    length: prompt.length
  };
}

const args = process.argv.slice(2);
const command = args[0];
const targetFile = args[1];

if (!command || command === '--help' || command === '-h') {
  console.log(`
\x1b[1m\x1b[36mAIQualityHQ Prompt Quality & Security CLI Linter\x1b[0m
\x1b[90mDeterministic Sub-10ms Browser & CI/CD Prompt Audit\x1b[0m

Usage:
  npx @aiqualityhq/cli check <file-path>

Examples:
  node scripts/cli.mjs check ./prompts/system-prompt.txt
  node scripts/cli.mjs check ./src/prompts/user_onboarding.md
`);
  process.exit(0);
}

if (command === 'check') {
  if (!targetFile) {
    console.error('\x1b[31mError: Please specify a prompt file path to check.\x1b[0m');
    process.exit(1);
  }

  const absolutePath = path.resolve(targetFile);

  if (!fs.existsSync(absolutePath)) {
    console.error(`\x1b[31mError: File not found at ${absolutePath}\x1b[0m`);
    process.exit(1);
  }

  const promptContent = fs.readFileSync(absolutePath, 'utf8');
  const startTime = performance.now();
  const res = evaluatePromptCLI(promptContent);
  const duration = (performance.now() - startTime).toFixed(2);

  console.log(`\n\x1b[1mAIQualityHQ Audit Results\x1b[0m — \x1b[90m${path.basename(absolutePath)}\x1b[0m`);
  console.log(`--------------------------------------------------`);
  console.log(`Status: ${res.passed ? '\x1b[32m✔ PASSED\x1b[0m' : '\x1b[31m✖ FLAGGED\x1b[0m'}`);
  console.log(`Score:  \x1b[1m${res.score}/100\x1b[0m (evaluated in ${duration}ms)`);
  console.log(`Length: ${res.length} chars`);
  
  if (res.piiDetected.length > 0) {
    console.log(`PII:    \x1b[33m⚠ Detected ${res.piiDetected.join(', ')}\x1b[0m`);
  } else {
    console.log(`PII:    \x1b[32m✔ Zero sensitive data found\x1b[0m`);
  }

  if (res.issues.length > 0) {
    console.log(`\n\x1b[1mActionable Issues Found (${res.issues.length}):\x1b[0m`);
    res.issues.forEach(iss => console.log(`  • ${iss}`));
  } else {
    console.log(`\n\x1b[32m✔ Prompt meets production quality standards.\x1b[0m`);
  }

  console.log(`--------------------------------------------------\n`);

  if (!res.passed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} else {
  console.error(`Unknown command: ${command}. Use 'check <file>'`);
  process.exit(1);
}
