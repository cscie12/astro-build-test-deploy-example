# Astro: Build → Test → Deploy

An example from [CSCI E-12](https://cs12.net/) at Harvard Extension School.

## What is the point of this repo?

The website itself is tiny on purpose: two pages and a shared layout.
**The interesting part is everything around the website:**

1. **Build.** Astro turns the source files in `src/` into plain HTML and CSS in `dist/`.
2. **Test.** Automated tests check the built files in `dist/` for common mistakes.
3. **Deploy.** GitHub Actions does steps 1 and 2 automatically on every push, and if everything passes, copies `dist/` to the web server.

The key idea: **if a test fails, the site does not deploy.** Broken code never reaches the live site.

```text
  src/  ──(npm run build)──▶  dist/  ──(npm test)──▶  ✅ pass ──(GitHub Actions)──▶  web server
                                                     ❌ fail ──▶ stop, nothing deployed
```

## Quick start

You need [Node.js](https://nodejs.org/) installed (see `"engines"` in `package.json` for the version).

```sh
npm install        # download the packages listed in package.json
npm run dev        # start a local server at http://localhost:4321 (auto-reloads as you edit)
npm run build      # build the finished site into dist/
npm run preview    # serve dist/ locally, so you can see exactly what will be deployed
npm test           # build the site, then run the tests
```

## Where to look

Start with the files marked ⭐.

| Path | What it is |
| :--- | :--- |
| ⭐ `src/pages/` | **Pages.** Each `.astro` file becomes a page: `index.astro` → `/`, `tools.astro` → `/tools/`. |
| ⭐ `src/layouts/Layout.astro` | **Shared layout.** The `<head>`, `<header>`, `<footer>` and styles used by every page. Pages put their content inside it with `<Layout pageTitle="...">`. |
| `public/` | Files copied into `dist/` as-is (for example, the favicon). |
| `dist/` | **Build output.** It's created by `npm run build` and is what actually gets deployed. Git ignores it, so it's not in the repo. |
| ⭐ `tests/` | **Vitest tests** that check the built site. See [The tests](#the-tests) below. |
| `vitest.config.js` | Tells Vitest where the tests are. |
| ⭐ `.github/workflows/deploy.yml` | **The GitHub Action** that builds, tests and deploys. Read the comments, which explain each step. |
| `package.json` | The project's dependencies and the `npm run ...` scripts. |
| `astro.config.mjs` | Astro settings (empty for now; the defaults are fine). |
| `tsconfig.json` | Editor/TypeScript settings. It defines the `@/` shortcut, so `@/layouts/Layout.astro` means `src/layouts/Layout.astro`. |

## The tests

The tests check the **built HTML in `dist/`**, not the `.astro` source files.
That makes them *generic*: they would work on almost any static website, no matter how it was built.

`npm test` runs `astro build` first, so the tests always check a fresh build.

| File | What it checks |
| :--- | :--- |
| `tests/smoke.test.js` | Quick "is anything badly broken?" checks: `index.html` exists, is valid HTML, and has a `<header>`, `<main>` and `<footer>`. It also checks that every page has a non-empty title and that no two pages share one. |
| `tests/all-pages.test.js` | Runs on **every** page: has `<html lang>`, charset and viewport `<meta>` tags, exactly one `<h1>`, header/main/footer, **valid HTML**, **valid CSS**, and internal links that point to files that really exist. |
| `tests/helpers.js` | Small helper functions the tests share: find all `.html`/`.css` files, load a page as a `document`, and validate HTML and CSS. |

Tools used:
- [Vitest](https://vitest.dev/) runs the tests.
- [jsdom](https://github.com/jsdom/jsdom) lets the tests use `document.querySelector(...)`, just like in the browser.
- [html-validate](https://html-validate.org/) checks HTML against the HTML standard.
- [csstree-validator](https://github.com/csstree/validator) checks CSS against the CSS standard.

### Reading a test failure

The tests collect problems into a list and expect the list to be empty.
When a test fails, Vitest prints exactly what went wrong, for example:

```text
+ "\"Astro Build, Test, Deploy | Home\" is used by: index.html, tools/index.html"
+ "index.html <style> line 1: Unknown property `colr`"
```

## The GitHub Action (deploy)

The workflow in `.github/workflows/deploy.yml` runs on GitHub's computers:

| When... | It does... |
| :--- | :--- |
| you push to `main` | install → build → test → **deploy** |
| someone opens a pull request | install → build → test (**no** deploy) |
| you click "Run workflow" on the **Actions** tab | the same as a push to `main` |

Every step is a command you can also run yourself in the terminal (`npm ci`, `npm run build`, `npm test`).
If any step fails, the steps after it are skipped, so a failing test stops the deploy.

To see your runs, open the **Actions** tab of the repo on GitHub. Click a run to see the output of each step.

**Deploying** uses `rsync` over SSH to copy the contents of `dist/` to the web server.
The server address, username, path and SSH key are **secrets**, not stored in the code.
They are set in the repo under **Settings → Secrets and variables → Actions**:
`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `SSH_PRIVATE_KEY`.

> **Coming later:** end-to-end tests with [Cypress](https://www.cypress.io/), which click through the site in a real browser.
> Cypress is already in `package.json`, and the workflow has a commented-out step ready for it.

## Try it yourself

The best way to understand the tests is to break something on purpose and watch them fail.
Run `npm test` after each change, then undo it.

1. In `src/pages/tools.astro`, change `pageTitle` to `"Home"`. The **unique title** test fails.
2. In `src/layouts/Layout.astro`, delete the `<footer>...</footer>` line. The **header/main/footer** tests fail.
3. In `src/pages/index.astro`, add `<a href="/nope">broken</a>`. The **internal links** test fails.
4. In the `<style>` block of `Layout.astro`, misspell `color` as `colr`. The **valid CSS** test fails.
5. In `src/pages/index.astro`, add a second `<h1>`. The **exactly one `<h1>`** test fails.

Then try it on GitHub: push a change that fails a test, and look at the **Actions** tab.
The deploy step is skipped and the live site does not change.

## Learn more

- [Astro docs](https://docs.astro.build/)
- [Vitest docs](https://vitest.dev/guide/)
- [GitHub Actions docs](https://docs.github.com/en/actions)
