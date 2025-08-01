const pool = require('../../db');
const bcrypt = require('bcrypt');
const createLog = require('../logcontrollers/createlog');
const { CONSTANTS, validateCodeMeli, normalizeText } = require('../../utils/constants');

exports.addDealerAndUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      dealer_code,
      dealer_name,
      remaining_subscription,
      user: {
        name,
        last_name,
        code_meli,
        password,
        phone_number,
        role
      }
    } = req.body;

    // چک کردن خالی بودن فیلدها
    if (
      !dealer_code || !dealer_name || !remaining_subscription ||
      !name || !last_name || !code_meli || !password || !phone_number || !role
    ) {
      return res.status(400).json({ message: 'تمام فیلدها الزامی هستند.' });
    }

    // ولیدیشن نام و نام خانوادگی
    if (!CONSTANTS.regex.name.test(normalizeText(name))) {
      return res.status(400).json({ message: 'نام معتبر نیست.' });
    }
    if (!CONSTANTS.regex.name.test(normalizeText(last_name))) {
      return res.status(400).json({ message: 'نام خانوادگی معتبر نیست.' });
    }

    // ولیدیشن کد ملی
    if (!validateCodeMeli(code_meli)) {
      return res.status(400).json({ message: 'کد ملی معتبر نیست.' });
    }

    // ولیدیشن رمز عبور
    if (!CONSTANTS.regex.password.test(password)) {
      return res.status(400).json({ message: 'رمز عبور باید حداقل ۴ رقم عددی باشد.' });
    }

    // ولیدیشن شماره تلفن
    if (!CONSTANTS.regex.phone.test(phone_number)) {
      return res.status(400).json({ message: 'شماره تلفن معتبر نیست.' });
    }

    // ولیدیشن نقش
    if (!CONSTANTS.roles.includes(normalizeText(role))) {
      return res.status(400).json({ message: 'نقش وارد شده معتبر نیست.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    // ایجاد نمایندگی
    const dealerRes = await client.query(
      `INSERT INTO dealers (dealer_code, dealer_name, remaining_subscription)
       VALUES ($1, $2, $3) RETURNING id`,
      [dealer_code, dealer_name, remaining_subscription]
    );

    const dealerId = dealerRes.rows[0].id;

    // ایجاد کاربر
    await client.query(
      `INSERT INTO login (name, last_name, code_meli, password, phone_number, role, dealer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, last_name, code_meli, hashedPassword, phone_number, role, dealerId]
    );

    await createLog(req.user?.id || null, 'ایجاد نمایندگی و کاربر', `نمایندگی ${dealer_name} و کاربر ${name} ${last_name} ایجاد شدند.`);

    await client.query('COMMIT');
    return res.status(201).json({ message: 'نمایندگی و کاربر با موفقیت ایجاد شدند.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in addDealerAndUser:', error);
    res.status(500).json({ message: 'خطا در ایجاد نمایندگی و کاربر.' });
  } finally {
    client.release();
  }
};
