import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getInviteTypeFromUrl } from '../lib/authRedirect'

export function InviteLinkRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const type = getInviteTypeFromUrl()
    if (!type) return

    const onSetPasswordPage = location.pathname.endsWith('/admin/set-password')
    if (onSetPasswordPage) return

    const hash = window.location.hash
    const search = window.location.search
    navigate(
      {
        pathname: '/admin/set-password',
        hash: hash.startsWith('#') ? hash.slice(1) : undefined,
        search,
      },
      { replace: true },
    )
  }, [location.pathname, navigate])

  return null
}
