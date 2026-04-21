import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_PATHS = [
  '.github/pull_request_template.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'pull_request_template.md',
  'docs/pull_request_template.md',
];

export async function findPRTemplate(workspaceRoot: string): Promise<string | null> {
  for (const relativePath of TEMPLATE_PATHS) {
    const fullPath = path.join(workspaceRoot, relativePath);
    try {
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf-8');
      }
    } catch {
      continue;
    }
  }

  // Also try vscode.workspace.findFiles as a fallback
  try {
    const files = await vscode.workspace.findFiles(
      '.github/**/pull_request_template.md',
      '**/node_modules/**',
      1
    );
    if (files.length > 0) {
      const content = await vscode.workspace.fs.readFile(files[0]);
      return Buffer.from(content).toString('utf-8');
    }
  } catch {
    // ignore
  }

  return null;
}

export const DEFAULT_PR_TEMPLATE = `## Summary
<!-- Describe the changes in this PR -->

## Motivation
<!-- Why is this change needed? -->

## Changes
<!-- List the main changes -->

## Test plan
<!-- How was this tested? -->
`;
