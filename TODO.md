# Fix Parcel Status Data Issue

## Problem
Parcel status in all pages has no data because the status normalization is too strict, causing many statuses to be classified as "OTHER" and not counted.

## Solution
Modify the `normalizeStatus` function in `lib/google-sheets-processor.ts` to use more inclusive matching with `includes()` instead of exact matches.

## Steps
- [x] Update normalizeStatus function to use includes() for better matching
- [x] Test the changes to ensure all statuses are properly categorized
- [x] Reorder conditions to prioritize more specific/problematic statuses first
