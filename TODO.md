# TODO: Change Financial Impact Report Computation Focus

## Task: Focus computation only to Delivered and Returned

### Steps:
- [x] Update rtsStatuses in components/financial-report.tsx to only include "RETURNED"
- [x] Verify the change excludes PROBLEMATIC from RTS calculations

### Information Gathered:
- Financial report computes gross sales from DELIVERED parcels (codAmount)
- RTS impact calculated from parcels with statuses in rtsStatuses array
- Currently rtsStatuses = ["PROBLEMATIC", "RETURNED"]
- Change to rtsStatuses = ["RETURNED"] to focus only on Delivered (sales) and Returned (RTS)

### Dependent Files:
- components/financial-report.tsx

### Followup Steps:
- Test the report to ensure RTS calculations now only consider RETURNED parcels
