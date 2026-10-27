import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { AuthProvider, useAuth, isStaff } from './lib/auth.jsx';
import { ToastProvider } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminTenants from './pages/admin/AdminTenants.jsx';
import AdminAudit from './pages/admin/AdminAudit.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
import CenterHome from './pages/center/CenterHome.jsx';
import Members from './pages/center/Members.jsx';
import Departments from './pages/center/Departments.jsx';
import CenterApprovals from './pages/center/Approvals.jsx';
import Policies from './pages/center/Policies.jsx';
import Connections from './pages/center/Connections.jsx';
import Integrations from './pages/center/Integrations.jsx';
import AiApps from './pages/center/AiApps.jsx';
import OAuthConsent from './pages/OAuthConsent.jsx';
import Invite from './pages/Invite.jsx';
import { useLocation } from 'react-router-dom';
import { useAuth as useAuthHome } from './lib/auth.jsx';
/** Inicio: las personas de una organización ven su Center; el equipo de la plataforma, la administración. */
function Home() { const { user } = useAuthHome(); return user?.role === 'client' ? <CenterHome /> : <Navigate to="/admin/users" replace />; }
// El editor de código y el de reglas se cargan solo cuando se usan (el resto del panel sigue ligero)
const Lazy = ({ C }) => <Suspense fallback={<p className="text-ink-soft">Cargando…</p>}><C /></Suspense>;

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: false } } });

function Guard({ children, staff }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <div className="grid min-h-[100dvh] place-items-center"><img src="/icon.svg" alt="Cargando" className="h-12 w-12 animate-pulse" /></div>;
  // Cada perfil vuelve a SU pantalla de acceso cuando caduca la sesión
  if (!user) { if (loc.pathname !== '/') sessionStorage.setItem('ja-next', loc.pathname + loc.search); return <Navigate to={localStorage.getItem('ja-portal') === 'staff' || staff ? '/admin/login' : '/login'} replace />; }
  if (staff && !isStaff(user)) return <Navigate to="/" replace />;
  return children;
}

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'unset'}>
      <QueryClientProvider client={qc}><ToastProvider><AuthProvider><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<StaffLogin />} />
          <Route path="/invite/:token" element={<Invite />} />
          <Route path="/oauth/consent" element={<Guard><OAuthConsent /></Guard>} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route index element={<Home />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="center/members" element={<Members />} />
            <Route path="center/departments" element={<Departments />} />
            <Route path="center/approvals" element={<CenterApprovals />} />
            <Route path="center/policies" element={<Policies />} />
            <Route path="center/connections" element={<Connections />} />
            <Route path="center/integrations" element={<Integrations />} />
            <Route path="center/ai" element={<AiApps />} />
            <Route path="center" element={<Navigate to="/" replace />} />
            <Route path="admin/users" element={<Guard staff><AdminUsers /></Guard>} />
            <Route path="admin/tenants" element={<Guard staff><AdminTenants /></Guard>} />
            <Route path="admin/audit" element={<Guard staff><AdminAudit /></Guard>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter></AuthProvider></ToastProvider></QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
