# AI Commit & PR Generator

VS Code extension that uses AI to write your git commit messages and pull request descriptions for you.

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) format
- PR descriptions follow your repo's PR template
- Powered by [OpenRouter](https://openrouter.ai) — one API key, access to Claude, GPT-4, Gemini, and more

---

## Installation

### Option A — Install from .vsix (recommended for now)

1. Download the `.vsix` file from the [Releases](../../releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` → type **Extensions: Install from VSIX** → select the downloaded file
4. Reload VS Code when prompted

### Option B — Run from source

```bash
git clone https://github.com/wsilva/ai-commit-pr-generator
cd ai-commit-pr-generator
npm install
npm run build
```

Then in VS Code: `Ctrl+Shift+P` → **Extensions: Install from VSIX** → select the generated `.vsix` file.

---

## First-time setup (required)

You need an OpenRouter API key to use this extension. OpenRouter is a service that gives you access to AI models (Claude, GPT-4, Gemini, etc.) through a single API.

### Get your free API key

1. Go to [openrouter.ai](https://openrouter.ai) and create a free account
2. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and click **Create key**
3. Copy the key (starts with `sk-or-...`)

### Add the key to VS Code

1. Open VS Code Settings: `Ctrl+,`
2. Search for **AI Commit**
3. Paste your key into the **Open Router Api Key** field

That's it. The extension is ready to use.

---

## How to use

### Generate a commit message

1. Make some changes to your code
2. **Stage the files** you want to commit (click the `+` next to each file in the Source Control panel, or run `git add`)
3. In the **Source Control** panel, click the **✨ sparkle icon** in the top-right of the panel
4. The commit message box fills automatically — review it and press **Commit**

> If the sparkle icon doesn't appear, make sure you have staged changes.

---

### Generate a PR description

#### From the command palette

1. Make sure you're on a **feature branch** (not `main` or `master`)
2. Press `Ctrl+Shift+P` → type **AI Commit: Generate AI PR Description** → press Enter
3. A panel opens on the side with the generated **Title** and **Body**
4. Use the **Copy Title** and **Copy Body** buttons to copy and paste into GitHub

#### From the GitHub Pull Requests panel (requires the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension)

1. Open the **GitHub Pull Requests** panel in the sidebar (the GitHub icon)
2. Click **Create Pull Request**
3. Click the **✨ sparkle icon** in the top-right of the Create Pull Request panel
4. The PR title is automatically copied to your clipboard — paste it into the **Title** field
5. The body appears in the side panel — click **Copy Body** and paste it into the **Description** field

---

## Choosing a model

The default model is `anthropic/claude-3.5-sonnet`. You can change it in Settings → search **AI Commit** → **Model**.

| Model | Speed | Cost | Best for |
|---|---|---|---|
| `anthropic/claude-3.5-sonnet` | Medium | ~$0.003/req | Best quality (default) |
| `anthropic/claude-3-haiku` | Fast | ~$0.0003/req | Quick commits |
| `openai/gpt-4o` | Medium | ~$0.005/req | Alternative |
| `mistralai/mistral-7b-instruct` | Fast | Free tier | Budget option |
| `google/gemini-flash-1.5` | Fast | ~$0.0001/req | Cheapest paid |

You can find all available models at [openrouter.ai/models](https://openrouter.ai/models).

---

## PR template

If your repository has a PR template, the extension will find and use it automatically as the structure for the generated description. It checks these locations (in order):

1. `.github/pull_request_template.md`
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `pull_request_template.md`
4. `docs/pull_request_template.md`

---

## All settings

| Setting | Default | Description |
|---|---|---|
| `aiCommitPr.openRouterApiKey` | *(empty)* | Your OpenRouter API key |
| `aiCommitPr.model` | `anthropic/claude-3.5-sonnet` | AI model to use |
| `aiCommitPr.baseBranch` | `main` | Branch to compare against for PR diff |
| `aiCommitPr.commitPrompt` | *(empty)* | Override the commit prompt. Use `{diff}` for the staged diff. |
| `aiCommitPr.prPrompt` | *(empty)* | Override the PR prompt. Use `{history}` and `{template}`. |

---

## Troubleshooting

**Sparkle icon doesn't appear in Source Control**
→ You need to have staged changes. Click the `+` icon next to files in the Source Control panel first.

**"No commits found between current branch and main"**
→ You're on `main` or there are no commits yet on your branch. Switch to a feature branch and make at least one commit.

**"OpenRouter API key is not configured"**
→ Follow the [First-time setup](#first-time-setup-required) steps above.

**API key is set but getting errors**
→ Check that your key is correct at [openrouter.ai/keys](https://openrouter.ai/keys). Make sure your account has credits (new accounts get free credits).

**PR sparkle icon doesn't appear in GitHub Pull Requests panel**
→ Make sure the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension is installed and you have the Create PR panel open.

---

## For developers

### Prerequisites

- Node.js >= 18
- npm >= 9

### Project structure

```
src/
  extension.ts          # Entry point
  git/gitProvider.ts    # VS Code git API wrapper + structured commit history
  ai/
    openRouterClient.ts # OpenRouter HTTP client
    promptBuilder.ts    # Commit and PR prompt construction
  utils/templateReader.ts  # PR template discovery
  webview/prPanel.ts    # PR result panel (title + body + copy buttons)
```

### Run locally

```bash
npm install
npm run compile   # development build
```

Open the project in VS Code and press `F5` to launch an Extension Development Host with the extension loaded.

Use `npm run watch` to automatically rebuild on file changes, then reload the Extension Development Host with `Ctrl+Shift+P` → **Developer: Reload Window**.

### Package

```bash
npm install -g @vscode/vsce   # only needed once
npm run build
vsce package
```

This generates a `.vsix` file you can share or install locally.

### Publish to VS Code Marketplace

1. Create a publisher at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
2. Generate a Personal Access Token with **Marketplace → Manage** scope at [dev.azure.com](https://dev.azure.com)
3. Run:

```bash
vsce login <your-publisher-name>
vsce publish
```

---

## License

MIT
