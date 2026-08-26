# ClimaAssist (MVP)

Un profesional de aire acondicionado recibe un WhatsApp, manda un enlace, el cliente cuenta lo
que necesita hablando con una IA (sin registrarse), y el trabajo aparece organizado en el panel
del profesional, con precio, costes y margen.

## Qué incluye este MVP

- Registro/login de profesionales (Supabase Auth) → `USER → BUSINESS → DATA`.
- Página pública `/c/[slug]` sin registro: nombre + teléfono → chat con IA (Claude) → solicitud
  creada automáticamente, con fotos.
- Dashboard móvil: inicio (estadísticas + resumen económico del mes), trabajos, clientes, perfil.
- Detalle de trabajo: cliente, ubicación (enlace a Google Maps), información técnica recopilada
  por la IA, fotos, resumen IA, conversación completa, economía (precio/costes/beneficio/margen)
  y cambio de estado.
- Reconocimiento de clientes recurrentes por teléfono dentro de un mismo negocio.
- Superadmin de plataforma (`/superadmin`) con listado de profesionales y estadísticas globales.
- Aislamiento multiusuario mediante Row Level Security: cada profesional solo ve sus propios
  datos; el cliente público solo puede escribir en su propia conversación (validada por token).

Explícitamente fuera de este MVP (ver el prompt original): WhatsApp Business API, pagos/Stripe,
suscripciones, empleados, calendario, facturación electrónica, presupuestos o precios calculados
por IA, notificaciones push, CRM avanzado.

## Arquitectura en una frase

Toda escritura del visitante anónimo (crear cliente, mandar mensajes, subir fotos, guardar los
datos que extrae la IA) pasa por funciones Postgres `security definer` que validan un
`conversation_id` + `access_token` de un solo uso por conversación — igual que el resto de tu
escritura pasa por RLS. El backend nunca usa la service role key para saltarse esto.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a SQL Editor y ejecuta el contenido completo de `supabase/migrations/0001_init.sql`.
3. Ve a Project Settings → API y copia la Project URL y la anon key.
4. Copia `.env.local.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (clave de la API de Anthropic, para el chat con IA)

### 3. Arrancar en local

```bash
npm run dev
```

### 4. Probar el flujo completo

1. Entra en `/registro` y crea tu cuenta y tu negocio (p. ej. "Juan Clima").
2. Copia tu enlace desde el dashboard (`/c/juan-clima`).
3. Ábrelo en una ventana de incógnito (como si fueras el cliente), rellena nombre y teléfono, y
   chatea con la IA. Sube alguna foto con el botón 📷.
4. Cuando la IA cierre la conversación, vuelve a tu dashboard: verás la nueva solicitud.
5. Abre el trabajo, introduce precio y costes, comprueba el margen, y cambia el estado.

### 5. Crear el primer superadmin (manual, a propósito)

En Supabase → Table Editor → `profiles`, busca tu usuario y cambia `role` a `admin`. Después
podrás entrar en `/superadmin`.

### 6. Subir a GitHub y desplegar en Vercel

1. `git init`, commit, crea un repo vacío en GitHub y haz push.
2. Importa el repo en [Vercel](https://vercel.com).
3. Añade las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `ANTHROPIC_API_KEY`) como filas independientes en Project Settings → Environment Variables.
4. Despliega. Revisa que "Deployment Protection" esté desactivado para producción, o los clientes
   no podrán abrir `/c/[slug]`.

## Cosas a vigilar

- **Proyectos Supabase gratuitos se pausan tras 7 días sin actividad de API.** Si el chat deja de
  responder sin error visible, revisa que el proyecto siga activo.
- **La clave de Anthropic (`ANTHROPIC_API_KEY`) es necesaria para que el chat funcione.** Sin
  ella, `/api/ai/chat` devolverá un error 500 — la arquitectura del resto de la app (BD, RLS,
  dashboard) funciona igualmente.
- El bucket de Storage `job-photos` es público de lectura y solo admite subidas dentro de la
  carpeta de una conversación válida (`{conversation_id}/{token}/...`). Es suficiente para el
  MVP; si más adelante quieres fotos privadas, cambia el bucket a privado y sirve URLs firmadas.
- La geocodificación de direcciones (lat/lng) no está implementada todavía: por ahora el detalle
  del trabajo abre Google Maps con la dirección en texto.
