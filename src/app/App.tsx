import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { shouldRunTutorial } from '../lib/tutorialProgress'
import { LandingPage } from '../pages/LandingPage'

const AppShell = lazy(() => import('../components/AppShell').then((module) => ({ default: module.AppShell })))
const AuthLayout = lazy(() => import('../components/AuthLayout').then((module) => ({ default: module.AuthLayout })))
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const GitHubPage = lazy(() => import('../pages/auth/GitHubPage').then((module) => ({ default: module.GitHubPage })))
const LinuxDOPage = lazy(() => import('../pages/auth/GitHubPage').then((module) => ({ default: module.LinuxDOPage })))
const ArenaPage = lazy(() => import('../pages/ArenaPage').then((module) => ({ default: module.ArenaPage })))
const TutorialPage = lazy(() => import('../pages/TutorialPage').then((module) => ({ default: module.TutorialPage })))

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="cosmic-bg grid min-h-dvh place-items-center"><LoaderCircle className="animate-spin text-cyan-signal" aria-label="Loading" /></div>
  return user ? <AppShell /> : <Navigate to="/login" state={{ from: location }} replace />
}

function ArenaWithTutorialGate() {
  const { user } = useAuth()
  if (user && shouldRunTutorial(user.username)) return <Navigate to="/tutorial" replace />
  return <ArenaPage />
}

export default function App() {
  return <Suspense fallback={<div className="cosmic-bg grid min-h-dvh place-items-center"><div className="h-px w-28 overflow-hidden bg-white/10"><span className="block h-full w-1/2 animate-pulse bg-cyan-signal" /></div></div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/github" element={<GitHubPage />} />
      <Route path="/auth/linux-do" element={<LinuxDOPage />} />
    </Route>
    {import.meta.env.DEV && <>
      <Route path="/demo" element={<div className="cosmic-bg min-h-dvh pt-0"><ArenaPage demo /></div>} />
      <Route path="/tutorial-demo" element={<div className="cosmic-bg min-h-dvh pt-0"><TutorialPage preview /></div>} />
    </>}
    <Route element={<RequireAuth />}>
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/arena" element={<ArenaWithTutorialGate />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}
