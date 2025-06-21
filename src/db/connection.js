import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import * as relations from './relations.js';

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'agi_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'agi_db',
  password: process.env.POSTGRES_PASSWORD || 'agi_password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: false,
  min: 0,
  max: 10,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
});

// Custom logger that truncates long values
const customLogger = {
  logQuery: (query, params) => {
    if (process.env.NODE_ENV === 'development') {
      // Truncate long parameter values (like embeddings)
      const truncatedParams = params?.map(param => {
        if (typeof param === 'string' && param.length > 100) {
          // Check if it's an embedding array
          if (param.startsWith('[') && param.includes(',')) {
            const values = param.slice(1, -1).split(',');
            if (values.length > 10) {
              return `[${values.slice(0, 5).join(',')}...${values.slice(-5).join(',')}] (${values.length} values)`;
            }
          }
          // For other long strings, just truncate
          return param.substring(0, 100) + '... (truncated)';
        }
        return param;
      });
      
      console.log('Query:', query, truncatedParams ? `-- params: ${JSON.stringify(truncatedParams)}` : '');
    }
  }
};

// Create Drizzle database instance
export const db = drizzle(pool, { 
  schema: { ...schema, ...relations },
  logger: process.env.NODE_ENV === 'development' ? customLogger : false
});

// Export pool for direct access if needed
export { pool };

// Graceful shutdown
export const closeConnection = async () => {
  try {
    await pool.end();
  } catch (error) {
    console.warn('Error closing database connection:', error.message);
  }
};
