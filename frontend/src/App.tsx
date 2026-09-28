import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ScrollToTop from '@/components/ScrollToTop'
import DashboardLayout from '@/layouts/DashboardLayout'
import Toaster from '@/components/ui/Toaster'
import Spinner from '@/components/ui/Spinner'
import { queryClient } from '@/lib/queryClient'

// Route-level code splitting. Every page becomes its own chunk, which keeps
// heavy optional dependencies (notably recharts, used only by AnalyticsPage)
// out of the first paint.
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const JobsPage = lazy(() => import('@/pages/JobsPage'))
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage'))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'))
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage'))
const CompanyDetailPage = lazy(() => import('@/pages/CompanyDetailPage'))
const ContactsPage = lazy(() => import('@/pages/ContactsPage'))
const ResumesPage = lazy(() => import('@/pages/ResumesPage'))
const InterviewsPage = lazy(() => import('@/pages/InterviewsPage'))
const TasksPage = lazy(() => import('@/pages/TasksPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Opt in to the React Router v7 behaviours now so the v7 upgrade is a no-op
// and the deprecation warnings stay out of the console/test output.
const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} satisfies Record<string, boolean>

function RouteFallback() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <Spinner size="lg" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={ROUTER_FUTURE}>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="companies/:id" element={<CompanyDetailPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="resumes" element={<ResumesPage />} />
                <Route path="interviews" element={<InterviewsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
