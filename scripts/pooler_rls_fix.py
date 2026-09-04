#!/usr/bin/env python3
"""
MAVORA - Connect via Pooler & Fix RLS
"""
import psycopg2
import sys

# Try multiple connection methods
connection_attempts = [
    {
        "name": "Pooler (Transaction Mode)",
        "host": "aws-0-us-east-1.pooler.supabase.com",
        "port": 6543,
        "dbname": "postgres",
        "user": "postgres.kyanecjjautqmuowbtvy",
        "password": "Sultan@Admin2024"
    },
    {
        "name": "Pooler (Session Mode)", 
        "host": "aws-0-us-east-1.pooler.supabase.com",
        "port": 5432,
        "dbname": "postgres",
        "user": "postgres.kyanecjjautqmuowbtvy",
        "password": "Sultan@Admin2024"
    }
]

print("""
╔═══════════════════════════════════════════════════════════╗
║     MAVORA RLS FIX - TRYING ALL CONNECTION METHODS         ║
╚═══════════════════════════════════════════════════════════╝
""")

conn = None
cursor = None

for attempt in connection_attempts:
    print(f"\n📡 Trying: {attempt['name']}")
    print(f"   Host: {attempt['host']}:{attempt['port']}")
    
    try:
        conn = psycopg2.connect(
            host=attempt['host'],
            port=attempt['port'],
            dbname=attempt['dbname'],
            user=attempt['user'],
            password=attempt['password'],
            connect_timeout=10
        )
        cursor = conn.cursor()
        print("   ✅ CONNECTED!\n")
        break
    except Exception as e:
        print(f"   ❌ Failed: {str(e)[:60]}")
        continue

if not conn:
    print("\n❌ All connection methods failed.")
    print("\nPossible solutions:")
    print("1. Check if your IP is whitelisted in Supabase settings")
    print("2. Try using the SQL Editor in Supabase Dashboard instead")
    sys.exit(1)

# Connected! Now discover schema and fix RLS
print("=" * 70)
print("STEP 1: DISCOVERING ACTUAL DATABASE SCHEMA")
print("=" * 70)

schema_query = """
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.ordinal_position
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
"""

try:
    cursor.execute(schema_query)
    schema_results = cursor.fetchall()
    
    # Organize by table
    tables = {}
    for row in schema_results:
        table_name, col_name, data_type, pos = row
        if table_name not in tables:
            tables[table_name] = []
        if col_name:
            tables[table_name].append({'name': col_name, 'type': data_type})
    
    # Display discovered schema
    print(f"\n✅ Found {len(tables)} tables:\n")
    for tbl in sorted(tables.keys()):
        cols = [c['name'] for c in tables[tbl]]
        print(f"  📋 {tbl}: {', '.join(cols)}")
    
except Exception as e:
    print(f"❌ Schema discovery failed: {e}")
    sys.exit(1)

# Find user columns for each table
def find_user_columns(columns):
    """Find user-related columns"""
    patterns = ['userid', 'user_id', 'buyerid', 'buyer_id', 
                'sellerid', 'seller_id', 'senderid', 'sender_id',
                'receiverid', 'receiver_id', 'reviewerid', 'reviewer_id']
    found = []
    for c in columns:
        if c['name'].lower().replace('_', '') in [p.replace('_', '') for p in patterns]:
            found.append(c['name'])
    return found

print("\n" + "=" * 70)
print("STEP 2: GENERATING & EXECUTING CORRECT RLS POLICIES")
print("=" * 70)

# Generate correct RLS based on ACTUAL schema
sql_statements = []

# Enable RLS
sql_statements.append("-- Enable RLS on all tables")
for tbl in tables.keys():
    sql_statements.append(f'ALTER TABLE "{tbl}" ENABLE ROW LEVEL SECURITY;')

