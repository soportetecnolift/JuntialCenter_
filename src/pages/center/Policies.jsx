import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowDown, FlaskConical, ShieldCheck } from 'lucide-react';
import { api, errMsg } from '../../lib/api.js';
import { PageHeader, Section, Button, Field, Input, Select, Toggle, Badge, Modal, Empty, useToast } from '../../components/ui.jsx';

const CATS = { data: 'Cambiar datos', external: 'Comunicarse con clientes', destructive: 'Irreversible', internal: 'Avisar / organizarse' };
const KINDS = { department_head: 'Responsable del área', department: 'Miembros de un área', role: 'Por rol', members: 'Personas concretas' };
const TIMEOUT = { remind: 'Recordar', escalate: 'Escalar', approve: 'Aprobar automáticamente', reject: 'Rechazar automáticamente' };
const blankStep = () => ({ name: 'Responsable del área', approvers: { kind: 'department_head', memberIds: [], orgRoles: [], appRoles: [], departmentIds: [] }, mode: 'any', quorum: 2, timeoutHours: 24, onTimeout: 'remind', escalate: { kind: 'role', memberIds: [], orgRoles: ['owner'], appRoles: [], departmentIds: [] } });
const blank = () => ({ name: '', description: '', enabled: true, priority: 100, match: { app: 'juntialagents', agentIds: [], departmentIds: [], categories: ['data', 'external', 'destructive'], toolPattern: '', minAmount: null }, steps: [blankStep()] });

