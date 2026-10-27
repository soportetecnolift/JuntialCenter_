import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api, errMsg } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input } from '../components/ui.jsx';

const TITLES = { password: 'Entra en tu cuenta', otp: 'Entra con un código', register: 'Crea tu cuenta', verify: 'Revisa tu correo', forgot: 'Recupera el acceso', reset: 'Elige una contraseña nueva' };

export default function Login() {
  const { user, accept: rawAccept } = useAuth();
  const accept = (d) => { localStorage.setItem('ja-portal', 'client'); rawAccept(d); };
  const [mode, setMode] = useState('password');
  const [f, setF] = useState({ email: '', password: '', name: '', code: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [err, setErr] = useState(''); const [staffHint, setStaffHint] = useState(false); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false);
  if (user) { const next = sessionStorage.getItem('ja-next'); sessionStorage.removeItem('ja-next'); return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/'} replace />; }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (m) => { setMode(m); setErr(''); setInfo(''); setCodeSent(false); };

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'password') { const { data } = await api.post('/auth/login', { email: f.email, password: f.password }); data.needsVerification ? (go('verify'), setInfo('Tu email no está verificado. Te enviamos un código.')) : accept(data); }
      if (mode === 'register') { await api.post('/auth/register', { email: f.email, password: f.password, name: f.name }); go('verify'); setInfo(`Enviamos un código de 6 dígitos a ${f.email}.`); }
      if (mode === 'verify') accept((await api.post('/auth/verify-email', { email: f.email, code: f.code })).data);
      if (mode === 'otp' && !codeSent) { await api.post('/auth/otp/request', { email: f.email }); setCodeSent(true); setInfo('Si la cuenta existe, recibirás un código en unos segundos.'); }
      else if (mode === 'otp') accept((await api.post('/auth/otp/verify', { email: f.email, code: f.code })).data);
      if (mode === 'forgot') { await api.post('/auth/password/forgot', { email: f.email }); go('reset'); setInfo('Si la cuenta existe, te enviamos un código.'); }
      if (mode === 'reset') { await api.post('/auth/password/reset', { email: f.email, code: f.code, password: f.password }); go('password'); setInfo('Contraseña actualizada. Ya puedes entrar.'); }
    } catch (e2) { setErr(errMsg(e2)); setStaffHint(e2?.response?.data?.error?.code === 'STAFF_PORTAL'); } finally { setBusy(false); }
  }
  const needsCode = mode === 'verify' || mode === 'reset' || (mode === 'otp' && codeSent);
  const needsPass = ['password', 'register', 'reset'].includes(mode);
  const cta = { password: 'Entrar', register: 'Crear cuenta', verify: 'Verificar y entrar', otp: codeSent ? 'Entrar' : 'Enviarme el código', forgot: 'Enviar código', reset: 'Guardar contraseña' }[mode];

  return (
    <div className="grid min-h-[100dvh] md:grid-cols-[1fr_minmax(420px,520px)]">
      <div className="hidden flex-col justify-between bg-harbor p-12 text-white md:flex">
        <p className="text-lg font-extrabold">JuntialAgents</p>
        <div className="max-w-md">
          <p className="text-[2.6rem] font-extrabold leading-[1.1]">Tus bots de Telegram, con Claude o GPT y conectados a tus herramientas.</p>
          <div className="mt-8 max-w-sm rounded-xl bg-white p-4 font-sans text-sm text-[#1D2733] shadow-lg">
            <p className="text-xs font-semibold text-[#55616F]">@soporte_obras_bot</p>
            <p className="mt-1 italic text-[#55616F]">Procesando…</p>
            <p>✅ Leyendo 3 mensajes</p><p>✅ Consultando CRM › buscar_trato</p><p>⏳ Redactando respuesta</p>
          </div>
        </div>
        <p className="text-xs text-harbor-300">Sesiones seguras de 30 días · Datos cifrados en reposo</p>
      </div>
      <div className="flex flex-col items-center justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="mb-8 flex items-center gap-2 md:hidden"><img src="/icon.svg" alt="" className="h-9 w-9" /><span className="text-lg font-extrabold">JuntialAgents</span></div>
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h1>{TITLES[mode]}</h1>
          {info && <p className="rounded-md bg-tide-tint px-3 py-2 text-sm text-tide-dark">{info}</p>}
          {err && <p role="alert" className="rounded-md bg-flare-tint px-3 py-2 text-sm text-flare">{err}{staffHint && <> · <Link to="/admin/login" className="font-bold underline">Ir al acceso de administración</Link></>}</p>}
          {['password', 'otp', 'register'].includes(mode) && (
            <div className="flex justify-center"><GoogleLogin onSuccess={async (c) => { try { localStorage.setItem('ja-portal', 'client'); accept((await api.post('/auth/google', { credential: c.credential })).data); } catch (e2) { setErr(errMsg(e2)); setStaffHint(e2?.response?.data?.error?.code === 'STAFF_PORTAL'); } }} onError={() => setErr('No se pudo iniciar sesión con Google')} width="320" text={mode === 'register' ? 'signup_with' : 'signin_with'} locale="es" /></div>
          )}
          {['password', 'otp', 'register'].includes(mode) && <p className="text-center text-xs text-ink-soft">o con tu email</p>}
          {mode === 'register' && <Field label="Nombre"><Input required value={f.name} onChange={set('name')} autoComplete="name" /></Field>}
          <Field label="Email"><Input type="email" required value={f.email} onChange={set('email')} autoComplete="email" disabled={needsCode && mode !== 'otp'} /></Field>
          {needsCode && <Field label="Código de 6 dígitos"><Input inputMode="numeric" pattern="\d{6}" maxLength={6} required value={f.code} onChange={set('code')} autoComplete="one-time-code" className="font-mono tracking-[0.4em]" /></Field>}
          {needsPass && <Field label={mode === 'password' ? 'Contraseña' : 'Contraseña nueva'} hint={mode !== 'password' ? 'Mínimo 10 caracteres' : undefined}><Input type="password" required minLength={mode === 'password' ? 1 : 10} value={f.password} onChange={set('password')} autoComplete={mode === 'password' ? 'current-password' : 'new-password'} /></Field>}
          <Button className="w-full" loading={busy}>{cta}</Button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            {mode === 'password' && <><button type="button" className="font-semibold text-tide" onClick={() => go('otp')}>Entrar con código</button><button type="button" className="text-ink-soft" onClick={() => go('forgot')}>¿Olvidaste la contraseña?</button></>}
            {mode !== 'password' && <button type="button" className="font-semibold text-tide" onClick={() => go('password')}>Entrar con contraseña</button>}
            {mode !== 'register' && <button type="button" className="text-ink-soft" onClick={() => go('register')}>Crear cuenta</button>}
          </div>
          <p className="border-t border-line pt-4 text-center text-xs text-ink-soft">¿Eres del equipo? <Link to="/admin/login" className="font-semibold text-tide">Acceso de administración</Link></p>
        </form>
      </div>
    </div>
  );
}
