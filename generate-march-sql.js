/**
 * March Data SQL Generator
 * 
 * INSTRUCTIONS:
 * 1. Run your system and download the full SQL file
 * 2. Open that SQL file and copy all INSERT statements
 * 3. Replace the SAMPLE_DATA below with your actual INSERT statements
 * 4. Run: node generate-march-sql.js
 * 5. Output will be saved to: march-only-data.sql
 */

const fs = require('fs');

// Paste your INSERT statements here
const SAMPLE_DATA = `
-- Example format (replace with your actual data):
INSERT INTO parcels (date, shipper, full_address, contact_number, amount, items, tracking_number, status, reason, province, municipality, barangay, region, island, cod_amount, service_charge, total_cost, rts_fee, month) VALUES
('2024-03-15', 'John Doe', '123 Main St', '09171234567', 500, '1x Item', 'TRACK001', 'DELIVERED', NULL, 'Manila', 'Manila', 'Barangay 1', 'NCR', 'luzon', 500, 50, 550, 100, 'March'),
('2024-03-20', 'Jane Smith', '456 Oak Ave', '09181234567', 750, '2x Items', 'TRACK002', 'PENDING', NULL, 'Cebu', 'Cebu City', 'Barangay 2', 'Central Visayas', 'visayas', 750, 60, 810, 150, 'March');
`;

function extractInsertStatements(sqlContent) {
  // Match all INSERT statements
  const insertRegex = /INSERT INTO parcels[^;]+;/gi;
  return sqlContent.match(insertRegex) || [];
}

function parseInsertValues(insertStatement) {
  // Extract values from INSERT statement
  const valuesMatch = insertStatement.match(/VALUES\s*\((.*?)\)(?:,\s*\((.*?)\))*;/is);
  if (!valuesMatch) return [];
  
  // Get all value groups
  const allValues = insertStatement.match(/\([^)]+\)/g) || [];
  return allValues.map(v => v.slice(1, -1)); // Remove parentheses
}

function isDateInMarch(dateStr) {
  if (!dateStr) return false;
  
  // Remove quotes
  dateStr = dateStr.replace(/'/g, '').trim();
  
  try {
    // Try parsing as number (Excel serial date)
    const numDate = parseFloat(dateStr);
    if (!isNaN(numDate) && numDate.toString() === dateStr) {
      const date = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000);
      return date.getMonth() === 2; // March is month 2 (0-indexed)
    }
    
    // Try parsing as regular date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getMonth() === 2;
    }
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
  }
  
  return false;
}

function filterMarchData(sqlContent) {
  const insertStatements = extractInsertStatements(sqlContent);
  const marchInserts = [];
  
  console.log(`Found ${insertStatements.length} INSERT statements`);
  
  for (const statement of insertStatements) {
    const valueGroups = parseInsertValues(statement);
    const marchValues = [];
    
    for (const values of valueGroups) {
      // First value is the date
      const firstValue = values.split(',')[0].trim();
      if (isDateInMarch(firstValue)) {
        marchValues.push(`(${values})`);
      }
    }
    
    if (marchValues.length > 0) {
      const marchStatement = `INSERT INTO parcels (date, shipper, full_address, contact_number, amount, items, tracking_number, status, reason, province, municipality, barangay, region, island, cod_amount, service_charge, total_cost, rts_fee, month) VALUES\n${marchValues.join(',\n')};\n`;
      marchInserts.push(marchStatement);
    }
  }
  
  console.log(`Filtered to ${marchInserts.length} March INSERT statements`);
  return marchInserts;
}

function generateMarchSQL() {
  console.log('===========================================');
  console.log('MARCH DATA SQL GENERATOR');
  console.log('===========================================\n');
  
  // Read the full SQL file (you need to provide this)
  let fullSQL;
  try {
    // Try to read from a file if it exists
    if (fs.existsSync('full-data.sql')) {
      fullSQL = fs.readFileSync('full-data.sql', 'utf8');
      console.log('✓ Loaded full-data.sql');
    } else {
      fullSQL = SAMPLE_DATA;
      console.log('⚠ Using sample data (replace with actual data)');
    }
  } catch (e) {
    fullSQL = SAMPLE_DATA;
    console.log('⚠ Using sample data');
  }
  
  // Filter March data
  const marchInserts = filterMarchData(fullSQL);
  
  // Generate complete SQL file
  const tableSchema = `-- March Data Only Export
-- Generated: ${new Date().toISOString()}

DROP TABLE IF EXISTS parcels CASCADE;

CREATE TABLE parcels (
  id BIGSERIAL PRIMARY KEY,
  date TEXT,
  shipper TEXT NOT NULL,
  full_address TEXT,
  contact_number TEXT,
  amount NUMERIC DEFAULT 0,
  items TEXT NOT NULL,
  tracking_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  reason TEXT,
  province TEXT,
  municipality TEXT,
  barangay TEXT,
  region TEXT,
  island TEXT,
  cod_amount NUMERIC DEFAULT 0,
  service_charge NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  rts_fee NUMERIC DEFAULT 0,
  month TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_province ON parcels(province);
CREATE INDEX idx_parcels_region ON parcels(region);
CREATE INDEX idx_parcels_island ON parcels(island);
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
CREATE INDEX idx_parcels_month ON parcels(month);
CREATE INDEX idx_parcels_date ON parcels(date);

`;
  
  const completSQL = tableSchema + '\n' + marchInserts.join('\n');
  
  // Save to file
  fs.writeFileSync('march-only-data.sql', completSQL);
  
  console.log('\n===========================================');
  console.log('✓ March SQL file generated successfully!');
  console.log('✓ Saved to: march-only-data.sql');
  console.log('===========================================\n');
  console.log('Next steps:');
  console.log('1. Open march-only-data.sql');
  console.log('2. Copy all contents');
  console.log('3. Paste in Supabase SQL Editor');
  console.log('4. Run the query');
  console.log('\n');
}

// Run the generator
generateMarchSQL();
