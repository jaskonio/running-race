# Exploration: sdd/running-challenge-mvp

## Current State

Greenfield project with complete product specs defined in READMEs:
- **Stack**: Next.js 14+ App Router, React, TypeScript, Tailwind CSS, Recharts (frontend)
- **Backend**: Next.js Route Handlers, TypeScript, Node.js
- **Database**: PostgreSQL + Prisma ORM
- **Integration**: Strava API OAuth 2.0
- **Features**: 3 participants, 3000 km/year goal, daily sync, 4 chart types, weekly rankings

## Affected Areas

- `src/prisma/schema.prisma` — 4 data models with relationships
- `src/app/api/strava/` — OAuth flow (connect, callback routes)
- `src/app/api/stats/` — Daily/weekly/monthly/range aggregation endpoints
- `src/app/api/cron/strava-sync/route.ts` — Daily sync endpoint
- `src/services/strava/` — Token refresh, activity fetching
- `src/services/stats/` — Aggregation logic
- `src/components/charts/` — Recharts implementations
- `src/app/page.tsx` — Landing page with dashboards

## Approaches

### 1. Monolithic Next.js App with Server Components

**Description**: Single Next.js project where frontend and backend live together, using Server Components for dashboards and Route Handlers for APIs. Data aggregation done in service layer.

**Pros**:
- ✅ Simple to develop (all in one repo)
- ✅ Great developer experience with Next.js
- ✅ Easy to deploy to Vercel (full stack serverless)
- ✅ Native Server Components avoid client-side hydration
- ✅ Schema Prisma enforces type safety
- ✅ No additional infrastructure for cron (Vercel Cron or internal endpoint)

**Cons**:
- ⚠️ Backend logic mixes with UI code (difficult to test separately)
- ⚠️ Harder to scale backend independently from frontend
- ⚠️ Cron scheduling options limited (Vercel Cron, GitHub Actions, or serverless scheduler)
- ⚠️ Data access layer could become messy with complexity

**Effort**: Low | Recommended for MVP

---

### 2. Next.js App + External API Service

**Description**: Keep Next.js for frontend/dashboard, create separate Node.js service for sync, aggregation, and cron jobs. Service connects to same PostgreSQL database.

**Pros**:
- ✅ Clean separation of concerns (UI vs business logic)
- ✅ Easier to test backend independently
- ✅ Better for production scale
- ✅ Cron jobs more flexible (run anywhere, cron libraries)
- ✅ Service can be deployed to container/VM

**Cons**:
- ❌ More infrastructure to manage (2 services)
- ❌ Harder to develop (communication between services)
- ❌ Additional deployment complexity
- ❌ Extra setup for database connections

**Effort**: Medium | Good for production

---

### 3. Monolithic Next.js App with Raw Activities + Aggregation in Queries

**Description**: Store raw Strava activities and compute daily/weekly/monthly stats using Prisma raw SQL queries instead of pre-computed tables.

**Pros**:
- ✅ No data duplication
- ✅ Always accurate (single source of truth)
- ✅ Easier to extend to custom queries

**Cons**:
- ⚠️ Aggregation queries become complex for large datasets
- ⚠️ Performance may degrade over time (many Strava activities)
- ⚠️ Weekly/monthly aggregations need groupBy operations
- ⚠️ Query complexity increases maintenance burden

**Effort**: Medium | Risky for long-term scalability

---

## Architecture Decisions

### Database Schema (Prisma)

**Recommended Models**:

```prisma
model Participant {
  id            String   @id @default(cuid())
  name          String
  stravaAthleteId String  @unique
  accessToken   String
  refreshToken  String
  tokenExpiresAt DateTime
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  activities    Activity[]
  dailyDistances DailyDistance[]
  syncRuns      SyncRun[]
}

model Activity {
  id                String   @id @default(cuid())
  participantId     String
  stravaActivityId  String   @unique
  name              String
  sportType         String
  distanceKm        Float
  movingTimeSec     Int
  elapsedTimeSec    Int
  startDate         DateTime
  activityDate      DateTime
  createdAt         DateTime @default(now())

  participant       Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
}

model DailyDistance {
  id            String   @id @default(cuid())
  participantId String
  date          DateTime @default(now())
  distanceKm    Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@unique([participantId, date])
}

model SyncRun {
  id                String   @id @default(cuid())
  participantId     String?
  status            String   // "completed" | "failed"
  startedAt         DateTime
  finishedAt        DateTime?
  activitiesFetched Int      @default(0)
  activitiesStored  Int      @default(0)
  errorMessage      String?

  participant       Participant? @relation(fields: [participantId], references: [id], onDelete: SetNull)
}
```

