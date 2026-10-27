import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { api, API_URL, refresh, errMsg } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Button } from '../components/ui.jsx';

export default function Invite() {
  const { token } = useParams(); const { user, accept } = useAuth(); const nav = useNavigate(); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['invite', token], retry: false, queryFn: () => axios.get(`${API_URL}/api/center/invitations/lookup/${token}`).then((r) => r.data) });
  const join = async () => { setBusy(true); try { await api.post('/center/invitations/accept', { token }); accept(await refresh()); window.location.assign('/center'); } catch (e) { setErr(errMsg(e)); setBusy(false); } };
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-mist p-4"><div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
      <img src="/icon.svg" alt="" className="mx-auto h-12 w-12" />
      {q.isError ? <><h1 className="mt-4 text-xl font-bold">Invitación no válida</h1><p className="text-sm text-ink-soft">Puede que haya caducado o ya se haya usado.</p></> : !q.data ? <p className="mt-4">Cargando…</p> : <>
        <h1 className="mt-4 text-xl font-bold">Únete a {q.data.org.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">Invitación para <b>{q.data.email}</b> en Juntial Center.</p>
        {err && <p className="mt-3 text-sm text-flare" role="alert">{err}</p>}
        {user ? <Button className="mt-5 w-full" loading={busy} onClick={join}>Aceptar y entrar</Button>
          : <Button className="mt-5 w-full" onClick={() => { sessionStorage.setItem('ja-next', `/invite/${token}`); nav('/login'); }}>Iniciar sesión o crear cuenta</Button>}
      </>}
    </div></main>
  );
}
