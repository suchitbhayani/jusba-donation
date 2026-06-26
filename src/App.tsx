import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { InviteLinkRedirect } from './components/InviteLinkRedirect'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PledgeForm } from './pages/PledgeForm'
import { AdminLogin } from './pages/admin/Login'
import { SetPassword } from './pages/admin/SetPassword'
import { AdminEvents } from './pages/admin/Events'
import { AdminPledges } from './pages/admin/Pledges'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <InviteLinkRedirect />
      <Routes>
        <Route path="/" element={<PledgeForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/set-password" element={<SetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/pledges" replace />} />
            <Route path="pledges" element={<AdminPledges />} />
            <Route path="events" element={<AdminEvents />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
