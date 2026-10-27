import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Mail, Trash2 } from 'lucide-react';
import { api, errMsg } from '../../lib/api.js';
import { useCenter, isOrgAdmin } from '../../lib/center.js';
import { PageHeader, Section, Button, Field, Input, Select, Badge, Modal, Table, fmtDate, useToast } from '../../components/ui.jsx';

const ROLE = { owner: ['Propietario', 'ok'], admin: ['Administrador', 'warn'], member: ['Miembro', 'neutral'] };
function DeptChips({ deps, value, onChange }) {
  return <div className="flex flex-wrap gap-1.5">{deps.map((d) => { const on = value.includes(d._id); return <button type="button" key={d._id} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== d._id) : [...value, d._id])} className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-transparent text-white' : 'border-line'}`} style={on ? { background: d.color } : {}}>{d.name}</button>; })}{!deps.length && <span className="text-xs text-ink-soft">Crea áreas en «Áreas».</span>}</div>;
}
function AppRoles({ apps, roles, value, onChange, disabled }) {
  return <div className="space-y-2">{apps.filter((a) => a.status === 'available').map((a) => <div key={a.id} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm"><span aria-hidden="true">{a.icon}</span>{a.name}</span><div className="w-44"><Select disabled={disabled} value={value[a.id] || 'none'} onChange={(e) => onChange({ ...value, [a.id]: e.target.value })} options={a.roles.map((r) => ({ value: r, label: roles[r]?.label || r }))} /></div></div>)}</div>;
}

export default function Members() {
  const toast = useToast(); const { data: c } = useCenter(); const admin = isOrgAdmin(c);
  const members = useQuery({ queryKey: ['center-members'], queryFn: () => api.get('/center/members').then((r) => r.data) });
  const deps = useQuery({ queryKey: ['center-deps'], queryFn: () => api.get('/center/departments').then((r) => r.data) });
  const invites = useQuery({ queryKey: ['center-invites'], enabled: admin, queryFn: () => api.get('/center/invitations').then((r) => r.data) });
  const [edit, setEdit] = useState(null); const [inv, setInv] = useState(null);
  if (!c) return null;
  const depName = (id) => deps.data?.find((d) => d._id === id);
  return (
    <>
      <PageHeader title="Miembros" subtitle="Personas de la organización, su rol, sus áreas y a qué aplicaciones acceden." actions={admin && <Button onClick={() => setInv({ email: '', orgRole: 'member', title: '', departmentIds: [], appRoles: { juntialagents: 'editor' } })}><UserPlus size={16} />Invitar</Button>} />
      <div className="panel"><Table rows={members.data || []} onRowClick={admin ? (m) => setEdit({ ...m, departmentIds: (m.departmentIds || []).map(String), telegramUsername: m.telegramUsername || '', title: m.title || '' }) : undefined} columns={[
        { key: 'n', label: 'Persona', render: (m) => <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-harbor text-xs font-bold text-white">{(m.name || m.email).slice(0, 2).toUpperCase()}</span><span><b className="block text-sm">{m.name || m.email}</b><span className="text-xs text-ink-soft">{m.email}{m.title ? ` · ${m.title}` : ''}</span></span></span> },
        { key: 'r', label: 'Rol', render: (m) => <Badge tone={ROLE[m.orgRole][1]}>{ROLE[m.orgRole][0]}</Badge> },
        { key: 'd', label: 'Áreas', render: (m) => <span className="flex flex-wrap gap-1">{(m.departmentIds || []).map((id) => { const d = depName(id); return d ? <span key={id} className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: d.color }}>{d.name}</span> : null; })}</span> },
        { key: 'a', label: 'JuntialAgents', render: (m) => c.appRoles[m.orgRole === 'owner' ? 'admin' : m.appRoles?.juntialagents || 'none']?.label },
        { key: 't', label: 'Telegram', render: (m) => (m.telegramUsername ? `@${m.telegramUsername}` : '—') },
        { key: 's', label: '', render: (m) => (m.status === 'disabled' ? <Badge tone="bad">Desactivado</Badge> : null) },
      ]} /></div>
      {admin && invites.data?.length > 0 && <div className="mt-5"><Section title="Invitaciones pendientes"><ul className="divide-y divide-line">{invites.data.map((i) => <li key={i._id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="flex items-center gap-2"><Mail size={14} className="text-ink-soft" />{i.email} · <span className="text-ink-soft">caduca {fmtDate(i.expiresAt)}</span></span><Button size="sm" variant="ghost" onClick={async () => { await api.delete(`/center/invitations/${i._id}`); invites.refetch(); }}>Anular</Button></li>)}</ul></Section></div>}

      <Modal open={!!inv} onClose={() => setInv(null)} title="Invitar a la organización" footer={<Button onClick={async () => { try { const { data } = await api.post('/center/invitations', inv); toast('Invitación enviada por email'); setInv(null); invites.refetch(); navigator.clipboard?.writeText(data.link).catch(() => {}); } catch (e) { toast(errMsg(e), 'bad'); } }}>Enviar invitación</Button>}>
        {inv && <><Field label="Email"><Input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Rol en la organización"><Select value={inv.orgRole} onChange={(e) => setInv({ ...inv, orgRole: e.target.value })} options={[{ value: 'member', label: 'Miembro' }, { value: 'admin', label: 'Administrador' }]} /></Field><Field label="Puesto (opcional)"><Input value={inv.title} onChange={(e) => setInv({ ...inv, title: e.target.value })} /></Field></div>
          <Field label="Áreas"><DeptChips deps={deps.data || []} value={inv.departmentIds} onChange={(v) => setInv({ ...inv, departmentIds: v })} /></Field>
          <Field label="Acceso a aplicaciones"><AppRoles apps={c.apps} roles={c.appRoles} value={inv.appRoles} onChange={(v) => setInv({ ...inv, appRoles: v })} /></Field>
          <p className="text-xs text-ink-soft">El enlace también se copia al portapapeles por si quieres enviarlo tú.</p></>}
      </Modal>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.name || edit?.email} footer={edit && <>{edit.orgRole !== 'owner' && <Button variant="danger" onClick={async () => { if (confirm('¿Quitar a esta persona de la organización?')) { await api.delete(`/center/members/${edit._id}`); setEdit(null); members.refetch(); } }}><Trash2 size={16} /></Button>}
        <Button onClick={async () => { try { const { orgRole, title, departmentIds, appRoles, telegramUsername, status } = edit; await api.put(`/center/members/${edit._id}`, { ...(edit.orgRole !== 'owner' ? { orgRole, status } : {}), title, departmentIds, appRoles, telegramUsername }); toast('Miembro actualizado'); setEdit(null); members.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } }}>Guardar</Button></>}>
        {edit && <><div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rol en la organización"><Select disabled={edit.orgRole === 'owner'} value={edit.orgRole} onChange={(e) => setEdit({ ...edit, orgRole: e.target.value })} options={[...(edit.orgRole === 'owner' ? [{ value: 'owner', label: 'Propietario' }] : []), { value: 'admin', label: 'Administrador' }, { value: 'member', label: 'Miembro' }]} /></Field>
          <Field label="Puesto"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field></div>
          <Field label="Áreas"><DeptChips deps={deps.data || []} value={edit.departmentIds} onChange={(v) => setEdit({ ...edit, departmentIds: v })} /></Field>
          <Field label="Acceso a aplicaciones"><AppRoles apps={c.apps} roles={c.appRoles} value={edit.appRoles || {}} disabled={edit.orgRole === 'owner'} onChange={(v) => setEdit({ ...edit, appRoles: v })} /></Field>
          <Field label="Usuario de Telegram" hint="Para que pueda aprobar desde los botones de Telegram."><Input value={edit.telegramUsername} onChange={(e) => setEdit({ ...edit, telegramUsername: e.target.value })} placeholder="@usuario" /></Field>
          {edit.orgRole !== 'owner' && <Field label="Estado"><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} options={[{ value: 'active', label: 'Activo' }, { value: 'disabled', label: 'Desactivado' }]} /></Field>}</>}
      </Modal>
    </>
  );
}
