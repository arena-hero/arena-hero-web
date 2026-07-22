import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { AuthLayout } from '../components/AuthLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { GitHubPage } from '../pages/auth/GitHubPage'
import { ArenaPage } from '../pages/ArenaPage'

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="cosmic-bg grid min-h-dvh place-items-center"><LoaderCircle className="animate-spin text-cyan-signal" aria-label="Loading" /></div>
  return user ? <AppShell /> : <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  return <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/github" element={<GitHubPage />} />
    </Route>
    {import.meta.env.DEV && <Route path="/demo" element={<div className="cosmic-bg min-h-dvh pt-0"><ArenaPage demo /></div>} />}
    <Route element={<RequireAuth />}>
      <Route path="/arena" element={<ArenaPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/arena" replace />} />
  </Routes>
}
