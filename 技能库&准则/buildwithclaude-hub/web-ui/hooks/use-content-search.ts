import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import type { SearchHit } from '@/lib/content-types'

export interface ContentSearchState {
  hits: SearchHit[]
  /** Per-type result counts from the facet distribution (for group headings). */
  facets: Record<string, number>
  loading: boolean
  errored: boolean
  /** The debounced, trimmed query the current results correspond to. */
  trimmed: string
}

/**
 * Debounced search against the unified `/api/search` endpoint. Shared by the ⌘K
 * palette and the homepage hero dropdown so both surface identical results.
 * When `enabled` is false (the palette/dropdown is closed) no request is made
 * and results are cleared, so the next open starts fresh.
 */
export function useContentSearch(
  query: string,
  { enabled = true, limit = 24 }: { enabled?: boolean; limit?: number } = {},
): ContentSearchState {
  const debounced = useDebounce(query, 250)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [facets, setFacets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    const q = debounced.trim()
    if (!enabled || !q) {
      setHits([])
      setFacets({})
      setLoading(false)
      setErrored(false)
      return
    }
    const ac = new AbortController()
    setLoading(true)
    setErrored(false)
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        setHits(data.hits ?? [])
        setFacets(data.facetDistribution?.type ?? {})
        setLoading(false)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setErrored(true)
        setLoading(false)
      })
    return () => ac.abort()
  }, [debounced, enabled, limit])

  return { hits, facets, loading, errored, trimmed: debounced.trim() }
}
