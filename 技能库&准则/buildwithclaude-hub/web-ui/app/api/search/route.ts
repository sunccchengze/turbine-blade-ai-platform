import { NextRequest, NextResponse } from 'next/server'
import { searchContent, type SearchOptions } from '@/lib/search/search-content'
import { isSearchContentType } from '@/lib/search/search-types'

export const dynamic = 'force-dynamic'

const SORTS: NonNullable<SearchOptions['sort']>[] = ['relevance', 'stars', 'installs', 'updated']

/**
 * GET /api/search — unified search across all content types.
 *
 * Query params: q | search, type, category, marketplace, limit, offset, sort.
 * Returns: { hits, totalHits, limit, offset, hasMore, facetDistribution, source }.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const query = sp.get('q') ?? sp.get('search') ?? ''
  const typeParam = sp.get('type')
  const type = typeParam && isSearchContentType(typeParam) ? typeParam : 'all'
  const category = sp.get('category') || undefined
  const marketplace = sp.get('marketplace') || undefined
  const limit = Math.min(parseInt(sp.get('limit') ?? '20', 10) || 20, 100)
  const offset = Math.max(0, parseInt(sp.get('offset') ?? '0', 10) || 0)
  const sortParam = sp.get('sort') as SearchOptions['sort']
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : 'relevance'

  try {
    const result = await searchContent({ query, type, category, marketplace, limit, offset, sort })
    return NextResponse.json(
      {
        hits: result.items,
        totalHits: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
        facetDistribution: result.facets,
        source: result.source,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
    )
  } catch (error) {
    console.error('/api/search failed:', error)
    return NextResponse.json({
      hits: [],
      totalHits: 0,
      limit,
      offset,
      hasMore: false,
      facetDistribution: {},
      source: 'fallback',
    })
  }
}
