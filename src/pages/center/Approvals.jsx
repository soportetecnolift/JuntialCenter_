import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, ShieldCheck } from 'lucide-react';
import { api, errMsg } from '../../lib/api.js';
import { useCenter, isOrgAdmin } from '../../lib/center.js';
import { PageHeader, Button, Input, Badge, Empty, fmtDate, useToast } from '../../components/ui.jsx';

const ST = { pending: ['Pendiente', 'warn'], approved: ['Aprobada', 'ok'], executed: ['Aprobada y ejecutada', 'ok'], approved: ['Aprobada', 'ok'], rejected: ['Rechazada', 'neutral'], failed: ['Falló', 'bad'], expired: ['Caducada', 'neutral'] };
const CAT = { data: 'Cambiar datos', external: 'Comunicarse con clientes', destructive: 'Irreversible', internal: 'Avisar', read: 'Consultar' };
/** Cadena de pasos de una aprobación, con quién votó y por dónde. */
export function Chain({ a }) {
  if (!a.steps?.length) return null;
  return (
    <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">{a.steps.map((s, i) => {
      const state = s.status === 'approved' ? 'ok' : s.status === 'rejected' ? 'bad' : i === a.currentStep && a.status === 'pending' ? 'cur' : 'wait';
      return (
        <li key={i} className={`flex-1 rounded-lg border p-2.5 text-xs ${state === 'cur' ? 'border-signal bg-signal-tint/50' : state === 'ok' ? 'border-tide/40 bg-tide-tint/40' : state === 'bad' ? 'border-flare/40 bg-flare-tint/40' : 'border-line'}`}>
          <b className="block">{i + 1}. {s.name}</b>
          <span className="text-ink-soft">{s.mode === 'all' ? 'Todos' : s.mode === 'quorum' ? `Mínimo ${s.quorum}` : 'Cualquiera'} · {s.approverNames || `${s.approverIds.length} aprobador(es)`}</span>
          {s.decisions?.length > 0 && <ul className="mt-1">{s.decisions.map((d, k) => <li key={k}>{d.decision === 'approve' ? '✅' : '❌'} {d.name} <span className="text-ink-soft">vía {d.via}</span></li>)}</ul>}
        </li>);
    })}</ol>
  );
}
export default function Approvals() {
  const toast = useToast(); const { data: c } = useCenter(); const admin = isOrgAdmin(c);
  const [scope, setScope] = useState('mine'); const [status, setStatus] = useState('pending'); const [fb, setFb] = useState({});
  const list = useQuery({ queryKey: ['center-approvals', scope, status], queryFn: () => api.get(`/center/approvals?scope=${scope}&status=${status}`).then((r) => r.data), refetchInterval: 15000 });
  const members = useQuery({ queryKey: ['center-members'], queryFn: () => api.get('/center/members').then((r) => r.data) });
  const nameOf = (id) => { const m = members.data?.find((x) => x._id === id); return m?.name || m?.email; };
  const decide = async (a, approve) => { try { const { data } = await api.post(`/center/approvals/${a._id}/decide`, { approve, feedback: fb[a._id] }); toast(data.status === 'pending' ? data.info : approve ? 'Aprobada: la app ya puede ejecutarla' : 'Rechazada', data.ok === false ? 'bad' : 'ok'); if (data.ok === false) toast(data.error, 'bad'); list.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } };
  return (
    <>
      <PageHeader title="Aprobaciones" subtitle="Todo lo que los agentes de tu organización necesitan que alguien apruebe, con la política y los pasos que le corresponden."
        actions={<div className="flex flex-wrap gap-1">{[['mine', 'Me tocan'], ...(admin ? [['all', 'Toda la organización']] : [])].map(([k, l]) => <Button key={k} size="sm" variant={scope === k ? 'primary' : 'secondary'} onClick={() => setScope(k)}>{l}</Button>)}
          {[['pending', 'Pendientes'], ['all', 'Historial']].map(([k, l]) => <Button key={k} size="sm" variant={status === k ? 'primary' : 'ghost'} onClick={() => setStatus(k)}>{l}</Button>)}</div>} />
      {!list.data?.length ? <Empty title={status === 'pending' ? 'Nada pendiente' : 'Sin historial'}>{scope === 'mine' ? 'Cuando te toque aprobar algo aparecerá aquí, en la campana y en tu email.' : ''}</Empty> : (
        <ul className="space-y-3">{list.data.map((a) => { const steps = a.steps?.map((s) => ({ ...s, approverNames: s.approverIds.map(nameOf).filter(Boolean).join(', ') })); return (
          <li key={a._id} className={`panel p-4 ${a.mine ? 'border-signal' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs"><Badge tone={ST[a.status][1]}>{ST[a.status][0]}</Badge>{a.mine && <Badge tone="warn">Te toca</Badge>}<Badge>{CAT[a.category] || a.category}</Badge>{a.policyName && <span className="flex items-center gap-1 font-semibold text-harbor"><ShieldCheck size={12} />{a.policyName}</span>}<span className="text-ink-soft">{a.agentName || a.app} · {fmtDate(a.createdAt)}{a.amount != null ? ` · ${a.amount.toLocaleString('es-ES')} €` : ''}</span></div>
            <p className="mt-2 font-semibold">{a.label}</p>
            {a.reason && <p className="mt-1 text-sm text-ink-soft"><i>Por qué:</i> {a.reason}</p>}
            <Chain a={{ ...a, steps }} />
            {a.mine && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input placeholder="Comentario (si rechazas, explica por qué: el agente aprenderá)" value={fb[a._id] || ''} onChange={(e) => setFb({ ...fb, [a._id]: e.target.value })} />
              <Button variant="danger" onClick={() => decide(a, false)}><X size={16} />Rechazar</Button><Button onClick={() => decide(a, true)}><Check size={16} />Aprobar</Button></div>}
          </li>); })}</ul>)}
    </>
  );
}
