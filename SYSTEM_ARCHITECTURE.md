# System Architecture Documentation

## Overview Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│                    (React + Next.js + Charts)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/dashboard        /api/overview    /api/lifecycle   │  │
│  │ /api/issues           /api/financial   /api/analytics   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Features: Error Handling, Logging, Caching, CORS              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Caching Layer                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ In-Memory Cache (5min TTL) | Cache Middleware           │  │
│  │ Query Parameters → Cache Key Mapping                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Data Transformation Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Sheet Data Parser | Data Aggregator | Metrics Calculator│  │
│  │ Date Range Filtering | Pagination | Forecasting         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Google Sheets API Layer                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Service Account Auth | Sheets Read API | Row Filtering  │  │
│  │ Separator Detection | Error Handling | Retry Logic      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                       Google Sheets
\`\`\`

## Data Flow

### Request Path (Read)
\`\`\`
User Dashboard
    ↓
fetch('/api/dashboard?startDate=...&endDate=...')
    ↓
Middleware: Check cache
    ├─ HIT: Return cached response (immediate)
    └─ MISS: Continue
    ↓
API Route: Validate params
    ↓
Import lib/google-sheets
    ↓
Authenticate to Google Sheets API
    ↓
Fetch raw data
    ↓
Transform CWAGO format
    ↓
Calculate aggregates & metrics
    ↓
Store in cache
    ↓
Return JSON response
\`\`\`

### Update Path (Write)
\`\`\`
User Action (e.g., add note)
    ↓
POST /api/notes/add { date, note }
    ↓
Validate payload
    ↓
Append to Audit Trail sheet
    ↓
Invalidate affected caches:
  - dashboard
  - overview
  - issues
    ↓
Return success response
\`\`\`

## Data Structures

### Dashboard Response
\`\`\`typescript
{
  success: boolean;
  overview: {
    latest: { /* current day metrics */ };
    totals: { /* aggregate metrics */ };
    lastUpdated: string;
  };
  lifecycle: {
    stages: Array<{name, count, amount, percent}>;
    date: Date;
  };
  issues: {
    issues: Array<{type, priority, message, count, amount}>;
    detained: {count, amount, percent};
    returned: {count, amount, percent};
  };
  financial: {
    grossRevenue: number;
    shippingFees: number;
    adSpend: number;
    netRevenue: number;
    profitMargin: number;
    avgOrderValue: number;
  };
  analytics: {
    trends: Array<{date, totalOrders, delivered, revenue, ...}>;
    metrics: {conversionRate, fulfillmentRate, successRate};
  };
}
\`\`\`

## Performance Characteristics

### Caching Strategy
- **Dashboard**: 5 minute cache (high-traffic endpoint)
- **Overview**: 5 minute cache
- **Issues**: 3 minute cache (time-sensitive)
- **Analytics**: 10 minute cache (historical data)
- **Forecast**: 15 minute cache

### Expected Response Times
- Cached: <100ms
- Fresh (small date range): <1s
- Fresh (large date range): 2-5s

### API Quota Usage (Google Sheets)
- With caching: 2-4 calls/hour
- Without caching: 100+ calls/hour (during active use)
- **Savings: 96-98%**

## Security Architecture

### Authentication
- Google Service Account (server-to-server)
- No user authentication yet (recommended for enterprise)

### Authorization
- Share sheet with service account email only
- Read-only access for analytics, write for audit trail

### Network Security
- HTTPS enforced (via Vercel)
- CORS restricted to configured domain
- API keys never exposed to client
- Environment variables stored in Vercel

### Data Protection
- Data encrypted in transit (TLS)
- At-rest encryption depends on Google Sheets
- Audit trail for all write operations
- Structured logging with sanitization

## Scalability Considerations

### Current Limits
- **Users**: 1-5 concurrent (single node)
- **Data**: ~1000 rows per sheet
- **Requests**: ~10 req/s (with caching)

### Scaling Path

**Phase 1 (Current - 10K MAU)**
- In-memory caching
- Google Sheets as primary DB
- Single Vercel deployment

**Phase 2 (100K MAU)**
- Add Supabase PostgreSQL
- Redis for distributed caching
- Multiple API edge regions

**Phase 3 (1M+ MAU)**
- Elasticsearch for search
- Message queue (RabbitMQ/Kafka)
- Microservices architecture

## Deployment Architecture

\`\`\`
                    Vercel Edge Network
                    (Global CDN)
                           ↓
    ┌─────────────┬────────────────┬──────────────┐
    ↓             ↓                ↓              ↓
NYC Region    LON Region      SFO Region    SGP Region
  (Node)        (Node)          (Node)        (Node)
   ↓ ↓           ↓ ↓             ↓ ↓           ↓ ↓
 API Route    API Route      API Route     API Route
   ↓             ↓                ↓              ↓
            Google Sheets API
\`\`\`

Each region has:
- In-memory cache (local)
- API route handler
- Connection to Google Sheets (shared)

---

Last Updated: November 14, 2025
