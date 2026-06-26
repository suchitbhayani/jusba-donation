import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Event, Pledge } from '../../types'

type PledgeRow = Pledge & { events: { name: string } | null }

export function AdminPledges() {
  const [pledges, setPledges] = useState<PledgeRow[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [filterEventId, setFilterEventId] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [pledgesResult, eventsResult] = await Promise.all([
      supabase
        .from('pledges')
        .select('*, events(name)')
        .order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('sort_order', { ascending: true }),
    ])

    if (pledgesResult.error || eventsResult.error) {
      setError('Could not load pledges.')
    } else {
      setPledges((pledgesResult.data as PledgeRow[]) ?? [])
      setEvents(eventsResult.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filteredPledges = useMemo(() => {
    if (!filterEventId) return pledges
    return pledges.filter((pledge) => pledge.event_id === filterEventId)
  }, [pledges, filterEventId])

  const totalAmount = useMemo(
    () => filteredPledges.reduce((sum, pledge) => sum + Number(pledge.amount), 0),
    [filteredPledges],
  )

  const receivedAmount = useMemo(
    () =>
      filteredPledges
        .filter((pledge) => pledge.payment_received)
        .reduce((sum, pledge) => sum + Number(pledge.amount), 0),
    [filteredPledges],
  )

  async function togglePaymentReceived(pledge: PledgeRow) {
    setUpdatingId(pledge.id)
    setError(null)

    const payment_received = !pledge.payment_received
    const { error: updateError } = await supabase
      .from('pledges')
      .update({ payment_received })
      .eq('id', pledge.id)

    setUpdatingId(null)

    if (updateError) {
      setError('Could not update payment status.')
      return
    }

    setPledges((current) =>
      current.map((row) => (row.id === pledge.id ? { ...row, payment_received } : row)),
    )
  }

  async function deletePledge(pledge: PledgeRow) {
    if (!confirm(`Delete pledge from ${pledge.name} for $${Number(pledge.amount).toFixed(2)}?`)) {
      return
    }

    setUpdatingId(pledge.id)
    setError(null)

    const { error: deleteError } = await supabase.from('pledges').delete().eq('id', pledge.id)

    setUpdatingId(null)

    if (deleteError) {
      setError('Could not delete pledge.')
      return
    }

    setPledges((current) => current.filter((row) => row.id !== pledge.id))
  }

  function exportCsv() {
    const headers = ['Name', 'Email', 'Phone', 'Amount', 'Event', 'Payment Received', 'Submitted']
    const rows = filteredPledges.map((pledge) => [
      pledge.name,
      pledge.email,
      pledge.phone,
      String(pledge.amount),
      pledge.events?.name ?? '',
      pledge.payment_received ? 'Yes' : 'No',
      new Date(pledge.created_at).toLocaleString(),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jusba-pledges-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pledges</h2>
          <p className="mt-1 text-sm text-slate-600">
            {filteredPledges.length} pledge{filteredPledges.length === 1 ? '' : 's'} · $
            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} pledged · $
            {receivedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} received
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredPledges.length === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading pledges...</p>
        ) : filteredPledges.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No pledges yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPledges.map((pledge) => {
                const isUpdating = updatingId === pledge.id

                return (
                  <tr
                    key={pledge.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      pledge.payment_received ? 'bg-green-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{pledge.name}</td>
                    <td className="px-4 py-3 text-slate-600">{pledge.email}</td>
                    <td className="px-4 py-3 text-slate-600">{pledge.phone}</td>
                    <td className="px-4 py-3 text-slate-900">
                      ${Number(pledge.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{pledge.events?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(pledge.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-slate-700">
                        <input
                          type="checkbox"
                          checked={pledge.payment_received}
                          disabled={isUpdating}
                          onChange={() => togglePaymentReceived(pledge)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-xs">
                          {pledge.payment_received ? 'Received' : 'Pending'}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deletePledge(pledge)}
                        disabled={isUpdating}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
