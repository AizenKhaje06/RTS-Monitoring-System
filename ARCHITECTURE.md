# System Architecture

Visual and technical overview of the RTS Monitoring Dashboard architecture.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Dashboard │  │  Reports   │  │  Analytics │            │
│  │   Views    │  │   Pages    │  │   Tools    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   App Router (RSC)                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Pages   │  │   API    │  │  Server  │            │ │
│  │  │          │  │  Routes  │  │Components│            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Business Logic Layer                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │Analytics │  │Validation│  │  Export  │            │ │
│  │  │          │  │          │  │          │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Cache   │  │Processor │  │  Types   │            │ │
│  │  │          │  │          │  │          │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Google   │  │  NextAuth  │  │  Analytics │            │
│  │   Sheets   │  │   (OAuth)  │  │  (Vercel)  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Architecture

### Request Flow (Uncached)

```
User Request
    │
    ▼
Next.js Page
    │
    ▼
API Route (/api/google-sheets/process)
    │
    ├─► Check Cache (Miss)
    │
    ▼
Google Sheets API
    │
    ▼
Data Processor
    │
    ├─► Normalize Status
    ├─► Determine Region
    ├─► Calculate Financials
    ├─► Validate Data
    │
    ▼
Store in Cache (30 min TTL)
    │
    ▼
Return to Client
    │
    ▼
Render Dashboard
```

### Request Flow (Cached)

```
User Request
    │
    ▼
Next.js Page
    │
    ▼
API Route
    │
    ├─► Check Cache (Hit) ✅
    │
    ▼
Return Cached Data (< 1 second)
    │
    ▼
Render Dashboard
```

## 🔄 Component Architecture

### Dashboard Structure

```
App (page.tsx)
│
├─► ErrorBoundary
│   │
│   └─► AuthProvider
│       │
│       └─► DashboardLayout
│           │
│           ├─► Sidebar
│           │   ├─► Navigation Menu
│           │   └─► Region Info
│           │
│           └─► Main Content
│               │
│               ├─► DashboardContent (Tabs)
│               │   ├─► Overview Tab
│               │   │   └─► DashboardView
│               │   │       ├─► Status Cards
│               │   │       ├─► Regional Charts
│               │   │       └─► Province Rankings
│               │   │
│               │   ├─► Trends Tab
│               │   │   └─► TrendChart
│               │   │       └─► Recharts LineChart
│               │   │
│               │   ├─► Comparison Tab
│               │   │   └─► ComparisonView
│               │   │       └─► Period Selector
│               │   │
│               │   ├─► Insights Tab
│               │   │   └─► PredictiveInsights
│               │   │       └─► Insight Cards
│               │   │
│               │   └─► Quality Tab
│               │       └─► DataQualityDashboard
│               │           ├─► Quality Score
│               │           ├─► Field Completeness
│               │           └─► Issues List
│               │
│               ├─► PerformanceReport
│               │   ├─► Metrics Table
│               │   ├─► Top Provinces
│               │   ├─► Top Municipalities
│               │   └─► Top Barangays
│               │
│               ├─► AnalyticalReport
│               │   ├─► Executive Summary
│               │   ├─► Zone Performance
│               │   ├─► Store Performance
│               │   └─► Critical Insights
│               │
│               └─► FinancialReport
│                   ├─► Revenue Metrics
│                   ├─► Profit Cards
│                   ├─► RTS Impact
│                   └─► Financial Summary
```

## 🗄️ Data Architecture

### Data Models

```typescript
// Core Data Structure
ProcessedData {
  all: RegionData
  luzon: RegionData
  visayas: RegionData
  mindanao: RegionData
}

RegionData {
  data: ParcelData[]
  stats: { [status]: StatusCount }
  provinces: { [province]: count }
  regions: { [region]: count }
  total: number
  winningShippers: { [shipper]: count }
  rtsShippers: { [shipper]: count }
}

ParcelData {
  date: string
  month: string
  status: string
  normalizedStatus: string
  shipper: string
  consigneeRegion: string
  province: string
  municipality: string
  barangay: string
  region: string
  island: string
  codAmount?: number
  serviceCharge?: number
  totalCost?: number
  rtsFee?: number
}
```

### Data Transformation Pipeline

```
Raw Google Sheets Data
    │
    ▼
Header Detection
    │
    ▼
Column Mapping
    │
    ▼
Row Processing
    │
    ├─► Status Normalization
    │   └─► DELIVERED, RETURNED, etc.
    │
    ├─► Region Determination
    │   └─► Luzon, Visayas, Mindanao
    │
    ├─► Financial Calculation
    │   └─► RTS Fee = Total Cost * 0.20
    │
    └─► Data Validation
        └─► Quality Scoring
    │
    ▼
Processed Data Structure
    │
    ▼
Cache Storage
    │
    ▼
Client Rendering
```

## 🔐 Security Architecture

### Authentication Flow

```
User
  │
  ▼
NextAuth
  │
  ├─► Google OAuth (Optional)
  │   └─► Access Token
  │
  └─► Session Management
      └─► JWT Token
```

### API Security

