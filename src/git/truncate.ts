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
