import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Lock, Eye, PenLine } from 'lucide-react';
import { api, errMsg } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Button, Select } from '../components/ui.jsx';

/** Pantalla de consentimiento OAuth (Claude, ChatGPT y otras apps de IA). */
export default function OAuthConsent() {
  const [sp] = useSearchParams(); const id = sp.get('req'); const { user } = useAuth();
  const q = useQuery({ queryKey: ['oauth-req', id], enabled: !!id, retry: false, queryFn: () => api.get(`/oauth/request/${id}`).then((r) => r.data) });
  const [org, setOrg] = useState(''); const [access, setAccess] = useState('write'); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const decide = async (approve) => { setBusy(true); setErr(''); try { const { data } = await api.post('/oauth/consent', { req: id, approve, orgId: org || q.data.orgs.find((o) => o.active)?.id || q.data.orgs[0]?.id, access }); window.location.assign(data.redirect); } catch (e) { setErr(errMsg(e)); setBusy(false); } };
  const d = q.data; const wantsWrite = d?.scopes?.some((s) => s.id === 'juntial:write');
  // Apps de Juntial (SSO): no hay nada que consentir, se vuelve directamente a la app con la organización activa
  const [auto, setAuto] = useState(false);
  useEffect(() => { if (d?.client?.firstParty && !auto) { setAuto(true); decide(true); } }, [d]); // eslint-disable-line
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-mist p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3"><img src="/icon.svg" alt="" className="h-10 w-10" /><span className="text-2xl text-ink-soft" aria-hidden="true">⇄</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-harbor text-lg text-white">{d?.client.logo ? <img src={d.client.logo} alt="" className="h-10 w-10 rounded-xl" /> : '✦'}</span></div>
        {d?.client?.firstParty ? <p className="mt-4 text-ink-soft">Entrando en {d.client.name}…</p> : q.isError ? <><h1 className="mt-4 text-xl font-bold">Solicitud caducada</h1><p className="mt-1 text-sm text-ink-soft">{errMsg(q.error)}</p></> : !d ? <p className="mt-4 text-ink-soft">Cargando…</p> : <>
          <h1 className="mt-4 text-xl font-bold">{d.client.name} quiere acceder a Juntial</h1>
          <p className="mt-1 text-sm text-ink-soft">Con tu cuenta <b>{user?.email}</b>. Volverás a <b>{d.client.redirectHost}</b>.</p>
          <label className="mt-4 block text-sm font-semibold" htmlFor="org">Organización</label>
          <Select id="org" value={org || d.orgs.find((o) => o.active)?.id || ''} onChange={(e) => setOrg(e.target.value)} options={d.orgs.map((o) => ({ value: o.id, label: o.name }))} />
          <fieldset className="mt-4"><legend className="text-sm font-semibold">Permisos</legend>
            <div className="mt-2 space-y-2">{[['read', Eye, 'Solo lectura', 'Consultar agentes, CRM, reglas, funciones, aprobaciones y documentos.'], ...(wantsWrite ? [['write', PenLine, 'Lectura y escritura', 'Además: crear y modificar, ejecutar agentes y funciones, y decidir aprobaciones.']] : [])].map(([v, I, t, desc]) => (
              <label key={v} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${access === v ? 'border-tide bg-tide-tint/50' : 'border-line'}`}><input type="radio" name="access" className="mt-1 accent-tide" checked={access === v} onChange={() => setAccess(v)} /><span><b className="flex items-center gap-1.5 text-sm"><I size={14} />{t}</b><span className="text-xs text-ink-soft">{desc}</span></span></label>))}</div></fieldset>
          <p className="mt-4 flex gap-2 rounded-lg bg-mist p-3 text-xs text-ink-soft"><ShieldCheck size={16} className="shrink-0 text-tide" />La app nunca podrá hacer más de lo que tu rol permite, y las acciones de los empleados digitales siguen sus aprobaciones. Puedes desconectarla cuando quieras en Juntial Center → Apps de IA.</p>
          {err && <p className="mt-3 text-sm text-flare" role="alert">{err}</p>}
          <div className="mt-5 flex gap-2"><Button variant="secondary" className="flex-1" disabled={busy} onClick={() => decide(false)}>Cancelar</Button><Button className="flex-1" loading={busy} onClick={() => decide(true)}><Lock size={16} />Autorizar</Button></div>
        </>}
      </div>
    </main>
  );
}
