const pool = require('../../db');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.searchLostOrders = async (req, res) => {
  try {
    const dealerId = req.user.dealer_id;

    const { search, filter, date } = req.query;

    const filtersMap = {
      piece_name: 'piece_name',
      part_id: 'part_id::text',
      car_name: 'car_name',
      lost_date: 'lost_date'
    };

    let whereClauses = [`dealer_id = $1`];
    let values = [dealerId];
    let paramIndex = 2;

    if (filter && search && filtersMap[filter]) {
      if (filter === 'lost_date') {
        const validDate = moment(search, 'YYYY-MM-DD', true).isValid();
        if (!validDate) {
          return res.status(400).json({ message: "تاریخ وارد شده معتبر نیست. فرمت باید YYYY-MM-DD باشد." });
        }
        whereClauses.push(`${filtersMap[filter]} = $${paramIndex++}`);
        values.push(search);
      } else {
        whereClauses.push(`${filtersMap[filter]} ILIKE $${paramIndex++}`);
        values.push(`%${search}%`);
      }
    } else if (search) {
      whereClauses.push(`(
        piece_name ILIKE $${paramIndex} OR
        part_id::text ILIKE $${paramIndex} OR
        car_name ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (date) {
      const validDate = moment(date, 'YYYY-MM-DD', true).isValid();
      if (!validDate) {
        return res.status(400).json({ message: "تاریخ وارد شده معتبر نیست. فرمت باید YYYY-MM-DD باشد." });
      }
      whereClauses.push(`lost_date = $${paramIndex++}`);
      values.push(date);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

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
      ${whereSQL}
      ORDER BY lost_date DESC, lost_time DESC
    `;

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

    return res.json({
      data,
      total: data.length,
    });

  } catch (error) {
    console.error("خطا در جستجوی قطعات گم‌شده:", error);
    return res.status(500).json({
      message: "خطا در دریافت اطلاعات جستجو شده.",
    });
  }
};
