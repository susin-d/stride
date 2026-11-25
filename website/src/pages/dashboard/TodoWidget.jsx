import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { createTodo, updateTodo } from '../../lib/todosApi'

const MAX_VISIBLE_TODOS = 5

/**
 * Interactive todo checklist widget with inline quick-add and optimistic completion toggles.
 */
export function TodoWidget({ tasks, setTasks, formatDate }) {
  const [draftTitle, setDraftTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const [error, setError] = useState('')

  const openTasks = tasks.filter((task) => !task.completed)
  const completedCount = tasks.length - openTasks.length
  const visibleTasks = openTasks.slice(0, MAX_VISIBLE_TODOS)

  const handleAdd = async (event) => {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title || submitting) return

    setSubmitting(true)
    setError('')
    try {
      const created = await createTodo({ title, dueDate: '' })
      setTasks((current) => [created, ...current])
      setDraftTitle('')
    } catch (err) {
      setError(err?.message || 'Could not add task.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (task) => {
    if (pendingIds.has(task.id)) return
    const nextCompleted = !task.completed

    setError('')
    setPendingIds((current) => new Set(current).add(task.id))
    setTasks((current) =>
      current.map((entry) =>
        entry.id === task.id ? { ...entry, completed: nextCompleted } : entry,
      ),
    )

    try {
      const updated = await updateTodo(task.id, { completed: nextCompleted })
      setTasks((current) =>
        current.map((entry) => (entry.id === task.id ? updated : entry)),
      )
    } catch (err) {
      setTasks((current) =>
        current.map((entry) =>
          entry.id === task.id ? { ...entry, completed: task.completed } : entry,
        ),
      )
      setError(err?.message || 'Could not update task.')
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  return (
    <div className="dashboard-todo-widget">
      <form className="dashboard-todo-quickadd" onSubmit={handleAdd}>
        <input
          type="text"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          placeholder="Add a task and press Enter…"
          aria-label="New task title"
          disabled={submitting}
        />
        <button
          type="submit"
          className="dashboard-todo-add-btn"
          disabled={!draftTitle.trim() || submitting}
          aria-label="Add task"
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </form>

      {error && (
        <p className="dashboard-todo-error" role="alert">
          {error}
        </p>
      )}

      {visibleTasks.length === 0 ? (
        <p className="dashboard-widget-empty">
          {tasks.length === 0 ? 'No tasks yet. Add one above.' : 'All tasks complete.'}
        </p>
      ) : (
        <ul className="dashboard-todo-list">
          {visibleTasks.map((task) => {
            const isBusy = pendingIds.has(task.id)
            return (
              <li key={task.id} className="dashboard-todo-row">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  className={`dashboard-todo-check ${task.completed ? 'is-checked' : ''}`}
                  disabled={isBusy}
                  onClick={() => handleToggle(task)}
                >
                  {task.completed && <Check size={12} strokeWidth={2.5} />}
                </button>
                <span className="dashboard-todo-title">{task.title}</span>
                {task.dueDate && (
                  <em className="dashboard-todo-due">
                    {formatDate(`${task.dueDate}T12:00:00`)}
                  </em>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {(openTasks.length > MAX_VISIBLE_TODOS || completedCount > 0) && (
        <div className="dashboard-todo-meta">
          {openTasks.length > MAX_VISIBLE_TODOS && (
            <span>+{openTasks.length - MAX_VISIBLE_TODOS} more open</span>
          )}
          {completedCount > 0 && <span>{completedCount} completed</span>}
        </div>
      )}
    </div>
  )
}
