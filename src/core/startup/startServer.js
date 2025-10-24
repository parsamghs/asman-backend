const setupExpress = require('./setupExpress');
const loadCronJobs = require('./cronjobs');
const loadRoutes = require('./loadRoutes');

function startServer() {
  const app = setupExpress();
  const port = process.env.PORT || 3000;

  loadCronJobs();
  loadRoutes(app);

  app.listen(port, () => {
    console.log(`Server is running`);
  });
}

module.exports = { startServer };
