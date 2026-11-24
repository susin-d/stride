import { Plus } from 'lucide-react'
import { Alert, Modal } from '../../components/ui'

export function HackathonFormModal({
  isOpen,
  title,
  submitLabel,
  showPlusIcon = false,
  form,
  onChange,
  onSubmit,
  onClose,
  saving,
  error,
  onDismissError,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="document-modal"
      subtitle="Hackathons"
      title={title}
    >
      <form className="project-edit-form" onSubmit={onSubmit}>
        {error && (
          <Alert variant="error" onDismiss={onDismissError}>
            {error}
          </Alert>
        )}
        <div className="project-edit-form-row">
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              required
              data-modal-initial-focus
            />
          </label>
          <label>
            Organizer
            <input
              value={form.organizer}
              onChange={(event) => onChange('organizer', event.target.value)}
            />
          </label>
        </div>
        <div className="project-edit-form-row">
          <label>
            Starts
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => onChange('startsAt', event.target.value)}
              required
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => onChange('endsAt', event.target.value)}
              required
            />
          </label>
        </div>
        <div className="project-edit-form-row">
          <label>
            Mode
            <select
              value={form.mode}
              onChange={(event) => onChange('mode', event.target.value)}
            >
              <option>Online</option>
              <option>In person</option>
              <option>Hybrid</option>
            </select>
          </label>
          <label>
            Team size
            <input
              value={form.teamSize}
              onChange={(event) => onChange('teamSize', event.target.value)}
              placeholder="1–4 members"
            />
          </label>
        </div>
        <label>
          Tags
          <input
            value={form.tags}
            onChange={(event) => onChange('tags', event.target.value)}
            placeholder="AI, Web, Open Source"
          />
        </label>
        <label>
          Event URL
          <input
            type="url"
            value={form.url}
            onChange={(event) => onChange('url', event.target.value)}
          />
        </label>
        <div className="todo-modal-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={saving}>
            {showPlusIcon && <Plus size={16} />}
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
