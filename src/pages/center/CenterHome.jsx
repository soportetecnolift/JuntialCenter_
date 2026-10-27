import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Network, ShieldCheck, KeyRound, Waypoints, Sparkles, ArrowRight, Inbox } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useCenter, isOrgAdmin } from '../../lib/center.js';
import { PageHeader, Badge } from '../../components/ui.jsx';

export default function CenterHome() {
  const { data: c } = useCenter();
  const org = useQuery({ queryKey: ['center-org'], queryFn: () => api.get('/center/org').then((r) => r.data) });
  const pend = useQuery({ queryKey: ['center-approvals', 'mine', 'pending'], queryFn: () => api.get('/center/approvals?scope=mine&status=pending').then((r) => r.data) });
  const ev = useQuery({ queryKey: ['center-events-home'], queryFn: () => api.get('/center/events?limit=8').then((r) => r.data) });
  if (!c) return <p className="text-ink-soft">Cargando…</p>;
  const tiles = [
    ['/center/approvals', Inbox, 'Mis aprobaciones', `${pend.data?.filter((a) => a.mine).length ?? '…'} pendientes`],
    ['/center/members', Users, 'Miembros', `${org.data?.members ?? '…'} personas`],
    ['/center/departments', Network, 'Áreas', 'Departamentos y responsables'],
    ['/center/policies', ShieldCheck, 'Políticas de aprobación', 'Quién aprueba qué'],
    ['/center/connections', KeyRound, 'Conexiones', 'Credenciales compartidas'],
    ['/center/integrations', Waypoints, 'Integraciones', 'Eventos entre apps'],
    ['/center/ai', Sparkles, 'Apps de IA (MCP)', 'Claude, ChatGPT…'],
  ];
  return (
    <>
      <PageHeader title={org.data?.name || 'Juntial Center'} subtitle={`Juntial Center · plan ${org.data?.subscription?.planId?.name || '—'} · ${c.membership?.orgRole === 'owner' ? 'eres propietario' : c.membership?.orgRole === 'admin' ? 'eres administrador' : 'eres miembro'}`} />
      <section aria-labelledby="apps-h" className="mb-6">
        <h2 id="apps-h" className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">Aplicaciones</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{c.apps.map((a) => {
          const usable = a.status === 'available' && a.enabled && a.myRole !== 'none';
          const inner = <>
            <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl" style={{ background: `${a.color}22` }} aria-hidden="true">{a.icon}</span>
            <span className="mt-3 flex items-center gap-2"><b>{a.name}</b>{a.status === 'soon' ? <Badge>Próximamente</Badge> : !a.enabled ? <Badge tone="warn">Desactivada</Badge> : a.myRole === 'none' ? <Badge tone="bad">Sin acceso</Badge> : <Badge tone="ok">{c.appRoles[a.myRole]?.label}</Badge>}</span>
            <span className="mt-1 text-sm text-ink-soft">{a.tagline}</span>
            {usable && <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-tide">Abrir <ArrowRight size={14} /></span>}</>;
          return usable ? <a key={a.id} href={a.url} className="panel flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md">{inner}</a> : <div key={a.id} className="panel flex flex-col p-4 opacity-70">{inner}</div>;
        })}</div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="adm-h"><h2 id="adm-h" className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">Organización</h2>
          <div className="grid gap-3 sm:grid-cols-2">{tiles.filter(([to]) => isOrgAdmin(c) || ['/center/approvals', '/center/ai', '/center/members', '/center/departments'].includes(to)).map(([to, I, t, d]) => (
            <Link key={to} to={to} className="panel flex items-center gap-3 p-4 hover:border-tide"><span className="grid h-10 w-10 place-items-center rounded-lg bg-tide-tint text-tide-dark"><I size={18} /></span><span className="min-w-0"><b className="block text-sm">{t}</b><span className="text-xs text-ink-soft">{d}</span></span></Link>))}</div>
        </section>
        <section aria-labelledby="ev-h" className="panel p-4"><h2 id="ev-h" className="mb-2 font-semibold">Actividad reciente</h2>
          <ul className="space-y-2 text-sm">{(ev.data || []).map((e) => <li key={e._id} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tide" /><span><code className="text-xs">{e.type}</code> <span className="text-ink-soft">{e.data?.label || e.data?.email || e.data?.trigger || ''}</span></span></li>)}
            {!ev.data?.length && <li className="text-ink-soft">Sin actividad todavía.</li>}</ul>
          <Link to="/center/integrations" className="mt-3 inline-block text-sm font-semibold text-tide">Ver todos los eventos</Link></section>
      </div>
    </>
  );
}
