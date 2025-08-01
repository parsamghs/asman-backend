const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.addLostOrder = async (req, res) => {
  const { piece_code, piece_name, car_name, lost_description, count, lost_date, lost_time } = req.body;

  if (!piece_name || !car_name) {
    return res.status(400).json({
      message: "نام قطعه و نام خودرو اجباری هستند.",
    });
  }

  if (count && !/^\d+$/.test(count)) {
    return res.status(400).json({
      message: "فیلد count باید فقط شامل عدد باشد.",
    });
  }

  if (!req.user || !req.user.dealer_id) {
    return res.status(403).json({ message: 'شناسه نمایندگی پیدا نشد.' });
  }

  const status = "از دست رفته";

  let lostDateGregorian = null;
  if (lost_date) {
    lostDateGregorian = moment(lost_date, ['jYYYY/jMM/jDD', 'jYYYY-MM-DD']).format('YYYY-MM-DD');
  }

  let lostTime24 = null;
  if (lost_time) {
    lostTime24 = moment(lost_time, ['hh:mm A', 'hh:mm:ss A']).format('HH:mm:ss');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertOrderQuery = `
      INSERT INTO lost_orders (
        part_id, piece_name, car_name, lost_description, count, status, lost_date, lost_time, dealer_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `;
    const values = [
      piece_code || null,
      piece_name,
      car_name,
      lost_description || null,
      count || null,
      status,
      lostDateGregorian,
      lostTime24,
      req.user.dealer_id
    ];

    const insertResult = await client.query(insertOrderQuery, values);
    const lostOrderId = insertResult.rows[0].id;

    await createLog(
      req.user.id,
      'ثبت قطعه از دست رفته',
      `قطعه از دست رفته جدیدی ثبت شد با شناسه ${lostOrderId}`
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: "درخواست قطعه گم‌شده با موفقیت ثبت شد.",
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("خطا در ثبت قطعه گم‌شده:", error);
    return res.status(500).json({
      message: "خطایی در سرور رخ داد.",
    });
  } finally {
    client.release();
  }
};
