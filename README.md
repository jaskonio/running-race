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

## Despliegue

La app está diseñada para **Vercel** + **Neon/Supabase/Railway** para PostgreSQL. Configurar las variables de entorno en el panel de Vercel y conectar la base de datos.
