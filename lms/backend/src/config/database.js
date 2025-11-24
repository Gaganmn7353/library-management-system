import pkg from 'pg';
const { Pool } = pkg;
import config from './env.js';
import logger from '../utils/logger.js';

// Create connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  max: config.database.max, // Maximum number of clients in the pool
  idleTimeoutMillis: config.database.idleTimeoutMillis, // Close idle clients after 30 seconds
  connectionTimeoutMillis: config.database.connectionTimeoutMillis, // Return an error after 2 seconds if connection could not be established
});

// Event listeners for pool
pool.on('connect', () => {
  logger.info('✅ Database connection established');
});

pool.on('error', (err) => {
  logger.error('❌ Unexpected error on idle database client', err);
  // Don't exit immediately - let the app try to reconnect
  logger.warn('⚠️ Database connection error. The app will continue but database operations may fail.');
});

// Test database connection
pool.on('connect', async (client) => {
  try {
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected successfully at ${result.rows[0].now}`);
  } catch (err) {
    logger.error('Error connecting to database:', err);
  }
});

// Query helper function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { error: error.message, text });
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
    logger.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);
  
  // Monkey patch the query method to log the last query
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release();
  };
  
  return client;
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool has been closed');
  } catch (error) {
    logger.error('Error closing database pool:', error);
  }
};

// Export pool for direct access if needed
export default pool;

