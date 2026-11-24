import '../styles/pages/hackathons.css'
import { useEffect, useState } from 'react'
import { Filter, Plus, Rocket } from 'lucide-react'
import { usePersistentState } from '../hooks/usePersistentState'
import { createHackathon, deleteHackathon, updateHackathon } from '../lib/workspaceApi'
import {
  ConfirmDialog,
  CustomDropdown,
  EmptyState,
  FilterBar,
  MetricCard,
  MetricGrid,
  SearchBar,
} from '../components/ui'
import {
  HACKATHONS_MODE_KEY,
  HACKATHONS_SORT_KEY,
  HACKATHONS_SOURCE_KEY,
  HACKATHON_FOCUS_KEY,
  HACKATHON_LAYOUT_KEY,
} from '../lib/storageKeys'
import { HackathonCard } from './hackathons/HackathonCard'
import { HackathonFormModal } from './hackathons/HackathonFormModal'

const emptyHackathon = {
  title: '',
  organizer: '',
  startsAt: '',
  endsAt: '',
  mode: 'Online',
  teamSize: '',
  tags: '',
  url: '',
}

const parseTags = (raw) =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

export function HackathonsPage({
  hackathons,
  setHackathons,
  canLoadMore,
  loadingMore,
  onLoadMore,
  onOpenHackathon,
}) {
  const [cardLayout, setCardLayout] = usePersistentState(HACKATHON_LAYOUT_KEY, 'compact')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyHackathon)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editingHackathon, setEditingHackathon] = useState(null)
  const [editForm, setEditForm] = useState(emptyHackathon)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = usePersistentState(HACKATHONS_MODE_KEY, 'All formats')
  const [sourceFilter, setSourceFilter] = usePersistentState(HACKATHONS_SOURCE_KEY, 'All sources')
  const [sortOrder, setSortOrder] = usePersistentState(HACKATHONS_SORT_KEY, 'Soonest')

  const sourceOptions = [...new Set(hackathons.map((item) => item.source || 'manual'))]
  const filteredHackathons = hackathons
    .filter((hackathon) => {
      const haystack = [
        hackathon.title,
        hackathon.organizer,
        hackathon.mode,
        ...(Array.isArray(hackathon.tags) ? hackathon.tags : []),
      ]
        .join(' ')
        .toLowerCase()
      return (
        (!searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase())) &&
        (modeFilter === 'All formats' || hackathon.mode === modeFilter) &&
        (sourceFilter === 'All sources' || (hackathon.source || 'manual') === sourceFilter)
      )
    })
    .sort((first, second) => {
      const direction = sortOrder === 'Latest' ? -1 : 1
      return (new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()) * direction
    })

  const clearFilters = () => {
    setSearchQuery('')
    setModeFilter('All formats')
    setSourceFilter('All sources')
    setSortOrder('Soonest')
  }

  useEffect(() => {
    const rawFocus = localStorage.getItem(HACKATHON_FOCUS_KEY)
    if (!rawFocus) return
    try {
      const { hackathonId } = JSON.parse(rawFocus)
      const focusedHackathon = hackathons.find((hackathon) => hackathon.id === hackathonId)
      if (focusedHackathon) onOpenHackathon?.(focusedHackathon.id)
    } finally {
      localStorage.removeItem(HACKATHON_FOCUS_KEY)
    }
  }, [hackathons, onOpenHackathon])

  const submitHackathon = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const hackathon = await createHackathon({ ...form, tags: parseTags(form.tags) })
      setHackathons((current) =>
        [...current, hackathon].sort(
          (first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
        ),
      )
      setForm(emptyHackathon)
      setFormOpen(false)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (hackathon) => {
    setEditingHackathon(hackathon)
    setEditForm({
      title: hackathon.title || '',
      organizer: hackathon.organizer || '',
      startsAt: hackathon.startsAt ? new Date(hackathon.startsAt).toISOString().slice(0, 16) : '',
      endsAt: hackathon.endsAt ? new Date(hackathon.endsAt).toISOString().slice(0, 16) : '',
      mode: hackathon.mode || 'Online',
      teamSize: hackathon.teamSize || '',
      tags: Array.isArray(hackathon.tags) ? hackathon.tags.join(', ') : '',
      url: hackathon.url || '',
    })
    setEditError('')
  }

  const saveHackathonEdit = async (event) => {
    event.preventDefault()
    if (!editingHackathon) return
    setEditSaving(true)
    setEditError('')
    try {
      const updated = await updateHackathon(editingHackathon.id, {
        ...editForm,
        tags: parseTags(editForm.tags),
      })
      setHackathons((current) =>
        current.map((item) => (item.id === editingHackathon.id ? updated : item)),
      )
      setEditingHackathon(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const confirmDeleteHackathon = async () => {
    const hackathonId = deleteId
    setDeleteId(null)
    if (!hackathonId) return
    try {
      await deleteHackathon(hackathonId)
      setHackathons((current) => current.filter((item) => item.id !== hackathonId))
    } catch (err) {
      setEditError(err.message || 'Could not delete hackathon.')
    }
  }

  return (
    <section className="hackathons-page">
      <FilterBar
        className="hackathon-toolbar"
        search={
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, organizer, or skill"
            ariaLabel="Search hackathons"
          />
        }
        filters={
          <>
            <Filter size={15} className="text-muted" aria-hidden="true" />
            <CustomDropdown
              value={modeFilter}
              onChange={setModeFilter}
              ariaLabel="Filter by format"
              options={[
                { value: 'All formats', label: 'All formats' },
                { value: 'Online', label: 'Online' },
                { value: 'In person', label: 'In person' },
                { value: 'Hybrid', label: 'Hybrid' },
              ]}
            />
            <CustomDropdown
              value={sourceFilter}
              onChange={setSourceFilter}
              ariaLabel="Filter by source"
              options={[
                { value: 'All sources', label: 'All sources' },
                ...sourceOptions.map((source) => ({
                  value: source,
                  label: source === 'manual' ? 'Manual' : source.toUpperCase(),
                })),
              ]}
            />
            <CustomDropdown
              value={sortOrder}
              onChange={setSortOrder}
              ariaLabel="Sort hackathons"
              options={[
                { value: 'Soonest', label: 'Soonest' },
                { value: 'Latest', label: 'Latest' },
              ]}
            />
            <CustomDropdown
              value={cardLayout}
              onChange={setCardLayout}
              ariaLabel="Customize card layout"
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'spacious', label: 'Spacious' },
              ]}
            />
          </>
        }
        actions={
          <button className="primary-button" type="button" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Add hackathon
          </button>
        }
        isFiltered={Boolean(
          searchQuery ||
            modeFilter !== 'All formats' ||
            sourceFilter !== 'All sources' ||
            sortOrder !== 'Soonest',
        )}
        onReset={clearFilters}
      />

      <MetricGrid className="workspace-insight-grid" ariaLabel="Hackathon overview">
        <MetricCard className="compact" label="Opportunities" value={hackathons.length} detail="in your pipeline" />
        <MetricCard className="compact" label="Online" value={hackathons.filter((item) => item.mode === 'Online').length} detail="join from anywhere" />
        <MetricCard className="compact" label="Next step" value={hackathons.length ? 'Choose' : 'Add one'} detail={hackathons.length ? 'a challenge to pursue' : 'your first challenge'} />
      </MetricGrid>
      <div className="hackathon-results-meta">
        <span>{filteredHackathons.length} of {hackathons.length} opportunities</span>
        <span>{filteredHackathons.length ? 'Open one to see the details' : 'Try a different filter'}</span>
      </div>

      <div className={`hackathon-list hackathon-layout-${cardLayout}`}>
        {filteredHackathons.map((hackathon) => (
          <HackathonCard
            key={hackathon.id}
            hackathon={hackathon}
            onOpenHackathon={onOpenHackathon}
            onEdit={openEditModal}
            onDelete={setDeleteId}
          />
        ))}
        {!filteredHackathons.length && (
          <EmptyState
            icon={Rocket}
            title="No hackathons match these filters"
            description="Adjust your search or reset the filters to see more opportunities."
            action={
              <button className="secondary-button" type="button" onClick={clearFilters}>
                Reset filters
              </button>
            }
          />
        )}
      </div>

      {canLoadMore && (
        <button className="secondary-button" type="button" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more hackathons'}
        </button>
      )}

      <HackathonFormModal
        isOpen={formOpen}
        title="Add hackathon"
        submitLabel="Add hackathon"
        showPlusIcon
        form={form}
        onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
        onSubmit={submitHackathon}
        onClose={() => setFormOpen(false)}
        saving={saving}
        error={error}
        onDismissError={() => setError('')}
      />

      <HackathonFormModal
        isOpen={Boolean(editingHackathon)}
        title="Edit hackathon"
        submitLabel="Save changes"
        form={editForm}
        onChange={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))}
        onSubmit={saveHackathonEdit}
        onClose={() => setEditingHackathon(null)}
        saving={editSaving}
        error={editError}
        onDismissError={() => setEditError('')}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        message="Are you sure you want to delete this manual hackathon entry?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDeleteHackathon}
      />
    </section>
  )
}
