# Juntial Center · panel (juntial-center-front)

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
