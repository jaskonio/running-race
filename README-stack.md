# README — Stack y base técnica del proyecto

## 1. Objetivo del proyecto

Construir una aplicación web para seguir un reto anual de running entre 3 participantes, sincronizando entrenamientos desde Strava y mostrando la evolución de kilómetros en diferentes vistas temporales: diaria, semanal, mensual y por rango de fechas.

El reto comienza el **1 de enero de 2026** y el objetivo es visualizar el progreso hacia los **3000 km** por participante a lo largo del año.

---

## 2. Stack recomendado

## Frontend
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Recharts** para gráficas

### Motivo
Este stack permite tener frontend y backend en el mismo proyecto, acelerar el desarrollo del MVP y mantener una arquitectura sencilla.

---

## Backend
- **Next.js Route Handlers** o API Routes
- **TypeScript**
- **Node.js**

### Motivo
No hace falta separar backend y frontend en una primera versión. La lógica de sincronización, consultas agregadas y endpoints para dashboard puede vivir dentro del mismo proyecto.

---

## Base de datos
- **PostgreSQL**
- **Prisma ORM**

### Motivo
PostgreSQL es robusto para agregaciones por fecha, rankings y consultas históricas. Prisma acelera el modelado, migraciones y acceso tipado a datos.

---

## Integración externa
- **Strava API**
- **OAuth 2.0** para conectar cada participante

### Motivo
Cada usuario deberá autorizar la app para que puedas leer sus actividades de running. Se deben guardar `access_token`, `refresh_token` y expiración del token.

---

## Jobs y sincronización
Opciones recomendadas:
- **Vercel Cron** si despliegas en Vercel
- **GitHub Actions Scheduler** si prefieres lanzar una llamada diaria externa
- **node-cron** si vas a correr la app en un VPS

### Recomendación
Para un MVP limpio:
- crear un endpoint interno de sincronización
- programar una ejecución diaria
- refrescar tokens y recuperar actividades nuevas de cada participante

---

## Hosting recomendado
### Opción simple
- **Vercel** para la aplicación
- **Neon / Supabase / Railway** para PostgreSQL

### Opción alternativa
- VPS con Docker si quieres tener control total del cron y del despliegue

---

## 3. Librerías recomendadas

## Core
```bash
npm install next react react-dom typescript
```

## Estilos
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

## Base de datos
```bash
npm install prisma @prisma/client
```

## Validación
```bash
npm install zod
```

## Fechas
```bash
npm install date-fns
```

## Gráficas
```bash
npm install recharts
```

## Cliente HTTP
```bash
npm install axios
```

## Variables de entorno
```bash
npm install dotenv
```

---

## 4. Estructura inicial recomendada

```txt
src/
  app/
    page.tsx
    dashboard/
      page.tsx
    weekly-winners/
      page.tsx
    api/
      strava/
        connect/route.ts
        callback/route.ts
      stats/
        daily/route.ts
        weekly/route.ts
        monthly/route.ts
        range/route.ts
      rankings/
        weekly-winners/route.ts
      cron/
        strava-sync/route.ts

  components/
    charts/
      DailyProgressChart.tsx
      WeeklyChart.tsx
      MonthlyChart.tsx
      RangeChart.tsx
    dashboard/
      SummaryCards.tsx
      Leaderboard.tsx

  lib/
    prisma.ts
    date.ts
    env.ts

  services/
    strava/
      strava-auth-service.ts
      strava-activity-service.ts
      strava-sync-service.ts
    stats/
      daily-stats-service.ts
      weekly-stats-service.ts
      monthly-stats-service.ts
      rankings-service.ts

  types/
    participant.ts
    activity.ts
    stats.ts

prisma/
  schema.prisma
  migrations/
```

---

## 5. Modelo de datos mínimo

## Participant
Representa a cada corredor conectado con Strava.

Campos recomendados:
- `id`
- `name`
- `stravaAthleteId`
- `accessToken`
- `refreshToken`
- `tokenExpiresAt`
- `isActive`
- `createdAt`
- `updatedAt`

