import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useSearchParams } from 'react-router-dom'
import { lazyWithRetry } from '@/app/lazyWithRetry'
import { Providers } from '@/app/providers'
import { LandingPage, NotFoundPage } from '@/features/home'
import { CookieConsentBanner } from '@/features/legal/components/CookieConsentBanner'
import { AuthLayout, RootLayout } from '@/layouts'
import { ErrorPage, GlobalErrorBoundary } from '@/shared/components/ErrorBoundary'
import { Loading } from '@/shared/components/Loading'
import { useAuthStore } from '@/shared/store/auth'

// Lazy-loaded feature components (kept static: LandingPage, NotFoundPage, CookieConsentBanner)
const AcceptInvitePage = lazyWithRetry(() =>
  import('@/features/auth/components/AcceptInvitePage').then((m) => ({
    default: m.AcceptInvitePage,
  })),
)
const AccountPage = lazyWithRetry(() =>
  import('@/features/auth/components/AccountPage').then((m) => ({ default: m.AccountPage })),
)
const ForgotPasswordPage = lazyWithRetry(() =>
  import('@/features/auth/components/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const LoginPage = lazyWithRetry(() =>
  import('@/features/auth/components/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazyWithRetry(() =>
  import('@/features/auth/components/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ResetPasswordPage = lazyWithRetry(() =>
  import('@/features/auth/components/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
)

const ClientList = lazyWithRetry(() =>
  import('@/features/clients/components/ClientList').then((m) => ({ default: m.ClientList })),
)
const ClientDetail = lazyWithRetry(() =>
  import('@/features/clients/components/ClientDetail').then((m) => ({ default: m.ClientDetail })),
)

const EavAttributeList = lazyWithRetry(() =>
  import('@/features/eav/components/EavAttributeList').then((m) => ({
    default: m.EavAttributeList,
  })),
)

const FinanceDashboard = lazyWithRetry(() =>
  import('@/features/finances/components/FinanceDashboard').then((m) => ({
    default: m.FinanceDashboard,
  })),
)

const CookiePage = lazyWithRetry(() =>
  import('@/features/legal/components/CookiePage').then((m) => ({ default: m.CookiePage })),
)
const PrivacyPage = lazyWithRetry(() =>
  import('@/features/legal/components/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazyWithRetry(() =>
  import('@/features/legal/components/TermsPage').then((m) => ({ default: m.TermsPage })),
)

const OrderCalendar = lazyWithRetry(() =>
  import('@/features/orders/components/OrderCalendar').then((m) => ({ default: m.OrderCalendar })),
)
const OrderDayView = lazyWithRetry(() =>
  import('@/features/orders/components/OrderDayView').then((m) => ({ default: m.OrderDayView })),
)
const OrderDetail = lazyWithRetry(() =>
  import('@/features/orders/components/OrderDetail').then((m) => ({ default: m.OrderDetail })),
)
const OrderForm = lazyWithRetry(() =>
  import('@/features/orders/components/OrderForm').then((m) => ({ default: m.OrderForm })),
)
const OrderList = lazyWithRetry(() =>
  import('@/features/orders/components/OrderList').then((m) => ({ default: m.OrderList })),
)

const OrgSelectPage = lazyWithRetry(() =>
  import('@/features/orgs/components/OrgSelectPage').then((m) => ({ default: m.OrgSelectPage })),
)
const OrgSettingsPage = lazyWithRetry(() =>
  import('@/features/orgs/components/OrgSettingsPage').then((m) => ({
    default: m.OrgSettingsPage,
  })),
)

const ProductList = lazyWithRetry(() =>
  import('@/features/products/components/ProductList').then((m) => ({ default: m.ProductList })),
)

const ReceiptDetail = lazyWithRetry(() =>
  import('@/features/receipts/components/ReceiptDetail').then((m) => ({
    default: m.ReceiptDetail,
  })),
)
const ReceiptForm = lazyWithRetry(() =>
  import('@/features/receipts/components/ReceiptForm').then((m) => ({ default: m.ReceiptForm })),
)
const ReceiptList = lazyWithRetry(() =>
  import('@/features/receipts/components/ReceiptList').then((m) => ({ default: m.ReceiptList })),
)

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// The backend generates password-reset links as `/auth/reset-password`
// (a legacy web-UI path). In SPA mode that route does not exist, so forward
// it to the SPA route while preserving the token.
function LegacyResetPasswordRedirect() {
  const [searchParams] = useSearchParams()
  const query = searchParams.toString()
  return <Navigate to={`/reset-password${query ? `?${query}` : ''}`} replace />
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage />, errorElement: <ErrorPage /> },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [{ index: true, element: <RegisterPage /> }],
  },
  {
    path: '/forgot-password',
    element: <AuthLayout />,
    children: [{ index: true, element: <ForgotPasswordPage /> }],
  },
  {
    path: '/reset-password',
    element: <AuthLayout />,
    children: [{ index: true, element: <ResetPasswordPage /> }],
  },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/cookie', element: <CookiePage /> },
  { path: '/invite', element: <AcceptInvitePage /> },
  { path: '/auth/reset-password', element: <LegacyResetPasswordRedirect /> },
  {
    path: '/account',
    element: (
      <RequireAuth>
        <AccountPage />
      </RequireAuth>
    ),
  },
  {
    path: '/orgs/select',
    element: (
      <RequireAuth>
        <OrgSelectPage />
      </RequireAuth>
    ),
  },
  {
    path: '/app/:orgId',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="orders/calendar" replace /> },
      { path: 'clients', element: <ClientList /> },
      { path: 'clients/:id', element: <ClientDetail /> },
      { path: 'products', element: <ProductList /> },
      { path: 'orders', element: <OrderList /> },
      { path: 'orders/new', element: <OrderForm /> },
      { path: 'orders/calendar', element: <OrderCalendar /> },
      { path: 'orders/day/:date', element: <OrderDayView /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'eav', element: <EavAttributeList /> },
      { path: 'receipts', element: <ReceiptList /> },
      { path: 'receipts/new', element: <ReceiptForm /> },
      { path: 'receipts/:id', element: <ReceiptDetail /> },
      { path: 'finances', element: <FinanceDashboard /> },
      { path: 'settings', element: <OrgSettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default function App() {
  return (
    <Providers>
      <GlobalErrorBoundary>
        <Suspense fallback={<Loading />}>
          <RouterProvider router={router} />
        </Suspense>
      </GlobalErrorBoundary>
      <CookieConsentBanner />
    </Providers>
  )
}
