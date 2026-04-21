#!/usr/bin/env python3
"""
March Data SQL Filter
Filters a full SQL export to include only March data

USAGE:
1. Download your full SQL file from the system
2. Save it as 'full-export.sql' in the same folder as this script
3. Run: python filter-march-data.py
4. Output will be saved as 'march-only-export.sql'
"""

import re
from datetime import datetime
import sys

def parse_date(date_str):
    """Parse various date formats"""
    date_str = date_str.strip().strip("'\"")
    
    # Try Excel serial date
    try:
        num = float(date_str)
        # Excel serial date to Python datetime
        base_date = datetime(1899, 12, 30)
        from datetime import timedelta
        date = base_date + timedelta(days=num)
        return date
    except ValueError:
        pass
    
    # Try standard date formats
    formats = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y-%m-%d %H:%M:%S',
        '%m/%d/%Y %H:%M:%S',
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None

def is_march(date_str):
    """Check if date is in March"""
    date = parse_date(date_str)
    if date:
        return date.month == 3
    return False

def extract_first_value(values_str):
    """Extract the first value (date) from a VALUES clause"""
    # Match the first value which could be quoted or not
    match = re.match(r"\s*'([^']*)'|([^,]+)", values_str)
    if match:
        return match.group(1) or match.group(2)
    return None

def filter_march_inserts(sql_content):
    """Filter INSERT statements to include only March data"""
    
    # Find all INSERT statements
    insert_pattern = r'INSERT INTO parcels[^;]+;'
    inserts = re.findall(insert_pattern, sql_content, re.IGNORECASE | re.DOTALL)
    
    print(f"Found {len(inserts)} INSERT statements")
    
    march_inserts = []
    total_rows = 0
    march_rows = 0
    
    for insert in inserts:
        # Extract VALUES part
        values_match = re.search(r'VALUES\s*(.+);', insert, re.IGNORECASE | re.DOTALL)
        if not values_match:
            continue
        
        values_part = values_match.group(1)
        
        # Split by row (each row is in parentheses)
        rows = re.findall(r'\([^)]+\)', values_part)
        total_rows += len(rows)
        
        march_rows_list = []
        for row in rows:
            # Remove parentheses and get first value (date)
            row_content = row[1:-1]  # Remove ( and )
            first_value = extract_first_value(row_content)
            
            if first_value and is_march(first_value):
                march_rows_list.append(row)
                march_rows += 1
        
        # If we have March rows, create a new INSERT statement
        if march_rows_list:
            # Get the column definition from original INSERT
            columns_match = re.search(r'INSERT INTO parcels\s*\(([^)]+)\)', insert, re.IGNORECASE)
            columns = columns_match.group(1) if columns_match else ''
            
            new_insert = f"INSERT INTO parcels ({columns}) VALUES\n"
            new_insert += ',\n'.join(march_rows_list)
            new_insert += ';\n'
            march_inserts.append(new_insert)
    
    print(f"Total rows processed: {total_rows}")
    print(f"March rows found: {march_rows}")
    
    return march_inserts

def generate_march_sql(input_file='full-export.sql', output_file='march-only-export.sql'):
    """Generate March-only SQL file"""
    
    print("=" * 50)
    print("MARCH DATA SQL FILTER")
    print("=" * 50)
    print()
    
    # Read input file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        print(f"✓ Loaded {input_file}")
    except FileNotFoundError:
        print(f"✗ Error: {input_file} not found!")
        print()
        print("Please:")
        print("1. Download your full SQL export from the system")
        print(f"2. Save it as '{input_file}' in this folder")
        print("3. Run this script again")
        sys.exit(1)
    
    # Extract table schema (everything before first INSERT)
    schema_match = re.search(r'(.+?)INSERT INTO', sql_content, re.IGNORECASE | re.DOTALL)
    schema = schema_match.group(1) if schema_match else ''
    
    # Filter March data
    print()
    march_inserts = filter_march_inserts(sql_content)
    
    # Generate complete SQL
    output_sql = f"""-- March Data Only Export
-- Generated: {datetime.now().isoformat()}
-- Source: {input_file}

{schema}

"""
    output_sql += '\n'.join(march_inserts)
    
    # Save output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_sql)
    
    print()
    print("=" * 50)
    print(f"✓ March SQL file generated successfully!")
    print(f"✓ Saved to: {output_file}")
    print("=" * 50)
    print()
    print("Next steps:")
    print(f"1. Open {output_file}")
    print("2. Copy all contents")
    print("3. Paste in Supabase SQL Editor")
    print("4. Run the query")
    print()

if __name__ == '__main__':
    # Check if custom input file is provided
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'full-export.sql'
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'march-only-export.sql'
    
    generate_march_sql(input_file, output_file)
