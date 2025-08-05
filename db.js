const { Pool } = require('pg');
const config = require('./config/config');

console.log('✅ DATABASE URL:', config.databaseUrl);

const pool = new Pool({
  connectionString: config.databaseUrl
});

module.exports = pool;