**Key Design Decisions**:
- `DailyDistance` uses compound unique constraint `[participantId, date]` to prevent duplicates
- `Activity.stravaActivityId` is unique to prevent duplicates
- `SyncRun.participantId` nullable for batch syncs (all participants at once)
- Cascading deletes ensure data integrity

---

### Strava OAuth Flow

**3-Step Flow**:

1. **Initiate OAuth** (`GET /api/strava/connect`)
   - Redirect to Strava auth URL with `response_type=code`
   - Include `redirect_uri`, `client_id`, `client_secret`, `scope: read:activities`

2. **Handle Callback** (`GET /api/strava/callback`)
   - Exchange code for access_token (Strava docs provide URL)
   - Parse response and extract `access_token`, `refresh_token`, `expires_in`
   - Save tokens to `Participant` model
   - Redirect user to frontend with success message

3. **Token Refresh** (in sync service)
   - Check `tokenExpiresAt` before calling Strava
   - If expired, use `refresh_token` to get new `access_token`
   - Update participant with new tokens

**Implementation Strategy**:
- Create `stravaAuthService.ts` to handle OAuth logic
- Use `axios` for HTTP requests to Strava
- Store tokens in database (never in env variables)
- Set up Cron job to refresh tokens daily before sync

**Risks**:
- ⚠️ Strava OAuth tokens can expire at any time (hourly)
- ⚠️ Refresh tokens can be revoked by user
- ⚠️ Need to handle failed OAuth attempts gracefully

---

### Data Aggregation Strategy

**Current Approach** (Recommended for MVP):

1. **Store Raw Activities** - Full Strava activity objects
2. **Pre-compute Daily Aggregations** - `DailyDistance` table
3. **Compute Weekly/Monthly on Demand** - Use Prisma aggregation queries

**Weekly Aggregation Query**:
```typescript
const weeklyStats = await prisma.dailyDistance.groupBy({
  by: ['date'],
  where: {
    participantId: participant.id,
    date: {
      gte: startOfWeek,
      lte: endOfWeek
    }
  },
  _sum: {
    distanceKm: true
  }
})
```

**Monthly Aggregation Query**:
```typescript
const monthlyStats = await prisma.dailyDistance.groupBy({
  by: ['date'],
  where: {
    participantId: participant.id,
    date: {
      gte: startOfMonth,
      lte: endOfMonth
    }
  },
  _sum: {
    distanceKm: true
  }
})
```

**Pros**:
- ✅ Simple queries using Prisma's `groupBy`
- ✅ Easy to implement and understand
- ✅ Sufficient performance for MVP (1000s of activities)

**Cons**:
- ⚠️ Query complexity increases for date ranges (need to filter by day of week/month)
- ⚠️ Large datasets could slow down queries

**Alternative Pre-computed Tables**:
- `WeeklyDistance` and `MonthlyDistance` pre-computed on sync
- Update incrementally when activities are added
- Faster queries but more maintenance

**Effort**: Low for MVP | Medium for production

---

### Cron/Sync Architecture

**Options**:

1. **Vercel Cron** (Recommended for MVP)
   - Configure via `vercel.json` or Vercel dashboard
   - Run every 24h at specific time (e.g., 3 AM UTC)
   - Simplest option (no external infra)
   - Cost: Free for small projects

2. **GitHub Actions Scheduler**
   - Create GitHub Actions workflow with cron trigger
   - Call internal `/api/cron/strava-sync` endpoint
   - Run every 24h
   - More control but additional GitHub Actions setup

3. **node-cron** (External service)
   - Run cron in a VPS/VM with the application
   - Use `node-cron` library for scheduling
   - Maximum flexibility
   - Requires VPS infrastructure

**Recommended Implementation**:
- **Vercel Cron** for MVP (simplest, free)
- Endpoint: `POST /api/cron/strava-sync`
- Handles all participants or specific participant
- Returns summary of sync results

