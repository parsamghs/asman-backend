const pool = require('../../../../core/config/db');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.getLostOrders = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let pageSize = parseInt(req.query.pageSize) || 20;
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 20;

    const offset = (page - 1) * pageSize;

    const dealerId = req.user.dealer_id;

    const query = `
      SELECT 
        id,
        part_id,
        piece_name,
        car_name,
        lost_description,
        count,
        status,
        lost_date,
        lost_time
      FROM lost_orders
      WHERE dealer_id = $3
      ORDER BY lost_date DESC, lost_time DESC
      LIMIT $1 OFFSET $2
    `;

    const values = [pageSize, offset, dealerId];

    const result = await pool.query(query, values);

    const data = result.rows.map(row => {
      const jalaliDate = row.lost_date
        ? moment(row.lost_date).format('jYYYY/jMM/jDD')
        : null;

      const shortTime = row.lost_time
        ? row.lost_time.substring(0, 5)
        : null;

      return {
        ...row,
        lost_date: jalaliDate,
        lost_time: shortTime,
      };
    });

    const countResult = await pool.query('SELECT COUNT(*) FROM lost_orders WHERE dealer_id = $1', [dealerId]);  // اضافه شده
    const total = parseInt(countResult.rows[0].count, 10);

    return res.json({
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (error) {
    console.error("خطا در دریافت قطعات گم‌شده:", error);
    return res.status(500).json({
      message: "خطا در دریافت اطلاعات قطعات گم‌شده.",
    });
  }
};
