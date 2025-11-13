const redis = require('redis');
require('dotenv').config();

let client = null;

if (process.env.NODE_ENV === 'production') {
  client = redis.createClient({
    url: process.env.REDIS_URL,
  });

  client.connect()
    .then(() => console.log('\x1b[32m%s\x1b[0m','Redis client connected'))
    .catch(err => console.error('❌ Redis connection error:', err));

  client.on('error', err => {
    console.error('❌ Redis client error event:', err);
  });
}

module.exports = client;
