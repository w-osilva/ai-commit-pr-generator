import * as vscode from 'vscode';
import { execSync } from 'child_process';

interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
}

interface Repository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
  state: {
    HEAD?: { name?: string };
    indexChanges: unknown[];
  };
  diff(cached?: boolean): Promise<string>;
  log(options?: { maxEntries?: number }): Promise<Commit[]>;
}

interface Commit {
  hash: string;
  message: string;
  authorName?: string;
}

export interface FileStats {
  path: string;
  type: 'M' | 'A' | 'D' | 'R';
  lines_added: number;
  lines_deleted: number;
  lines_changed: number;
}

export interface CommitEntry {
  sha: string;
  date: string;
  body: string;
  files: string[];
  file_stats: FileStats[];
}

export function getRepository(): Repository | undefined {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!gitExtension?.isActive) {
    return undefined;
  }
  const api = gitExtension.exports.getAPI(1);
  return api.repositories[0];
}

export async function getStagedDiff(repo: Repository): Promise<string> {
  return repo.diff(true);
}

export function getCurrentBranch(repo: Repository): string | undefined {
  return repo.state.HEAD?.name;
}

function resolveBaseRef(repoRoot: string, baseBranch: string): string | null {
  const candidates = [
    `origin/${baseBranch}`,
    baseBranch,
    `origin/${baseBranch === 'main' ? 'master' : 'main'}`,
    baseBranch === 'main' ? 'master' : 'main',
  ];
  for (const ref of candidates) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { cwd: repoRoot, stdio: 'pipe' });
      return ref;
    } catch {
      // try next
    }
  }
  return null;
}

function getCommitFileStats(repoRoot: string, sha: string): FileStats[] {
  // Build type map from --name-status (unambiguous for renames)
  const nsRaw = execSync(`git diff-tree --no-commit-id -r -M --name-status ${sha}`, {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
    .toString()
    .trim();

  const typeMap = new Map<string, FileStats['type']>();
  for (const line of nsRaw.split('\n').filter(Boolean)) {
    const parts = line.split('\t');
    const rawType = parts[0];
    if (rawType.startsWith('R') || rawType.startsWith('C')) {
      typeMap.set(parts[2], 'R');
    } else if (rawType === 'D') {
      typeMap.set(parts[1], 'D');
    } else if (rawType === 'A') {
      typeMap.set(parts[1], 'A');
    } else {
      typeMap.set(parts[1], 'M');
    }
  }

  // Parse --numstat for line counts; renames produce 4 tab-separated columns
  const numRaw = execSync(`git diff-tree --no-commit-id -r -M --numstat ${sha}`, {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
    .toString()
    .trim();

  const stats: FileStats[] = [];
  for (const line of numRaw.split('\n').filter(Boolean)) {
    const parts = line.split('\t');
    if (parts.length < 3) {
      continue;
    }
    const added = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
    const deleted = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
    // Renames: git outputs old_path\tnew_path as the last two columns
    const path = parts.length === 4 ? parts[3] : parts[2];
    stats.push({
      path,
      type: typeMap.get(path) ?? 'M',
      lines_added: added,
      lines_deleted: deleted,
      lines_changed: added + deleted,
    });
  }
  return stats;
}

export function getStructuredCommitHistory(
  repoRoot: string,
  baseBranch: string
): CommitEntry[] {
  const baseRef = resolveBaseRef(repoRoot, baseBranch);
  if (!baseRef) {
    return [];
  }

  const range = `${baseRef}..HEAD`;
  const COMMIT_SEP = '---COMMIT_SEP_7f3a---';

  // %H = full hash, %aI = author date ISO strict, %B = full commit message body
  const logRaw = execSync(
    `git log ${range} --format="${COMMIT_SEP}%n%H%n%aI%n%B"`,
    { cwd: repoRoot, maxBuffer: 1024 * 1024 * 2 }
  ).toString();

  const blocks = logRaw.split(COMMIT_SEP + '\n').filter((b: string) => b.trim());

  return blocks
    .map((block: string): CommitEntry | null => {
      const lines = block.trimEnd().split('\n');
      const sha = lines[0]?.trim();
      const date = lines[1]?.trim();
      const body = lines.slice(2).join('\n').trim();

      if (!sha || sha.length < 7) {
        return null;
      }

      try {
        const file_stats = getCommitFileStats(repoRoot, sha);
        return {
          sha: sha.slice(0, 40),
          date,
          body,
          files: file_stats.map((f) => f.path),
          file_stats,
        };
      } catch {
        return { sha: sha.slice(0, 40), date, body, files: [], file_stats: [] };
      }
    })
    .filter((c: CommitEntry | null): c is CommitEntry => c !== null);
}
