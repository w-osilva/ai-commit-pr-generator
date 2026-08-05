<div align="center">
  <img src="images/icon.png" alt="AI Commit & PR Generator" width="128">
  <h1>AI Commit &amp; PR Generator</h1>
  <p>Write your commit messages and pull request descriptions with AI, without leaving VS Code.</p>

[![Version](https://img.shields.io/visual-studio-marketplace/v/wsilva.ai-commit-pr-generator?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=wsilva.ai-commit-pr-generator)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/wsilva.ai-commit-pr-generator)](https://marketplace.visualstudio.com/items?itemName=wsilva.ai-commit-pr-generator)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/wsilva.ai-commit-pr-generator)](https://marketplace.visualstudio.com/items?itemName=wsilva.ai-commit-pr-generator&ssr=false#review-details)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

## Features

- **Commit messages from your staged diff.** Click the ✨ in the Source Control panel and the message drops straight into the commit box, following [Conventional Commits](https://www.conventionalcommits.org).
- **PR descriptions from your branch history.** The extension reads the commits between your branch and its base, then writes a title and body.
- **Your PR template, respected.** If the repository has a pull request template, the generated description follows its sections.
- **Two backends, one extension.** Use [OpenRouter](https://openrouter.ai) for any model behind a single API key, or the [Claude CLI](https://claude.com/claude-code) to reuse the session you are already logged into — no API key at all.
- **Bring your own prompt.** Both prompts are settings. Override them when the defaults do not match how your team writes.

## Requirements

- VS Code 1.85 or newer
- The built-in Git extension (`vscode.git`), enabled by default
- One backend: an OpenRouter API key, **or** the `claude` CLI installed and logged in
- Optional: the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension, to generate descriptions from the Create Pull Request panel

## Quick start

Pick a backend with `aiCommitPr.provider` (open Settings with `Ctrl+,` and search **AI Commit**):

**`claude-cli`** — nothing to configure beyond having the [Claude CLI](https://claude.com/claude-code) installed and authenticated (`claude`, then `/login`). It reuses your existing session, SSO included. If `claude` is not on your PATH — common with nvm under WSL — point `aiCommitPr.claudeCliPath` at the binary.

**`openrouter`** (default) — needs a key:

1. Create a free account at [openrouter.ai](https://openrouter.ai)
2. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and click **Create key**
3. Copy the key (it starts with `sk-or-...`) into the **Open Router Api Key** setting

> **New to OpenRouter?** It gives you dozens of models through one API key, so you do not need separate Anthropic, OpenAI and Google accounts. New accounts get free credits, and a commit message or PR description usually costs under $0.01 — or nothing at all on a `:free` model.

## Usage

### Generate a commit message

1. Stage the files you want to commit
2. Click the ✨ in the top-right of the Source Control panel
3. Review the generated message and commit as usual

The ✨ only appears once you have staged changes.

### Generate a PR description

From the command palette:

1. Check out a feature branch (not your base branch)
2. Press `Ctrl+Shift+P` and run **AI Commit: Generate AI PR Description**
3. A panel opens with the **Title** and **Body**, each with a copy button

From the GitHub Pull Requests panel:

1. Open the **Create Pull Request** view in the sidebar
2. Click the ✨ in its title bar
3. The title lands on your clipboard, ready to paste; the body opens in a side panel

## Commands

| Command | Palette entry | Where |
|---|---|---|
| `aiCommitPr.generateCommit` | AI Commit: Generate AI Commit Message | Source Control title bar |
| `aiCommitPr.generatePR` | AI Commit: Generate AI PR Description | Command palette, Create Pull Request title bar |

## Extension settings

| Setting | Default | Description |
|---|---|---|
| `aiCommitPr.provider` | `openrouter` | Backend to use: `openrouter` or `claude-cli` |
| `aiCommitPr.openRouterApiKey` | *(empty)* | Your OpenRouter API key. OpenRouter backend only |
| `aiCommitPr.model` | `openai/gpt-oss-120b:free` | OpenRouter model ID. OpenRouter backend only |
| `aiCommitPr.claudeCliPath` | `claude` | Path to the Claude CLI binary. Override when it is not on PATH |
| `aiCommitPr.baseBranch` | `main` | Branch the PR is compared against |
| `aiCommitPr.includeDiff` | `true` | Send the branch diff to the model for PR descriptions. Turn off to send only commit history |
| `aiCommitPr.commitPrompt` | *(built-in)* | Custom commit prompt. Use `{diff}` as the placeholder |
| `aiCommitPr.prPrompt` | *(built-in)* | Custom PR prompt. Use `{history}`, `{diff}` and `{template}` as placeholders |

## Choosing a model

Applies to the OpenRouter backend only. The default is `openai/gpt-oss-120b:free`.

Models with the `:free` suffix cost nothing. Filter by the **Programming** category to find models benchmarked on code — they handle diffs and technical writing better than general-purpose ones. Full list: [openrouter.ai/models](https://openrouter.ai/models?q=free&fmt=cards&categories=programming).

| Free model | Context | Notes |
|---|---|---|
| `openai/gpt-oss-120b:free` | 262K | Large model, best free option |
| `nvidia/nemotron-3-super-120b-a12b:free` | 262K | Large model, excellent quality |
| `google/gemma-4-31b-it:free` | 262K | Solid quality for code |
| `nvidia/nemotron-3-nano-30b-a3b:free` | 256K | Lighter and faster |
| `openrouter/free` | 200K | Auto-routes to an available free model |

| Paid model | Quality | Cost per request |
|---|---|---|
| `anthropic/claude-3.5-sonnet` | ★★★★★ | ~$0.003 |
| `openai/gpt-4o` | ★★★★★ | ~$0.005 |
| `anthropic/claude-3-haiku` | ★★★★☆ | ~$0.0003 |
| `openai/gpt-4o-mini` | ★★★★☆ | ~$0.0006 |
| `google/gemini-flash-1.5` | ★★★★☆ | ~$0.0001 |

## PR templates

The extension looks for a template in these paths, in order, and uses the first one it finds as the structure for the generated description:

- `.github/pull_request_template.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `pull_request_template.md`
- `docs/pull_request_template.md`

With no template, it falls back to a built-in Summary / Motivation / Changes / Test plan structure.

## Troubleshooting

**The ✨ is missing from Source Control.**
Stage at least one file. The action is hidden while nothing is staged.

**The ✨ is missing from the Create Pull Request panel.**
Install the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension and open the panel.

**"No commits found between current branch and main"**
You are on the base branch, or your branch has no commits yet. Check out a feature branch with at least one commit, or correct `aiCommitPr.baseBranch`.

**"OpenRouter API key is not configured"**
Add your key as shown in [Quick start](#quick-start), or switch `aiCommitPr.provider` to `claude-cli`.

**"Claude CLI not found"**
Install the [Claude CLI](https://claude.com/claude-code), or run `which claude` and put the result in `aiCommitPr.claudeCliPath`.

**"Claude CLI isn't logged in"**
Run `claude` in a terminal, authenticate with `/login`, then try again.

**Requests fail with a valid key.**
Check your balance at [openrouter.ai/credits](https://openrouter.ai/credits). Free credits do run out.

## Release notes

See [CHANGELOG.md](CHANGELOG.md) for the full history.

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for the build, watch and packaging workflow. Issues and pull requests are welcome at [github.com/w-osilva/ai-commit-pr-generator](https://github.com/w-osilva/ai-commit-pr-generator).

## License

[MIT](LICENSE)
