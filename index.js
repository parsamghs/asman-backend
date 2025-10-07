require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const requestLogger = require('./middlewares/loggerMiddleware'); 

require('./cronjobs/updatearrivaldays');
require('./cronjobs/updatesubscription');

const authRoutes = require('./routes/AuthCentralRoute');
const orderRoutes = require('./routes/OrdersCentralRoute');
const adminRoutes = require('./routes/AdminCentralRoute');
const settingRoute = require('./routes/SettingCentralRoute');
const reportsroute = require('./routes/ReportsCentralRoute');
const dealersroute = require('./routes/DealersCentralRoute');
const systemroute = require('./routes/SystemCentralRoute');
const dateroute = require('./routes/DateCentralRoutes');

const app = express();

app.set('trust proxy', true);

const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(requestLogger); 

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setting', settingRoute);
app.use('/api/reports', reportsroute);
app.use('/api/dealers', dealersroute);
app.use('/api/system', systemroute);
app.use('/api/date', dateroute);

app.listen(port, () => {
  console.log(`Server is running`);
});
