const pool = require('../../db');

async function getserverstatshandler({ from, to }) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const filter = `
    ($1::timestamptz IS NULL OR created_at >= $1)
    AND ($2::timestamptz IS NULL OR created_at <= $2)
    AND dealer_name != 'Unknown'
    AND dealer_code != 'Unknown'
  `;

  const methodQuery = `
    SELECT method, COUNT(*) AS count
    FROM server_logs
    WHERE ${filter}
    GROUP BY method;
  `;
  const { rows: methods } = await pool.query(methodQuery, [fromDate, toDate]);

  const pathQuery = `
    SELECT split_part(path, '/', 3) AS level2, COUNT(*) AS count
    FROM server_logs
    WHERE ${filter}
    GROUP BY level2
    ORDER BY count DESC
    LIMIT 5;
  `;
  const { rows: paths } = await pool.query(pathQuery, [fromDate, toDate]);

  const statusQuery = `
    SELECT status_code, COUNT(*) AS count
    FROM server_logs
    WHERE ${filter}
    GROUP BY status_code;
  `;
  const { rows: statusCodes } = await pool.query(statusQuery, [fromDate, toDate]);

  const durationQuery = `
    SELECT AVG(duration) AS avg_duration, COUNT(*) AS total
    FROM server_logs
    WHERE ${filter};
  `;
  const { rows: [durationRow] } = await pool.query(durationQuery, [fromDate, toDate]);

  const dealerQuery = `
    SELECT dealer_name, dealer_code, COUNT(*) AS count
    FROM server_logs
    WHERE ${filter}
    GROUP BY dealer_name, dealer_code
    ORDER BY count DESC;
  `;
  const { rows: dealers } = await pool.query(dealerQuery, [fromDate, toDate]);

  const dailyQuery = `
    SELECT DATE(created_at) AS day, COUNT(*) AS count
    FROM server_logs
    WHERE ${filter}
    GROUP BY day
    ORDER BY day DESC;
  `;
  const { rows: daily } = await pool.query(dailyQuery, [fromDate, toDate]);

  return {
    totalRequests: parseInt(durationRow.total || 0),
    avgDuration: parseFloat(durationRow.avg_duration) || 0,
    methods: Object.fromEntries(methods.map(m => [m.method, parseInt(m.count)])),
    topPaths: Object.fromEntries(paths.map(p => [`/api/${p.level2}`, parseInt(p.count)])),
    statusCodes: Object.fromEntries(statusCodes.map(s => [s.status_code, parseInt(s.count)])),
    dealers: Object.fromEntries(dealers.map(d => [`${d.dealer_name} (${d.dealer_code})`, parseInt(d.count)])),
    dailyCounts: Object.fromEntries(daily.map(d => [d.day.toISOString().split('T')[0], parseInt(d.count)]))
  };
}

module.exports = getserverstatshandler;
