# Repository Guidelines

## Project Overview
A build-less static personal website published via GitHub Pages (`FLT18355.github.io`). It is a personal homepage/portfolio (`index.html`) plus two small browser games (`game-calculator.html`, `game-number-bomb.html`). No backend, no framework, no build step — plain HTML/CSS/JS, fully offline-capable.

## Architecture & Data Flow
- Three independent, single-file pages. Each page embeds its own `<style>` (in `<head>`) and `<script>` (at end of `<body>`); no shared CSS/JS files, no modules, no CDNs.
- `index.html` is the hub: a tabbed (no-router) SPA with two tabs — `首页` (home: avatar, tags, info grid, project links) and `小游戏` (game cards linking to the two game pages). Game pages link back via a `.back` anchor to `index.html`.
- Data flow is purely client-side: user input → `addEventListener` handlers → module-scoped `let` state → DOM updates. No network calls except outbound `<a>` links to github.com profiles.
- Cross-page theming is duplicated, not shared: the Catppuccin Mocha palette is copy-pasted into each `:root` and has already drifted between files (e.g., `game-number-bomb.html` omits several variables present in `index.html`).

## Key Directories
Flat repo — no subdirectories. All source lives at the root:
- `index.html` — homepage / game launcher
- `game-calculator.html` — calculator game
- `game-number-bomb.html` — "数字炸弹" number-guessing game
- `logo.png` — only asset; favicon (all pages) + homepage avatar
- `README.md` — trivial (repo title only); not a source of truth

## Development Commands
No build, test, or lint tooling exists (no `package.json`, no CI).
- Preview locally: run any static server from the repo root, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000/`. Opening `index.html` directly in a browser also works.
- Deploy: push to the default branch; GitHub Pages serves the repo root automatically. No workflow file is required.

## Code Conventions & Common Patterns
- **Markup:** single-file skeleton — `<!DOCTYPE html>` → `<head>` (meta, `<title>`, `<link rel="icon" href="logo.png">`, inline `<style>`) → `<body>` (`.container` → content → inline `<script>`).
- **CSS:** 4-space indent; order is `* {}` reset → `:root` vars → element selectors → component classes. BEM-ish single-class naming (`.game-card`, `.input-row`, `.back`). Palette via Catppuccin Mocha CSS custom properties (`--base #1e1e2e`, `--text #cdd6f4`, `--mauve`, `--blue`, `--peach`, `--green`, `--red`, `--teal`, …). `Inter` is declared but not loaded → resolves to `system-ui`.
- **JS:** vanilla ES2015+ (let/const, arrow funcs, forEach, optional `catch {}`). Globals at script top-level; module-scoped `let` for state, `const` for cached elements. camelCase identifiers. Function declarations (hoisted). **Events: 100% `addEventListener`** (no inline handlers).
- **Script placement:** scripts sit at the end of `<body>` and there is **no `DOMContentLoaded` guard** — moving a `<script>` into `<head>` breaks `getElementById`. Keep scripts at end of body.
- **UI strings:** Chinese labels are inline in HTML/JS.
- **Error handling:** calculator wraps evaluation in `try/catch` → shows `出错`; number-bomb validates with `isNaN` + `alert`. No console logging strategy.
- **New page pattern:** create `game-<name>.html` at root, copy the standard `<head>` + `:root` Mocha block, inline `<style>`/`<script>`, include `.back` → `index.html`, and add a `.game-card` entry inside `.game-list` in `index.html`. Keep everything self-contained and offline.

## Important Files
- `index.html` — entry/landing page and game launcher; tab-switching logic lives in its inline `<script>` (`querySelectorAll('.tab')` + `data-page`).
- `game-calculator.html` — expression evaluator via `Function('"use strict"; return (' + expr + ')')()`. Input is constrained to button/keyboard tokens (safe today), but **any added free-text input becomes a code-injection vector** — do not relax the token constraint.
- `game-number-bomb.html` — game state in `target/low/high/attempts/gameOver`; mixes class-toggle (`.game-area.active`) and inline `style.display` for show/hide — easy to break, edit with care.
- `logo.png` — the only shared binary asset.

## Runtime/Tooling Preferences
- **No runtime required to build or deploy.** Pure static HTML/CSS/JS; GitHub Pages serves it as-is.
- Not Jekyll-dependent: pages contain no front matter/includes. (A `.nojekyll` is unnecessary today but harmless if raw passthrough is ever wanted.)
- Editor: footer text notes "built from termux"; no enforced formatter/linter. Match existing 4-space indentation and inline-style conventions.
- Prefer no new external dependencies. Keep pages offline-capable.

## Testing & QA
- **No automated tests, CI, or linters exist.** Nothing currently enforces correctness.
- Verification is manual:
  1. Serve locally (`python3 -m http.server 8000`) or open the file.
  2. Click through every interactive control; for the calculator verify arithmetic, parentheses, `x²/√/%/1/x`, `+/−`, `xʸ`, `⌫`, `C`, `=`, and keyboard input.
  3. Open DevTools console per page and confirm zero JS errors/warnings.
  4. Confirm `logo.png` and all asset paths resolve.
- If you add a new page, register it in `index.html`'s `.game-list` and confirm the back-link works.

## Known Fragile Spots (read before editing)
- **Theme drift:** the Mocha palette is duplicated per file and already diverges; a class referencing a variable missing in one file silently falls back. Edit colors in all three files.
- **Dead code:** `game-calculator.html` has an unreachable `if (key === 'CE')` branch (no `CE` button exists). Safe to delete or wire up.
- **Unicode operator care:** the calculator uses `−` (U+2212), `×`, `÷` glyphs and maps them to JS `- * /`; do not naively replace glyphs.
- **Eval constraint:** keep calculator input token-constrained; never feed raw user text into the `Function` evaluator.
- **Script position:** keep inline `<script>` at end of `<body>` (no `DOMContentLoaded`).
