import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { clearAuthParamsFromUrl, getInviteTypeFromUrl } from '../../lib/authRedirect'

export function SetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [canSetPassword, setCanSetPassword] = useState(false)
  const [linkType, setLinkType] = useState<'invite' | 'recovery' | null>(null)

  useEffect(() => {
    let cancelled = false
    const type = getInviteTypeFromUrl()
    if (type) setLinkType(type)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (
        nextSession &&
        (event === 'PASSWORD_RECOVERY' ||
          event === 'SIGNED_IN' ||
          type === 'invite' ||
          type === 'recovery')
      ) {
        setCanSetPassword(true)
        setCheckingLink(false)
      }
    })

    async function handleAuthCallback() {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (exchangeError) {
          setError('This link is invalid or has expired. Ask an admin to send a new invitation.')
          setCheckingLink(false)
          return
        }
        setCanSetPassword(true)
        setCheckingLink(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return

      if (session && (type === 'invite' || type === 'recovery')) {
        setCanSetPassword(true)
        setCheckingLink(false)
        return
      }

      if (!session && !type) {
        setError('This link is invalid or has expired. Ask an admin to send a new invitation.')
        setCheckingLink(false)
      } else if (session) {
        setCanSetPassword(true)
        setCheckingLink(false)
      }
    }

    void handleAuthCallback()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('Could not set password. The link may have expired — request a new invitation.')
      return
    }

    clearAuthParamsFromUrl()
    navigate('/admin/pledges', { replace: true })
  }

  const title =
    linkType === 'recovery' ? 'Reset your password' : 'Set your admin password'
  const description =
    linkType === 'recovery'
      ? 'Choose a new password for your admin account.'
      : 'You were invited as an admin. Choose a password to finish setting up your account.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>

        {checkingLink ? (
          <p className="mt-6 text-sm text-slate-500">Verifying your link...</p>
        ) : canSetPassword ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Confirm password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save password'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Link
              to="/admin/login"
              className="block text-center text-sm text-slate-600 hover:text-slate-900"
            >
              Go to admin login
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-700">
            ← Back to pledge form
          </Link>
        </p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
