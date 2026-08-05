import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  truncateDiff,
  selectDiffWithinBudget,
  DIFF_CHAR_LIMIT,
} from '../src/git/truncate';

function fileDiff(path: string, bodyChars: number): string {
  return `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n${'+x\n'.repeat(bodyChars)}`;
}

test('returns the diff unchanged when it is under the limit', () => {
  const diff = 'a'.repeat(100);
  assert.equal(truncateDiff(diff, 200), diff);
});

test('returns the diff unchanged when it exactly hits the limit', () => {
  const diff = 'a'.repeat(200);
  assert.equal(truncateDiff(diff, 200), diff);
});

test('truncates and appends the marker when over the limit', () => {
  const result = truncateDiff('a'.repeat(300), 200);
  assert.ok(result.startsWith('a'.repeat(200)));
  assert.ok(result.endsWith('[diff truncated]'));
  assert.equal(result.match(/\[diff truncated\]/g)?.length, 1);
});

test('keeps only the first limit characters of content', () => {
  const result = truncateDiff('a'.repeat(200) + 'b'.repeat(100), 200);
  assert.equal(result.includes('b'), false);
});

test('defaults to the 80000 character limit', () => {
  assert.equal(DIFF_CHAR_LIMIT, 80000);
  assert.equal(truncateDiff('a'.repeat(100)), 'a'.repeat(100));
});

test('handles an empty diff', () => {
  assert.equal(truncateDiff(''), '');
});

test('keeps every file when the whole diff fits the budget', () => {
  const diff = fileDiff('src/a.ts', 10) + fileDiff('src/b.ts', 10);
  const result = selectDiffWithinBudget(diff, 10000);
  assert.equal(result, diff);
  assert.equal(result.includes('omitted for size'), false);
});

test('drops a single file that claims more than its share, and names it', () => {
  const small = fileDiff('src/a.ts', 5);
  const huge = fileDiff('package-lock.json', 2000);
  const result = selectDiffWithinBudget(small + huge, 4000);
  assert.ok(result.includes('src/a.ts'));
  assert.equal(result.includes('+++ b/package-lock.json'), false);
  assert.ok(result.includes('omitted for size: package-lock.json'));
});

test('keeps files that sort last, which a tail truncation would have cut', () => {
  // Git orders by path: the lockfile comes before src/ and would eat a plain cap.
  const diff = fileDiff('package-lock.json', 2000) + fileDiff('src/z.ts', 5);
  const result = selectDiffWithinBudget(diff, 4000);
  assert.ok(result.includes('+++ b/src/z.ts'));
  assert.equal(truncateDiff(diff, 4000).includes('+++ b/src/z.ts'), false);
});

test('stops once the budget is spent and names what did not fit', () => {
  const diff = fileDiff('a.ts', 100) + fileDiff('b.ts', 100) + fileDiff('c.ts', 100);
  const result = selectDiffWithinBudget(diff, 800);
  assert.ok(result.includes('omitted for size:'));
  assert.ok(result.length <= 800 + 200);
});

test('falls back to a blunt cap when the diff has no file header', () => {
  const headerless = 'x'.repeat(500);
  const result = selectDiffWithinBudget(headerless, 100);
  assert.ok(result.endsWith('[diff truncated]'));
});

test('handles an empty diff', () => {
  assert.equal(selectDiffWithinBudget(''), '');
});
