export function getAuthRedirectUrl(path = 'admin/set-password') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${base}/${path}`
}

export function getInviteTypeFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  const type = hashParams.get('type')
  if (type === 'invite' || type === 'recovery') return type

  const searchParams = new URLSearchParams(window.location.search)
  const searchType = searchParams.get('type')
  if (searchType === 'invite' || searchType === 'recovery') return searchType

  return null
}

export function clearAuthParamsFromUrl() {
  const url = new URL(window.location.href)
  url.hash = ''
  url.search = ''
  window.history.replaceState(null, '', url.pathname)
}
