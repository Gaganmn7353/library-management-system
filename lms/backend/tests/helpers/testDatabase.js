import pkg from 'pg';
const { Pool } = pkg;
import config from '../../src/config/env.js';

// Test database name can be overridden via env
const testDbName = process.env.TEST_DB_NAME || config.database.name + '_test';

// Create a separate test database connection
const testPool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: testDbName,
  user: config.database.user,
  password: config.database.password,
  ssl: false,
  max: 5,
});

/**
 * Setup test database - run migrations and seed data
 */
export const setupTestDatabase = async () => {
  try {
    // For testing, we can use the same database with a test prefix
    // Or create a separate test database if needed
    // For simplicity, we'll use the main database but clean it before tests
    
    // Note: In production, you should use a separate test database
    // This can be configured via environment variables
    
    // Test database name can be overridden via env
    const testDbName = process.env.TEST_DB_NAME || config.database.name;
    
    // If using separate test database, create it
    if (testDbName !== config.database.name) {
      const adminPool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: 'postgres', // Connect to default database
        user: config.database.user,
        password: config.database.password,
      });

      try {
        const result = await adminPool.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [testDbName]
        );
        
        if (result.rows.length === 0) {
          // Escape database name to prevent SQL injection
          const escapedDbName = `"${testDbName.replace(/"/g, '""')}"`;
          await adminPool.query(`CREATE DATABASE ${escapedDbName}`);
        }
      } catch (err) {
        // Database might already exist, ignore
        if (err.code !== '42P04') {
          throw err;
        }
      }

      await adminPool.end();
    }
    
    // Note: Schema should be created separately using migration scripts
    // For now, tests assume schema already exists

    return testPool;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

/**
 * Clean test database - truncate all tables
 */
export const cleanTestDatabase = async () => {
  try {
    // Disable foreign key checks temporarily
    await testPool.query('SET session_replication_role = replica;');

    // Truncate all tables in reverse dependency order
    const tables = [
      'fine_payments',
      'transactions',
      'reservations',
      'books',
      'members',
      'users',
    ];

    for (const table of tables) {
      await testPool.query(`TRUNCATE TABLE ${table} CASCADE;`);
    }

    // Re-enable foreign key checks
    await testPool.query('SET session_replication_role = DEFAULT;');
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  }
};

/**
 * Close test database connection
 */
export const closeTestDatabase = async () => {
  try {
    await testPool.end();
  } catch (error) {
    console.error('Error closing test database:', error);
    throw error;
  }
};

/**
 * Get test database pool
 */
export const getTestPool = () => testPool;

/**
 * Query helper for test database
 */
export const testQuery = async (text, params) => {
  return await testPool.query(text, params);
};


