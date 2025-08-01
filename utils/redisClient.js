const redis = require('redis');
require('dotenv').config(); // حتماً این خط را اضافه کن

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.connect()
  .then(() => console.log('✅ Redis client connected'))
  .catch(err => console.error('❌ Redis connection error:', err));

client.on('error', err => {
  console.error('❌ Redis client error event:', err);
});

module.exports = client;
