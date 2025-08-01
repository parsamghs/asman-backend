const pool = require('../../db');
const bcrypt = require('bcryptjs');
const { validateWithRegex } = require('../../utils/validation');
const { CONSTANTS } = require('../../utils/constants');

exports.addUser = async (req, res) => {
  const { name, last_name, code_meli, password, role } = req.body;

  const dealer_id = req.user?.dealer_id;

  if (!dealer_id) {
    return res.status(403).json({ message: 'دسترسی غیرمجاز: شناسه نمایندگی یافت نشد.' });
  }

  let result = validateWithRegex('name', name);
  if (!result.isValid) return res.status(400).json({ message: `نام: ${result.message}` });

  result = validateWithRegex('name', last_name);
  if (!result.isValid) return res.status(400).json({ message: `نام خانوادگی: ${result.message}` });

  result = validateWithRegex('code_meli', code_meli);
  if (!result.isValid) return res.status(400).json({ message: `کد ملی: ${result.message}` });

  result = validateWithRegex('password', password);
  if (!result.isValid) {
    return res.status(400).json({ message: `رمز عبور: فقط باید شامل رقم و حداقل ۵ رقم باشد.` });
  }

  if (!CONSTANTS.roles.includes(role)) {
    return res.status(400).json({ message: 'نقش وارد شده معتبر نیست.' });
  }

  try {
    const check = await pool.query('SELECT * FROM login WHERE code_meli = $1', [code_meli]);
    if (check.rows.length > 0)
      return res.status(409).json({ message: 'کاربری با این کد ملی قبلاً ثبت شده است.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO login (name, last_name, code_meli, password, role, dealer_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, last_name, code_meli, hashedPassword, role, dealer_id]
    );

    res.status(201).json({ message: 'کاربر با موفقیت اضافه شد.' });
  } catch (err) {
    console.error('❌ خطا در افزودن کاربر:', err);
    res.status(500).json({ message: 'خطای سرور در افزودن کاربر.' });
  }
};