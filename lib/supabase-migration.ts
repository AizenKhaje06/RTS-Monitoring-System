// Supabase Migration Utility
// Exports Google Sheets data to SQL format for Supabase

import type { ParcelData } from "./types"

export interface SupabaseParcel {
  id?: number
  parcel_date: string
  shipper_name: string
  address: string
  contact_number: string
  amount: number
  items: string
  tracking_number: string
  status: string
  normalized_status: string
  reason: string
  province: string
  municipality: string
  region: string
  island: string
  cod_amount: number
  service_charge: number
  total_cost: number
  rts_fee: number
  created_at?: string
  updated_at?: string
}

// Parse date string to standard YYYY-MM-DD format
// Uses the month from sheet name to determine the correct year
function parseDate(dateStr: string, monthFromSheet: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null
  
  try {
    // Extract year from sheet name (e.g., "MARCH 2026" -> 2026)
    const yearMatch = monthFromSheet.match(/202[0-9]/);
    const yearFromSheet = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
    
    // Extract month from sheet name
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthLower = monthFromSheet.toLowerCase();
    let monthNumber = 1;
    
    for (let i = 0; i < monthNames.length; i++) {
      if (monthLower.includes(monthNames[i])) {
        monthNumber = i + 1;
        break;
      }
    }
    
    // Parse the day from dateStr
    let day = 1;
    
    // Try to extract day number from various formats
    // "March 03" -> 3
    // "03" -> 3
    // "3" -> 3
    const dayMatch = dateStr.match(/\d+/);
    if (dayMatch) {
      day = parseInt(dayMatch[0], 10);
    }
    
    // Validate day
    if (day < 1 || day > 31) {
      day = 1;
    }
    
    // Format as YYYY-MM-DD
    const month = String(monthNumber).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    
    return `${yearFromSheet}-${month}-${dayStr}`;
    
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, 'from month:', monthFromSheet, error);
    return null;
  }
}

// Generate Supabase table creation SQL
export function generateTableSchema(): string {
  return `-- RTS Monitoring System - Parcels Table
-- Generated: ${new Date().toISOString()}

-- Drop existing table if needed (CAUTION: This will delete all data!)
-- DROP TABLE IF EXISTS parcels CASCADE;

-- Create parcels table
CREATE TABLE IF NOT EXISTS parcels (
  id BIGSERIAL PRIMARY KEY,
  
  -- Basic Information
  parcel_date DATE NOT NULL,
  shipper_name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_number TEXT,
  
  -- Order Details
  amount DECIMAL(10, 2) DEFAULT 0,
  items TEXT,
  tracking_number TEXT,
  
  -- Status Information
  status TEXT NOT NULL,
  normalized_status TEXT NOT NULL,
  reason TEXT,
  
  -- Location Information
  province TEXT NOT NULL,
  municipality TEXT,
  region TEXT NOT NULL,
  island TEXT NOT NULL,
  
  -- Financial Information
  cod_amount DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  rts_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_parcels_parcel_date ON parcels(parcel_date);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(normalized_status);
CREATE INDEX IF NOT EXISTS idx_parcels_province ON parcels(province);
CREATE INDEX IF NOT EXISTS idx_parcels_region ON parcels(region);
CREATE INDEX IF NOT EXISTS idx_parcels_island ON parcels(island);
CREATE INDEX IF NOT EXISTS idx_parcels_shipper ON parcels(shipper_name);
CREATE INDEX IF NOT EXISTS idx_parcels_date_status ON parcels(parcel_date, normalized_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parcels_updated_at
  BEFORE UPDATE ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on parcels" ON parcels
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE parcels IS 'RTS Monitoring System - Parcel tracking and analytics data';
COMMENT ON COLUMN parcels.parcel_date IS 'Parcel date in standard DATE format (YYYY-MM-DD)';
`
}

// Convert ParcelData to Supabase format
export function convertToSupabaseFormat(parcel: ParcelData): SupabaseParcel {
  const dateText = parcel.date || ''
  const monthFromSheet = parcel.month || ''
  const parsedDate = parseDate(dateText, monthFromSheet)
  
  return {
    parcel_date: parsedDate || '2026-01-01', // Default date if parsing fails
    shipper_name: parcel.shipper || '',
    address: parcel.fullAddress || '', // Use complete address from Google Sheets
    contact_number: parcel.contactNumber || '', // Use contact number from Column D
    amount: parcel.codAmount || 0,
    items: '',
    tracking_number: '',
    status: parcel.status || '',
    normalized_status: parcel.normalizedStatus || '',
    reason: '',
    province: parcel.province || 'Unknown',
    municipality: parcel.municipality || '',
    region: parcel.region || 'Unknown',
    island: parcel.island || 'unknown',
    cod_amount: parcel.codAmount || 0,
    service_charge: parcel.serviceCharge || 0,
    total_cost: parcel.totalCost || 0,
    rts_fee: parcel.rtsFee || 0,
  }
}