## Activity
Guarda las actividades recuperadas desde Strava para trazabilidad y deduplicación.

Campos recomendados:
- `id`
- `participantId`
- `stravaActivityId`
- `name`
- `sportType`
- `distanceKm`
- `movingTimeSec`
- `elapsedTimeSec`
- `startDate`
- `activityDate`
- `createdAt`

## DailyDistance
Tabla agregada por día y participante. Esta será la principal fuente para gráficas y rankings.

Campos recomendados:
- `id`
- `participantId`
- `date`
- `distanceKm`
- `createdAt`
- `updatedAt`

## SyncRun
Auditoría de sincronización.

Campos recomendados:
- `id`
- `participantId`
- `status`
- `startedAt`
- `finishedAt`
- `activitiesFetched`
- `activitiesStored`
- `errorMessage`

---

## 6. Reglas técnicas clave

## Solo running
Solo deben contarse actividades de carrera. Hay que filtrar por el tipo de actividad devuelto por Strava.

## Evitar duplicados
Cada actividad de Strava tiene un identificador único. Ese valor debe usarse para impedir inserciones repetidas.

## Agregación por fecha
La app no debe depender solo de actividades crudas. Debe guardar también la suma diaria de kilómetros por participante.

## Tokens renovables
El acceso a Strava requiere renovar tokens cuando caduquen. Esta lógica debe estar centralizada en un servicio.

## Rango anual del reto
La app debe trabajar con datos entre:
- inicio: `2026-01-01`
- fin: `2026-12-31`

---

## 7. Endpoints recomendados

```txt
GET  /api/stats/daily
GET  /api/stats/weekly
GET  /api/stats/monthly
GET  /api/stats/range?from=2026-01-01&to=2026-04-30
GET  /api/rankings/weekly-winners
POST /api/cron/strava-sync
GET  /api/strava/connect
GET  /api/strava/callback
```

---

## 8. Variables de entorno

```env
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

---

## 9. Pasos para arrancar el proyecto

## 1. Crear proyecto
```bash
npx create-next-app@latest running-challenge-web --typescript --tailwind --app
```

## 2. Instalar dependencias
```bash
npm install prisma @prisma/client zod date-fns recharts axios dotenv
```

## 3. Inicializar Prisma
```bash
npx prisma init
```

## 4. Configurar `.env`
Añadir conexión a PostgreSQL y credenciales de Strava.

## 5. Definir `schema.prisma`
Crear modelos base para:
- Participant
- Activity
- DailyDistance
- SyncRun

## 6. Lanzar migración inicial
```bash
npx prisma migrate dev --name init
```

## 7. Implementar flujo OAuth con Strava
- conectar usuario
- recibir callback
- guardar tokens

## 8. Implementar servicio diario de sincronización
- refrescar token
- consultar actividades recientes
- filtrar running
- persistir actividades
- recalcular agregación diaria

## 9. Crear endpoints de estadísticas
- diario
- semanal
- mensual
- rango de fechas
- ranking semanal

## 10. Construir dashboard inicial
- tarjetas resumen
- gráfica acumulada diaria
- gráfica semanal
- gráfica mensual
- filtro por rango

---

## 10. Recomendación de arquitectura para V1

Para una primera versión, la arquitectura ideal es:
- un solo proyecto Next.js
- PostgreSQL como fuente de verdad
- Prisma para acceso a datos
- sincronización diaria programada
- datos crudos + datos agregados

Esto te permitirá evolucionar más adelante hacia:
- webhooks de Strava
- rankings avanzados
- predicción de llegada a 3000 km
- comparativas de constancia y tendencia

---

## 11. Objetivo técnico del MVP

Tener una web funcional que:
- conecte 3 cuentas de Strava
- sincronice diariamente actividades de running
- almacene kilómetros diarios por participante
- muestre la evolución del reto con gráficas y rankings semanales

