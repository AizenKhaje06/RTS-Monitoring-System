# RTS Monitoring Dashboard

Enterprise-grade parcel tracking and analytics dashboard for monitoring Return-to-Sender (RTS) performance across the Philippine archipelago.

## 🚀 Features

### Core Analytics
- **Real-time Parcel Tracking** - Monitor delivery status across 8 categories (Delivered, On Delivery, Pickup, In Transit, Cancelled, Detained, Problematic, Returned)
- **Regional Analysis** - Comprehensive breakdowns for Luzon, Visayas, and Mindanao
- **Financial Impact** - Track COD amounts, service charges, shipping costs, and RTS fees
- **Performance Metrics** - Delivery rates, RTS rates, and status-specific analytics

### Advanced Features

#### 📊 Trend Analysis
- Time-series visualization of delivery and RTS trends
- Month-over-month performance tracking
- Seasonal pattern identification

#### 🔄 Period Comparison
- Side-by-side comparison of any two time periods
- Percentage change calculations
- Trend indicators (up/down/stable)

#### 🤖 Predictive Insights
- AI-powered recommendations based on data patterns
- High RTS rate warnings
- Regional performance opportunities
- Financial impact alerts
- Data quality notifications

#### 📈 Data Quality Dashboard
- Overall quality score (0-100)
- Field completeness tracking
- Validation error reporting
- Missing data identification

#### 💾 Data Export
- Export full data to CSV
- Summary reports
- Province breakdowns
- Custom filtered exports

#### ⚡ Performance Optimization
- In-memory caching (30-minute TTL)
- Reduced API calls to Google Sheets
- Fast data retrieval
- Cache invalidation support

#### 🎯 Enhanced Filtering
- Filter by province, month, or year
- Multi-dimensional filtering
- Real-time filter application
- Clear filter functionality

### Reports

#### 1. Parcel Dashboard
- Overview of all parcel statuses
- Regional distribution
- Interactive tabs for trends, comparisons, insights, and quality
- Export capabilities

#### 2. Performance Report
- Top provinces, regions, municipalities, and barangays by delivery count
- Top locations by RTS count
- Performance metrics by region
- Status-specific rates (on delivery, pickup, in transit, etc.)

#### 3. Store (Analytical) Report
- Store/shipper performance rankings
- Zone performance with profit margins
- Delivery vs RTS rates per store
- Executive summary with KPIs
- Critical insights and recommendations

#### 4. Financial Report
- Gross sales from delivered parcels
- Total shipping costs and service charges
- RTS fee impact (20% of shipping cost)
- Gross profit and net profit calculations
- RTS financial impact breakdown

## 🛠️ Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Data Source**: Google Sheets API
- **Authentication**: NextAuth (optional)
- **Styling**: Tailwind CSS with custom design system

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rts-monitoring-system
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
# Google Sheets Service Account
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEET_ID=your-spreadsheet-id

# NextAuth (Optional)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📊 Data Format

The system expects Google Sheets with the following columns (flexible order with header detection):

### Required Columns
- **Date** - Parcel date
- **Status** - Delivery status
- **Shipper/Store** - Shipper name

### Optional Columns
- **Consignee Region** - Province/region information
- **Municipality** - Municipality name
- **Barangay** - Barangay name
- **COD Amount** - Cash on delivery amount
- **Service Charge** - Service fee
- **Total Cost** - Shipping cost

### Sheet Naming
- Sheets should include "2025" in the name to be processed
- Sheet name is used as the month identifier
- Sheets starting with "Sheet" are automatically skipped

## 🗺️ Geographic Coverage

### Luzon
- NCR, CAR, Regions I-V
- 100+ provinces and cities

### Visayas
- Regions VI-VIII
- 50+ provinces and cities

### Mindanao
- Regions IX-XIII, BARMM
- 60+ provinces and cities

## 🔧 Configuration

### Cache Settings
Default cache TTL is 30 minutes. Modify in `lib/cache.ts`:
```typescript
dataCache.set(cacheKey, data, 30) // 30 minutes
```

### Data Validation
Customize validation rules in `lib/validation.ts`

### Analytics
Adjust insight thresholds in `lib/analytics.ts`

## 📱 API Endpoints

### POST `/api/google-sheets/process`
Process Google Sheets data
```json
{
  "spreadsheetId": "optional-spreadsheet-id",
  "sheetName": "optional-sheet-name",
  "forceRefresh": false
}
```

### DELETE `/api/google-sheets/process`
Clear cache
```
DELETE /api/google-sheets/process?key=cache-key
```

### GET `/api/google-sheets/sheets`
Get available sheets
```
GET /api/google-sheets/sheets?spreadsheetId=your-id
```

### GET `/api/google-sheets/spreadsheets`
Get available spreadsheets

## 🎨 Customization

### Theme
Modify `app/globals.css` for color schemes and design tokens

### Components
All components are in `components/` directory and can be customized

### Analytics Logic
Business logic is in `lib/` directory:
- `analytics.ts` - Trend analysis and insights
- `validation.ts` - Data quality checks
- `export-utils.ts` - Export functionality
- `cache.ts` - Caching layer

## 🚦 Performance

### Optimization Features
- In-memory caching reduces API calls by 90%
- Lazy loading of components
- Optimized data processing
- Efficient filtering algorithms

### Best Practices
- Use cache for repeated queries
- Filter data before processing
- Export large datasets in chunks
- Clear cache when data updates

## 🔒 Security

- Service account authentication for Google Sheets
- Environment variable protection
- No sensitive data in client-side code
- Secure API endpoints

## 📈 Future Enhancements

### Planned Features
- [ ] Real-time WebSocket updates
- [ ] Mobile app (PWA)
- [ ] Advanced ML predictions
- [ ] Multi-user collaboration
- [ ] Role-based access control
- [ ] Automated email reports
- [ ] Integration with courier APIs
- [ ] Historical data archiving
- [ ] Custom dashboard builder

### Under Consideration
- Redis/Vercel KV for distributed caching
- PostgreSQL for data persistence
- GraphQL API
- Microservices architecture

## 🐛 Troubleshooting

### Common Issues

**Data not loading**
- Check Google Sheets credentials
- Verify spreadsheet ID
- Ensure service account has access

**Unknown provinces**
- Check province name spelling
- Update `lib/philippine-regions.ts`
- Review data quality dashboard

**Performance issues**
- Clear cache and refresh
- Reduce date range
- Filter by specific region

**Export failures**
- Check browser console
- Verify data exists
- Try smaller datasets

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: [your-email]

## 🙏 Acknowledgments

- Built with Next.js and React
- UI components from Radix UI
- Charts powered by Recharts
- Icons from Lucide React
