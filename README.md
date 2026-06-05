# AI Commit & PR Generator

Generate git commit messages and pull request descriptions using AI, directly inside VS Code.

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) — `feat`, `fix`, `refactor`, etc.
- PR descriptions follow your repository's PR template
- Two backends to choose from:
  - **OpenRouter** — any model (Claude, GPT, Gemini, Mistral…) via one API key
  - **Claude CLI** — reuses your existing, authenticated [Claude Code](https://claude.com/claude-code) session. No API key required.

---

## What is OpenRouter?

OpenRouter is a service that gives you access to dozens of AI models through a single API key. Instead of signing up separately for Anthropic, OpenAI, and Google, you create one account and can switch between models freely.

New accounts receive free credits. Most models cost a fraction of a cent per request — generating a commit message or PR description typically costs less than $0.01.

---

## Choosing a backend

Set `aiCommitPr.provider` in Settings (search **AI Commit**):

- **`openrouter`** (default) — uses the OpenRouter API. Follow the [Setup](#setup) below to add a key.
- **`claude-cli`** — shells out to the `claude` command-line tool, reusing whatever session you're already logged into (including SSO). Nothing to configure beyond having the [Claude CLI](https://claude.com/claude-code) installed and logged in (`claude` → `/login`). If `claude` isn't on your PATH — common with nvm installs under WSL — set `aiCommitPr.claudeCliPath` to its full path.

The rest of this guide covers the OpenRouter setup. If you use the Claude CLI backend, skip to [Generating a commit message](#generating-a-commit-message).

---

## Setup

### 1. Get an API key

1. Create a free account at [openrouter.ai](https://openrouter.ai)
2. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and click **Create key**
3. Copy the key — it starts with `sk-or-...`

### 2. Add the key to VS Code

1. Open Settings with `Ctrl+,`
2. Search for **AI Commit**
3. Paste your key into the **Open Router Api Key** field

---

## Generating a commit message

1. Stage the files you want to commit (click `+` next to each file in the Source Control panel)
2. Click the **✨ icon** in the top-right of the Source Control panel
3. The commit message fills in automatically — review it and commit normally

> The ✨ icon only appears when you have staged changes.

---

## Generating a PR description

### From the command palette

1. Make sure you're on a feature branch (not `main` or `master`)
2. Press `Ctrl+Shift+P`, type **AI Commit: Generate AI PR Description**, and press Enter
3. A panel opens with the generated **Title** and **Body**
4. Use **Copy Title** and **Copy Body** to paste into GitHub

### From the GitHub Pull Requests panel

If you use the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension:

1. Open the **Create Pull Request** panel in the sidebar
2. Click the **✨ icon** in the top-right of that panel
3. The PR title is automatically copied to your clipboard — paste it into the **Title** field
4. Copy the body from the side panel that opens

---

## Choosing a model

The default is `openai/gpt-oss-120b:free` — free, 120B parameters, 262K context. You can change it in Settings → search **AI Commit** → **Model**.

### Free models

Models with the `:free` suffix have no cost. Use the **Programming** category filter for models benchmarked on code tasks — they handle diffs and technical writing better than general-purpose models. Browse the full list at [openrouter.ai/models?q=free&categories=programming](https://openrouter.ai/models?q=free&fmt=cards&categories=programming).

| Model | Context | Notes |
|---|---|---|
| `google/gemma-4-31b-it:free` | 262K | Google, solid quality for code |
| `openai/gpt-oss-120b:free` | 262K | OpenAI, large model, best free option |
| `nvidia/nemotron-3-super-120b-a12b:free` | 262K | NVIDIA, large model, excellent quality |
| `nvidia/nemotron-3-nano-30b-a3b:free` | 256K | NVIDIA, lighter and faster |
| `openrouter/free` | 200K | Auto-routes to an available free model |

### Paid models

| Model | Quality | Cost (approx.) |
|---|---|---|
| `anthropic/claude-3.5-sonnet` | ★★★★★ | ~$0.003 / req |
| `anthropic/claude-3-haiku` | ★★★★☆ | ~$0.0003 / req |
| `openai/gpt-4o` | ★★★★★ | ~$0.005 / req |
| `openai/gpt-4o-mini` | ★★★★☆ | ~$0.0006 / req |
| `google/gemini-flash-1.5` | ★★★★☆ | ~$0.0001 / req |

Browse all models at [openrouter.ai/models](https://openrouter.ai/models).

---

## PR template

If your repository has a PR template, the extension finds and uses it automatically as the structure for the generated description. It checks these paths:

- `.github/pull_request_template.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `pull_request_template.md`
- `docs/pull_request_template.md`

---

## All settings

| Setting | Default | Description |
|---|---|---|
| `aiCommitPr.provider` | `openrouter` | Backend to use: `openrouter` or `claude-cli` |
| `aiCommitPr.claudeCliPath` | `claude` | Path to the Claude CLI binary (override if not on PATH, e.g. nvm under WSL) |
| `aiCommitPr.openRouterApiKey` | *(empty)* | Your OpenRouter API key (OpenRouter backend only) |
| `aiCommitPr.model` | `openai/gpt-oss-120b:free` | AI model to use (OpenRouter backend only) |
| `aiCommitPr.baseBranch` | `main` | Branch to compare against for PR diff |
| `aiCommitPr.commitPrompt` | Default prompt | Custom prompt for commit messages. Use `{diff}` as placeholder. Leave empty to use the default. |
| `aiCommitPr.prPrompt` | Default prompt | Custom prompt for PR descriptions. Use `{history}` and `{template}` as placeholders. Leave empty to use the default. |

---

## Troubleshooting

**✨ icon doesn't appear in Source Control**
Stage at least one file first by clicking the `+` icon next to it.

**"No commits found between current branch and main"**
You're on the base branch, or there are no commits on your branch yet. Switch to a feature branch with at least one commit.

**"OpenRouter API key is not configured"**
Follow the [Setup](#setup) steps above, or switch `aiCommitPr.provider` to `claude-cli` to use the Claude CLI instead.

**"Claude CLI not found"**
Install the [Claude CLI](https://claude.com/claude-code), or set `aiCommitPr.claudeCliPath` to its full path (run `which claude` to find it).

**"Claude CLI isn't logged in"**
Run `claude` in a terminal and use `/login` to authenticate, then try again.

**Request fails even with a valid key**
Check your account balance at [openrouter.ai/credits](https://openrouter.ai/credits). New accounts get free credits but they can run out.

**✨ icon doesn't appear in the GitHub Pull Requests panel**
Make sure the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension is installed and the **Create Pull Request** panel is open.

---

## Source

[github.com/w-osilva/ai-commit-pr-generator](https://github.com/w-osilva/ai-commit-pr-generator)
