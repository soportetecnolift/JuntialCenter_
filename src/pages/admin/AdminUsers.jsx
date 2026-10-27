import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, errMsg } from '../../lib/api.js';
import { useAuth, hasRole } from '../../lib/auth.jsx';
import { PageHeader, Button, Modal, Field, Input, Select, Table, Badge, fmtDate, useToast } from '../../components/ui.jsx';

const ROLE = { superadmin: 'Superadmin', admin: 'Administrador', employee: 'Empleado', client: 'Cliente' };
export default function AdminUsers() {
  const { user } = useAuth(); const toast = useToast();
  const [q, setQ] = useState(''); const [role, setRole] = useState('');
  const { data, refetch } = useQuery({ queryKey: ['admin-users', q, role], queryFn: () => api.get(`/admin/users?q=${encodeURIComponent(q)}&role=${role}`).then((r) => r.data) });
  const [f, setF] = useState(null);
  const canWrite = hasRole(user, 'superadmin', 'admin');
  const roleOptions = (user.role === 'superadmin' ? ['admin', 'employee', 'client'] : ['employee', 'client']).map((v) => ({ value: v, label: ROLE[v] }));
  const act = async (fn, msg) => { try { await fn(); toast(msg); refetch(); } catch (e) { toast(errMsg(e), 'bad'); } };
  return (
    <>
      <PageHeader title="Usuarios" subtitle={`${data?.total ?? '—'} usuarios en la plataforma`} actions={canWrite && <Button onClick={() => setF({ email: '', name: '', role: 'employee' })}>Invitar usuario</Button>} />
      <div className="mb-4 flex gap-2"><Input placeholder="Buscar por email o nombre" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <div className="w-48"><Select value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: '', label: 'Todos los roles' }, ...Object.entries(ROLE).map(([value, label]) => ({ value, label }))]} /></div></div>
      <div className="panel"><Table rows={data?.items || []} columns={[
        { key: 'e', label: 'Usuario', render: (u) => <><b>{u.name || '—'}</b><span className="block text-xs text-ink-soft">{u.email}</span></> },
        { key: 'r', label: 'Rol', render: (u) => (canWrite && u._id !== user.id && u.role !== 'superadmin' ? <select className="field py-1" value={u.role} onChange={(e) => act(() => api.patch(`/admin/users/${u._id}`, { role: e.target.value }), 'Rol actualizado')}>{[...new Set([u.role, ...roleOptions.map((o) => o.value)])].map((v) => <option key={v} value={v}>{ROLE[v]}</option>)}</select> : ROLE[u.role]) },
        { key: 't', label: 'Cliente', render: (u) => u.tenantId?.name || '—' },
        { key: 's', label: 'Estado', render: (u) => <Badge tone={u.status === 'active' ? 'ok' : 'bad'}>{u.status === 'active' ? 'Activo' : 'Deshabilitado'}</Badge> },
        { key: 'l', label: 'Último acceso', render: (u) => fmtDate(u.lastLoginAt) },
        { key: 'o', label: '', render: (u) => canWrite && u._id !== user.id && <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => act(() => api.post(`/admin/users/${u._id}/logout-all`), 'Sesiones cerradas')}>Cerrar sesiones</Button>
          <Button size="sm" variant="ghost" onClick={() => act(() => api.patch(`/admin/users/${u._id}`, { status: u.status === 'active' ? 'disabled' : 'active' }), 'Estado actualizado')}>{u.status === 'active' ? 'Deshabilitar' : 'Habilitar'}</Button></div> },
      ]} /></div>
      <Modal open={!!f} onClose={() => setF(null)} title="Invitar usuario" footer={<Button onClick={() => act(async () => { await api.post('/admin/users', f); setF(null); }, 'Usuario invitado')}>Enviar invitación</Button>}>
        {f && <><Field label="Nombre"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email" hint="Entrará con Google o con un código enviado a este correo."><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Rol"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} options={roleOptions} /></Field></>}
      </Modal>
    </>
  );
}
