import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, errMsg } from '../lib/api.js';
import { useAuth, isStaff } from '../lib/auth.jsx';
import { Secret as SecretBox } from '../components/ui.jsx';
import { ThemeSwitch } from '../components/Layout.jsx';
import { PageHeader, Section, Button, Field, Input, Toggle, Table, Badge, fmtDate, useToast } from '../components/ui.jsx';

export default function Settings() {
  const { user, sessionExpiresAt, setUser } = useAuth(); const toast = useToast();
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => api.get('/auth/sessions').then((r) => r.data) });
  const [pw, setPw] = useState({ current: '', password: '' });
  const [prefs, setPrefs] = useState(user.notificationPrefs || { email: true, inApp: true });
  return (
    <>
      <PageHeader title="Ajustes" subtitle={`${user.email} · tu sesión caduca el ${new Date(sessionExpiresAt).toLocaleDateString('es-ES')} (30 días desde que entraste)`} />
      <div className="space-y-5">
        <Section title="Sesiones abiertas" description="Por seguridad, cada sesión dura 30 días como máximo. Cierra las que no reconozcas.">
          <Table rows={sessions.data || []} columns={[
            { key: 'ua', label: 'Dispositivo', render: (s) => <><span className="text-sm">{s.userAgent?.slice(0, 70)}</span>{s.current && <Badge tone="ok">Esta sesión</Badge>}</> },
            { key: 'm', label: 'Método', render: (s) => ({ google: 'Google', otp: 'Código', password: 'Contraseña', staff: 'Admin + 2FA' }[s.method]) },
            { key: 'ip', label: 'IP' }, { key: 'u', label: 'Último uso', render: (s) => fmtDate(s.lastUsedAt) }, { key: 'e', label: 'Caduca', render: (s) => fmtDate(s.expiresAt) },
            { key: 'o', label: '', render: (s) => !s.current && <Button size="sm" variant="ghost" onClick={async () => { await api.delete(`/auth/sessions/${s._id}`); sessions.refetch(); }}>Cerrar</Button> },
          ]} />
        </Section>
        {isStaff(user) && <StaffMfa />}
        <Section title="Contraseña" description="Si entras con Google o con código, puedes crear una contraseña aquí. Al cambiarla se cierran las demás sesiones.">
          <div className="grid max-w-xl gap-3 md:grid-cols-2">
            <Field label="Contraseña actual"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
            <Field label="Contraseña nueva" hint="Mínimo 10 caracteres"><Input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          </div>
          <Button className="mt-4" onClick={async () => { try { await api.post('/auth/password/change', pw); toast('Contraseña actualizada'); setPw({ current: '', password: '' }); sessions.refetch(); } catch (e) { toast(errMsg(e), 'bad'); } }}>Cambiar contraseña</Button>
        </Section>
        <Section title="Apariencia" description="Por defecto sigue el modo claro u oscuro de tu dispositivo."><div className="max-w-sm"><ThemeSwitch /></div></Section>
        <Section title="Avisos">
          <div className="space-y-3">
            <Toggle checked={prefs.email} onChange={(v) => setPrefs({ ...prefs, email: v })} label="Recibir avisos por email" hint="Los avisos de seguridad (códigos, nuevos accesos) se envían siempre." />
            <Toggle checked={prefs.inApp} onChange={(v) => setPrefs({ ...prefs, inApp: v })} label="Avisos dentro de la plataforma" />
          </div>
          <Button className="mt-4" variant="secondary" onClick={async () => { await api.put('/notifications/prefs', prefs); setUser({ ...user, notificationPrefs: prefs }); toast('Preferencias guardadas'); }}>Guardar preferencias</Button>
        </Section>
      </div>
    </>
  );
}

function StaffMfa() {
  const toast = useToast(); const [code, setCode] = useState(''); const [codes, setCodes] = useState(null);
  const { data, refetch } = useQuery({ queryKey: ['mfa-status'], queryFn: () => api.get('/auth/staff/mfa/status').then((r) => r.data) });
  return (
    <Section title="Verificación en dos pasos" description="Obligatoria para el equipo. Si pierdes el móvil y los códigos de respaldo, un superadmin puede reiniciarla con npm run reset-mfa.">
      <p className="mb-3 text-sm">{data?.enabled ? <><Badge tone="ok">Activa</Badge> desde {fmtDate(data.enabledAt)} · {data.backupCodesLeft} códigos de respaldo disponibles</> : <Badge tone="warn">Se configurará en tu próximo acceso</Badge>}</p>
      {data?.enabled && (codes ? <div className="space-y-2"><p className="text-sm text-ink-soft">Tus códigos nuevos (los anteriores ya no sirven):</p><SecretBox value={codes.join('  ')} /></div> : (
        <div className="flex max-w-md flex-col gap-2 sm:flex-row"><Input inputMode="numeric" maxLength={6} placeholder="Código de la app" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <Button variant="secondary" disabled={code.length !== 6} onClick={async () => { try { const { data: r } = await api.post('/auth/staff/backup-codes', { code }); setCodes(r.backupCodes); refetch(); } catch (e) { toast(errMsg(e), 'bad'); } }}>Generar códigos nuevos</Button></div>))}
    </Section>
  );
}
