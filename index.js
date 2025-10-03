require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const express = require('express');
const cors = require('cors');
const requestLogger = require('./src/core/middlewares/loggerMiddleware'); 

require('./src/core/cronjobs/updatearrivaldays');
require('./src/core/cronjobs/updatesubscription');

const authRoutes = require('./src/shared_modules/auth/routes/login');
const follow_parts = require('./src/modules/follow-parts/index');
const sharedmodules = require('./src/shared_modules/index');

const app = express();
app.set('trust proxy', true);

const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use(requestLogger); 

app.use('/api/auth', authRoutes);
app.use('/api/follow-parts', follow_parts);
app.use('/api/shared', sharedmodules);

app.listen(port, () => {
  console.log(`Server is running ✅`);
});
