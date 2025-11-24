-- Migration: add columns required by Node.js controllers and exports
-- Run with psql or any PostgreSQL client after selecting the target database.

-- Members table additions ----------------------------------------------------
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) DEFAULT 'public' CHECK (member_type IN ('student', 'faculty', 'public')),
  ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Ensure updated_at auto-updates on change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_members_updated_at'
  ) THEN
    CREATE TRIGGER update_members_updated_at
      BEFORE UPDATE ON members
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Transactions table additions ----------------------------------------------
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_transactions_updated_at'
  ) THEN
    CREATE TRIGGER update_transactions_updated_at
      BEFORE UPDATE ON transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Fine payments may reference created_at via exports, add if missing.
ALTER TABLE fine_payments
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_fine_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_fine_payments_updated_at
      BEFORE UPDATE ON fine_payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

