-- Migration: Create HarvestTracking table
-- Run this in your backend migration system or SQL console.

CREATE TABLE HarvestTracking (
  harvestId BIGINT PRIMARY KEY,
  cropId INT NOT NULL,
  cropName VARCHAR(200) NOT NULL,
  harvestTimestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  cleanedTimestamp TIMESTAMP WITH TIME ZONE NULL,
  packedTimestamp TIMESTAMP WITH TIME ZONE NULL,
  shippedTimestamp TIMESTAMP WITH TIME ZONE NULL,
  deliveredTimestamp TIMESTAMP WITH TIME ZONE NULL,
  freshnessScore INT NOT NULL DEFAULT 100,
  freshnessStatus VARCHAR(100) NOT NULL DEFAULT 'Very Fresh',
  shelfLifeHours INT NOT NULL,
  customerSatisfaction INT NULL,
  isWasted BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_harvest_tracking_cropId ON HarvestTracking(cropId);
CREATE INDEX idx_harvest_tracking_harvestTimestamp ON HarvestTracking(harvestTimestamp);
CREATE INDEX idx_harvest_tracking_isWasted ON HarvestTracking(isWasted);