```
API Request
    │
    ▼
Rate Limiting (Future)
    │
    ▼
Input Validation
    │
    ▼
Authorization Check (Future)
    │
    ▼
Process Request
    │
    ▼
Sanitize Response
    │
    ▼
Return Data
```

## 💾 Caching Architecture

### Cache Strategy

```
┌─────────────────────────────────────┐
│         In-Memory Cache             │
│                                     │
│  Key: spreadsheet-id-sheet-name    │
│  Value: ProcessedData               │
│  TTL: 30 minutes                    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Cache Entry                 │  │
│  │  ├─ data: ProcessedData      │  │
│  │  ├─ timestamp: number        │  │
│  │  └─ ttl: number              │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Cache Operations

```
GET Request
    │
    ▼
Generate Cache Key
    │
    ▼
Check Cache
    │
    ├─► Hit ✅
    │   └─► Return Cached Data
    │
    └─► Miss ❌
        │
        ▼
    Fetch from Source
        │
        ▼
    Process Data
        │
        ▼
    Store in Cache
        │
        ▼
    Return Data
```

## 📈 Analytics Architecture

### Analytics Pipeline

```
Raw Data
    │
    ▼
Trend Analysis
    ├─► generateTrendData()
    └─► Time-series aggregation
    │
    ▼
Period Comparison
    ├─► compareTimePeriods()
    └─► Calculate changes
    │
    ▼
Predictive Insights
    ├─► generatePredictiveInsights()
    └─► Pattern detection
    │
    ▼
Data Quality
    ├─► generateDataQualityReport()
    └─► Validation scoring
    │
    ▼
Visualization
    └─► Charts & Tables
```

## 🎨 UI Component Hierarchy

### Component Tree

```
App
└─► ErrorBoundary
    └─► Providers
        ├─► AuthProvider
        └─► ThemeProvider (Future)
            └─► Layout
                ├─► Sidebar
                │   ├─► Logo
                │   ├─► Navigation
                │   └─► Footer
                │
                └─► Content
                    ├─► Header
                    │   ├─► Title
                    │   └─► ExportMenu
                    │
                    ├─► Filters
                    │   ├─► RegionToggle
                    │   └─► GlobalFilters
                    │
                    └─► Views
                        ├─► Cards
                        ├─► Charts
                        ├─► Tables
                        └─► Insights
```

## 🔄 State Management

### State Flow

```
Global State (React State)
    │
    ├─► data: ProcessedData | null
    ├─► currentView: string
    ├─► globalFilter: FilterState
    ├─► isLoading: boolean
    └─► fromCache: boolean
    │
    ▼
Component State (Local)
    │
    ├─► currentRegion: string
    ├─► selectedMonth: string
    ├─► filterType: string
    └─► filterValue: string
```

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────┐
│         CDN (Vercel Edge)           │
│  ┌──────────────────────────────┐  │
│  │   Static Assets              │  │
│  │   - Images                   │  │
│  │   - CSS                      │  │
│  │   - JS Bundles               │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│      Vercel Serverless Functions    │
│  ┌──────────────────────────────┐  │
│  │   Next.js Server             │  │
│  │   - API Routes               │  │
│  │   - SSR Pages                │  │
│  │   - Server Components        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│       External Services              │
│  ┌──────────────────────────────┐  │
│  │   Google Sheets API          │  │
│  │   NextAuth                   │  │
│  │   Analytics                  │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 📊 Performance Optimization

### Optimization Strategies

```
1. Caching Layer
   ├─► In-memory cache (30 min)
   ├─► Browser cache
   └─► CDN cache

2. Code Splitting
   ├─► Dynamic imports
   ├─► Route-based splitting
   └─► Component lazy loading

3. Data Optimization
   ├─► Efficient algorithms
   ├─► Memoization
   └─► Debouncing

4. Asset Optimization
   ├─► Image optimization
   ├─► CSS minification
   └─► JS bundling
```

## 🔍 Monitoring Architecture

### Monitoring Stack (Future)

```
Application
    │
    ├─► Error Tracking (Sentry)
    │   └─► Exception monitoring
    │
    ├─► Performance (Vercel Analytics)
    │   └─► Web Vitals
    │
    ├─► Logging (Console/CloudWatch)
    │   └─► Application logs
    │
    └─► Uptime (Pingdom/UptimeRobot)
        └─► Availability monitoring
```

## 🎯 Scalability Considerations

### Horizontal Scaling

```
Load Balancer
    │
    ├─► Server Instance 1
    ├─► Server Instance 2
    └─► Server Instance N
    │
    ▼
Shared Cache (Redis - Future)
    │
    ▼
Database (PostgreSQL - Future)
```

### Vertical Scaling

```
Current: Serverless (Auto-scaling)
    │
    ├─► Memory: 1024 MB
    ├─► Timeout: 10 seconds
    └─► Concurrent: 1000
```

## 📝 Technology Stack Summary

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI**: Radix UI + Tailwind
- **Charts**: Recharts
- **State**: React Hooks

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Data**: Google Sheets API
- **Cache**: In-memory

### DevOps
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics
- **Logs**: Vercel Logs

---

**Architecture Version**: 2.0.0
**Last Updated**: January 2025
**Status**: Production Ready ✅
