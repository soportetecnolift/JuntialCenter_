import { Orbit, Inbox, ShieldCheck, Users, Network, KeyRound, Waypoints, Sparkles, Building2, ScrollText, Bell, Settings } from 'lucide-react';

/** Navegación de Juntial Center por rol. `primary` = barra inferior en móvil (máx. 4 + «Más»). */
export function navFor(user) {
  const admin = ['admin', 'superadmin'].includes(user.role);
  if (user.role === 'client') return [
    { to: '/', label: 'Inicio', icon: Orbit, end: true, primary: true },
    { to: '/center/approvals', label: 'Aprobaciones', icon: Inbox, primary: true },
    { to: '/center/members', label: 'Miembros', icon: Users, primary: true, group: 'Organización' },
    { to: '/center/departments', label: 'Áreas', icon: Network, group: 'Organización' },
    { to: '/center/policies', label: 'Políticas', icon: ShieldCheck, group: 'Organización' },
    { to: '/center/connections', label: 'Conexiones', icon: KeyRound, group: 'Organización' },
    { to: '/center/integrations', label: 'Integraciones', icon: Waypoints, group: 'Organización' },
    { to: '/center/ai', label: 'Apps de IA', icon: Sparkles, group: 'Organización' },
  ];
  return [
    { to: '/admin/users', label: 'Usuarios', icon: Users, primary: true },
    { to: '/admin/tenants', label: 'Organizaciones', icon: Building2, primary: true },
    ...(admin ? [{ to: '/admin/audit', label: 'Auditoría', icon: ScrollText }] : []),
  ];
}
export const utilNav = [{ to: '/notifications', label: 'Avisos', icon: Bell }, { to: '/settings', label: 'Ajustes', icon: Settings }];
