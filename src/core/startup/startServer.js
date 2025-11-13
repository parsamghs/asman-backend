const setupExpress = require('./setupExpress');
const loadCronJobs = require('./cronjobs');
const loadRoutes = require('./loadRoutes');
const http = require('http');
const { Server } = require('socket.io');
const setupSocket = require('../../socket');

function startServer() {
  const app = setupExpress();
  const port = process.env.PORT || 3001;

  loadCronJobs();
  loadRoutes(app);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  setupSocket(io);

  server.listen(port, () => {
    console.log(`\x1b[32mServer is running`);
    // require('../../eita-bot')();
  });

  return { app, server, io }; 
}

module.exports = { startServer };
