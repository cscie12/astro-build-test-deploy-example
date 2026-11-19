// Smoke tests: quick checks that the site built correctly.
// If these fail, something is seriously wrong!

import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';
import { DIST, getHtmlFiles, loadPage, validateHtml } from './helpers.js';

describe('index.html', () => {
  // Does the home page exist at all?
  // If the build failed or wrote to the wrong place, this will catch it.
  test('exists', () => {
    const indexPath = path.join(DIST, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  // Is the HTML valid according to the HTML standard?
  // If not, the list of problems is printed in the test output.
  test('is valid HTML', async () => {
    const { html } = loadPage('index.html');
    const problems = await validateHtml(html);
    expect(problems).toEqual([]);
  });

  // Does the page have the main landmark elements?
  // These help screen readers and give the page a clear structure.
  test('has a <header>, <main>, and <footer>', () => {
    const { document } = loadPage('index.html');
    expect(document.querySelector('header')).not.toBeNull();
    expect(document.querySelector('main')).not.toBeNull();
    expect(document.querySelector('footer')).not.toBeNull();
  });
});

describe('all pages', () => {
  // Every page should have a <title> that is not empty.
  test('every page has a title', () => {
    const missing = [];
    for (const file of getHtmlFiles()) {
      const { document } = loadPage(file);
      if (document.title.trim() === '') {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  // No two pages should share the same <title>.
  // Titles show up in browser tabs, bookmarks, and search results,
  // so each page needs its own.
  test('every page has a unique title', () => {
    // Build an object that maps each title to the files that use it, e.g.
    // { 'My Site | Home': ['index.html'], 'My Site | Tools': ['tools/index.html'] }
    const titles = {};
    for (const file of getHtmlFiles()) {
      const { document } = loadPage(file);
      const title = document.title;
      if (titles[title] === undefined) {
        titles[title] = [];
      }
      titles[title].push(file);
    }

    // Any title used by more than one file is a duplicate.
    const duplicates = [];
    for (const title in titles) {
      if (titles[title].length > 1) {
        duplicates.push(`"${title}" is used by: ${titles[title].join(', ')}`);
      }
    }
    expect(duplicates).toEqual([]);
  });
});
