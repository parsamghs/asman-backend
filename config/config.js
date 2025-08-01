const config = {
  development: {
    databaseUrl: process.env.DEV_DB_URL,
    port: process.env.PORT || 3001,
  },
  production: {
    databaseUrl: process.env.PROD_DB_URL,
    port: process.env.PORT || 3001,
  }
};

const currentEnv = process.env.NODE_ENV || "development";

module.exports = config[currentEnv];
