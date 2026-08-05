export const DIFF_CHAR_LIMIT = 80000;

/**
 * Caps a diff so the model receives a bounded payload. The marker tells the
 * model it is looking at a partial diff rather than the whole branch.
 */
export function truncateDiff(diff: string, limit: number = DIFF_CHAR_LIMIT): string {
  if (diff.length <= limit) {
    return diff;
  }
  return diff.slice(0, limit) + '\n\n[diff truncated]';
}

/** A single file's diff may claim at most this share of the whole budget. */
export const PER_FILE_SHARE = 0.25;

/**
 * Fits a diff into the budget by choosing whole files rather than cutting the
 * tail. Git orders a diff by path, so a plain truncation drops whatever sorts
 * last — usually `src/` — while a regenerated lockfile earlier in the alphabet
 * keeps its place. Any file whose diff alone exceeds its share is dropped, and
 * the rest fill the budget in order. Dropped paths are named so the model knows
 * the file changed even though it cannot see how.
 */
export function selectDiffWithinBudget(
  diff: string,
  limit: number = DIFF_CHAR_LIMIT,
  share: number = PER_FILE_SHARE
): string {
  // A diff that carries no file header (an execSync overflow can start mid-file)
  // cannot be split by file — fall back to the blunt cap.
  if (!diff.startsWith('diff --git ')) {
    return truncateDiff(diff, limit);
  }

  const chunks = diff.split(/^(?=diff --git )/m).filter(Boolean);
  const perFileCap = limit * share;
  const kept: string[] = [];
  const omitted: string[] = [];
  let used = 0;

  for (const chunk of chunks) {
    const path = chunk.match(/^diff --git a\/.+? b\/(.+)$/m)?.[1] ?? 'unknown file';
    if (chunk.length > perFileCap || used + chunk.length > limit) {
      omitted.push(path);
      continue;
    }
    kept.push(chunk);
    used += chunk.length;
  }

  const body = kept.join('');
  if (omitted.length === 0) {
    return body;
  }
  return `${body}\n[these files changed too, but their diffs were omitted for size: ${omitted.join(', ')}]\n`;
}
