# Development Guide

## Prerequisites

- Node.js >= 18
- npm >= 9
- VS Code (to run the Extension Development Host)

## Getting started

```bash
git clone https://github.com/w-osilva/ai-commit-pr-generator
cd ai-commit-pr-generator
npm install
npm run compile
```

Press `F5` in VS Code to open an Extension Development Host with the extension loaded.

---

## Project structure

```
src/
  extension.ts              # Entry point — activate(), registers both commands
  git/
    gitProvider.ts          # Wraps vscode.git API
                            # getStagedDiff, getStructuredCommitHistory,
                            # getCurrentBranch, getRepository
  ai/
    openRouterClient.ts     # HTTP client for OpenRouter (native fetch, no dependencies)
    promptBuilder.ts        # Builds prompts for commit and PR; parses responses
  utils/
    templateReader.ts       # Finds PR template in workspace
  webview/
    prPanel.ts              # WebviewPanel — editable title/body + copy buttons
scripts/
  release.sh                # Version bump + vsix + GitHub Release + optional Marketplace publish
dist/
  extension.js              # Webpack bundle (generated, not committed)
```

---

## Commands

| npm script | What it does |
|---|---|
| `npm run compile` | Development build with source maps |
| `npm run build` | Production build (minified) |
| `npm run watch` | Rebuilds on file changes |
| `npm run release` | Bump patch, build, package, push, create GitHub Release |
| `npm run release:minor` | Same but bumps minor version |
| `npm run release:major` | Same but bumps major version |

---

## Running locally

1. Open this repo in VS Code
2. Press `F5` — this opens a new **Extension Development Host** window
3. In the new window, open a git repository
4. Set your OpenRouter API key in Settings → search **AI Commit**
5. Stage some files and click the ✨ icon in Source Control to test

After rebuilding (`npm run compile`), reload the Extension Development Host with `Ctrl+Shift+P` → **Developer: Reload Window** — no need to restart the debug session.

Breakpoints work in `src/` files because the development build generates source maps at `dist/extension.js.map`.

---

## How the commit flow works

```
User clicks ✨ in SCM
→ getRepository()            vscode.git extension API
→ getStagedDiff()            repo.diff(true)
→ buildCommitMessages()      injects diff into prompt
→ generate()                 POST openrouter.ai/api/v1/chat/completions
→ repo.inputBox.value        fills the SCM commit input
```

## How the PR flow works

```
User triggers generatePR command
→ getRepository()
→ getStructuredCommitHistory()   git log + git diff-tree per commit → JSON[]
→ findPRTemplate()               checks .github/, root, docs/
→ buildPRMessages()              XML-tagged prompt with history + template
→ generate()                     POST openrouter.ai/api/v1/chat/completions
→ parsePRResponse()              extracts { title, body } from JSON response
→ PRPanel.createOrShow()         opens WebviewPanel
→ clipboard.writeText(title)     auto-copies title
```

---

## Modifying prompts

Prompts live in [src/ai/promptBuilder.ts](src/ai/promptBuilder.ts).

- `COMMIT_PROMPT` — the default commit message prompt. Uses `{diff}` as the diff placeholder.
- `PR_WRITING_GUIDELINES` — writing style rules appended to the PR prompt.
- `buildPRMessages()` — assembles `<git_history>` and `<pull_request_template>` XML tags.

Users can override the prompts via `aiCommitPr.commitPrompt` and `aiCommitPr.prPrompt` settings. Custom prompts support `{diff}` / `{changes}` (commit) and `{history}` / `{template}` (PR).

---

## Packaging

```bash
npm run build
./node_modules/.bin/vsce package
# generates ai-commit-pr-generator-<version>.vsix
```

Install locally:
```bash
code --install-extension ai-commit-pr-generator-<version>.vsix
```

---

## Release process

The release script handles everything in one command:

```bash
npm run release          # patch bump  (0.1.2 → 0.1.3)
npm run release:minor    # minor bump  (0.1.2 → 0.2.0)
npm run release:major    # major bump  (0.1.2 → 1.0.0)
```

What it does:
1. Bumps version in `package.json` with `npm version`
2. Packages the extension with `vsce package`
3. Creates a git commit `chore: release vX.Y.Z` and tag
4. Pushes commit and tags to origin
5. Creates a GitHub Release with the `.vsix` as a downloadable asset (requires `gh auth login`)

To also publish to the VS Code Marketplace, add `--publish`:

```bash
bash scripts/release.sh patch --publish
```

This requires a prior `vsce login`:

```bash
./node_modules/.bin/vsce login wsilva
# enter your Azure DevOps PAT when prompted
```

Generate the PAT at [dev.azure.com](https://dev.azure.com) → Personal Access Tokens → scope: **Marketplace → Manage**.

---

## Adding a new AI provider

The OpenRouter client is in [src/ai/openRouterClient.ts](src/ai/openRouterClient.ts). It uses the OpenAI-compatible chat completions API. Any provider that implements the same interface (Ollama, LM Studio, etc.) can be swapped in by changing `OPENROUTER_URL` and the auth header.

---

## Dependencies

All dependencies are `devDependencies` — the extension bundle has zero runtime npm dependencies. The build uses webpack to tree-shake and bundle everything into a single `dist/extension.js`.