**Sync Flow**:
```typescript
async function syncParticipant(participantId: string) {
  // 1. Refresh token if needed
  await refreshTokenIfNeeded(participant)

  // 2. Fetch new activities (Strava API limit: 200 per page)
  const activities = await fetchActivities(page: 1)

  // 3. Filter for running only
  const runningActivities = activities.filter(a => a.sportType === 'Run')

  // 4. Store activities (avoid duplicates)
  for (const activity of runningActivities) {
    await prisma.activity.upsert({
      where: { stravaActivityId: activity.id },
      update: {},
      create: { ...activity }
    })
  }

  // 5. Update daily distances
  await updateDailyDistances(runningActivities)
}
```

**Risks**:
- ⚠️ Network failures in sync job
- ⚠️ Strava API rate limits
- ⚠️ Multiple sync runs shouldn't duplicate data
- ⚠️ Need error handling and retry logic

---

### API Design

**Structure** (Next.js Route Handlers):

```
/api/
├── strava/
│   ├── connect/route.ts       (GET) - Initiate OAuth
│   └── callback/route.ts      (GET) - Handle OAuth callback
├── stats/
│   ├── daily/route.ts         (GET) - Daily evolution
│   ├── weekly/route.ts        (GET) - Weekly comparison
│   ├── monthly/route.ts       (GET) - Monthly comparison
│   └── range/route.ts         (GET) - Custom date range
├── rankings/
│   └── weekly-winners/route.ts (GET) - Weekly rankings
└── cron/
    └── strava-sync/route.ts   (POST) - Trigger sync manually
```

**Response Format** (Standardized):

```typescript
// All stats endpoints return this format
{
  success: true,
  data: {
    participantId: string,
    name: string,
    distances: {
      daily: Array<{ date: string, distanceKm: number }>,
      weekly: Array<{ week: string, distances: { participant1: number, participant2: number } }>,
      monthly: Array<{ month: string, totalKm: number }>
    },
    total: number
  }
}

// Rankings response
{
  success: true,
  data: {
    week: string,
    winner: { participantId: string, name: string, km: number },
    rankings: [
      { participantId: string, name: string, km: number }
    ]
  }
}
```

**Key Design Decisions**:
- All endpoints use GET for stats/rankings, POST only for sync trigger
- Server Components fetch data directly, avoid client fetch in most cases
- Date range validation: from >= 2026-01-01, to <= 2026-12-31
- Return errors in consistent format with HTTP status codes

**Risks**:
- ⚠️ API responses can become complex
- ⚠️ Need proper error handling for invalid date ranges
- ⚠️ Rate limiting concerns (should be fine for MVP)

---

### Chart Rendering (Recharts)

**4 Chart Types**:

1. **Daily Evolution** (Line chart, cumulative)
   - X-axis: Dates (1 Jan - today)
   - Y-axis: Total cumulative km
   - Series: 3 lines (one per participant)
   - Use `Recharts.LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`

2. **Weekly Comparison** (Grouped bar chart)
   - X-axis: Weeks (grouped by year-week)
   - Y-axis: Weekly km per participant
   - Series: 3 bars per week
   - Use `Recharts.BarChart`, `Bar`, `XAxis`, `YAxis`, `Legend`

3. **Monthly Comparison** (Stacked area or line)
   - X-axis: Months
   - Y-axis: Monthly km
   - Series: 3 lines or stacked areas
   - Use `Recharts.LineChart` with `stacked: true`

4. **Date Range** (Custom filter, same as daily but dynamic)
   - Interactive date picker component
   - Same chart type as daily
   - Use `rechartscales` for custom ranges

**Component Structure**:

```typescript
// DailyProgressChart.tsx (Server Component)
export default async function DailyProgressChart({ participantId }: Props) {
  const data = await fetchDailyStats(participantId)

  return (
    <LineChart width={800} height={400} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      {participants.map(p => (
        <Line type="monotone" dataKey={p.id} stroke={p.color} name={p.name} />
      ))}
    </LineChart>
  )
}
```

**Key Design Decisions**:
- Use Server Components to avoid client-side hydration
- Recharts is good for simple charts, but may struggle with large datasets
- Consider `recharts/voronoi-tooltip` for better UX
- Performance: use `recharts/responsive-container` for responsiveness

