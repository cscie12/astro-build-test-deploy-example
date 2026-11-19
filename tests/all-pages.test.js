// Generic checks that run on EVERY page the site generates.
// These tests would work for almost any static website.

import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';
import {
  DIST,
  getHtmlFiles,
  getCssFiles,
  loadPage,
  validateHtml,
  validateCss,
} from './helpers.js';

// Loop over every HTML file and create a group of tests for each one.
// In the test output you will see one group per page, e.g. "index.html".
for (const file of getHtmlFiles()) {
  describe(file, () => {
    // <html lang="en"> tells browsers and screen readers what language the page is in.
    test('has a lang attribute on <html>', () => {
      const { document } = loadPage(file);
      const lang = document.documentElement.getAttribute('lang');
      expect(lang).toBeTruthy(); // not missing, not empty
    });

    // <meta charset> makes sure characters display correctly.
    // <meta name="viewport"> makes the page work on phones.
    test('has charset and viewport meta tags', () => {
      const { document } = loadPage(file);
      expect(document.querySelector('meta[charset]')).not.toBeNull();
      expect(document.querySelector('meta[name="viewport"]')).not.toBeNull();
    });

    // Each page should have exactly one main heading.
    test('has exactly one <h1>', () => {
      const { document } = loadPage(file);
      const h1s = document.querySelectorAll('h1');
      expect(h1s.length).toBe(1);
    });

    test('has a <header>, <main>, and <footer>', () => {
      const { document } = loadPage(file);
      expect(document.querySelector('header')).not.toBeNull();
      expect(document.querySelector('main')).not.toBeNull();
      expect(document.querySelector('footer')).not.toBeNull();
    });

    test('is valid HTML', async () => {
      const { html } = loadPage(file);
      const problems = await validateHtml(html);
      expect(problems).toEqual([]);
    });

    // Is the CSS inside each <style> tag valid?
    // (The HTML validator does NOT check CSS, so we need a separate check.)
    // Note: line numbers count from the start of each <style> tag, not the HTML file.
    test('has valid CSS in <style> tags', () => {
      const { document } = loadPage(file);

      const problems = [];
      for (const styleTag of document.querySelectorAll('style')) {
        const css = styleTag.textContent;
        for (const problem of validateCss(css, `${file} <style>`)) {
          problems.push(problem);
        }
      }
      expect(problems).toEqual([]);
    });

    // Every link to another page or file on THIS site should point to
    // something that actually exists in "dist".
    //
    // To keep things simple, we only check "root-relative" URLs that start
    // with a single "/" (like "/tools/" or "/favicon.svg").
    // We skip:
    //   - external links like "https://example.com" (they need the internet)
    //   - protocol-relative links like "//example.com"
    //   - relative links like "page.html" (they need extra path math)
    test('internal links point to real files', () => {
      const { document } = loadPage(file);

      // Gather every URL from links, stylesheets/icons, images, and scripts.
      const urls = [];
      for (const el of document.querySelectorAll('a[href], link[href]')) {
        urls.push(el.getAttribute('href'));
      }
      for (const el of document.querySelectorAll('img[src], script[src]')) {
        urls.push(el.getAttribute('src'));
      }

      const broken = [];
      for (const url of urls) {
        // Skip anything that doesn't start with exactly one "/"
        if (!url.startsWith('/') || url.startsWith('//')) {
          continue;
        }

        // Remove "#section" and "?query=..." from the end of the URL
        let cleanUrl = url.split('#')[0].split('?')[0];

        // Work out which file in "dist" this URL should load.
        //   "/"             -> dist/index.html
        //   "/tools/"       -> dist/tools/index.html
        //   "/tools"        -> dist/tools/index.html
        //   "/favicon.svg"  -> dist/favicon.svg
        if (cleanUrl.endsWith('/')) {
          cleanUrl = cleanUrl + 'index.html';
        } else if (path.extname(cleanUrl) === '') {
          cleanUrl = cleanUrl + '/index.html';
        }
        const filePath = path.join(DIST, cleanUrl);

        if (!fs.existsSync(filePath)) {
          broken.push(url);
        }
      }
      expect(broken).toEqual([]);
    });
  });
}

// Check every separate .css file the build produced.
// If the site has no .css files (all CSS is inside <style> tags),
// this test simply finds nothing to check and passes.
describe('CSS files', () => {
  test('every .css file is valid CSS', () => {
    const problems = [];
    for (const file of getCssFiles()) {
      const css = fs.readFileSync(path.join(DIST, file), 'utf-8');
      for (const problem of validateCss(css, file)) {
        problems.push(problem);
      }
    }
    expect(problems).toEqual([]);
  });
});
