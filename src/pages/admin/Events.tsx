import { useEffect, useState, type DragEvent, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Event } from '../../types'

type EventDraft = {
  name: string
  is_active: boolean
}

const emptyDraft: EventDraft = { name: '', is_active: true }

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [draft, setDraft] = useState<EventDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadEvents() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .order('sort_order', { ascending: true })

    if (fetchError) {
      setError('Could not load events.')
    } else {
      setEvents(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  function startEdit(event: Event) {
    setEditingId(event.id)
    setDraft({
      name: event.name,
      is_active: event.is_active,
    })
    setError(null)
    setMessage(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  function nextSortOrder() {
    if (events.length === 0) return 1
    return Math.max(...events.map((event) => event.sort_order)) + 1
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const name = draft.name.trim()
    if (!name) {
      setError('Event name is required.')
      return
    }

    if (editingId) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ name, is_active: draft.is_active })
        .eq('id', editingId)

      if (updateError) {
        setError('Could not update event.')
        return
      }
      setMessage('Event updated.')
    } else {
      const { error: insertError } = await supabase.from('events').insert({
        name,
        sort_order: nextSortOrder(),
        is_active: draft.is_active,
      })

      if (insertError) {
        setError('Could not create event.')
        return
      }
      setMessage('Event created.')
    }

    cancelEdit()
    await loadEvents()
  }

  async function persistSortOrder(reordered: Event[]) {
    setSavingOrder(true)
    setError(null)

    const updates = reordered.map((event, index) =>
      supabase
        .from('events')
        .update({ sort_order: index + 1 })
        .eq('id', event.id),
    )

    const results = await Promise.all(updates)
    const failed = results.find((result) => result.error)

    setSavingOrder(false)

    if (failed?.error) {
      setError('Could not save event order. Refreshing list.')
      await loadEvents()
      return
    }

    setMessage('Event order updated.')
  }

  function reorderEvents(draggedId: string, targetId: string) {
    if (draggedId === targetId) return

    const fromIndex = events.findIndex((event) => event.id === draggedId)
    const toIndex = events.findIndex((event) => event.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = [...events]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)

    const reordered = next.map((event, index) => ({
      ...event,
      sort_order: index + 1,
    }))

    setEvents(reordered)
    void persistSortOrder(reordered)
  }

  function handleDragStart(e: DragEvent<HTMLLIElement>, eventId: string) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', eventId)
    setDraggingId(eventId)
    setMessage(null)
  }

  function handleDragOver(e: DragEvent<HTMLLIElement>, eventId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggingId && draggingId !== eventId) {
      setDropTargetId(eventId)
    }
  }

  function handleDrop(e: DragEvent<HTMLLIElement>, targetId: string) {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    reorderEvents(draggedId, targetId)
    setDraggingId(null)
    setDropTargetId(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDropTargetId(null)
  }

  async function toggleActive(event: Event) {
    setError(null)
    const { error: updateError } = await supabase
      .from('events')
      .update({ is_active: !event.is_active })
      .eq('id', event.id)

    if (updateError) {
      setError('Could not update event status.')
      return
    }
    await loadEvents()
  }

  async function deleteEvent(event: Event) {
    if (!confirm(`Delete "${event.name}"? This only works if no pledges are linked.`)) {
      return
    }

    setError(null)
    const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id)

    if (deleteError) {
      setError('Could not delete event. It may have pledges attached — try deactivating instead.')
      return
    }
    await loadEvents()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Manage events</h2>
      <p className="mt-1 text-sm text-slate-600">
        Active events appear in the public pledge form dropdown. Drag to reorder.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4"
      >
        <h3 className="text-sm font-semibold text-slate-900">
          {editingId ? 'Edit event' : 'Add event'}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Event name"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            required
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Active in dropdown
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {editingId ? 'Save changes' : 'Add event'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No events yet.</p>
        ) : (
          <>
            {savingOrder && (
              <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                Saving order...
              </p>
            )}
            <ul className="divide-y divide-slate-100">
              {events.map((event, index) => {
                const isDragging = draggingId === event.id
                const isDropTarget = dropTargetId === event.id

                return (
                  <li
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event.id)}
                    onDragOver={(e) => handleDragOver(e, event.id)}
                    onDrop={(e) => handleDrop(e, event.id)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => {
                      if (dropTargetId === event.id) setDropTargetId(null)
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition ${
                      isDragging ? 'opacity-40' : ''
                    } ${isDropTarget ? 'bg-slate-100' : 'bg-white'}`}
                  >
                    <button
                      type="button"
                      aria-label={`Drag to reorder ${event.name}`}
                      className="cursor-grab touch-none text-slate-400 active:cursor-grabbing"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <GripIcon />
                    </button>

                    <span className="w-6 text-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{event.name}</p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        event.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {event.is_active ? 'Active' : 'Inactive'}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(event)}
                        className="text-sm text-slate-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(event)}
                        className="text-sm text-slate-700 hover:underline"
                      >
                        {event.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEvent(event)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
