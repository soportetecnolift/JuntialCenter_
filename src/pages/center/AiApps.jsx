import { useQuery } from '@tanstack/react-query';
import { Sparkles, Copy, Unplug } from 'lucide-react';
import { api } from '../../lib/api.js';
import { PageHeader, Section, Button, Badge, fmtDate, useToast } from '../../components/ui.jsx';

/** Conectar Claude, ChatGPT y otras apps de IA al MCP de Juntial con OAuth. */
export default function AiApps() {
  const toast = useToast();
  const info = useQuery({ queryKey: ['mcp-info'], queryFn: () => api.get('/center/mcp-info').then((r) => r.data) });
  const grants = useQuery({ queryKey: ['ai-apps'], queryFn: () => api.get('/center/ai-apps').then((r) => r.data) });
  const url = info.data?.url || '';
  const copy = () => { navigator.clipboard.writeText(url); toast('URL copiada'); };
  const Guide = ({ name, logo, steps }) => (
    <div className="panel p-4"><b className="flex items-center gap-2 text-base"><span aria-hidden="true">{logo}</span>{name}</b><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>);
  return (
    <>
      <PageHeader title="Apps de IA (MCP)" subtitle="Conecta Claude, ChatGPT o cualquier cliente MCP a tu organización. Entran con OAuth: cada persona autoriza con su cuenta y la app solo puede hacer lo que esa persona tiene permitido." />
      <Section title={<span className="flex items-center gap-2"><Sparkles size={16} />URL del servidor MCP</span>}>
        <div className="flex flex-col gap-2 sm:flex-row"><code className="flex-1 truncate rounded-lg bg-mist px-3 py-2.5 font-mono text-sm">{url}</code><Button onClick={copy}><Copy size={16} />Copiar</Button></div>
        <p className="mt-2 text-xs text-ink-soft">Incluye 39 herramientas: agentes y empleados digitales (preguntar, encargar, actividad), aprobaciones (ver, decidir, simular), CRM, reglas de flujo, funciones, documentos, mensajería, registros, miembros, áreas y eventos, además de <code>search</code> y <code>fetch</code> para ChatGPT.</p>
      </Section>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Guide name="Claude" logo="✳️" steps={['Ve a Ajustes → Conectores → Añadir conector personalizado.', 'Pega la URL del servidor MCP y guarda.', 'Pulsa Conectar: se abrirá Juntial para que autorices y elijas la organización.', 'Listo: pide a Claude, por ejemplo, «¿qué aprobaciones tengo pendientes?».']} />
        <Guide name="ChatGPT" logo="◎" steps={['Ve a Ajustes → Aplicaciones y conectores → Crear (modo desarrollador si te lo pide).', 'Pega la URL del servidor MCP y elige autenticación OAuth.', 'Autoriza en Juntial y elige la organización.', 'Úsalo en el chat o en investigación profunda (usa search y fetch).']} />
      </div>
      <div className="mt-5"><Section title="Apps conectadas" description="Quién ha conectado qué app y con qué permisos. Desconectar revoca su acceso al momento.">
        {!grants.data?.length ? <p className="text-sm text-ink-soft">Ninguna app de IA conectada todavía.</p> : <ul className="divide-y divide-line">{grants.data.map((g) => <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><span><b>{g.app}</b> · {g.user} {g.scopes.includes('juntial:write') ? <Badge tone="warn">Lectura y escritura</Badge> : <Badge>Solo lectura</Badge>}<span className="block text-xs text-ink-soft">Conectada {fmtDate(g.createdAt)}{g.lastUsedAt ? ` · último uso ${fmtDate(g.lastUsedAt)}` : ''}</span></span>
          <Button size="sm" variant="danger" onClick={async () => { if (confirm(`¿Desconectar ${g.app}?`)) { await api.delete(`/center/ai-apps/${g.id}`); grants.refetch(); toast('Desconectada'); } }}><Unplug size={14} />Desconectar</Button></li>)}</ul>}
      </Section></div>
    </>
  );
}
