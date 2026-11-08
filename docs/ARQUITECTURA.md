# Arquitectura del panel de Juntial Center

Habla **solo** con `juntial-center-bk` (`VITE_API_URL`). Las apps se abren en su propia dirección (`app.url` del catálogo).

## Piezas comunes
| Pieza | Dónde | Qué hace |
|---|---|---|
| Cliente HTTP | `src/lib/api.js` | Axios con `VITE_API_URL`. Añade el access token a cada petición; ante un 401 renueva la sesión **una sola vez** (`refresh()` compartido) y repite la petición. `errMsg()` convierte los errores en mensajes legibles. |
| Sesión | `src/lib/auth.jsx` | Contexto con el usuario. Al cargar intenta `POST /api/auth/refresh` (con cookie): si responde, hay sesión. El access token vive **solo en memoria** (nunca en `localStorage`). |
| Organización | `src/lib/center.js`, `components/OrgSwitcher.jsx` | Organización activa, permisos y cambio de organización. |
| Interfaz | `src/components/ui.jsx` | Botones, campos, tablas, modales, avisos… **Reutilízalos siempre.** |
| Estructura | `components/Layout.jsx`, `nav.js`, `CommandPalette.jsx` | Menú por rol (barra lateral en escritorio, barra inferior en móvil), paleta de comandos (Ctrl+K). |
| Tema | `src/lib/theme.js` | Claro y oscuro. |
| Datos | TanStack Query | Caché de las peticiones; se invalida tras cada cambio. |

**Stack:** React 18 · Vite · Tailwind · TanStack Query · React Router · lucide-react.

**Guardas de ruta:** sin sesión → `/login` (la ruta de origen se guarda en `sessionStorage['ja-next']` para volver después).

## Páginas
| Ruta | Página | Para quién |
|---|---|---|
| `/login`, `/admin/login` | Login y registro · acceso del equipo con 2FA | Todos |
| `/invite/:token` | Aceptar invitación | Invitados |
| `/oauth/consent` | Consentimiento OAuth. **Con una app de primera parte decide sola y vuelve a la app** | Todos |
| `/` | Inicio: lanzador de apps y resumen | Organización |
| `/center/members`, `/departments` | Miembros (rol de organización + rol por app, Telegram vinculado) y áreas | Administradores |
| `/center/approvals`, `/policies` | Bandeja de aprobaciones con política y editor de políticas (con simulador) | Organización |
| `/center/connections`, `/integrations`, `/ai` | Conexiones compartidas, suscripciones de eventos, apps de IA (MCP) | Administradores |
| `/admin/users`, `/tenants`, `/audit` | Usuarios, organizaciones, auditoría | Equipo de la plataforma |
| `/notifications`, `/settings` | Avisos; cuenta, seguridad y sesiones | Todos |

Sesión: cookie `jc_rt` en el dominio de Center-bk.
