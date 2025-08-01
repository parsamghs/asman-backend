const redis = require('redis');

const client = redis.createClient();

client.connect()
  .then(() => console.log('✅ Redis client connected'))
  .catch(err => console.error('❌ Redis connection error:', err));

module.exports = client;
