# TODO: Implement Corporate Performance Dashboard

## Tasks
- [x] Update metrics calculations for new KPIs (Gross Sales, Net Profit, Profit Margin, etc.)
- [x] Implement Executive Summary section with KPI cards
- [x] Create Top Performing Regions table with sorting and color coding
- [x] Create Store Performance table with sorting
- [x] Add Critical Insights section with 3 bullet points
- [x] Add Recommendations section with 3 action items
- [x] Test calculations with sample data

# TODO: Expand Reports Module

## Tasks
- [x] Create lib/reports.ts with 10 admin-side report functions
- [x] Implement User Summary Report
- [x] Implement Deposit Summary
- [x] Implement Withdrawal Summary
- [x] Implement Transaction Report
- [x] Implement Commission Report
- [x] Implement Agent Performance Report
- [x] Implement Financial Summary
- [x] Implement Audit Log Report
- [x] Implement System Health Report
- [x] Implement Customer Support Report

# TODO: Add Filter Section to Analytical Report

## Tasks
- [x] Add filter controls UI to analytical-report.tsx (province, month, year)
- [x] Verify filtering logic consistency between analytical and financial reports
- [x] Test filter functionality across both dashboards
- [x] Ensure date parsing handles various Excel date formats correctly

# TODO: Fix Parcel Counting Discrepancy

## Tasks
- [x] Double-check code in counting parcel status for total parcels and delivered parcels
- [x] Modify excel-processor.ts to include all parcels with valid status in counts, even if region is unknown
- [x] Test updated logic to ensure counts match Excel data

# TODO: Fix Financial Report JavaScript Error

## Tasks
- [x] Fix "Cannot access 'n' before initialization" error in financial-report.tsx
- [x] Move rtsStatuses declaration before use in useMemo
- [x] Remove duplicate declaration
