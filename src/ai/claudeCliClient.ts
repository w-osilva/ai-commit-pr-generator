import { spawn } from 'node:child_process';
import { Message } from './openRouterClient';

export interface ClaudeCliOptions {
  cliPath: string;
  timeoutMs?: number;
}

// Print mode takes a single prompt, so collapse the role array into one string.
export function flattenMessages(messages: Message[]): string {
  return messages.map((m) => m.content).join('\n\n');
}

// Map a failed CLI run to a user-friendly Error.
export function classifyError(code: number | null, stderr: string): Error {
  const text = stderr.trim();
  if (/ENOENT/.test(text)) {
    return new Error(
      'Claude CLI not found. Install it or set "aiCommitPr.claudeCliPath".'
    );
  }
  if (/\b(login|authenticat|unauthor|credential)/i.test(text)) {
    return new Error(
      "Claude CLI isn't logged in — run `claude` then `/login`."
    );
  }
  const snippet = text.split('\n').slice(0, 5).join('\n') || `exit code ${code}`;
  return new Error(`Claude CLI failed: ${snippet}`);
}

interface ProcResult {
  code: number | null;
  stdout: string;
  stderr: string;
  spawnError?: NodeJS.ErrnoException;
}

function runProcess(
  cliPath: string,
  args: string[],
  input: string,
  timeoutMs: number
): Promise<ProcResult> {
  return new Promise((resolve) => {
    const child = spawn(cliPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        child.kill();
        stderr += `\nTimed out after ${timeoutMs}ms`;
      }
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({ code: null, stdout, stderr: stderr + err.message, spawnError: err });
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });

    // Swallow EPIPE: claude may exit before draining stdin; an unhandled
    // stream error would otherwise crash the extension host.
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

export async function generate(
  messages: Message[],
  opts: ClaudeCliOptions
): Promise<string> {
  const prompt = flattenMessages(messages);
  const result = await runProcess(
    opts.cliPath,
    ['-p', '--output-format', 'text'],
    prompt,
    opts.timeoutMs ?? 120000
  );
  if (result.spawnError || result.code !== 0) {
    throw classifyError(result.code, result.stderr);
  }
  const out = result.stdout.trim();
  if (!out) {
    throw new Error('Claude CLI returned an empty response.');
  }
  return out;
}

// Lightweight check that the binary resolves; real auth errors surface on first generate.
export async function preflight(opts: ClaudeCliOptions): Promise<void> {
  const result = await runProcess(opts.cliPath, ['--version'], '', 10000);
  if (result.spawnError) {
    throw classifyError(null, result.stderr);
  }
}
