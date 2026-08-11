import { Suspense } from 'react'
import { getMarketplacesPaginated, getMarketplaceTotals } from '@/lib/marketplace-server'
import { searchMarketplacesHydrated } from '@/lib/search/search-hydrate'
import { isSearchEnabled } from '@/lib/search/meilisearch-client'
import MarketplacesPageClient from './marketplaces-client'

export const metadata = {
  title: 'Plugin Marketplaces | Build with Claude',
  description: 'Discover community-maintained Claude Code plugin marketplaces. Browse registries with thousands of plugins, skills, and commands.',
}

export const dynamic = 'force-dynamic'

interface MarketplacesPageProps {
  // A `q` deep-link (e.g. from a marketplace search result) pre-filters the
  // listing so the linked marketplace surfaces as the top result.
  searchParams: Promise<{ q?: string }>
}

export default async function MarketplacesPage({ searchParams }: MarketplacesPageProps) {
  const { q } = await searchParams
  const initialQuery = q?.trim() || ''

  const [list, totals] = await Promise.all([
    // Mirror /api/marketplaces/list: Meilisearch ranking when searching (so the
    // linked marketplace ranks first), DB listing otherwise.
    initialQuery && isSearchEnabled()
      ? searchMarketplacesHydrated({ query: initialQuery, limit: 20, offset: 0 })
      : getMarketplacesPaginated({ limit: 20, offset: 0, search: initialQuery || undefined }),
    getMarketplaceTotals(),
  ])

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <MarketplacesPageClient
        key={initialQuery}
        initialMarketplaces={list.marketplaces}
        initialHasMore={list.hasMore}
        initialQuery={initialQuery}
        totals={totals}
      />
    </Suspense>
  )
}
