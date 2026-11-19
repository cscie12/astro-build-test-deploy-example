// Helper functions shared by our test files.
//
// IMPORTANT: These tests check the BUILT site in the "dist" folder,
// not the Astro source code. Run `npm run build` first
// (or just run `npm test`, which builds for you).

import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { HtmlValidate } from 'html-validate';
import { validate as cssValidate } from 'csstree-validator';

// The folder where Astro puts the finished website.
export const DIST = path.join(process.cwd(), 'dist');

// Return a list of every .html file inside "dist".
// Example result: ['index.html', 'tools/index.html']
export function getHtmlFiles() {
  // { recursive: true } means "also look inside sub-folders"
  const allFiles = fs.readdirSync(DIST, { recursive: true });

  const htmlFiles = [];
  for (const file of allFiles) {
    if (file.endsWith('.html')) {
      htmlFiles.push(file);
    }
  }
  return htmlFiles;
}

// Return a list of every .css file inside "dist".
// Astro puts small CSS directly inside <style> tags in the HTML,
// but larger stylesheets become separate files like 'dist/_astro/index.abc123.css'.
// This list may be empty, and that's OK.
export function getCssFiles() {
  const allFiles = fs.readdirSync(DIST, { recursive: true });

  const cssFiles = [];
  for (const file of allFiles) {
    if (file.endsWith('.css')) {
      cssFiles.push(file);
    }
  }
  return cssFiles;
}

// Read one HTML file and turn it into a "document" we can query,
// just like `document` in the browser.
// `file` is a path relative to dist, e.g. 'index.html'
export function loadPage(file) {
  const html = fs.readFileSync(path.join(DIST, file), 'utf-8');
  const document = new JSDOM(html).window.document;
  return { html, document };
}

// Check a string of HTML against the HTML standard.
// Returns a list of problems. An empty list [] means the HTML is valid.
//
// "html-validate:standard" checks that the HTML follows the spec.
// (It does not enforce style preferences like indentation.)
const validator = new HtmlValidate({ extends: ['html-validate:standard'] });

export async function validateHtml(html) {
  const report = await validator.validateString(html);

  // Turn the report into short, readable sentences, e.g.
  // "line 3: <div> is missing required attribute (element-required-attributes)"
  const problems = [];
  for (const result of report.results) {
    for (const msg of result.messages) {
      problems.push(`line ${msg.line}: ${msg.message} (${msg.ruleId})`);
    }
  }
  return problems;
}

// Check a string of CSS against the CSS standard.
// Returns a list of problems. An empty list [] means the CSS is valid.
// `source` is just a label (like a file name) so we know where a problem came from.
//
// Example problems it catches:
//   colr: red;      -> "Unknown property `colr`"
//   margin: 12pz;   -> "Invalid value for `margin` property"
export function validateCss(css, source) {
  const errors = cssValidate(css, source);

  const problems = [];
  for (const error of errors) {
    problems.push(`${source} line ${error.line}: ${error.message}`);
  }
  return problems;
}
