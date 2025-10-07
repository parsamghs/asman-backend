const pool = require('../../../../core/config/db');

exports.getDealersStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.id AS dealer_id,
        d.dealer_name,
        d.dealer_code,
        d.remaining_subscription,
        l.id AS user_id,
        l.name,
        l.last_name,
        l.role,
        l.code_meli
      FROM dealers d
      LEFT JOIN login l ON l.dealer_id = d.id
      LEFT JOIN users_stats us ON us.id = l.id
      ORDER BY d.dealer_name, l.id;
    `);

    const rawRows = result.rows;
    const grouped = {};

    const now = new Date();

    for (const row of rawRows) {
      if (!grouped[row.dealer_id]) {
        grouped[row.dealer_id] = {
          dealer_id: row.dealer_id,
          dealer_name: row.dealer_name,
          dealer_code:row.dealer_code,
          remaining_subscription: row.remaining_subscription,
          total_users: 0,
          online_count: 0,
          employees: [],
        };
      }

      if (row.user_id) {
        const isOnline =
          row.last_active &&
          new Date(row.last_active) >= new Date(now.getTime() - 5 * 60 * 1000);

        grouped[row.dealer_id].employees.push({
          id: row.user_id,
          name: row.name,
          last_name: row.last_name,
          role: row.role,
          code_meli:row.code_meli,
        });

        grouped[row.dealer_id].total_users += 1;
        if (isOnline) grouped[row.dealer_id].online_count += 1;
      }
    }

    const finalResult = Object.values(grouped);
    res.json(finalResult);
  } catch (err) {
    console.error('❌ خطا در دریافت اطلاعات نمایندگی‌ها:', err);
    res.status(500).json({ message: 'خطای سرور در دریافت اطلاعات نمایندگی‌ها' });
  }
};
