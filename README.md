# Running Challenge 2026

Aplicación web para seguir un reto anual de running entre 3 participantes. Sincroniza entrenamientos desde Strava y muestra la evolución de kilómetros con gráficas y rankings semanales. Objetivo: **3000 km por participante durante 2026**.

## Stack

- **Next.js 16** (App Router, Server Components)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Prisma 7** + **PostgreSQL**
- **Recharts** para gráficas
- **Strava API** (OAuth 2.0)

## Desarrollo local

### Requisitos

- Node.js 20+
- Docker + Docker Compose

### 1. Levantar la base de datos

```bash
docker compose up -d
```

Esto levanta PostgreSQL 17 en el puerto `5432` con:
- Usuario: `postgres`
- Password: `postgres`
- Database: `running_challenge`

### 2. Configurar variables de entorno

Copiar `.env` y completar los valores reales de Strava:

```bash
# DATABASE_URL ya viene configurada para el docker compose local
# Completar con los datos de tu Strava API Application:
# https://www.strava.com/settings/api
STRAVA_CLIENT_ID="tu-client-id"
STRAVA_CLIENT_SECRET="tu-client-secret"
```

### 3. Aplicar migraciones

```bash
npx prisma migrate dev
```

### 4. Arrancar la app

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 5. Probar el login con Strava en local

El flujo OAuth de Strava funciona en `localhost` sin problemas.

**Configurar la Strava API Application para local:**

