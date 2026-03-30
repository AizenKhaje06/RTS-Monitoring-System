# Testing Guide

Comprehensive guide for testing all features of the RTS Monitoring Dashboard.

## 🧪 Testing Checklist

### Pre-Testing Setup
- [ ] Environment variables configured
- [ ] Google Sheets accessible
- [ ] Service account has permissions
- [ ] Development server running
- [ ] Browser console open

## 1. Initial Load Testing

### Test: First Time Load
**Steps:**
1. Open http://localhost:3000
2. Click "Enter Dashboard"
3. Wait for data processing

**Expected Results:**
- ✅ Loading overlay appears
- ✅ "Processing Google Sheets data..." message shows
- ✅ Data loads within 30-60 seconds
- ✅ Dashboard displays with data
- ✅ No errors in console

**Common Issues:**
- ❌ "Failed to process data" → Check credentials
- ❌ Timeout → Check spreadsheet size
- ❌ No data → Verify sheet names include "2025"

### Test: Cached Load
**Steps:**
1. Refresh the page
2. Click "Enter Dashboard" again

**Expected Results:**
- ✅ Loads in 1-2 seconds
- ✅ Console shows "Data loaded from cache"
- ✅ Same data as before
- ✅ No API call to Google Sheets

## 2. Dashboard Features Testing

### Test: Overview Tab
**Steps:**
1. Navigate to Dashboard
2. Verify Overview tab is active

**Expected Results:**
- ✅ Status cards show correct counts
- ✅ Regional breakdown displays
- ✅ Province rankings visible
- ✅ All numbers are accurate

### Test: Trends Tab
**Steps:**
1. Click "Trends" tab
2. Observe the chart

**Expected Results:**
- ✅ Line chart renders
- ✅ Shows delivered and returned lines
- ✅ Delivery rate line visible
- ✅ Hover shows tooltips
- ✅ X-axis shows months
- ✅ Y-axis shows counts/percentages

### Test: Comparison Tab
**Steps:**
1. Click "Comparison" tab
2. Select Period 1 (e.g., "JANUARY 2025")
3. Select Period 2 (e.g., "FEBRUARY 2025")

**Expected Results:**
- ✅ Comparison data displays
- ✅ All metrics shown
- ✅ Percentage changes calculated
- ✅ Trend indicators (↑↓) correct
- ✅ Colors match trends (green=good, red=bad)

### Test: Insights Tab
**Steps:**
1. Click "Insights" tab
2. Review recommendations

**Expected Results:**
- ✅ Insights cards display
- ✅ Impact levels shown (high/medium/low)
- ✅ Recommendations are relevant
- ✅ Icons match insight types
- ✅ At least 2-3 insights generated

**Insight Types to Verify:**
- High RTS Rate warning (if RTS > 15%)
- Regional performance opportunities
- Financial impact alerts
- Data quality notifications

### Test: Data Quality Tab
**Steps:**
1. Click "Data Quality" tab
2. Review quality score

**Expected Results:**
- ✅ Quality score displays (0-100)
- ✅ Score label correct (Excellent/Good/Fair/Poor)
- ✅ Valid/Invalid record counts shown
- ✅ Field completeness bars display
- ✅ Top issues listed
- ✅ All percentages accurate

## 3. Export Functionality Testing

### Test: Export Menu
**Steps:**
1. Click "Export" button on any report
2. Verify dropdown opens

**Expected Results:**
- ✅ Dropdown menu appears
- ✅ Three options visible:
  - Full Data (CSV)
  - Summary Report (CSV)
  - Province Breakdown (CSV)

### Test: Full Data Export
**Steps:**
1. Click "Export" → "Full Data (CSV)"
2. Check downloaded file

**Expected Results:**
- ✅ File downloads automatically
- ✅ Filename includes date and region
- ✅ CSV opens in Excel/Sheets
- ✅ All columns present
- ✅ Data matches dashboard

**Verify Columns:**
- Date, Month, Status, Normalized Status
- Shipper, Consignee Region, Province
- Municipality, Barangay, Region, Island
- COD Amount, Service Charge, Total Cost, RTS Fee

### Test: Summary Export
**Steps:**
1. Click "Export" → "Summary Report (CSV)"
2. Check downloaded file

**Expected Results:**
- ✅ File downloads
- ✅ Shows status breakdown
- ✅ Counts and percentages correct
- ✅ All 8 statuses included

### Test: Province Breakdown Export
**Steps:**
1. Click "Export" → "Province Breakdown (CSV)"
2. Check downloaded file

