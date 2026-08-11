import { useEffect } from 'react'

/**
 * Opens the global search palette on ⌘K / Ctrl-K, and on "/" when the user
 * isn't typing in a field. `onOpen` should be a stable callback (e.g. a state setter).
 */
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null
      if (!node) return false
      const tag = node.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable
    }

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpen()
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault()
        onOpen()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}