1. Ir a [Strava API Settings](https://www.strava.com/settings/api)
2. En tu aplicación, configurar:
   - **Website**: `http://localhost:3000`
   - **Authorization Callback Domain**: `localhost`
3. Copiar el **Client ID** y **Client Secret** al `.env`:

```env
STRAVA_CLIENT_ID=tu-client-id
STRAVA_CLIENT_SECRET=tu-client-secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

> **Importante**: `STRAVA_REDIRECT_URI` debe ser exactamente `http://localhost:3000/api/strava/callback`. Si pusiste otro dominio en Strava, el callback va a fallar.

**Probar el flujo:**

```bash
# 1. DB levantada
docker compose up -d

# 2. Migraciones aplicadas
npx prisma migrate dev

# 3. Arrancar la app
npm run dev
```

4. Abrir [http://localhost:3000](http://localhost:3000)
5. Hacer click en **"Conectar con Strava"**
6. Strava pide autorización → autorizar
7. Strava redirige a `localhost:3000/api/strava/callback`
8. El participante queda guardado en la base de datos
9. La app muestra el dashboard con el nuevo participante

**Verificar que se guardó:**

```bash
npx prisma studio
```

Abre [http://localhost:5555](http://localhost:5555) y podés ver la tabla `Participant` con los datos del atleta.

**Sincronizar actividades manualmente:**

```bash
curl -X POST http://localhost:3000/api/cron/strava-sync -H "Authorization: Bearer your-cron-secret-key"
```

Esto corre la sync que normalmente ejecuta el cron diario. Trae las actividades de running de 2026 y las guarda en la DB.

> **Nota**: Podés tener la misma Strava API Application para local y producción. Solo tenés que cambiar `STRAVA_REDIRECT_URI` en el `.env` según el entorno. Strava valida que el redirect URI del callback coincida con lo configurado en la app, no con el "domain" genérico.

## Testing

### Levantar la base de datos de test

```bash
docker compose -f docker-compose.test.yml up -d
```

Usa el puerto `5433` con una base de datos `running_challenge_test` en **tmpfs** (RAM) — se reinicia cada vez que se baja el contenedor.

### Aplicar migraciones contra la DB de test

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/running_challenge_test" npx prisma migrate deploy
```

### Ejecutar tests

```bash
npm test
```

> Si los tests necesitan variables de entorno, usar `.env.test` que ya apunta a la DB de test en puerto 5433.

### Detener la DB de test

```bash
docker compose -f docker-compose.test.yml down
```

## Estructura del proyecto

```
src/
  app/
    page.tsx                       # Dashboard principal
    weekly-winners/page.tsx        # Ranking semanal
    api/
      strava/connect/route.ts      # OAuth redirect
      strava/callback/route.ts     # OAuth callback
      stats/                       # Endpoints: daily, weekly, monthly, range
      rankings/weekly-winners/     # Ranking de ganadores
      cron/strava-sync/            # Sincronización diaria
  components/
    charts/                        # DailyProgress, Weekly, Monthly, Range
    dashboard/                     # SummaryCards, Leaderboard
  services/
    strava/                        # auth, activity, sync
    stats/                         # daily, weekly, monthly, rankings
  lib/                             # prisma, date, env
  types/                           # participant, activity, stats
prisma/
  schema.prisma                    # 4 modelos: Participant, Activity, DailyDistance, SyncRun
```

## Sincronización con Strava

La app sincroniza actividades automáticamente cada día a las 6am (configurado en `vercel.json`). Solo se procesan:

- Actividades de tipo **Run**
- Fechas dentro de **2026** (1 enero - 31 diciembre)
- Sin duplicados (deduplicación por `stravaActivityId`)

## Despliegue en Vercel

### 1. Crear la base de datos

Elegir un proveedor de PostgreSQL managed. Recomendado: **Neon** (serverless, free tier generoso,分支conexiones desde Vercel sin latency).

**Opciones:**

| Proveedor | Free tier | Setup | Link |
|-----------|-----------|-------|------|
| **Neon** (recomendado) | 0.5 GB, 100 horas compute | 1 minuto, sin tarjeta | [neon.tech](https://neon.tech) |
| Supabase | 500 MB, 2 proyectos | Requiere cuenta | [supabase.com](https://supabase.com) |
| Railway | $5 crédito/mes | Setup rápido | [railway.app](https://railway.app) |

**Crear la DB en Neon:**
1. Ir a [console.neon.tech](https://console.neon.tech) y crear cuenta
2. Crear un proyecto: nombre `running-challenge`, región más cercana
3. Copiar la connection string que Neon te da (formato: `postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)

### 2. Crear la Strava API Application

1. Ir a [Strava API Settings](https://www.strava.com/settings/api)
2. Crear una nueva aplicación:
   - **Application Name**: `Running Challenge 2026`
   - **Category**: `View Data`
   - **Website**: tu URL de Vercel (ej: `https://running-challenge.vercel.app`)
   - **Authorization Callback Domain**: tu dominio de Vercel
3. Copiar **Client ID** y **Client Secret**

### 3. Deployear en Vercel

1. Push del repo a GitHub
2. Ir a [vercel.com](https://vercel.com) → **Add New Project** → importar el repo
3. Framework Preset: **Next.js** (se detecta automáticamente)
4. Configurar las variables de entorno (ver sección siguiente)
5. Click **Deploy**

### 4. Variables de entorno

Configurar estas variables en **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://neondb_owner:xxxxx@ep-xxxxx.neon.tech/neondb?sslmode=require&uselibpqcompat=true` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app en Vercel | `https://running-challenge.vercel.app` |
| `STRAVA_CLIENT_ID` | Client ID de Strava API | `12345` |
| `STRAVA_CLIENT_SECRET` | Client Secret de Strava API | `abcdef1234567890` |
| `STRAVA_REDIRECT_URI` | Callback URL para OAuth | `https://running-challenge.vercel.app/api/strava/callback` |
| `CRON_SECRET` | Secreto para proteger el endpoint de sync | generar un string aleatorio |

> **Importante**: `STRAVA_REDIRECT_URI` debe coincidir exactamente con lo configurado en Strava API Settings. Si deployeas en `https://running-challenge.vercel.app`, el callback debe ser `https://running-challenge.vercel.app/api/strava/callback`.

### 5. Aplicar migraciones

Después del primer deploy, correr las migraciones contra la DB de producción:

```bash
# Instalar Vercel CLI si no lo tenés
npm i -g vercel

# Linkear el proyecto
vercel link

# Correr migraciones contra la DB de producción
vercel env pull .env.production.local
npx prisma migrate deploy
```

O directamente con la connection string:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 6. Cron de sincronización

El archivo `vercel.json` ya configura un cron que ejecuta la sincronización cada día a las 6am UTC:

```json
{
  "crons": [{
    "path": "/api/cron/strava-sync",
    "schedule": "0 6 * * *"
  }]
}
```

> **Nota**: Los cron jobs en Vercel requieren plan **Pro** ($20/mes). En plan Hobby, se puede usar [GitHub Actions](https://docs.github.com/en/actions) para disparar la sync diaria con un `curl` al endpoint.

**Alternativa con GitHub Actions** (gratis):

Crear `.github/workflows/strava-sync.yml`:
```yaml
name: Daily Strava Sync
on:
  schedule:
    - cron: '0 6 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST ${{ secrets.APP_URL }}/api/cron/strava-sync -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 7. Conectar participantes

Una vez deployeado:
1. Abrir la app en el navegador
2. Cada participante hace click en **"Conectar con Strava"**
3. Autoriza la aplicación en Strava
4. El participante queda registrado en la base de datos
5. La sincronización diaria empezará a traer las actividades

### Links útiles

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Console](https://console.neon.tech)
- [Strava API Settings](https://www.strava.com/settings/api)
- [Strava API Docs](https://developers.strava.com/docs/reference/)
- [Prisma Deploy Docs](https://www.prisma.io/docs/orm/prisma-migrate/deploy-migrations)
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