**Risks**:
- ⚠️ Recharts may be slow with thousands of data points
- ⚠️ Complex charts need careful state management
- ⚠️ Need to handle date formatting consistently

---

### Landing Page Architecture

**Structure**:

```typescript
// app/page.tsx (Server Component)
export default async function LandingPage() {
  const participants = await getParticipants()
  const dailyStats = await getDailyStats() // All participants

  return (
    <div className="grid">
      {/* Summary Cards */}
      <SummaryCards participants={participants} dailyStats={dailyStats} />

      {/* Main Chart - Daily Evolution */}
      <DailyProgressChart data={dailyStats} />

      {/* Secondary Charts - Weekly and Monthly */}
      <div className="grid">
        <WeeklyChart data={dailyStats} />
        <MonthlyChart data={dailyStats} />
      </div>

      {/* Date Range Filter */}
      <RangeChart />

      {/* Weekly Rankings */}
      <WeeklyWinners rankings={rankings} />

      {/* Last Sync Status */}
      <SyncStatus />
    </div>
  )
}
```

**Key Design Decisions**:
- All data fetched on server, no client fetch
- Use Server Components to avoid multiple client requests
- Lazy load heavy components (charts) if needed
- Responsive grid layout with Tailwind

**Risks**:
- ⚠️ Too many API calls on page load (need to optimize)
- ⚠️ Charts may take time to render with large datasets
- ⚠️ Need to handle loading states gracefully

---

## Recommendation

**Primary Recommendation: Approach 1 (Monolithic Next.js App)**

This is the best choice for the MVP because:

1. **Faster Development** - Everything in one repo, no need to set up separate services
2. **Lower Complexity** - Easier to understand and maintain for a small team
3. **Free Deployment** - Vercel free tier covers this easily
4. **Good Enough Performance** - For 3 participants and limited activities, current approach works
5. **Scalable** - Can refactor to separate services later if needed

**Implementation Sequence**:

**Phase 1: Foundation** (Week 1)
1. Set up Next.js project with TypeScript, Tailwind
2. Install Prisma, configure PostgreSQL
3. Define and run database schema
4. Set up Strava OAuth flow (connect + callback)
5. Create token refresh logic

**Phase 2: Sync Logic** (Week 2)
1. Implement sync service (fetch activities, filter running, deduplicate)
2. Update DailyDistance table on each sync
3. Implement Cron job (Vercel Cron or GitHub Actions)
4. Add error handling and retry logic

**Phase 3: API Endpoints** (Week 2-3)
1. Create stats aggregation queries (daily, weekly, monthly, range)
2. Create rankings endpoint
3. Add input validation (Zod)
4. Document API responses

**Phase 4: Dashboard UI** (Week 3-4)
1. Build summary cards component
2. Implement DailyProgressChart with Recharts
3. Implement WeeklyChart and MonthlyChart
4. Add date range filter component
5. Create weekly rankings page

**Phase 5: Polish** (Week 4)
1. Add responsive design
2. Add loading states
3. Error handling and error pages
4. Final testing and deployment

**Key Success Factors**:
- ✅ Test OAuth flow thoroughly (multiple test accounts)
- ✅ Implement deduplication properly from day 1
- ✅ Write unit tests for sync logic
- ✅ Use date-fns for all date operations (consistency)
- ✅ Test Cron job manually before deploying

---

## Risks

### High Priority

1. **Strava OAuth Token Expiration**
   - **Risk**: Tokens expire hourly, sync will fail if not refreshed
   - **Mitigation**: Refresh tokens before each sync, check expiration time

2. **Data Deduplication Failures**
   - **Risk**: Same activity from Strava can cause duplicates if `stravaActivityId` not unique
   - **Mitigation**: Use `upsert` instead of `create`, validate `stravaActivityId` uniqueness

3. **Cron Job Reliability**
   - **Risk**: Cron may fail silently (network issues, timeouts)
   - **Mitigation**: Add retry logic, send alerts on failure, test locally first

4. **Date Range Validation**
   - **Risk**: Invalid date ranges could cause bugs or data leakage
   - **Mitigation**: Validate all date inputs, enforce 2026-01-01 to 2026-12-31 constraints