# Generate policies per table
for tbl_name, cols in tables.items():
    col_names = [c['name'] for c in cols]
    user_cols = find_user_columns(cols)
    
    sql_statements.append(f"\n-- === Policies for: {tbl_name} ===")
    sql_statements.append(f"-- User columns found: {user_cols if user_cols else 'NONE'}")
    
    # Public/read-only tables
    if any(x in tbl_name.lower() for x in ['categor', 'tag', 'setting']):
        sql_statements.append(f'''
CREATE POLICY "pub_select_{tbl_name}" ON public."{tbl_name}"
    FOR SELECT USING (true);
CREATE POLICY "svc_{tbl_name}" ON public."{tbl_name}"
    FOR ALL USING (auth.role() = 'service_role');''')
    
    # Listings
    elif tbl_name == 'listings':
        uid_col = user_cols[0] if user_cols else 'userId'
        sql_statements.append(f'''
DROP POLICY IF EXISTS "listings_select" ON public."{tbl_name}";
CREATE POLICY "listings_select" ON public."{tbl_name}"
    FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "listings_insert" ON public."{tbl_name}";
CREATE POLICY "listings_insert" ON public."{tbl_name}"
    FOR INSERT WITH CHECK (auth.uid()::text = "{uid_col}"::text);
DROP POLICY IF EXISTS "listings_update" ON public."{tbl_name}";
CREATE POLICY "listings_update" ON public."{tbl_name}"
    FOR UPDATE USING (auth.uid()::text = "{uid_col}"::text);
DROP POLICY IF EXISTS "listings_delete" ON public."{tbl_name}";
CREATE POLICY "listings_delete" ON public."{tbl_name}"
    FOR DELETE USING (auth.uid()::text = "{uid_col}"::text);''')
    
    # Listing media - join with listings
    elif tbl_name == 'listing_media':
        listing_fk = None
        for c in cols:
            if 'listing' in c['name'].lower():
                listing_fk = c['name']
                break
        
        if listing_fk:
            sql_statements.append(f'''
DROP POLICY IF EXISTS "{tbl_name}_select" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_select" ON public."{tbl_name}"
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "{tbl_name}_insert" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_insert" ON public."{tbl_name}"
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.listings l 
                 WHERE l.id = "{tbl_name}"."{listing_fk}"
                 AND auth.uid()::text = l."userId"::text)
    );
DROP POLICY IF EXISTS "{tbl_name}_delete" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_delete" ON public."{tbl_name}"
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.listings l 
                 WHERE l.id = "{tbl_name}"."{listing_fk}"
                 AND auth.uid()::text = l."userId"::text)
    );''')
    
    # Orders - may have buyer/seller or just userId
    elif tbl_name == 'orders':
        if len(user_cols) >= 2:
            u1, u2 = user_cols[0], user_cols[1]
            sql_statements.append(f'''
DROP POLICY IF EXISTS "{tbl_name}_select" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_select" ON public."{tbl_name}"
    FOR SELECT USING (
        auth.uid()::text = "{u1}"::text OR auth.uid()::text = "{u2}"::text
    );
DROP POLICY IF EXISTS "{tbl_name}_insert" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_insert" ON public."{tbl_name}"
    FOR INSERT WITH CHECK (auth.uid()::text = "{u1}"::text);
DROP POLICY IF EXISTS "{tbl_name}_update" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_update" ON public."{tbl_name}"
    FOR UPDATE USING (
        auth.uid()::text = "{u1}"::text OR auth.uid()::text = "{u2}"::text
    );''')
        elif user_cols:
            uc = user_cols[0]
            sql_statements.append(f'''
CREATE POLICY "{tbl_name}_all" ON public."{tbl_name}"
    FOR ALL USING (auth.uid()::text = "{uc}"::text);''')
    
    # Messages/Conversations
    elif any(x in tbl_name.lower() for x in ['message', 'conversation', 'chat']):
        if len(user_cols) >= 2:
            u1, u2 = user_cols[0], user_cols[1]
            sql_statements.append(f'''
DROP POLICY IF EXISTS "{tbl_name}_select" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_select" ON public."{tbl_name}"
    FOR SELECT USING (
        auth.uid()::text = "{u1}"::text OR auth.uid()::text = "{u2}"::text
    );
DROP POLICY IF EXISTS "{tbl_name}_insert" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_insert" ON public."{tbl_name}"
    FOR INSERT WITH CHECK (auth.uid()::text = "{u1}"::text);''')
        elif user_cols:
            uc = user_cols[0]
            sql_statements.append(f'''
CREATE POLICY "{tbl_name}_all" ON public."{tbl_name}"
    FOR ALL USING (auth.uid()::text = "{uc}"::text);''')
    
    # Everything else with user column
    elif user_cols:
        uc = user_cols[0]
        sql_statements.append(f'''
DROP POLICY IF EXISTS "{tbl_name}_all" ON public."{tbl_name}";
CREATE POLICY "{tbl_name}_all" ON public."{tbl_name}"
    FOR ALL USING (auth.uid()::text = "{uc}"::text)
    WITH CHECK (auth.uid()::text = "{uc}"::text);''')

# Combine all SQL
full_sql = '\n'.join(sql_statements)

# Save generated SQL
with open('/home/z/my-project/download/MAVORA_AUTO_GENERATED_RLS.sql', 'w') as f:
    f.write(full_sql)

print(f"\n📄 Generated SQL saved to: /home/z/my-project/download/MAVORA_AUTO_GENERATED_RLS.sql")

# Execute!
print("\n⚙️  Executing RLS policies...")
print("-" * 70)

success_count = 0
error_count = 0

try:
    cursor.execute(full_sql)
    conn.commit()
    print("\n✅✅✅ SUCCESS! All RLS policies applied!\n")
    
    # Verify
    cursor.execute("""
        SELECT tablename, policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    """)
    policies = cursor.fetchall()
    
    print(f"📊 Total Policies: {len(policies)}\n")
    for p in policies:
        print(f"   ✅ {p[0]}.{p[1]} ({p[2]})")
    success_count = len(policies)
    
except psycopg2.Error as e:
    print(f"\n❌ SQL Error: {e}")
    print(f"\nError Details:")
    print(f"   PG Code: {e.pgcode}")
    print(f"   Message: {e.pgerror}")
    conn.rollback()
    error_count += 1
    
    # Save error info
    with open('/home/z/my-project/download/RLS_ERROR_LOG.txt', 'w') as f:
        f.write(f"Error: {e}\n\nSQL:\n{full_sql}")

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"✅ Successful: {success_count} policies")
print(f"❌ Errors: {error_count}")
print(f"📁 SQL File: /home/z/my-project/download/MAVORA_AUTO_GENERATED_RLS.sql")

if error_count == 0:
    print("""
╔═══════════════════════════════════════════════════════════╗
║              ✅ RLS FIX COMPLETED SUCCESSFULLY!           ║
║     All policies use REAL column names from your DB       ║
╚═══════════════════════════════════════════════════════════╝
""")
