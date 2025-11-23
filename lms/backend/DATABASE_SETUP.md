# PostgreSQL Database Setup Guide

This guide will help you set up the PostgreSQL database for the Library Management System.

## Prerequisites

1. **PostgreSQL Installation**
   - Download and install PostgreSQL from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   - Ensure PostgreSQL is running on your system
   - Note your PostgreSQL version (recommended: 12 or higher)

2. **Database Tools (Optional but Recommended)**
   - **pgAdmin**: GUI tool for PostgreSQL administration
   - **psql**: Command-line tool (comes with PostgreSQL installation)
   - **DBeaver**: Universal database tool

## Setup Steps

### Step 1: Create Database

Connect to PostgreSQL and create a new database:

**Using psql (Command Line):**
```bash
# Connect to PostgreSQL (default user is usually 'postgres')
psql -U postgres

# Create the database
CREATE DATABASE library_management;

# Connect to the new database
\c library_management
```

**Using pgAdmin:**
1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `library_management`
4. Click "Save"

### Step 2: Create Schema

Run the schema file to create all tables, indexes, constraints, and triggers:

**Using psql:**
```bash
psql -U postgres -d library_management -f schema.sql
```

**Using pgAdmin:**
1. Right-click on `library_management` database → "Query Tool"
2. Open `schema.sql` file
3. Execute the query (F5 or click Execute)

**Using command line from project directory:**
```bash
# Windows PowerShell
psql -U postgres -d library_management -f "lms\backend\schema.sql"

# Linux/Mac
psql -U postgres -d library_management -f lms/backend/schema.sql
```

### Step 3: Load Sample Data (Optional)

To populate the database with sample data for testing:

**Using psql:**
```bash
psql -U postgres -d library_management -f init_data.sql
```

**Using pgAdmin:**
1. Right-click on `library_management` database → "Query Tool"
2. Open `init_data.sql` file
3. Execute the query

**Using command line:**
```bash
# Windows PowerShell
psql -U postgres -d library_management -f "lms\backend\init_data.sql"

# Linux/Mac
psql -U postgres -d library_management -f lms/backend/init_data.sql
```

### Step 4: Verify Installation

Run these queries to verify everything was set up correctly:

```sql
-- Check table counts
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'books', COUNT(*) FROM books
UNION ALL
SELECT 'members', COUNT(*) FROM members
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'fine_payments', COUNT(*) FROM fine_payments;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;
```

## Database Connection Configuration

### Connection String Format

```
postgresql://username:password@host:port/database_name
```

### Example Connection Strings

**Local Development:**
```
postgresql://postgres:your_password@localhost:5432/library_management
```

**Environment Variables (Recommended):**
```bash
# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=your_password
```

### Python (SQLAlchemy) Connection

```python
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:password@localhost:5432/library_management"
engine = create_engine(DATABASE_URL)
```

### Node.js (pg) Connection

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'library_management',
  user: 'postgres',
  password: 'your_password'
});
```

## Database Schema Overview

### Tables

1. **users** - User accounts (admin, librarian, member)
2. **books** - Book catalog and inventory
3. **members** - Member profiles linked to users
4. **transactions** - Book issue/return records
5. **reservations** - Book reservation requests
6. **fine_payments** - Fine payment records

### Key Features

- **Foreign Key Constraints**: Ensures referential integrity
- **Check Constraints**: Validates data (e.g., status values, dates)
- **Indexes**: Optimized for frequently queried columns
- **Triggers**: Automatic updates (e.g., `updated_at` timestamps, book availability)
- **Views**: Pre-built queries for common operations

### Important Constraints

- **users.role**: Must be 'admin', 'librarian', or 'member'
- **members.status**: Must be 'active', 'inactive', or 'suspended'
- **transactions.status**: Must be 'issued', 'returned', or 'overdue'
- **reservations.status**: Must be 'pending', 'fulfilled', or 'cancelled'
- **books.available_quantity**: Cannot exceed `quantity`
- **transactions.due_date**: Must be >= `issue_date`

## Maintenance Tasks

### Update Overdue Transactions

The schema includes a function to update overdue transactions. Run this periodically (daily recommended):

```sql
SELECT update_overdue_transactions();
```

Or create a scheduled job (pg_cron extension):

```sql
-- Install pg_cron extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily update at 2 AM
SELECT cron.schedule(
    'update-overdue-transactions',
    '0 2 * * *',
    $$SELECT update_overdue_transactions();$$
);
```

### Backup Database

**Using pg_dump:**
```bash
pg_dump -U postgres -d library_management -F c -f library_backup.dump
```

**Restore:**
```bash
pg_restore -U postgres -d library_management library_backup.dump
```

### Vacuum and Analyze

Run periodically to maintain performance:

```sql
VACUUM ANALYZE;
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL service is running
   - Verify host and port (default: localhost:5432)
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check `pg_hba.conf` configuration
   - Ensure user has proper permissions

3. **Permission Denied**
   - Grant necessary privileges:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE library_management TO your_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
   ```

4. **Foreign Key Violations**
   - Ensure parent records exist before inserting child records
   - Check data insertion order (users → members → transactions)

5. **Check Constraint Violations**
   - Verify data matches allowed values (status fields, dates, etc.)
   - Check that `available_quantity <= quantity` for books

## Security Best Practices

1. **Change Default Password**: Always change the default PostgreSQL password
2. **Use Environment Variables**: Never hardcode database credentials
3. **Limit Permissions**: Create application-specific users with minimal required privileges
4. **Enable SSL**: Use SSL connections in production
5. **Regular Backups**: Schedule automated backups
6. **Update Regularly**: Keep PostgreSQL updated with security patches

## Sample Queries

### Find Active Members
```sql
SELECT * FROM active_members_view;
```

### Check Book Availability
```sql
SELECT * FROM books_availability_view WHERE availability_status = 'available';
```

### View Current Transactions
```sql
SELECT * FROM current_transactions_view;
```

### Member Transaction Summary
```sql
SELECT * FROM member_transaction_summary WHERE active_issues > 0;
```

### Find Overdue Books
```sql
SELECT * FROM current_transactions_view WHERE days_overdue > 0;
```

## Next Steps

1. Update your application's database connection configuration
2. Test database connectivity
3. Run your application and verify it works with PostgreSQL
4. Set up automated backups
5. Configure monitoring and logging

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [node-postgres Documentation](https://node-postgres.com/)

