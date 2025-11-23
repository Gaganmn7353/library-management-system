import pkg from 'pg';
const { Pool } = pkg;
import config from '../../src/config/env.js';

// Create a separate test database connection
const testPool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name + '_test', // Use test database
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
    // Create test database if it doesn't exist
    const adminPool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: 'postgres', // Connect to default database
      user: config.database.user,
      password: config.database.password,
    });

    await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = '${config.database.name}_test'`
    ).then(async (result) => {
      if (result.rows.length === 0) {
        await adminPool.query(`CREATE DATABASE ${config.database.name}_test`);
      }
    });

    await adminPool.end();

    // Run schema creation (you may want to import your schema file here)
    // For now, we'll assume the test database schema is already set up
    // In a real scenario, you'd run your migration scripts here

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

