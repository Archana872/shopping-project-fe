# Backend Sample: HarvestTracking Migration

This folder contains a sample database migration for a new backend repository. It is intended as a starting point for implementing the `HarvestTracking` table once backend code exists.

## Sample Table Schema

- `harvestId` - primary key
- `cropId` - reference to crop/product
- `cropName` - display name for the crop
- `harvestTimestamp` - original harvest time
- `cleanedTimestamp`, `packedTimestamp`, `shippedTimestamp`, `deliveredTimestamp` - timeline stage timestamps
- `freshnessScore` - computed freshness rating (0-100)
- `freshnessStatus` - human-readable freshness status
- `shelfLifeHours` - expected shelf life duration
- `customerSatisfaction` - optional satisfaction rating
- `isWasted` - boolean flag for waste status

## How to use

1. Copy the SQL migration from `migrations/001_create_harvest_tracking_table.sql` into your backend migration system.
2. Adjust column types and relationships to match your backend stack.
3. Add API endpoints for harvest creation, timeline updates, freshness recalculation, and owner actions.
