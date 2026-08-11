'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from './use-debounce'

export interface UseSearchOptions<T> {
  /** API route to query, e.g. '/api/search'. */
  endpoint: string
  /** Raw search text; the hook debounces it internally. */
  query: string
  /** Extra query params (filter state). Use `undefined` for default values so
   *  they're omitted from the URL/request. Pass a value object — it's compared
   *  by content, so it need not be referentially stable. */
  params?: Record<string, string | undefined>
  /** Key holding the array in the JSON response (e.g. 'hits', 'plugins', 'servers'). */
  resultsKey?: string
  pageSize?: number
  initialItems?: T[]
  initialHasMore?: boolean
  debounceMs?: number
  /** When set, mirrors q + params into the URL via router.replace. */
  urlSync?: { path: string }
  /** Fetch immediately on mount instead of trusting server-provided initialItems.
   *  Defaults to true only when no initialItems were given (e.g. the /search page). */
  fetchOnMount?: boolean
}

export interface UseSearchResult<T> {
  items: T[]
  hasMore: boolean
  loading: boolean
  error: boolean
  total: number
  facets: Record<string, Record<string, number>>
  loadMore: () => void
  loadMoreRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Debounced, paginated, URL-synced search against a JSON endpoint, with an
 * IntersectionObserver for infinite scroll and an AbortController so a slow
 * response can't overwrite a newer query. Extracted from the duplicated logic
 * across the browse pages.
 */
export function useSearch<T = unknown>(opts: UseSearchOptions<T>): UseSearchResult<T> {
  const {
    endpoint,
    query,
    params,
    resultsKey = 'hits',
    pageSize = 24,
    initialItems = [],
    initialHasMore = false,
    debounceMs = 300,
    urlSync,
    fetchOnMount,
  } = opts
  const shouldFetchOnMount = fetchOnMount ?? initialItems.length === 0

  const router = useRouter()
  const [items, setItems] = useState<T[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [total, setTotal] = useState(initialItems.length)
  const [facets, setFacets] = useState<Record<string, Record<string, number>>>({})

  const debouncedQuery = useDebounce(query, debounceMs)
  // Compare params by content so a fresh object each render doesn't refetch.
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params])

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(initialItems.length)
  const isFirstRender = useRef(true)
  const resetAbortRef = useRef<AbortController | null>(null)

  const buildQuery = useCallback(
    (offset: number) => {
      const sp = new URLSearchParams()
      sp.set('limit', String(pageSize))
      sp.set('offset', String(offset))
      if (debouncedQuery) sp.set('q', debouncedQuery)
      const p: Record<string, string | undefined> = params ?? {}
      for (const key of Object.keys(p)) {
        const value = p[key]
        if (value) sp.set(key, value)
      }
      return sp.toString()
    },
    // paramsKey stands in for `params` content; debouncedQuery + pageSize complete it.
    [pageSize, debouncedQuery, paramsKey], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Reset + fetch (and URL sync) whenever the debounced query or filters change.
  useEffect(() => {
    if (urlSync) {
      const qs = buildSyncQuery(debouncedQuery, params)
      router.replace(qs ? `${urlSync.path}?${qs}` : urlSync.path, { scroll: false })
    }

    if (isFirstRender.current) {
      isFirstRender.current = false
      // Skip the initial fetch when the server already provided matching items.
      if (!shouldFetchOnMount) return
    }

    const ac = new AbortController()
    resetAbortRef.current?.abort()
    resetAbortRef.current = ac
    setLoading(true)
    setError(false)

    fetch(`${endpoint}?${buildQuery(0)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        const list = (data[resultsKey] ?? []) as T[]
        setItems(list)
        setHasMore(Boolean(data.hasMore))
        setTotal(
          typeof data.totalHits === 'number'
            ? data.totalHits
            : typeof data.total === 'number'
              ? data.total
              : list.length,
        )
        setFacets(data.facetDistribution ?? {})
        offsetRef.current = list.length
        setLoading(false)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setError(true)
        setLoading(false)
      })

    return () => ac.abort()
  }, [debouncedQuery, paramsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    setLoading(true)
    fetch(`${endpoint}?${buildQuery(offsetRef.current)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data[resultsKey] ?? []) as T[]
        setItems((prev) => [...prev, ...list])
        setHasMore(Boolean(data.hasMore))
        offsetRef.current += list.length
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [loading, hasMore, endpoint, buildQuery, resultsKey])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { threshold: 0.1, rootMargin: '100px' },
    )
    const node = loadMoreRef.current
    if (node) observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return { items, hasMore, loading, error, total, facets, loadMore, loadMoreRef }
}

function buildSyncQuery(query: string, params?: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()
  if (query) sp.set('q', query)
  const p: Record<string, string | undefined> = params ?? {}
  for (const key of Object.keys(p)) {
    const value = p[key]
    if (value) sp.set(key, value)
  }
  return sp.toString()
}
