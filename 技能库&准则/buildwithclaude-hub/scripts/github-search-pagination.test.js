const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getSearchMaxPages } = require('./github-search-pagination');

test('getSearchMaxPages returns 0 for empty totals', () => {
  assert.equal(getSearchMaxPages(0), 0);
  assert.equal(getSearchMaxPages(-1), 0);
});

test('getSearchMaxPages matches topic-search cap for claude-code-plugins scale', () => {
  // 266 repos → 3 pages at 100/page (issue #157 repro)
  assert.equal(getSearchMaxPages(266), 3);
  assert.equal(getSearchMaxPages(100), 1);
  assert.equal(getSearchMaxPages(101), 2);
});

test('getSearchMaxPages caps at 10 pages (1000 results)', () => {
  assert.equal(getSearchMaxPages(1000), 10);
  assert.equal(getSearchMaxPages(1500), 10);
});
