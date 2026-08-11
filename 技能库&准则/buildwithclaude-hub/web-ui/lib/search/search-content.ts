import { getContentIndex } from './meilisearch-client'
import {
  HIGHLIGHT_PRE_TAG,
  HIGHLIGHT_POST_TAG,
  type SearchContentType,
  type SearchDocument,
} from './search-types'
import { allDocs, docsForType } from './indexer'

export interface SearchOptions {
  query: string
  type?: SearchContentType | 'all'
  /** One or more categories (comma-separated → OR). Matched against the `categories` array. */
  category?: string
  marketplace?: string
  /** Marketplace id or name (matched against marketplaceId OR marketplace). */
  marketplaceId?: string
  limit?: number
  offset?: number
  sort?: 'relevance' | 'stars' | 'installs' | 'updated'
}

export type SearchHit = SearchDocument & { _formatted?: Partial<SearchDocument> }

export interface SearchResult {
  items: SearchHit[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  facets: Record<string, Record<string, number>>
  source: 'meilisearch' | 'fallback'
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Circuit breaker (mirrors lib/db/safe-query.ts): once a Meilisearch query
// fails, skip it for a cooldown window so a flapping/down instance doesn't add
// latency to every request — go straight to the DB/file fallback instead.
let circuitOpen = false
let circuitOpenedAt = 0
const CIRCUIT_TTL_MS = 30_000

function clampLimit(n?: number): number {
  if (!n || Number.isNaN(n)) return DEFAULT_LIMIT
  return Math.min(Math.max(1, n), MAX_LIMIT)
}

function buildFilter(opts: SearchOptions): (string | string[])[] {
  // Top-level array entries are AND'd; a nested array is OR'd (Meilisearch).
  const filter: (string | string[])[] = []
  if (opts.type && opts.type !== 'all') filter.push(`type = "${opts.type}"`)
  if (opts.category) {
    const cats = opts.category.split(',').map((c) => c.trim()).filter(Boolean)
    if (cats.length === 1) filter.push(`categories = "${escapeFilter(cats[0])}"`)
    else if (cats.length > 1) filter.push(cats.map((c) => `categories = "${escapeFilter(c)}"`))
  }
  if (opts.marketplaceId) {
    const v = escapeFilter(opts.marketplaceId)
    filter.push([`marketplaceId = "${v}"`, `marketplace = "${v}"`])
  } else if (opts.marketplace) {
    filter.push(`marketplace = "${escapeFilter(opts.marketplace)}"`)
  }
  return filter
}

function escapeFilter(value: string): string {
  return value.replace(/"/g, '\\"')
}

function buildSort(sort?: SearchOptions['sort']): string[] | undefined {
  switch (sort) {
    case 'stars':
      return ['stars:desc']
    case 'installs':
      return ['installs:desc']
    case 'updated':
      return ['updatedAt:desc']
    default:
      return undefined // relevance → use the index ranking rules
  }
}

/**
 * Unified search over the `bwc_content` index, with a DB/file fallback so search
 * never hard-fails. Returns highlighted hits (`_formatted` uses sentinel tags,
 * rendered safely on the client) plus facet distributions for type/category.
 */
export async function searchContent(opts: SearchOptions): Promise<SearchResult> {
  const limit = clampLimit(opts.limit)
  const offset = Math.max(0, opts.offset ?? 0)
  const index = getContentIndex()

  if (index) {
    if (circuitOpen && Date.now() - circuitOpenedAt > CIRCUIT_TTL_MS) circuitOpen = false
    if (!circuitOpen) {
      try {
        const res = await index.search<SearchDocument>(opts.query, {
          offset,
          limit,
          filter: buildFilter(opts),
          sort: buildSort(opts.sort),
          facets: ['type', 'category', 'marketplace'],
          attributesToHighlight: ['name', 'description', 'content'],
          attributesToCrop: ['content'],
          cropLength: 30,
          highlightPreTag: HIGHLIGHT_PRE_TAG,
          highlightPostTag: HIGHLIGHT_POST_TAG,
        })
        const total = res.estimatedTotalHits ?? res.hits.length
        return {
          items: res.hits as SearchHit[],
          total,
          limit,
          offset,
          hasMore: offset + res.hits.length < total,
          facets: res.facetDistribution ?? {},
          source: 'meilisearch',
        }
      } catch (error) {
        console.error('[searchContent] Meilisearch query failed, using fallback:', error)
        circuitOpen = true
        circuitOpenedAt = Date.now()
      }
    }
  }

  return fallbackSearch(opts, limit, offset)
}

function countBy(docs: SearchDocument[], key: 'type' | 'category' | 'marketplace'): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const d of docs) {
    const v = d[key]
    if (v) counts[v] = (counts[v] ?? 0) + 1
  }
  return counts
}

/**
 * Degraded path: rebuild candidate docs from the source loaders and do an
 * in-memory substring match. Only runs when Meilisearch is unconfigured or down;
 * the circuit breaker keeps it from running on every request.
 */
async function fallbackSearch(opts: SearchOptions, limit: number, offset: number): Promise<SearchResult> {
  let docs: SearchDocument[]
  try {
    docs = opts.type && opts.type !== 'all' ? await docsForType(opts.type) : await allDocs()
  } catch (error) {
    console.error('[searchContent] fallback source load failed:', error)
    return { items: [], total: 0, limit, offset, hasMore: false, facets: {}, source: 'fallback' }
  }

  const q = opts.query.trim().toLowerCase()
  let filtered = q
    ? docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          (d.content ? d.content.toLowerCase().includes(q) : false),
      )
    : docs
  if (opts.category) {
    const cats = opts.category.split(',').map((c) => c.trim()).filter(Boolean)
    if (cats.length) {
      filtered = filtered.filter(
        (d) => d.categories?.some((c) => cats.includes(c)) || (d.category ? cats.includes(d.category) : false),
      )
    }
  }
  if (opts.marketplaceId) {
    filtered = filtered.filter((d) => d.marketplaceId === opts.marketplaceId || d.marketplace === opts.marketplaceId)
  } else if (opts.marketplace) {
    filtered = filtered.filter((d) => d.marketplace === opts.marketplace)
  }

  const facets = {
    type: countBy(filtered, 'type'),
    category: countBy(filtered, 'category'),
    marketplace: countBy(filtered, 'marketplace'),
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (opts.sort) {
      case 'stars':
        return b.stars - a.stars || a.name.localeCompare(b.name)
      case 'installs':
        return b.installs - a.installs || a.name.localeCompare(b.name)
      case 'updated':
        return b.updatedAt - a.updatedAt || a.name.localeCompare(b.name)
      default: {
        // relevance-ish: exact/prefix name match first, then popularity, then name
        if (q) {
          const aExact = a.name.toLowerCase() === q ? 0 : a.name.toLowerCase().startsWith(q) ? 1 : 2
          const bExact = b.name.toLowerCase() === q ? 0 : b.name.toLowerCase().startsWith(q) ? 1 : 2
          if (aExact !== bExact) return aExact - bExact
        }
        return b.stars - a.stars || a.name.localeCompare(b.name)
      }
    }
  })

  const total = sorted.length
  const items = sorted.slice(offset, offset + limit) as SearchHit[]
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
    facets,
    source: 'fallback',
  }
}
