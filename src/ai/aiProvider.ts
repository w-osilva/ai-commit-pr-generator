import * as vscode from 'vscode';
import { Message, generate as openRouterGenerate, DEFAULT_MODEL } from './openRouterClient';
import * as claudeCli from './claudeCliClient';

export interface AiProvider {
  generate(messages: Message[]): Promise<string>;
  // Returns true if the backend is ready. On failure it shows its own error
  // dialog and returns false, so callers just bail out without re-reporting.
  preflight(): Promise<boolean>;
}

class OpenRouterProvider implements AiProvider {
  constructor(private apiKey: string, private model: string) {}

  async preflight(): Promise<boolean> {
    if (!this.apiKey) {
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
      return false;
    }
    return true;
  }

  generate(messages: Message[]): Promise<string> {
    return openRouterGenerate(messages, { apiKey: this.apiKey, model: this.model });
  }
}

class ClaudeCliProvider implements AiProvider {
  constructor(private cliPath: string) {}

  async preflight(): Promise<boolean> {
    try {
      await claudeCli.preflight({ cliPath: this.cliPath });
      return true;
    } catch (err) {
      const action = await vscode.window.showErrorMessage(
        `AI Commit: ${err instanceof Error ? err.message : String(err)}`,
        'Open Settings'
      );
      if (action === 'Open Settings') {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'aiCommitPr.claudeCliPath'
        );
      }
      return false;
    }
  }

  generate(messages: Message[]): Promise<string> {
    return claudeCli.generate(messages, { cliPath: this.cliPath });
  }
}

export function getProvider(): AiProvider {
  const cfg = vscode.workspace.getConfiguration('aiCommitPr');
  const provider = cfg.get<string>('provider') ?? 'openrouter';
  if (provider === 'claude-cli') {
    return new ClaudeCliProvider(cfg.get<string>('claudeCliPath') || 'claude');
  }
  return new OpenRouterProvider(
    cfg.get<string>('openRouterApiKey') ?? '',
    cfg.get<string>('model') || DEFAULT_MODEL
  );
}
