const authRoutes = require('../../shared_modules/auth/routes/authRoutes');
const follow_parts = require('../../modules/follow-parts');
const sharedmodules = require('../../shared_modules');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/follow-parts', follow_parts);
  app.use('/api/shared', sharedmodules);
};
