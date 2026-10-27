import { useQuery } from '@tanstack/react-query';
import { api, errMsg } from '../../lib/api.js';
import { useAuth, hasRole } from '../../lib/auth.jsx';
import { PageHeader, Table, Badge, Button, fmtDate, useToast } from '../../components/ui.jsx';

/** Organizaciones de Juntial Center. Los planes y el consumo de cada app se gestionan en su propio panel. */
export default function AdminTenants() {
  const { user } = useAuth(); const toast = useToast(); const canWrite = hasRole(user, 'superadmin', 'admin');
  const q = useQuery({ queryKey: ['admin-tenants'], queryFn: () => api.get('/admin/tenants').then((r) => r.data) });
  const setStatus = async (t, status) => { try { await api.patch(`/admin/tenants/${t._id}`, { status }); toast(status === 'active' ? 'Organización activada' : 'Organización suspendida'); q.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } };
  return (
    <>
      <PageHeader title="Organizaciones" subtitle="Todas las organizaciones de Juntial, su propietario y su estado. Los planes de cada app se gestionan en el panel de esa app." />
      <div className="panel"><Table rows={q.data || []} columns={[
        { key: 'n', label: 'Organización', render: (t) => <span><b>{t.name}</b>{t.slug && <span className="block text-xs text-ink-soft">{t.slug}</span>}</span> },
        { key: 'o', label: 'Propietario', render: (t) => t.ownerId?.email || '—' },
        { key: 'm', label: 'Miembros', render: (t) => t.members },
        { key: 'c', label: 'Creada', render: (t) => fmtDate(t.createdAt) },
        { key: 's', label: 'Estado', render: (t) => <Badge tone={t.status === 'active' ? 'ok' : 'bad'}>{t.status === 'active' ? 'Activa' : 'Suspendida'}</Badge> },
        ...(canWrite ? [{ key: 'a', label: '', render: (t) => <Button size="sm" variant={t.status === 'active' ? 'danger' : 'secondary'} onClick={() => setStatus(t, t.status === 'active' ? 'suspended' : 'active')}>{t.status === 'active' ? 'Suspender' : 'Activar'}</Button> }] : []),
      ]} /></div>
    </>
  );
}
