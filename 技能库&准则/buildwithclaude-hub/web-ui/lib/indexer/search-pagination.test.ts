import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getSearchMaxPages } from './search-pagination.ts'

describe('getSearchMaxPages', () => {
  it('returns 0 for empty totals', () => {
    assert.equal(getSearchMaxPages(0), 0)
    assert.equal(getSearchMaxPages(-1), 0)
  })

  it('paginates topic:claude-code-plugins scale (issue #157)', () => {
    assert.equal(getSearchMaxPages(266), 3)
    assert.equal(getSearchMaxPages(100), 1)
    assert.equal(getSearchMaxPages(101), 2)
  })

  it('caps at 10 pages', () => {
    assert.equal(getSearchMaxPages(1000), 10)
    assert.equal(getSearchMaxPages(1500), 10)
  })
})
