import * as vscode from 'vscode';
import {
  getRepository,
  getStagedDiff,
  getCurrentBranch,
  getStructuredCommitHistory,
} from './git/gitProvider';
import { generate } from './ai/openRouterClient';
import { buildCommitMessages, buildPRMessages, parsePRResponse } from './ai/promptBuilder';
import { findPRTemplate } from './utils/templateReader';
import { PRPanel } from './webview/prPanel';

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('aiCommitPr');
  return {
    apiKey: cfg.get<string>('openRouterApiKey') ?? '',
    model: cfg.get<string>('model') ?? 'anthropic/claude-3.5-sonnet',
    baseBranch: cfg.get<string>('baseBranch') ?? 'main',
    commitPrompt: cfg.get<string>('commitPrompt') ?? '',
    prPrompt: cfg.get<string>('prPrompt') ?? '',
  };
}

async function ensureApiKey(): Promise<string | undefined> {
  const { apiKey } = getConfig();
  if (!apiKey) {
    const action = await vscode.window.showErrorMessage(
      'AI Commit: OpenRouter API key is not configured.',
      'Open Settings'
    );
    if (action === 'Open Settings') {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'aiCommitPr.openRouterApiKey'
      );
    }
    return undefined;
  }
  return apiKey;
}

async function generateCommit(): Promise<void> {
  const repo = getRepository();
  if (!repo) {
    vscode.window.showErrorMessage('AI Commit: No git repository found.');
    return;
  }

  const diff = await getStagedDiff(repo);
  if (!diff.trim()) {
    vscode.window.showWarningMessage(
      'AI Commit: No staged changes found. Stage your changes first.'
    );
    return;
  }

  const apiKey = await ensureApiKey();
  if (!apiKey) {
    return;
  }

  const config = getConfig();

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.SourceControl,
      title: 'Generating commit message…',
    },
    async () => {
      const messages = buildCommitMessages(diff, config.commitPrompt || undefined);
      const result = await generate(messages, { apiKey, model: config.model });
      repo.inputBox.value = result;
    }
  );
}

async function generatePR(): Promise<void> {
  const repo = getRepository();
  if (!repo) {
    vscode.window.showErrorMessage('AI Commit: No git repository found.');
    return;
  }

  const config = getConfig();
  const currentBranch = getCurrentBranch(repo);

  if (currentBranch === config.baseBranch) {
    vscode.window.showWarningMessage(
      `AI Commit: You are on the base branch (${config.baseBranch}). Switch to a feature branch first.`
    );
    return;
  }

  const apiKey = await ensureApiKey();
  if (!apiKey) {
    return;
  }

  const repoRoot = repo.rootUri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: 'Generating PR description…',
    },
    async () => {
      const history = getStructuredCommitHistory(repoRoot, config.baseBranch);
      if (history.length === 0) {
        vscode.window.showWarningMessage(
          `AI Commit: No commits found between current branch and ${config.baseBranch}.`
        );
        return;
      }

      const template = await findPRTemplate(repoRoot);
      const messages = buildPRMessages(history, template, config.prPrompt || undefined);

      const raw = await generate(messages, { apiKey, model: config.model });
      const { title, body } = parsePRResponse(raw);

      PRPanel.createOrShow(title, body);

      // Auto-copy title to clipboard so it's ready to paste into the GitHub PR title field
      await vscode.env.clipboard.writeText(title);
      vscode.window.showInformationMessage(
        'PR title copied to clipboard — paste it in the Title field. Copy the body from the panel.',
      );
    }
  );
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiCommitPr.generateCommit', async () => {
      try {
        await generateCommit();
      } catch (err) {
        vscode.window.showErrorMessage(
          `AI Commit: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }),

    vscode.commands.registerCommand('aiCommitPr.generatePR', async () => {
      try {
        await generatePR();
      } catch (err) {
        vscode.window.showErrorMessage(
          `AI Commit: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );
}

export function deactivate(): void {}
