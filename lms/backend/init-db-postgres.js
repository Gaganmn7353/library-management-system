import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const targetDbName = process.env.DB_NAME || 'library_management';

async function initDatabase() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbCheckResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDbName]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`📦 Creating database: ${targetDbName}...`);
      await client.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`✅ Database '${targetDbName}' created successfully`);
    } else {
      console.log(`ℹ️  Database '${targetDbName}' already exists`);
    }

    await client.end();

    // Now connect to the target database and run schema
    const targetClient = new Client({
      ...dbConfig,
      database: targetDbName,
    });

    await targetClient.connect();
    console.log(`🔌 Connected to database: ${targetDbName}`);

    // Read and execute schema file
    const schemaPath = join(__dirname, 'schema.sql');
    console.log('📄 Reading schema file...');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('🚀 Executing schema...');
    await targetClient.query(schema);
    console.log('✅ Schema executed successfully');

    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);`,
      `CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);`,
      `CREATE INDEX IF NOT EXISTS idx_reservations_member_id ON reservations(member_id);`,
      `CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);`,
      `CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);`,
      `CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);`,
    ];

    for (const index of indexes) {
      await targetClient.query(index);
    }
    console.log('✅ Indexes created successfully');

    await targetClient.end();
    console.log('\n🎉 Database initialization completed successfully!');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Run: npm run seed (to seed initial data)`);
    console.log(`   2. Run: npm run dev (to start the server)`);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initDatabase();