function Chips({ items, value, onChange }) { return <div className="flex flex-wrap gap-1.5">{items.map(([v, l]) => { const on = value.includes(v); return <button type="button" key={v} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])} className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-tide bg-tide text-white' : 'border-line'}`}>{l}</button>; })}</div>; }
function ApproverEditor({ spec, onChange, deps, members, label = 'Aprueban' }) {
  return <div className="space-y-2">
    <Field label={label}><Select value={spec.kind} onChange={(e) => onChange({ ...spec, kind: e.target.value })} options={Object.entries(KINDS).map(([v, l]) => ({ value: v, label: l }))} /></Field>
    {['department', 'department_head'].includes(spec.kind) && <div><p className="mb-1 text-xs text-ink-soft">{spec.kind === 'department_head' ? 'Vacío = el responsable del área del agente.' : 'Vacío = el área del agente.'}</p><Chips items={deps.map((d) => [d._id, d.name])} value={spec.departmentIds || []} onChange={(v) => onChange({ ...spec, departmentIds: v })} /></div>}
    {spec.kind === 'role' && <div className="space-y-1.5"><Chips items={[['owner', 'Propietario'], ['admin', 'Administradores']]} value={spec.orgRoles || []} onChange={(v) => onChange({ ...spec, orgRoles: v })} /><Chips items={[['admin', 'Admin. de JuntialAgents'], ['editor', 'Editores de JuntialAgents']]} value={spec.appRoles || []} onChange={(v) => onChange({ ...spec, appRoles: v })} /></div>}
    {spec.kind === 'members' && <Chips items={members.map((m) => [m._id, m.name || m.email])} value={spec.memberIds || []} onChange={(v) => onChange({ ...spec, memberIds: v })} />}
  </div>;
}

export default function Policies() {
  const toast = useToast();
  const list = useQuery({ queryKey: ['center-policies'], queryFn: () => api.get('/center/policies').then((r) => r.data) });
  const deps = useQuery({ queryKey: ['center-deps'], queryFn: () => api.get('/center/departments').then((r) => r.data) });
  const members = useQuery({ queryKey: ['center-members'], queryFn: () => api.get('/center/members').then((r) => r.data) });
  const [p, setP] = useState(null); const [sim, setSim] = useState({ agentId: '', category: 'data', tool: '', amount: '' }); const [simOut, setSimOut] = useState(null);
  const D = deps.data || []; const Mb = members.data || []; const workers = []; // los agentes viven en cada app: aquí se filtra por área, tipo de acción, herramienta e importe
  const setStep = (i, patch) => setP({ ...p, steps: p.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const save = async () => { try { const { _id, orgId, createdAt, updatedAt, __v, ...b } = p; b.match = { ...b.match, minAmount: b.match.minAmount === '' || b.match.minAmount == null ? null : Number(b.match.minAmount) }; _id ? await api.put(`/center/policies/${_id}`, b) : await api.post('/center/policies', b); toast('Política guardada'); setP(null); list.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } };
  return (
    <>
      <PageHeader title="Políticas de aprobación" subtitle="Quién aprueba qué: por área, tipo de cambio, herramienta, agente o importe, en uno o varios pasos. Se aplica la primera que encaje (menor prioridad primero)." actions={<Button onClick={() => setP(blank())}><Plus size={16} />Nueva política</Button>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div>{!list.data?.length ? <Empty title="Sin políticas">Sin políticas, cualquier responsable (propietario o administradores) decide. Ejemplo: «Compras de Operaciones de más de 5.000 € → responsable del área y después las dos firmas de Dirección».</Empty> : (
          <ul className="space-y-3">{list.data.map((x) => (
            <li key={x._id}><button onClick={() => setP(JSON.parse(JSON.stringify(x)))} className="panel block w-full p-4 text-left hover:border-tide">
              <span className="flex flex-wrap items-center gap-2"><ShieldCheck size={16} className="text-tide" /><b>{x.name}</b><Badge>{`Prioridad ${x.priority}`}</Badge>{!x.enabled && <Badge tone="neutral">Pausada</Badge>}</span>
              <span className="mt-1 block text-xs text-ink-soft">Cuando: {x.match.categories?.length ? x.match.categories.map((c) => CATS[c]).join(', ') : 'cualquier acción'}{x.match.departmentIds?.length ? ` · áreas ${x.match.departmentIds.map((id) => D.find((d) => d._id === id)?.name).join(', ')}` : ''}{x.match.minAmount != null ? ` · desde ${Number(x.match.minAmount).toLocaleString('es-ES')} €` : ''}{x.match.toolPattern ? ` · herramientas «${x.match.toolPattern}»` : ''}</span>
              <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">{x.steps.map((s, i) => <span key={i} className="flex items-center gap-1.5">{i > 0 && <span aria-hidden="true">→</span>}<span className="rounded-md bg-mist px-2 py-1 font-semibold">{s.name}</span></span>)}</span>
            </button></li>))}</ul>)}</div>
        <Section title={<span className="flex items-center gap-2"><FlaskConical size={16} />Simulador</span>} description="¿Quién aprobaría esta acción?">
          <div className="space-y-3">
            <Field label="Área"><Select value={sim.departmentId || ''} onChange={(e) => setSim({ ...sim, departmentId: e.target.value })} options={[{ value: '', label: 'Cualquiera' }, ...D.map((d) => ({ value: d._id, label: d.name }))]} /></Field>
            <Field label="Tipo de acción"><Select value={sim.category} onChange={(e) => setSim({ ...sim, category: e.target.value })} options={Object.entries(CATS).map(([v, l]) => ({ value: v, label: l }))} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Herramienta"><Input value={sim.tool} onChange={(e) => setSim({ ...sim, tool: e.target.value })} placeholder="create_bill" /></Field><Field label="Importe (€)"><Input type="number" value={sim.amount} onChange={(e) => setSim({ ...sim, amount: e.target.value })} /></Field></div>
            <Button className="w-full" onClick={async () => { try { setSimOut((await api.post('/center/policies/simulate', { ...sim, departmentId: sim.departmentId || undefined, amount: sim.amount === '' ? null : Number(sim.amount) })).data); } catch (e) { toast(errMsg(e), 'bad'); } }}>Simular</Button>
            {simOut && <div className="rounded-lg bg-mist p-3 text-sm" role="status">{!simOut.policy ? simOut.info : <><b>{simOut.policy.name}</b><ol className="mt-2 space-y-1.5">{simOut.steps.map((s, i) => <li key={i}><b>{i + 1}. {s.name}</b> <span className="text-xs text-ink-soft">({s.mode === 'all' ? 'todos' : s.mode === 'quorum' ? `mínimo ${s.quorum}` : 'cualquiera'}, {s.timeoutHours} h)</span><br /><span className="text-xs">{s.approvers.map((m) => m.name).join(', ') || 'nadie → decide el propietario'}</span></li>)}</ol></>}</div>}
          </div>
        </Section>
      </div>

      <Modal open={!!p} onClose={() => setP(null)} title={p?._id ? `Editar «${p.name}»` : 'Nueva política'} footer={<>{p?._id && <Button variant="danger" onClick={async () => { if (confirm('¿Eliminar la política?')) { await api.delete(`/center/policies/${p._id}`); setP(null); list.refetch(); } }}><Trash2 size={16} /></Button>}<Button onClick={save}>Guardar política</Button></>}>
        {p && <>
          <div className="grid gap-3 sm:grid-cols-[1fr_110px]"><Field label="Nombre"><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Compras de Operaciones > 5.000 €" /></Field><Field label="Prioridad"><Input type="number" value={p.priority} onChange={(e) => setP({ ...p, priority: +e.target.value })} /></Field></div>
          <Toggle checked={p.enabled} onChange={(v) => setP({ ...p, enabled: v })} label={p.enabled ? 'Activa' : 'Pausada'} />
          <fieldset className="rounded-xl border border-line p-3"><legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink-soft">Cuándo se aplica</legend>
            <div className="space-y-3"><Field label="Tipo de acción (vacío = cualquiera)"><Chips items={Object.entries(CATS)} value={p.match.categories} onChange={(v) => setP({ ...p, match: { ...p.match, categories: v } })} /></Field>
              <Field label="Área del agente (vacío = cualquiera)"><Chips items={D.map((d) => [d._id, d.name])} value={p.match.departmentIds} onChange={(v) => setP({ ...p, match: { ...p.match, departmentIds: v } })} /></Field>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Herramienta (texto o expresión)" hint="Ej.: bill|invoice"><Input value={p.match.toolPattern} onChange={(e) => setP({ ...p, match: { ...p.match, toolPattern: e.target.value } })} /></Field><Field label="Importe mínimo (€)" hint="Se detecta en total, importe, amount…"><Input type="number" value={p.match.minAmount ?? ''} onChange={(e) => setP({ ...p, match: { ...p.match, minAmount: e.target.value } })} /></Field></div></div>
          </fieldset>
          <div>{p.steps.map((s, i) => (
            <div key={i}>{i > 0 && <div className="flex justify-center py-1 text-line" aria-hidden="true"><ArrowDown size={18} /></div>}
              <fieldset className="rounded-xl border border-line p-3"><legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink-soft">Paso {i + 1}</legend>
                <div className="space-y-3"><div className="flex gap-2"><Input value={s.name} onChange={(e) => setStep(i, { name: e.target.value })} aria-label="Nombre del paso" />{p.steps.length > 1 && <button aria-label="Quitar paso" onClick={() => setP({ ...p, steps: p.steps.filter((_, j) => j !== i) })} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-flare-tint hover:text-flare"><Trash2 size={16} /></button>}</div>
                  <ApproverEditor spec={s.approvers} deps={D} members={Mb} onChange={(v) => setStep(i, { approvers: v })} />
                  <div className="grid gap-3 sm:grid-cols-3"><Field label="Hace falta"><Select value={s.mode} onChange={(e) => setStep(i, { mode: e.target.value })} options={[{ value: 'any', label: 'Uno cualquiera' }, { value: 'all', label: 'Todos' }, { value: 'quorum', label: 'Un mínimo' }]} /></Field>
                    {s.mode === 'quorum' && <Field label="Mínimo"><Input type="number" min="1" value={s.quorum} onChange={(e) => setStep(i, { quorum: +e.target.value })} /></Field>}
                    <Field label="Plazo (horas)"><Input type="number" min="0.25" step="0.25" value={s.timeoutHours} onChange={(e) => setStep(i, { timeoutHours: +e.target.value })} /></Field></div>
                  <Field label="Si vence el plazo"><Select value={s.onTimeout} onChange={(e) => setStep(i, { onTimeout: e.target.value })} options={Object.entries(TIMEOUT).map(([v, l]) => ({ value: v, label: l }))} /></Field>
                  {s.onTimeout === 'escalate' && <div className="rounded-lg bg-mist p-3"><ApproverEditor label="Escalar a" spec={s.escalate || blankStep().escalate} deps={D} members={Mb} onChange={(v) => setStep(i, { escalate: v })} /></div>}</div>
              </fieldset></div>))}
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => setP({ ...p, steps: [...p.steps, { ...blankStep(), name: `Paso ${p.steps.length + 1}`, approvers: { ...blankStep().approvers, kind: 'role', orgRoles: ['owner'] } }] })}><Plus size={14} />Añadir paso</Button></div>
        </>}
      </Modal>
    </>
  );
}
