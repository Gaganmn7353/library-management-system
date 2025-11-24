import { query, closePool } from '../config/database.js';

async function runMigration() {
  console.log('Running migration: add_user_status');
  try {
    await query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id)
    `);

    await query(`UPDATE users SET status = 'active' WHERE status IS NULL`);

    await query(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS member_type VARCHAR(30) DEFAULT 'regular',
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    await query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

runMigration();

