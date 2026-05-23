import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">Loading Rzen Ishare...</p>
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner/>
  if (!session) return <Navigate to="/login" replace/>
  return <Outlet/>
}

export function RequireRole({ roles }) {
  const { profile, loading } = useAuth()
  if (loading) return <FullPageSpinner/>
  if (!profile) return <Navigate to="/login" replace/>
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(profile.role)) return <Navigate to="/dashboard" replace/>
  return <Outlet/>
}

export function RedirectIfAuth() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner/>
  if (session) return <Navigate to="/dashboard" replace/>
  return <Outlet/>
}
