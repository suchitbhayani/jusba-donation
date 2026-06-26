import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PaymentInstructions } from '../components/PaymentInstructions'
import { supabase } from '../lib/supabase'
import type { Event, PledgeFormData } from '../types'

const initialForm: PledgeFormData = {
  name: '',
  email: '',
  phone: '',
  amount: '',
  event_id: '',
}

export function PledgeForm() {
  const [events, setEvents] = useState<Event[]>([])
  const [form, setForm] = useState<PledgeFormData>(initialForm)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEventName, setSubmittedEventName] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (fetchError) {
        setError('Could not load events. Please try again later.')
      } else {
        setEvents(data ?? [])
        if (data?.length === 1) {
          setForm((prev) => ({ ...prev, event_id: data[0].id }))
        }
      }
      setLoadingEvents(false)
    }

    loadEvents()
  }, [])

  function updateField<K extends keyof PledgeFormData>(key: K, value: PledgeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
    setSuccess(false)
    setEmailSent(false)
    setSubmittedEventName(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setEmailSent(false)
    setSubmittedEventName(null)

    const amount = parseFloat(form.amount)
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.event_id) {
      setError('Please fill in all fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Please enter a valid pledge amount greater than zero.')
      return
    }

    const eventName = events.find((event) => event.id === form.event_id)?.name ?? null

    setSubmitting(true)
    const { data: pledge, error: insertError } = await supabase
      .from('pledges')
      .insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        amount,
        event_id: form.event_id,
      })
      .select('id')
      .single()

    if (insertError || !pledge) {
      setSubmitting(false)
      setError('Could not submit your pledge. Please try again.')
      return
    }

    const { error: emailError } = await supabase.functions.invoke('send-pledge-confirmation', {
      body: { pledge_id: pledge.id },
    })

    setSubmitting(false)
    setSuccess(true)
    setEmailSent(!emailError)
    setSubmittedEventName(eventName)
    setForm({ ...initialForm, event_id: events.length === 1 ? events[0].id : '' })
  }

  const selectedEventName =
    events.find((event) => event.id === form.event_id)?.name ?? undefined

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">JUSBA Donation Pledge</h1>
          <p className="mt-2 text-slate-600">
            Share your intended gift, then pay by Zelle using the instructions below.
          </p>
        </div>

        <PaymentInstructions eventName={selectedEventName} className="mb-6" />

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <Field label="Full name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
                placeholder="Jane Doe"
                required
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={inputClass}
                placeholder="jane@example.com"
                required
              />
            </Field>

            <Field label="Phone number" required>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputClass}
                placeholder="(555) 123-4567"
                required
              />
            </Field>

            <Field label="Pledge amount ($)" required>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className={inputClass}
                placeholder="100.00"
                required
              />
            </Field>

            <Field label="Event" required>
              {loadingEvents ? (
                <p className="text-sm text-slate-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-amber-700">
                  No events are open for pledges right now. Please check back soon.
                </p>
              ) : (
                <select
                  value={form.event_id}
                  onChange={(e) => updateField('event_id', e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <div className="mt-4 space-y-4">
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Thank you for your pledge! We have recorded your information.
                {emailSent
                  ? ' A confirmation email with payment instructions has been sent to your inbox.'
                  : ' We could not send a confirmation email, but your pledge was saved.'}
              </p>
              <PaymentInstructions eventName={submittedEventName ?? undefined} />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingEvents || events.length === 0}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit pledge'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/admin/login" className="hover:text-slate-700">
            Admin login
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
