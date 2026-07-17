const { createClient } = require("redis");

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
    port: 10432,
  },
});

redisClient.on('error', (err) => console.error('Redis error:', err));

module.exports = redisClient;
