import * as vscode from 'vscode';
import { Message, generate as openRouterGenerate, DEFAULT_MODEL } from './openRouterClient';
import * as claudeCli from './claudeCliClient';

export interface AiProvider {
  generate(messages: Message[]): Promise<string>;
  preflight(): Promise<void>;
}

class OpenRouterProvider implements AiProvider {
  constructor(private apiKey: string, private model: string) {}

  async preflight(): Promise<void> {
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
      throw new Error('OpenRouter API key is not configured.');
    }
  }

  generate(messages: Message[]): Promise<string> {
    return openRouterGenerate(messages, { apiKey: this.apiKey, model: this.model });
  }
}

class ClaudeCliProvider implements AiProvider {
  constructor(private cliPath: string) {}

  async preflight(): Promise<void> {
    try {
      await claudeCli.preflight({ cliPath: this.cliPath });
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
      throw err;
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
