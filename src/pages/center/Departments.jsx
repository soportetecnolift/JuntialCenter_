import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api, errMsg } from '../../lib/api.js';
import { useCenter, isOrgAdmin } from '../../lib/center.js';
import { PageHeader, Button, Field, Input, Select, Modal, Empty, useToast } from '../../components/ui.jsx';

const COLORS = ['#0E7C86', '#16324F', '#B45309', '#5B4BDB', '#B42318', '#15803D', '#9333EA', '#0369A1'];
export default function Departments() {
  const toast = useToast(); const { data: c } = useCenter(); const admin = isOrgAdmin(c);
  const deps = useQuery({ queryKey: ['center-deps'], queryFn: () => api.get('/center/departments').then((r) => r.data) });
  const members = useQuery({ queryKey: ['center-members'], queryFn: () => api.get('/center/members').then((r) => r.data) });
  const [f, setF] = useState(null);
  const who = (id) => members.data?.find((m) => m._id === id);
  return (
    <>
      <PageHeader title="Áreas" subtitle="Departamentos de la organización y su responsable. Se usan para dar permisos, asignar agentes y decidir quién aprueba." actions={admin && <Button onClick={() => setF({ name: '', description: '', color: COLORS[0], headId: '', parentId: '' })}><Plus size={16} />Nueva área</Button>} />
      {!deps.data?.length ? <Empty title="Aún no hay áreas">Ejemplo: Dirección, Operaciones, Comercial, Administración.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{deps.data.map((d) => (
          <button key={d._id} disabled={!admin} onClick={() => setF({ ...d, headId: d.headId || '', parentId: d.parentId || '' })} className="panel p-4 text-left hover:border-tide disabled:cursor-default">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: d.color }} /><b>{d.name}</b></span>
            <p className="mt-1 text-sm text-ink-soft">{d.description || '—'}</p>
            <p className="mt-3 text-xs text-ink-soft">{d.members} miembros · Responsable: <b className="text-ink">{who(d.headId)?.name || who(d.headId)?.email || 'sin asignar'}</b>{d.parentId ? ` · dentro de ${deps.data.find((x) => x._id === d.parentId)?.name || ''}` : ''}</p>
          </button>))}</div>)}
      <Modal open={!!f} onClose={() => setF(null)} title={f?._id ? `Editar ${f.name}` : 'Nueva área'} footer={<>{f?._id && <Button variant="danger" onClick={async () => { if (confirm('¿Eliminar el área?')) { await api.delete(`/center/departments/${f._id}`); setF(null); deps.refetch(); } }}>Eliminar</Button>}
        <Button onClick={async () => { try { const b = { name: f.name, description: f.description, color: f.color, headId: f.headId || null, parentId: f.parentId || null }; f._id ? await api.put(`/center/departments/${f._id}`, b) : await api.post('/center/departments', b); toast('Área guardada'); setF(null); deps.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } }}>Guardar</Button></>}>
        {f && <><Field label="Nombre"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Operaciones" /></Field>
          <Field label="Descripción"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Responsable" hint="Aprueba en las políticas «responsable del área»."><Select value={f.headId} onChange={(e) => setF({ ...f, headId: e.target.value })} options={[{ value: '', label: 'Sin asignar' }, ...(members.data || []).map((m) => ({ value: m._id, label: m.name || m.email }))]} /></Field>
            <Field label="Dentro de"><Select value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })} options={[{ value: '', label: '— (área principal)' }, ...(deps.data || []).filter((d) => d._id !== f._id).map((d) => ({ value: d._id, label: d.name }))]} /></Field></div>
          <Field label="Color"><div className="flex gap-2">{COLORS.map((col) => <button key={col} type="button" aria-label={col} aria-pressed={f.color === col} onClick={() => setF({ ...f, color: col })} className={`h-8 w-8 rounded-full ${f.color === col ? 'ring-2 ring-ink ring-offset-2' : ''}`} style={{ background: col }} />)}</div></Field></>}
      </Modal>
    </>
  );
}
