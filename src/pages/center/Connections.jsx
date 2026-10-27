import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, KeyRound, Play } from 'lucide-react';
import { api, errMsg } from '../../lib/api.js';
import { PageHeader, Button, Field, Input, Select, Textarea, Badge, Modal, Empty, fmtDate, useToast } from '../../components/ui.jsx';

const TYPES = { bearer: 'Token Bearer', api_key: 'API key en cabecera', basic: 'Usuario y contraseña (Basic)', headers: 'Cabeceras personalizadas', oauth2_client_credentials: 'OAuth 2 (client credentials)' };
const FIELDS = { bearer: [['token', 'Token']], api_key: [['headerName', 'Nombre de la cabecera', 'X-API-Key'], ['apiKey', 'API key']], basic: [['username', 'Usuario'], ['password', 'Contraseña']], oauth2_client_credentials: [['tokenUrl', 'URL del token'], ['clientId', 'Client ID'], ['clientSecret', 'Client secret'], ['scope', 'Scope (opcional)']], headers: [] };
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
export default function Connections() {
  const toast = useToast(); const list = useQuery({ queryKey: ['center-conns'], queryFn: () => api.get('/center/connections').then((r) => r.data) });
  const [f, setF] = useState(null); const [test, setTest] = useState(null);
  const save = async () => { try { const creds = f.type === 'headers' ? { headers: Object.fromEntries(f.headersText.split('\n').map((l) => l.split(':')).filter((x) => x[1]).map(([k, ...v]) => [k.trim(), v.join(':').trim()])) } : Object.fromEntries((FIELDS[f.type] || []).map(([k]) => [k, f.creds[k] || ''])); const b = { name: f.name, service: f.service, description: f.description, type: f.type, baseUrl: f.baseUrl, apps: ['juntialagents'], ...(f._id ? (Object.values(creds).some(Boolean) ? { credentials: creds } : {}) : { slug: f.slug, credentials: creds }) }; f._id ? await api.put(`/center/connections/${f._id}`, b) : await api.post('/center/connections', b); toast('Conexión guardada'); setF(null); list.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } };
  return (
    <>
      <PageHeader title="Conexiones" subtitle="Credenciales de tus servicios guardadas una vez y cifradas. Tus funciones las usan con jx.connections.request('nombre', …) sin ver nunca el secreto." actions={<Button onClick={() => setF({ name: '', slug: '', service: '', description: '', type: 'bearer', baseUrl: '', creds: {}, headersText: '' })}><Plus size={16} />Nueva conexión</Button>} />
      {!list.data?.length ? <Empty title="Sin conexiones">Ejemplo: tu ERP con un token Bearer y su URL base. Así ninguna función tiene que guardar la clave.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.data.map((c) => (
          <div key={c._id} className="panel p-4"><span className="flex items-center gap-2"><KeyRound size={16} className="text-tide" /><b>{c.name}</b><Badge>{TYPES[c.type]}</Badge></span>
            <code className="mt-1 block text-xs text-ink-soft">jx.connections.request('{c.slug}', …)</code>
            <p className="mt-1 text-xs text-ink-soft">{c.baseUrl || 'Sin URL base'} · {c.uses || 0} usos{c.lastUsedAt ? ` · último ${fmtDate(c.lastUsedAt)}` : ''}</p>
            <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setF({ ...c, creds: {}, headersText: '' })}>Editar</Button><Button size="sm" variant="ghost" onClick={() => setTest({ c, url: '', out: null })}><Play size={14} />Probar</Button></div></div>))}</div>)}
      <Modal open={!!f} onClose={() => setF(null)} title={f?._id ? `Editar ${f.name}` : 'Nueva conexión'} footer={<>{f?._id && <Button variant="danger" onClick={async () => { if (confirm('¿Eliminar? Las funciones que la usen fallarán.')) { await api.delete(`/center/connections/${f._id}`); setF(null); list.refetch(); } }}>Eliminar</Button>}<Button onClick={save}>Guardar</Button></>}>
        {f && <><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: f._id ? f.slug : slug(e.target.value) })} placeholder="ERP Tecnolift" /></Field><Field label="Nombre API"><Input className="font-mono" disabled={!!f._id} value={f.slug} onChange={(e) => setF({ ...f, slug: slug(e.target.value) })} /></Field></div>
          <Field label="URL base (https)" hint="Las peticiones solo podrán ir a esta dirección."><Input value={f.baseUrl} onChange={(e) => setF({ ...f, baseUrl: e.target.value })} placeholder="https://erp.tuempresa.com/api" /></Field>
          <Field label="Tipo"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={Object.entries(TYPES).map(([v, l]) => ({ value: v, label: l }))} /></Field>
          {f.type === 'headers' ? <Field label="Cabeceras" hint="Una por línea: Nombre: valor"><Textarea rows={3} className="font-mono text-xs" value={f.headersText} onChange={(e) => setF({ ...f, headersText: e.target.value })} /></Field>
            : (FIELDS[f.type] || []).map(([k, l, ph]) => <Field key={k} label={l} hint={f._id ? 'Vacío = sin cambios' : ''}><Input type={/secret|password|token|apiKey/i.test(k) ? 'password' : 'text'} value={f.creds[k] || ''} placeholder={ph} onChange={(e) => setF({ ...f, creds: { ...f.creds, [k]: e.target.value } })} /></Field>)}</>}
      </Modal>
      <Modal open={!!test} onClose={() => setTest(null)} title={`Probar ${test?.c.name}`} footer={<Button onClick={async () => { const { data } = await api.post(`/center/connections/${test.c._id}/test`, { url: test.url }); setTest({ ...test, out: data }); }}>Enviar GET</Button>}>
        {test && <><Field label="Ruta" hint="Relativa a la URL base."><Input value={test.url} onChange={(e) => setTest({ ...test, url: e.target.value })} placeholder="/status" /></Field>
          {test.out && <pre className="max-h-60 overflow-auto rounded-lg bg-mist p-3 font-mono text-xs">{JSON.stringify(test.out, null, 2)}</pre>}</>}
      </Modal>
    </>
  );
}