### Medium Priority

5. **Chart Performance with Large Datasets**
   - **Risk**: Recharts may be slow with thousands of data points
   - **Mitigation**: Use pagination or limit data points (e.g., show last 365 days only)

6. **API Rate Limits (Strava)**
   - **Risk**: API may rate limit if too many requests
   - **Mitigation**: Use caching, rate limit fetches, implement pagination

7. **Database Query Performance**
   - **Risk**: Aggregation queries become slow as data grows
   - **Mitigation**: Add database indexes, consider pre-computed tables for production

8. **Separation of Concerns (Monolithic Approach)**
   - **Risk**: Backend and frontend code mix, harder to test
   - **Mitigation**: Keep services in separate folders, use clear boundaries

### Low Priority

9. **User Experience - Sync Status Visibility**
   - **Risk**: Users don't know when last sync happened or if it failed
   - **Mitigation**: Show sync timestamp and status in UI

10. **Mobile Responsiveness**
    - **Risk**: Charts may not render well on mobile
    - **Mitigation**: Use responsive-container, test on multiple devices

---

## Decisions Made

1. **Use Next.js 14+ App Router** - Modern, better performance, Server Components
2. **Pre-compute DailyDistance table** - Easier to query than raw activities aggregation
3. **Implement Weekly/Monthly aggregation on demand** - Sufficient for MVP, better flexibility
4. **Vercel Cron for scheduling** - Simplest option, free tier available
5. **Store Strava tokens in database** - More secure than env variables, supports multiple participants
6. **Use Server Components for all pages** - Avoid client-side hydration, faster rendering
7. **Standardized API response format** - Consistency across all endpoints

---

## Alternative Options Considered

### Alternative 1: Pre-compute all aggregation tables
- **Pros**: Faster queries, better performance
- **Cons**: More maintenance, data duplication, harder to extend
- **Decision**: Not chosen for MVP - over-engineering

### Alternative 2: Webhooks from Strava
- **Pros**: Real-time updates, better UX
- **Cons**: More complex, requires webhook subscription management
- **Decision**: V2 feature, MVP uses polling (daily sync)

### Alternative 3: Separate service for sync
- **Pros**: Better separation, easier testing
- **Cons**: More infrastructure, harder to develop
- **Decision**: Overkill for MVP - can refactor later

### Alternative 4: Use serverless functions for aggregation
- **Pros**: Scalable, automatic scaling
- **Cons**: Complex for simple use case
- **Decision**: Not needed - Vercel handles this well

---

## Implementation Notes

### Date Handling
- Use `date-fns` for all date operations (consistency)
- Store dates as `DateTime` in Prisma (not string)
- Format dates for API responses (ISO 8601 strings)
- Use `startDate` (actual activity time) not `activityDate` (recorded time)

### Error Handling
- All API endpoints return error responses with `success: false`
- Use try-catch blocks for database operations
- Log errors to console (add Winston later for production)
- User-friendly error messages (not stack traces)

### Testing Strategy
- Focus on integration tests for sync flow
- Unit tests for aggregation logic
- E2E tests for OAuth flow
- Manual testing for charts (visual validation)

### Security Considerations
- Never expose Strava tokens in frontend code
- Validate all user inputs (date ranges, IDs)
- Use environment variables for sensitive config
- Clean up tokens on user disconnect (if added)

---

## Next Steps for Orchestrator

**Ready for Proposal: Yes**

The following should be presented to the user:

1. **Change Proposal** - Define scope, approach, and timeline
2. **Technical Design Document** - Detailed architecture, data models, API contracts
3. **Specs and Tasks** - Detailed requirements and implementation checklist

**Recommended Flow**:
1. ✅ Complete this exploration (done)
2. → Create change proposal (sdd-propose)
3. → Write technical design (sdd-design)
4. → Create specifications (sdd-spec)
5. → Break down tasks (sdd-tasks)
6. → Implement (sdd-apply)
7. → Verify (sdd-verify)

**User Questions**:
- Confirm this architecture approach is acceptable
- Confirm the timeline (4 weeks for MVP)
- Confirm deployment target (Vercel free tier)
- Confirm any requirements not covered in READMEs
