const management = require('../../modules/system-management/index')
const authRoutes = require('../../shared_modules/auth/routes/authRoutes');
const follow_parts = require('../../modules/follow-parts/index');
const sharedmodules = require('../../shared_modules/index');

module.exports = (app) => {
  app.use('/api/admin', management);
  app.use('/api/auth', authRoutes);
  app.use('/api/follow-parts', follow_parts);
  app.use('/api/shared', sharedmodules);
};
