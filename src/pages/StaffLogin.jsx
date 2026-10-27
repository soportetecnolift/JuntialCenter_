import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldCheck, Smartphone, KeyRound, ArrowLeft } from 'lucide-react';
import { api, errMsg } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input, Secret, CopyButton } from '../components/ui.jsx';

/**
 * Acceso de administración: contraseña + verificación en dos pasos obligatoria.
 * Pasos: credentials → (setup | mfa) → backup (solo tras configurar) → panel
 */
export default function StaffLogin() {
  const { user, accept } = useAuth();
  const [step, setStep] = useState('credentials');
  const [f, setF] = useState({ email: '', password: '', code: '' });
  const [ctx, setCtx] = useState({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  if (user && step !== 'backup') return <Navigate to="/" replace />;

  const enter = (data) => { localStorage.setItem('ja-portal', 'staff'); accept(data); };
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (step === 'credentials') {
        const { data } = await api.post('/auth/staff/login', { email: f.email, password: f.password });
        if (data.accessToken) return enter(data); // 2FA desactivado por configuración
        setCtx(data); setStep(data.step);
      } else {
        const { data } = await api.post('/auth/staff/mfa', { mfaToken: ctx.mfaToken, code: f.code });
        if (data.backupCodes) { setCtx({ ...ctx, session: data, backupCodes: data.backupCodes }); setStep('backup'); } else enter(data);
      }
    } catch (e2) {
      setErr(errMsg(e2)); setF((x) => ({ ...x, code: '' }));
      if (e2?.response?.status === 401 && step !== 'credentials') setStep('credentials');
    } finally { setBusy(false); }
  }

  const Icon = { credentials: ShieldCheck, setup: Smartphone, mfa: KeyRound, backup: KeyRound }[step];
  const title = { credentials: 'Acceso de administración', setup: 'Activa la verificación en dos pasos', mfa: 'Verificación en dos pasos', backup: 'Guarda tus códigos de respaldo' }[step];
  return (
    <div className="min-h-[100dvh] bg-harbor px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-white md:grid md:place-items-center md:py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2"><img src="/icon.svg" alt="" className="h-9 w-9" /><span className="text-lg font-extrabold">JuntialAgents</span><span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-harbor-300">Equipo</span></div>
        <form onSubmit={submit} className="rounded-2xl bg-surface p-6 text-ink shadow-2xl md:p-8">
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-tide-tint text-tide-dark"><Icon size={24} /></span>
          <h1 className="text-xl">{title}</h1>
          {err && <p role="alert" className="mt-4 rounded-lg bg-flare-tint px-3 py-2 text-sm text-flare">{err}</p>}

          {step === 'credentials' && <div className="mt-5 space-y-4">
            <p className="text-sm text-ink-soft">Solo para superadministradores, administradores y empleados. Los clientes entran por el <Link to="/login" className="font-semibold text-tide">acceso de clientes</Link>.</p>
            <Field label="Email"><Input type="email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Contraseña"><Input type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            <Button className="w-full" loading={busy}>Continuar</Button>
          </div>}

          {step === 'setup' && <div className="mt-4 space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
              <li>Abre Google Authenticator, Microsoft Authenticator, 1Password o similar.</li>
              <li>Escanea el código QR o pega la clave manual.</li>
              <li>Escribe el código de 6 dígitos que muestra la app.</li>
            </ol>
            <div className="flex justify-center"><img src={ctx.qr} alt="Código QR para la app autenticadora" className="h-48 w-48 rounded-lg bg-white p-2" /></div>
            <a href={ctx.otpauthUrl} className="block text-center text-sm font-semibold text-tide md:hidden">Abrir en la app autenticadora de este móvil</a>
            <Field label="Clave manual"><Secret value={ctx.secret} /></Field>
            <CodeInput value={f.code} onChange={(code) => setF({ ...f, code })} />
            <Button className="w-full" loading={busy} disabled={f.code.length !== 6}>Activar y entrar</Button>
          </div>}

          {step === 'mfa' && <div className="mt-4 space-y-4">
            <p className="text-sm text-ink-soft">{useBackup ? 'Escribe uno de tus códigos de respaldo (formato xxxx-xxxx). Cada código solo funciona una vez.' : 'Escribe el código de 6 dígitos de tu app autenticadora.'}</p>
            {useBackup ? <Field label="Código de respaldo"><Input autoFocus className="font-mono tracking-widest" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="abcd-efgh" /></Field>
              : <CodeInput value={f.code} onChange={(code) => setF({ ...f, code })} autoSubmit />}
            <Button className="w-full" loading={busy} disabled={useBackup ? f.code.length < 9 : f.code.length !== 6}>Entrar</Button>
            <button type="button" className="w-full text-sm font-semibold text-tide" onClick={() => { setUseBackup(!useBackup); setF({ ...f, code: '' }); }}>{useBackup ? 'Usar la app autenticadora' : '¿No tienes el móvil? Usa un código de respaldo'}</button>
          </div>}

          {step === 'backup' && <div className="mt-4 space-y-4">
            <p className="text-sm text-ink-soft">Si pierdes el móvil, cada uno de estos códigos te deja entrar una vez. Guárdalos en tu gestor de contraseñas. No se volverán a mostrar.</p>
            <ul className="grid grid-cols-2 gap-2 rounded-lg bg-mist p-4 font-mono text-sm">{ctx.backupCodes.map((c) => <li key={c}>{c}</li>)}</ul>
            <CopyButton value={ctx.backupCodes.join('\n')} label="Copiar códigos" />
            <Button type="button" className="w-full" onClick={() => enter(ctx.session)}>Ya los he guardado, entrar al panel</Button>
          </div>}

          {(step === 'setup' || step === 'mfa') && <button type="button" onClick={() => { setStep('credentials'); setErr(''); setF({ ...f, code: '' }); }} className="mt-5 flex items-center gap-1 text-sm text-ink-soft"><ArrowLeft size={14} />Volver</button>}
        </form>
        <p className="mt-6 text-center text-xs text-harbor-300">Accesos registrados y auditados. Bloqueo de 15 minutos tras 5 intentos fallidos.</p>
      </div>
    </div>
  );
}

/** Campo de 6 dígitos: autocompletado de SMS/app en móvil, teclado numérico y envío automático. */
function CodeInput({ value, onChange, autoSubmit }) {
  return (
    <Field label="Código de 6 dígitos">
      <Input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={value}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); onChange(v); if (autoSubmit && v.length === 6) setTimeout(() => e.target.form?.requestSubmit(), 50); }}
        className="text-center font-mono text-2xl tracking-[0.5em] md:text-2xl" placeholder="••••••" />
    </Field>
  );
}
