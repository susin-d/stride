import { useEffect, useMemo, useState } from 'react'
import { buildSearchIndex, filterSearchItems } from '../../config/searchIndex'
import { usePersistentState } from '../../hooks/usePersistentState'
import { RECENT_SEARCHES_KEY } from '../../lib/storageKeys'

const MAX_RECENTS = 6

export function useSearchPalette({
  isOpen,
  onClose,
  onNavigate,
  onCreate,
  callCenter,
  toggleTheme,
  setDarkTheme,
  setEveOpen,
  setNotificationsOpen,
  onEveNewChat,
  onSignOut,
  workspaceData,
  initialQuery,
  inputRef,
  listRef,
}) {
  const [query, setQuery] = useState(initialQuery)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentSearches, setRecentSearches] = usePersistentState(RECENT_SEARCHES_KEY, [])

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setActiveIndex(0)
      window.requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isOpen, initialQuery, inputRef])

  const fullIndex = useMemo(() => buildSearchIndex(workspaceData), [workspaceData])
  const filteredItems = useMemo(() => filterSearchItems(fullIndex, query, 'all'), [fullIndex, query])

  const groupedResults = useMemo(() => {
    const groups = {}
    filteredItems.forEach((item) => {
      const groupName = item.group || 'Other'
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(item)
    })
    return groups
  }, [filteredItems])

  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(Math.max(0, filteredItems.length - 1))
    }
  }, [filteredItems.length, activeIndex])

  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-item-index="${activeIndex}"]`)
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex, listRef])

  const saveRecentSearch = (item) => {
    const entry = {
      id: item.id,
      title: item.title,
      badge: item.badge,
      category: item.category,
      page: item.page,
      hash: item.hash,
      recordId: item.recordId,
      actionId: item.actionId,
      timestamp: Date.now(),
    }
    setRecentSearches((current) => [entry, ...current.filter((r) => r.id !== item.id)].slice(0, MAX_RECENTS))
  }

  const clearRecentSearches = (e) => {
    e?.stopPropagation()
    setRecentSearches([])
  }

  const handleSelectItem = (item) => {
    if (!item) return
    saveRecentSearch(item)
    onClose()

    if (item.hash) {
      onNavigate('setting')
      window.location.hash = `#${item.hash}`
      window.setTimeout(() => {
        const el = document.getElementById(item.hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          el.classList.add('notification-target-highlight')
          window.setTimeout(() => el.classList.remove('notification-target-highlight'), 1600)
        }
      }, 100)
      return
    }

    if (item.actionId) {
      const createActionMap = {
        'create-todo': ['todo', 'todo'],
        'create-project': ['project', 'projects'],
        'create-job': ['job', 'jobs'],
        'create-document': ['document', 'documents'],
      }
      if (createActionMap[item.actionId]) {
        const [type, fallbackPage] = createActionMap[item.actionId]
        if (onCreate) onCreate(type)
        else onNavigate(fallbackPage)
        return
      }
      if (item.actionId === 'new-eve-chat') {
        if (onEveNewChat) onEveNewChat()
        onNavigate('eve')
      } else if (item.actionId === 'open-eve') {
        if (setEveOpen) setEveOpen(true)
      } else if (item.actionId === 'call-eve') {
        if (callCenter?.initiateEveCall) callCenter.initiateEveCall()
        else onNavigate('eve-call')
      } else if (item.actionId === 'toggle-theme') {
        if (toggleTheme) toggleTheme()
        else if (setDarkTheme) setDarkTheme((current) => !current)
      } else if (item.actionId === 'open-notifications') {
        if (setNotificationsOpen) setNotificationsOpen(true)
      } else if (item.actionId === 'sign-out') {
        if (onSignOut) onSignOut()
      }
      return
    }

    if (item.recordType) {
      if (item.recordType === 'project' && item.recordId) onNavigate('project-detail', item.recordId)
      else if (item.recordType === 'document' && item.recordId) onNavigate('document-opener', null, item.recordId)
      else if (item.recordType === 'hackathon' && item.recordId) onNavigate('hackathon-detail', null, null, item.recordId)
      else if (item.page) onNavigate(item.page)
      return
    }

    if (item.page) onNavigate(item.page)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(Math.max(0, filteredItems.length - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredItems[activeIndex]) handleSelectItem(filteredItems[activeIndex])
    }
  }

  return {
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    recentSearches,
    clearRecentSearches,
    fullIndex,
    filteredItems,
    groupedResults,
    handleSelectItem,
    handleKeyDown,
  }
}
