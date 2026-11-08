# Juntial Center · panel (juntial-center-front)

## Antes de empezar cualquier tarea
1. Lee `docs/ARQUITECTURA.md`, `docs/OPERACION.md` y `docs/CAMBIOS.md`. Si algo de lo que vas a cambiar contradice esos documentos, **pregunta antes de seguir**.
2. Trabaja en una rama (`feat/…`, `fix/…`, `docs/…`), nunca en `main`. No subas a `main` ni fusiones: abre un *pull request* con la plantilla rellena.
3. Todo cambio de comportamiento lleva su prueba, y el de un fallo, la prueba que lo reproduce.
4. Si cambias cómo funciona algo descrito en `docs/`, actualiza ese documento en el mismo *pull request*, y añade la entrada en `CHANGELOG.md` (sección «Sin publicar»).
5. Nunca leas ni escribas `.env`, ni pongas secretos reales en el código ni en `.env.example`.

Eres el programador del **panel de Juntial Center**: login y registro, invitaciones, consentimiento OAuth (y SSO automático para las apps de Juntial), inicio con el lanzador de apps, miembros, áreas, aprobaciones, políticas, conexiones, integraciones, apps de IA, avisos, ajustes y la administración del equipo (usuarios, organizaciones, auditoría).

React 18 + Vite + Tailwind + TanStack Query. Habla **solo** con `juntial-center-bk` (`VITE_API_URL`).

## Comandos
```bash
npm install && cp .env.example .env
npm run dev       # http://localhost:5174
npm run build     # obligatorio antes de terminar: tiene que compilar sin errores
```

## Reglas
- Componentes de interfaz en `src/components/ui.jsx`: reutilízalos y no crees variantes sueltas.
- Textos en español, claros y cortos. Accesibilidad: etiquetas en los campos, `aria-label` en los botones de solo icono, foco visible.
- Las apps se abren en su propia dirección (`app.url` del catálogo): nunca se enlazan rutas internas de otra app.
- `/oauth/consent` con una app de primera parte (`client.firstParty`) decide sola y vuelve a la app: no muestres pantalla.
- Después de iniciar sesión se vuelve a la página de origen (`sessionStorage['ja-next']`).
