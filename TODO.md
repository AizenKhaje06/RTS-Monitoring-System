# Implementation Plan for Parcel Page under All Regions

## Steps to Complete:

- [x] Create components/total-parcel-card.tsx: New KPI card component displaying total parcel count with styling similar to StatusCard (glassmorphism, gradient, Package icon), using props { total: number }. Show count prominently, 100% percentage, no bar chart.

- [x] Update components/dashboard-view.tsx: 
  - Add import for TotalParcelCard.
  - Conditionally render <TotalParcelCard total={displayData.total} /> in a full-width row (grid-cols-1) before the status cards grid, only when currentRegion === "all".
  - Add a subtle subheader like "Parcel Overview" after region tabs for context.

- [ ] Test the changes:
  - Run `pnpm dev` to start the development server.
  - Upload sample data via the modal.
  - Switch to "All regions" and verify the total parcel card displays correctly (e.g., count from data.total).
  - Check responsiveness and styling matches the dashboard theme.

- [x] Update TODO.md: Mark completed steps and note any issues.

After completion, the "Parcel page" will be integrated as an enhanced view under "All regions" showing the total count as a prominent KPI.
