import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Waypoints } from 'lucide-react';
import { api, errMsg } from '../../lib/api.js';
import { PageHeader, Section, Button, Field, Input, Badge, Modal, Toggle, fmtDate, useToast } from '../../components/ui.jsx';

export default function Integrations() {
  const toast = useToast(); const [type, setType] = useState('');
  const events = useQuery({ queryKey: ['center-events', type], queryFn: () => api.get(`/center/events?limit=150${type ? `&type=${type}` : ''}`).then((r) => r.data), refetchInterval: 10000 });
  const types = useQuery({ queryKey: ['center-ev-types'], queryFn: () => api.get('/center/event-types').then((r) => r.data) });
  const subs = useQuery({ queryKey: ['center-subs'], queryFn: () => api.get('/center/subscriptions').then((r) => r.data) });
  const [f, setF] = useState(null); const [secret, setSecret] = useState(null); const [open, setOpen] = useState(null);
  return (
    <>
      <PageHeader title="Integraciones" subtitle="El bus de eventos de tu organización: lo que pasa en cada app de Juntial queda aquí y puede avisar a otras apps o a tus sistemas (Make, n8n, ERP…) por webhook firmado." actions={<Button onClick={() => setF({ name: '', url: '', events: ['approval.*'] })}><Plus size={16} />Suscribirse a eventos</Button>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <Section title="Eventos" actions={<Input value={type} onChange={(e) => setType(e.target.value.replace(/[^\w.]/g, ''))} placeholder="Filtrar: approval." className="w-44" />}>
          <ul className="divide-y divide-line font-mono text-xs">{(events.data || []).map((e) => <li key={e._id}><button onClick={() => setOpen(open === e._id ? null : e._id)} className="flex w-full items-center gap-3 py-2 text-left"><span className="w-20 shrink-0 text-ink-soft">{new Date(e.createdAt).toLocaleTimeString('es-ES')}</span><Badge>{e.app}</Badge><b className="text-tide-dark">{e.type}</b><span className="truncate text-ink-soft">{e.actor || ''}</span></button>
            {open === e._id && <pre className="mb-2 overflow-x-auto rounded-lg bg-mist p-2">{JSON.stringify(e.data, null, 2)}</pre>}</li>)}
            {!events.data?.length && <li className="py-6 text-center font-sans text-sm text-ink-soft">Sin eventos todavía.</li>}</ul>
        </Section>
        <div className="space-y-5">
          <Section title="Suscripciones">{!subs.data?.length ? <p className="text-sm text-ink-soft">Ninguna todavía.</p> : <ul className="space-y-2">{subs.data.map((s) => <li key={s._id} className="rounded-lg border border-line p-3 text-sm"><span className="flex items-center justify-between gap-2"><b>{s.name}</b><Toggle checked={s.enabled} onChange={async (v) => { await api.put(`/center/subscriptions/${s._id}`, { enabled: v }); subs.refetch(); }} label="" /></span><span className="block truncate text-xs text-ink-soft">{s.url}</span><span className="mt-1 flex flex-wrap gap-1">{s.events.map((e) => <code key={e} className="rounded bg-mist px-1.5 text-[11px]">{e}</code>)}</span>{s.failures > 0 && <Badge tone="bad">{s.failures} fallos seguidos</Badge>}<button className="mt-1 block text-xs font-semibold text-flare" onClick={async () => { await api.delete(`/center/subscriptions/${s._id}`); subs.refetch(); }}>Eliminar</button></li>)}</ul>}</Section>
          <Section title={<span className="flex items-center gap-2"><Waypoints size={16} />Eventos disponibles</span>}><div className="flex flex-wrap gap-1">{(types.data || []).map((t) => <code key={t.type} title={t.app} className="rounded bg-mist px-1.5 py-0.5 text-[11px]">{t.type}</code>)}</div><p className="mt-2 text-xs text-ink-soft">Usa <code>prefijo.*</code> para varios (p. ej. <code>crm.*</code>). Cada entrega lleva <code>X-Juntial-Signature: t=…,v1=HMAC-SHA256(secreto, t.cuerpo)</code>.</p></Section>
        </div>
      </div>
      <Modal open={!!f} onClose={() => setF(null)} title="Suscribirse a eventos" footer={<Button onClick={async () => { try { const { data } = await api.post('/center/subscriptions', { ...f, events: f.events.filter(Boolean) }); setF(null); setSecret(data.secret); subs.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } }}>Crear</Button>}>
        {f && <><Field label="Nombre"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Make — aprobaciones" /></Field><Field label="URL (https)"><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
          <Field label="Eventos" hint="Separados por comas."><Input value={f.events.join(', ')} onChange={(e) => setF({ ...f, events: e.target.value.split(',').map((x) => x.trim()) })} /></Field></>}
      </Modal>
      <Modal open={!!secret} onClose={() => setSecret(null)} title="Secreto de firma"><p className="text-sm">Guárdalo ahora: no se volverá a mostrar.</p><Input readOnly className="font-mono" value={secret || ''} onFocus={(e) => e.target.select()} /></Modal>
    </>
  );
}
