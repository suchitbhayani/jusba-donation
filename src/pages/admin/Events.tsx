import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Event } from '../../types'

type EventDraft = {
  name: string
  sort_order: string
  is_active: boolean
}

const emptyDraft: EventDraft = { name: '', sort_order: '0', is_active: true }

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [draft, setDraft] = useState<EventDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
      sort_order: String(event.sort_order),
      is_active: event.is_active,
    })
    setError(null)
    setMessage(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const name = draft.name.trim()
    const sort_order = parseInt(draft.sort_order, 10)
    if (!name) {
      setError('Event name is required.')
      return
    }
    if (Number.isNaN(sort_order)) {
      setError('Sort order must be a number.')
      return
    }

    if (editingId) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ name, sort_order, is_active: draft.is_active })
        .eq('id', editingId)

      if (updateError) {
        setError('Could not update event.')
        return
      }
      setMessage('Event updated.')
    } else {
      const { error: insertError } = await supabase
        .from('events')
        .insert({ name, sort_order, is_active: draft.is_active })

      if (insertError) {
        setError('Could not create event.')
        return
      }
      setMessage('Event created.')
    }

    cancelEdit()
    await loadEvents()
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
        Active events appear in the public pledge form dropdown.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4"
      >
        <h3 className="text-sm font-semibold text-slate-900">
          {editingId ? 'Edit event' : 'Add event'}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Event name"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            required
          />
          <input
            type="number"
            placeholder="Sort order"
            value={draft.sort_order}
            onChange={(e) => setDraft((prev) => ({ ...prev, sort_order: e.target.value }))}
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
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{event.name}</td>
                  <td className="px-4 py-3 text-slate-600">{event.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        event.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {event.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(event)}
                        className="text-slate-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(event)}
                        className="text-slate-700 hover:underline"
                      >
                        {event.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEvent(event)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
