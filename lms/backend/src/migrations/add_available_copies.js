import { query, closePool } from '../config/database.js';

async function runMigration() {
  console.log('Running migration: add_available_copies');

  try {
    await query(`
      ALTER TABLE books
        ADD COLUMN IF NOT EXISTS available_copies INTEGER DEFAULT 0
    `);

    await query(`
      UPDATE books
      SET available_copies = COALESCE(available_quantity, quantity, 0)
      WHERE available_copies = 0
    `);

    await query(`
      CREATE OR REPLACE FUNCTION sync_available_columns()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.available_copies := NEW.available_quantity;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'books_available_sync'
        ) THEN
          CREATE TRIGGER books_available_sync
            BEFORE INSERT OR UPDATE ON books
            FOR EACH ROW
            EXECUTE FUNCTION sync_available_columns();
        END IF;
      END;
      $$;
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