**Expected Results:**
- ✅ File downloads
- ✅ Lists all provinces
- ✅ Parcel counts correct
- ✅ Percentages accurate

## 4. Filtering Testing

### Test: Province Filter
**Steps:**
1. Select "Province" from filter dropdown
2. Enter "Manila"
3. Click "Apply"

**Expected Results:**
- ✅ Data filters to Manila only
- ✅ All metrics recalculate
- ✅ Charts update
- ✅ Export respects filter

### Test: Month Filter
**Steps:**
1. Select "Month" from filter dropdown
2. Choose "January"
3. Click "Apply"

**Expected Results:**
- ✅ Data filters to January
- ✅ Counts update
- ✅ Trends adjust
- ✅ Comparisons work

### Test: Year Filter
**Steps:**
1. Select "Year" from filter dropdown
2. Choose "2025"
3. Click "Apply"

**Expected Results:**
- ✅ Data filters to 2025
- ✅ All reports update
- ✅ Export includes only 2025

### Test: Clear Filter
**Steps:**
1. Apply any filter
2. Click "Clear"

**Expected Results:**
- ✅ Filter resets to "All"
- ✅ Full dataset displays
- ✅ All metrics return to original

## 5. Regional Toggle Testing

### Test: Region Switching
**Steps:**
1. Click "All Regions" button
2. Click "Luzon" button
3. Click "Visayas" button
4. Click "Mindanao" button

**Expected Results:**
- ✅ Data filters to selected region
- ✅ Button highlights active region
- ✅ Metrics recalculate
- ✅ Charts update
- ✅ Export menu reflects region

## 6. Performance Report Testing

### Test: Performance Metrics Table
**Steps:**
1. Navigate to Performance Report
2. Review metrics table

**Expected Results:**
- ✅ All regions listed
- ✅ 8 status columns visible
- ✅ Percentages and counts shown
- ✅ Colors match statuses
- ✅ Totals are accurate

### Test: Top Provinces (Delivered)
**Steps:**
1. Scroll to "Delivered Results"
2. Review top provinces

**Expected Results:**
- ✅ Top 10 provinces listed
- ✅ Ranked by delivery count
- ✅ Counts are accurate
- ✅ No "Unknown" in top 10 (ideally)

### Test: Top Municipalities
**Steps:**
1. Check municipalities section
2. Verify data

**Expected Results:**
- ✅ Top 10 municipalities shown
- ✅ Delivery counts correct
- ✅ Rankings accurate

### Test: Top Barangays
**Steps:**
1. Check barangays section
2. Verify data

**Expected Results:**
- ✅ Top 10 barangays shown
- ✅ Delivery counts correct
- ✅ Rankings accurate

### Test: RTS Sections
**Steps:**
1. Scroll to "Returned Results"
2. Review all RTS sections

**Expected Results:**
- ✅ Top RTS provinces shown
- ✅ Top RTS regions shown
- ✅ Top RTS municipalities shown
- ✅ Top RTS barangays shown
- ✅ All counts accurate

## 7. Analytical Report Testing

### Test: Executive Summary
**Steps:**
1. Navigate to Analytical Report
2. Review summary cards

**Expected Results:**
- ✅ 6 metric cards display
- ✅ Total Shipments correct
- ✅ Delivery Rate accurate
- ✅ RTS Rate accurate
- ✅ Gross Sales correct
- ✅ Net Profit calculated
- ✅ Avg Profit/Shipment shown

### Test: Zone Performance
**Steps:**
1. Review zone performance table
2. Verify calculations

**Expected Results:**
- ✅ All regions listed
- ✅ Delivery rates correct
- ✅ RTS rates accurate
- ✅ Financial metrics calculated
- ✅ Profit margins shown
- ✅ Color coding appropriate

### Test: Store Performance
**Steps:**
1. Review store performance table
2. Check top 10 stores

**Expected Results:**
- ✅ Stores ranked by net profit
- ✅ All metrics accurate
- ✅ Delivery/RTS rates correct
- ✅ Financial data calculated

### Test: Critical Insights
**Steps:**
1. Review insights cards
2. Verify recommendations

**Expected Results:**
- ✅ 3 insight cards display
- ✅ Highest performing region identified
- ✅ Worst RTS region shown
- ✅ Top store highlighted
- ✅ Recommendations relevant

## 8. Financial Report Testing

### Test: Revenue Metrics
**Steps:**
1. Navigate to Financial Report
2. Review top 4 cards

**Expected Results:**
- ✅ Gross Sales displayed
- ✅ Total Service Charge shown
- ✅ Total Shipping Cost calculated
- ✅ Total RTS Fee (20%) correct
- ✅ All amounts formatted with ₱

