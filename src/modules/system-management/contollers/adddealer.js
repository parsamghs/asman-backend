const pool = require('../../../core/config/db');
const bcrypt = require('bcryptjs');
const { CONSTANTS, validateCodeMeli, normalizeText } = require('../../../core/utils/constants');

exports.addDealerAndUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      dealer_code,
      dealer_name,
      remaining_subscription,
      category,
      user: {
        name,
        last_name,
        code_meli,
        password,
        phone_number,
        role
      }
    } = req.body;

    if (
      !dealer_code || !dealer_name || !remaining_subscription || !category ||
      !name || !last_name || !code_meli || !password || !role
    ) {
      return res.status(400).json({ message: 'تمام فیلدها الزامی هستند.' });
    }

    if (!CONSTANTS.regex.name.test(normalizeText(name))) {
      return res.status(400).json({ message: 'نام معتبر نیست.' });
    }
    if (!CONSTANTS.regex.name.test(normalizeText(last_name))) {
      return res.status(400).json({ message: 'نام خانوادگی معتبر نیست.' });
    }

    if (!validateCodeMeli(code_meli)) {
      return res.status(400).json({ message: 'کد ملی معتبر نیست.' });
    }

    if (!CONSTANTS.regex.password.test(password)) {
      return res.status(400).json({ message: 'رمز عبور باید حداقل ۴ رقم عددی باشد.' });
    }

    if (!CONSTANTS.roles.includes(normalizeText(role))) {
      return res.status(400).json({ message: 'نقش وارد شده معتبر نیست.' });
    }

    if (phone_number && !CONSTANTS.regex.phone.test(phone_number)) {
      return res.status(400).json({ message: 'شماره تلفن معتبر نیست.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const dealerRes = await client.query(
      `INSERT INTO dealers (dealer_code, dealer_name, remaining_subscription, category)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [dealer_code, dealer_name, remaining_subscription, category]
    );

    const dealerId = dealerRes.rows[0].id;

    await client.query(
      `INSERT INTO login (name, last_name, code_meli, password, phone_number, role, dealer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, last_name, code_meli, hashedPassword, phone_number || null, role, dealerId]
    );

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
