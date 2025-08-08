const redis = require('redis');
require('dotenv').config();

let client = null;

if (process.env.NODE_ENV === 'production') {
  client = redis.createClient({
    url: process.env.REDIS_URL,
  });

  client.connect()
    .then(() => console.log('✅ Redis client connected'))
    .catch(err => console.error('❌ Redis connection error:', err));

  client.on('error', err => {
    console.error('❌ Redis client error event:', err);
  });
} else {
  console.log('⚠️ Redis client not initialized (development mode)');
}

module.exports = client;
