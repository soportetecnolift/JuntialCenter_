import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refresh } from './api.js';
import { useAuth } from './auth.jsx';

/** Contexto de Juntial Center: organizaciones, membresía activa y apps. */
export const useCenter = () => useQuery({ queryKey: ['center-me'], queryFn: () => api.get('/center/me').then((r) => r.data), staleTime: 30000 });
export function useSwitchOrg() {
  const { accept } = useAuth(); const qc = useQueryClient();
  return async (orgId) => { await api.post(`/center/orgs/${orgId}/switch`); accept(await refresh()); qc.clear(); window.location.assign('/center'); };
}
export const isOrgAdmin = (c) => ['owner', 'admin'].includes(c?.membership?.orgRole);
