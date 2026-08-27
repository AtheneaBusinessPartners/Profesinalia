# Profesionalia (MVP)

Un profesional de aire acondicionado recibe un WhatsApp, manda un enlace, el cliente rellena un
formulario guiado por desplegables (sin registrarse), y el trabajo aparece organizado en el panel
del profesional, con precio, costes y margen.

## Qué incluye este MVP

- Registro/login de profesionales (Supabase Auth) → `USER → BUSINESS → DATA`.
- Página pública `/c/[slug]` sin registro: nombre + teléfono → elige tipo de trabajo (instalación /
  reparación / mantenimiento) → formulario de desplegables adaptado a ese tipo → fotos → se crea
  la solicitud automáticamente, con un resumen generado a partir de las respuestas.
- Dashboard móvil: inicio (estadísticas + resumen económico del mes), trabajos, clientes, perfil.
- Detalle de trabajo: cliente, ubicación (enlace a Google Maps), información recopilada, fotos,
  resumen, economía (precio/costes/beneficio/margen) y cambio de estado.
- Reconocimiento de clientes recurrentes por teléfono dentro de un mismo negocio.
- Superadmin de plataforma (`/superadmin`) con listado de profesionales y estadísticas globales.
- Aislamiento multiusuario mediante Row Level Security: cada profesional solo ve sus propios
  datos; el cliente público solo puede escribir en su propia solicitud (validada por token).

Explícitamente fuera de este MVP: WhatsApp Business API, pagos/Stripe, suscripciones, empleados,
calendario, facturación electrónica, presupuestos o precios calculados automáticamente,
notificaciones push, CRM avanzado, y (por decisión explícita) un chat con IA — se sustituyó por un
formulario de desplegables para evitar el coste y la dependencia de una API externa.

## Arquitectura en una frase

Toda escritura del visitante anónimo (crear cliente, guardar las respuestas del formulario, subir
fotos) pasa por funciones Postgres `security definer` que validan un `job_id` + `access_token` de
un solo uso por solicitud — igual que el resto de la escritura pasa por RLS. El backend nunca usa
la service role key para saltarse esto.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor, ejecuta **en este orden** los archivos de `supabase/migrations/`:
   - `0001_init.sql` (esquema base)
   - `0002_form_instead_of_ai.sql` (sustituye el chat de IA por el formulario de desplegables)
   - `0003_fix_ambiguous_business_id.sql` (corrección de un bug de la función `start_job_request`)
   - `0004_business_approval.sql` (añade aprobación manual de negocios por el superadmin)
3. Ve a Project Settings → API Keys y copia el **Project URL** y la clave **anon / public**
   (o la **Publishable key**, si tu proyecto usa el nuevo formato de claves).
4. Copia `.env.local.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Arrancar en local

```bash
npm run dev
```

### 4. Probar el flujo completo

1. Entra en `/registro` y crea tu cuenta y tu negocio (p. ej. "Juan Clima").
2. Copia tu enlace desde el dashboard (`/c/juan-clima`).
3. Ábrelo en una ventana de incógnito (como si fueras el cliente), rellena nombre y teléfono, elige
   un tipo de trabajo y completa el formulario. Sube alguna foto.
4. Vuelve a tu dashboard: verás la nueva solicitud.
5. Abre el trabajo, introduce precio y costes, comprueba el margen, y cambia el estado.

### 5. Crear el primer superadmin (manual, a propósito)

En Supabase → Table Editor → `profiles`, busca tu usuario y cambia `role` a `admin`. Después
podrás entrar en `/superadmin`.

### 5b. Aprobar negocios

Cualquiera puede registrarse, pero un negocio recién creado queda **pendiente de aprobación**
(`businesses.approved = false`): su enlace público no funciona y su dashboard muestra un aviso de
espera. Desde `/superadmin` puedes aprobar (o revocar) cada negocio con un botón. Solo el
superadmin puede cambiar este campo — un intento de un profesional de auto-aprobarse se revierte
automáticamente (trigger `businesses_protect_approval`).

### 6. Subir a GitHub y desplegar en Vercel

1. `git init`, commit, crea un repo vacío en GitHub y haz push.
2. Importa el repo en [Vercel](https://vercel.com).
3. Añade las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   como filas independientes en Project Settings → Environment Variables.
4. Despliega. Revisa que "Deployment Protection" esté desactivado para producción, o los clientes
   no podrán abrir `/c/[slug]`.

## Cosas a vigilar

- **Proyectos Supabase gratuitos se pausan tras 7 días sin actividad de API.** Si la web deja de
  responder sin error visible, revisa que el proyecto siga activo.
- El bucket de Storage `job-photos` es público de lectura y solo admite subidas dentro de la
  carpeta de una solicitud válida (`{job_id}/{token}/...`). Es suficiente para el MVP; si más
  adelante quieres fotos privadas, cambia el bucket a privado y sirve URLs firmadas.
- La geocodificación de direcciones (lat/lng) no está implementada todavía: por ahora el detalle
  del trabajo abre Google Maps con la dirección en texto.
- Si en el futuro quieres volver a un chat con IA en vez del formulario, la arquitectura de token
  por solicitud (`access_token` en `jobs`) ya está lista para soportarlo sin cambios de esquema.
