import { Meilisearch, type Index } from 'meilisearch'

/**
 * Index-name prefix. EVERY index name we touch is derived through `indexName()`
 * so our content can never collide with another project (Somi AI) sharing this
 * Meilisearch instance. Defense in depth: the prefix is the convention; the
 * scoped API key (restricted to `bwc_*`) is the server-enforced boundary.
 */
const PREFIX = process.env.MEILISEARCH_INDEX_PREFIX ?? 'bwc_'

export function indexName(base: string): string {
  return `${PREFIX}${base}`
}

/** The one and only content index id (already prefixed), e.g. `bwc_content`. */
export const CONTENT_INDEX = indexName('content')

function createClient(): Meilisearch | null {
  const host = process.env.MEILISEARCH_HOST
  const apiKey = process.env.MEILISEARCH_API_KEY
  // Search is optional: returning null (rather than throwing) lets `next build`
  // and a Meilisearch-less local dev run without these vars. Mirrors the lazy
  // pattern in lib/db/client.ts, but tri-state because absence is valid.
  if (!host || !apiKey) return null
  return new Meilisearch({ host, apiKey })
}

let _client: Meilisearch | null | undefined

/** Lazily-initialized singleton. `undefined` = not yet created, `null` = created
 *  but unconfigured (cached so we don't re-read env every call). */
export function getMeiliClient(): Meilisearch | null {
  if (_client === undefined) _client = createClient()
  return _client
}

/** The content index handle, or null when search is not configured. */
export function getContentIndex(): Index | null {
  const client = getMeiliClient()
  return client ? client.index(CONTENT_INDEX) : null
}

export function isSearchEnabled(): boolean {
  return getMeiliClient() !== null
}