// Escape SQL string values
function escapeSQLString(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL'
  return `'${value.toString().replace(/'/g, "''")}'`
}

// Generate SQL INSERT statements
export function generateInsertSQL(parcels: ParcelData[], batchSize: number = 100): string[] {
  const sqlStatements: string[] = []
  
  // Process in batches for better performance
  for (let i = 0; i < parcels.length; i += batchSize) {
    const batch = parcels.slice(i, i + batchSize)
    const values = batch.map(parcel => {
      const sp = convertToSupabaseFormat(parcel)
      return `(
  '${sp.parcel_date}',
  ${escapeSQLString(sp.shipper_name)},
  ${escapeSQLString(sp.address)},
  ${escapeSQLString(sp.contact_number)},
  ${sp.amount},
  ${escapeSQLString(sp.items)},
  ${escapeSQLString(sp.tracking_number)},
  ${escapeSQLString(sp.status)},
  ${escapeSQLString(sp.normalized_status)},
  ${escapeSQLString(sp.reason)},
  ${escapeSQLString(sp.province)},
  ${escapeSQLString(sp.municipality)},
  ${escapeSQLString(sp.region)},
  ${escapeSQLString(sp.island)},
  ${sp.cod_amount},
  ${sp.service_charge},
  ${sp.total_cost},
  ${sp.rts_fee}
)`
    }).join(',\n')

    const insertSQL = `-- Batch ${Math.floor(i / batchSize) + 1} (Records ${i + 1} to ${Math.min(i + batchSize, parcels.length)})
INSERT INTO parcels (
  parcel_date, shipper_name, address, contact_number,
  amount, items, tracking_number, status, normalized_status,
  reason, province, municipality, region, island,
  cod_amount, service_charge, total_cost, rts_fee
) VALUES
${values};
`
    sqlStatements.push(insertSQL)
  }

  return sqlStatements
}

// Generate complete migration SQL file
export function generateCompleteMigrationSQL(parcels: ParcelData[]): string {
  const schema = generateTableSchema()
  const inserts = generateInsertSQL(parcels, 100)
  
  const header = `-- ============================================
-- RTS MONITORING SYSTEM - SUPABASE MIGRATION
-- ============================================
-- Generated: ${new Date().toISOString()}
-- Total Records: ${parcels.toLocaleString()}
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Verify data in Table Editor
-- ============================================

`

  const footer = `

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Total records inserted: ${parcels.length.toLocaleString()}
-- 
-- NEXT STEPS:
-- 1. Verify data: SELECT COUNT(*) FROM parcels;
-- 2. Check status distribution: SELECT normalized_status, COUNT(*) FROM parcels GROUP BY normalized_status;
-- 3. Check regional distribution: SELECT island, COUNT(*) FROM parcels GROUP BY island;
-- ============================================
`

  return header + schema + '\n\n' + inserts.join('\n\n') + footer
}

// Generate statistics about the migration
export function generateMigrationStats(parcels: ParcelData[]): {
  totalRecords: number
  byStatus: Record<string, number>
  byRegion: Record<string, number>
  byIsland: Record<string, number>
  byMonth: Record<string, number>
  estimatedSize: string
} {
  const stats = {
    totalRecords: parcels.length,
    byStatus: {} as Record<string, number>,
    byRegion: {} as Record<string, number>,
    byIsland: {} as Record<string, number>,
    byMonth: {} as Record<string, number>,
    estimatedSize: '0 KB'
  }

  parcels.forEach(parcel => {
    // Count by status
    const status = parcel.normalizedStatus || 'UNKNOWN'
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

    // Count by region
    const region = parcel.region || 'Unknown'
    stats.byRegion[region] = (stats.byRegion[region] || 0) + 1

    // Count by island
    const island = parcel.island || 'unknown'
    stats.byIsland[island] = (stats.byIsland[island] || 0) + 1

    // Count by month
    const month = parcel.month || 'Unknown'
    stats.byMonth[month] = (stats.byMonth[month] || 0) + 1
  })

  // Estimate SQL file size (rough estimate: ~500 bytes per record)
  const estimatedBytes = parcels.length * 500
  if (estimatedBytes < 1024) {
    stats.estimatedSize = `${estimatedBytes} bytes`
  } else if (estimatedBytes < 1024 * 1024) {
    stats.estimatedSize = `${(estimatedBytes / 1024).toFixed(2)} KB`
  } else {
    stats.estimatedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return stats
}
