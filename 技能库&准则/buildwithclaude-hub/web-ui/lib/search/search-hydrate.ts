import { searchContent } from './search-content'
import { getDbPluginsBySlugs, getLocalBuildWithClaudePlugins } from '@/lib/plugin-db-server'
import { getMarketplacesByNamespaces } from '@/lib/marketplace-server'
import type { UnifiedPlugin, PluginType } from '@/lib/plugin-types'
import type { MarketplaceRegistry } from '@/lib/marketplace-types'

/**
 * Meilisearch-backed search for the plugins/skills pages: rank via Meilisearch,
 * then hydrate full UnifiedPlugin records (DB + local Build with Claude) so the
 * cards keep all their fields (install commands, repos, etc.). Returns the same
 * envelope as getPluginsPaginated.
 */
export async function searchPluginsHydrated(opts: {
  query: string
  type?: PluginType | 'all'
  category?: string
  marketplaceId?: string
  limit: number
  offset: number
}): Promise<{ plugins: UnifiedPlugin[]; total: number; limit: number; offset: number; hasMore: boolean }> {
  const res = await searchContent({
    query: opts.query,
    type: !opts.type || opts.type === 'all' ? 'all' : opts.type,
    category: opts.category,
    marketplaceId: opts.marketplaceId && opts.marketplaceId !== 'all' ? opts.marketplaceId : undefined,
    limit: opts.limit,
    offset: opts.offset,
  })

  const hits = res.items
  const dbList = await getDbPluginsBySlugs(hits.map((h) => h.slug))
  const dbBySlug = new Map<string, UnifiedPlugin>()
  for (const p of dbList) if (p.slug) dbBySlug.set(p.slug, p)

  // Hydrate local Build with Claude items only if some hits weren't in the DB.
  const localByKey = new Map<string, UnifiedPlugin>()
  if (hits.some((h) => !dbBySlug.has(h.slug))) {
    for (const p of getLocalBuildWithClaudePlugins()) {
      localByKey.set(`${p.type}:${p.slug ?? p.name}`, p)
    }
  }

  const plugins = hits
    .map((h) => dbBySlug.get(h.slug) ?? localByKey.get(`${h.type}:${h.slug}`))
    .filter((p): p is UnifiedPlugin => Boolean(p))

  return { plugins, total: res.total, limit: res.limit, offset: res.offset, hasMore: res.hasMore }
}

/**
 * Meilisearch-backed search for the marketplaces page (slug = namespace).
 * Returns the same envelope as getMarketplacesPaginated.
 */
export async function searchMarketplacesHydrated(opts: {
  query: string
  limit: number
  offset: number
}): Promise<{ marketplaces: MarketplaceRegistry[]; total: number; hasMore: boolean }> {
  const res = await searchContent({
    query: opts.query,
    type: 'marketplace',
    limit: opts.limit,
    offset: opts.offset,
  })
  const marketplaces = await getMarketplacesByNamespaces(res.items.map((h) => h.slug))
  return { marketplaces, total: res.total, hasMore: res.hasMore }
}