### Test: Profit Cards
**Steps:**
1. Review Gross Profit card
2. Review Net Profit card

**Expected Results:**
- ✅ Gross Profit = Sales - Costs
- ✅ Net Profit = Gross - RTS Fees
- ✅ Formulas correct
- ✅ Colors appropriate (green/blue)

### Test: RTS Impact Section
**Steps:**
1. Review RTS Financial Impact card
2. Verify all metrics

**Expected Results:**
- ✅ RTS Parcel count correct
- ✅ RTS Shipping Cost calculated
- ✅ RTS Fee Impact shown
- ✅ All in red (warning color)

### Test: Financial Summary
**Steps:**
1. Review summary breakdown
2. Verify calculations

**Expected Results:**
- ✅ All line items present
- ✅ Calculations accurate
- ✅ Net Profit highlighted
- ✅ Formatting consistent

## 9. Error Handling Testing

### Test: Invalid Credentials
**Steps:**
1. Modify `.env.local` with wrong credentials
2. Try to load dashboard

**Expected Results:**
- ✅ Error message displays
- ✅ No crash
- ✅ Error boundary catches issue
- ✅ User can reload

### Test: Network Error
**Steps:**
1. Disconnect internet
2. Try to load dashboard

**Expected Results:**
- ✅ Error message shows
- ✅ Retry option available
- ✅ No crash

### Test: Invalid Data
**Steps:**
1. Add malformed data to sheet
2. Load dashboard

**Expected Results:**
- ✅ Data Quality tab shows issues
- ✅ Invalid records counted
- ✅ Dashboard still loads
- ✅ Valid data displays

## 10. Cache Testing

### Test: Cache Hit
**Steps:**
1. Load dashboard (first time)
2. Note load time
3. Refresh and load again
4. Note load time

**Expected Results:**
- ✅ First load: 30-60 seconds
- ✅ Second load: 1-2 seconds
- ✅ Console shows "from cache"
- ✅ Data identical

### Test: Cache Expiry
**Steps:**
1. Load dashboard
2. Wait 31 minutes
3. Load again

**Expected Results:**
- ✅ Cache expired
- ✅ Fresh data fetched
- ✅ New cache created
- ✅ Load time back to 30-60 seconds

### Test: Force Refresh
**Steps:**
1. Load dashboard (cached)
2. Modify spreadsheet
3. Load with forceRefresh=true

**Expected Results:**
- ✅ Cache bypassed
- ✅ Fresh data loaded
- ✅ New data displays
- ✅ Cache updated

## 11. Browser Compatibility Testing

### Test: Chrome
- [ ] All features work
- [ ] Charts render correctly
- [ ] Export downloads
- [ ] No console errors

### Test: Firefox
- [ ] All features work
- [ ] Charts render correctly
- [ ] Export downloads
- [ ] No console errors

### Test: Safari
- [ ] All features work
- [ ] Charts render correctly
- [ ] Export downloads
- [ ] No console errors

### Test: Edge
- [ ] All features work
- [ ] Charts render correctly
- [ ] Export downloads
- [ ] No console errors

## 12. Mobile Testing

### Test: Mobile View
**Steps:**
1. Open on mobile device or use DevTools
2. Navigate through all pages

**Expected Results:**
- ✅ Layout responsive
- ✅ Buttons accessible
- ✅ Charts visible
- ✅ Tables scrollable
- ✅ Export works

## 🐛 Bug Reporting Template

When you find a bug, report it with:

```markdown
**Bug Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [Browser version]
- OS: [Windows/Mac/Linux]
- Node Version: [18.x/20.x]

**Console Errors:**
[Paste any console errors]

**Screenshots:**
[Attach if relevant]
```

## ✅ Testing Sign-Off

After completing all tests:

- [ ] All core features tested
- [ ] All reports verified
- [ ] Export functionality works
- [ ] Filters apply correctly
- [ ] Cache functions properly
- [ ] Error handling works
- [ ] No critical bugs found
- [ ] Documentation accurate
- [ ] Ready for production

## 📊 Test Results Template

```markdown
# Test Results - [Date]

## Summary
- Tests Run: [X]
- Tests Passed: [X]
- Tests Failed: [X]
- Critical Issues: [X]

## Detailed Results
[List each test and result]

## Issues Found
[List any bugs or problems]

## Recommendations
[Suggestions for improvements]

## Sign-Off
Tested by: [Name]
Date: [Date]
Status: [Pass/Fail/Conditional Pass]
```

---

**Remember:** Testing is crucial for ensuring quality. Take your time and be thorough!
