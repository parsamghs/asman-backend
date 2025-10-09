const getserverstatshandler = require('./handler/serverLogsstats');
const socketEvents = require('./socketevents');
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = (io) => {
  io.use((socket, next) => {
    const req = {
      headers: {
        authorization:
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization
      },
      cookies: socket.handshake.auth?.cookies || {}
    };

    const res = {
      status: (code) => ({
        json: (data) => next(new Error(data.message))
      })
    };

    authMiddleware(req, res, (err) => {
      if (err) return next(new Error('Unauthorized'));
      socket.user = req.user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id} - ${socket.user.dealer_name}`);

    socket.on('get-server-stats', async (query) => {
      try {
        const data = await getserverstatshandler(query);
        socket.emit('server-stats', data);
      } catch (err) {
        console.error('Error emitting stats:', err);
        socket.emit('error', { message: 'Internal server error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  socketEvents.on('serverLogsUpdated', async () => {
    const data = await getserverstatshandler({});
    io.emit('server-stats', data);
  });
};
