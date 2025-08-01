const pool = require('../../db');
const bcrypt = require('bcryptjs');
const { validateWithRegex } = require('../../utils/validation');
const { CONSTANTS } = require('../../utils/constants');

exports.updateUser = async (req, res) => {
  const userRole = req.user?.role;
  const userId = parseInt(req.params.id, 10);
  const { name, last_name, code_meli, password, role } = req.body;

  if (userRole !== 'مدیریت') {
    return res.status(403).json({ message: 'شما دسترسی به این عملیات ندارید.' });
  }

  if (!name && !last_name && !code_meli && !password && !role) {
    return res.status(400).json({ message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است.' });
  }

  const fields = [];
  const values = [];
  let index = 1;

  try {
    if (name !== undefined) {
      const result = validateWithRegex('name', name);
      if (!result.isValid) return res.status(400).json({ message: `نام: ${result.message}` });
      fields.push(`name = $${index++}`);
      values.push(name);
    }

    if (last_name !== undefined) {
      const result = validateWithRegex('name', last_name);
      if (!result.isValid) return res.status(400).json({ message: `نام خانوادگی: ${result.message}` });
      fields.push(`last_name = $${index++}`);
      values.push(last_name);
    }

    if (code_meli !== undefined) {
      const result = validateWithRegex('code_meli', code_meli);
      if (!result.isValid) return res.status(400).json({ message: `کد ملی: ${result.message}` });
      fields.push(`code_meli = $${index++}`);
      values.push(code_meli);
    }

    if (password !== undefined) {
      const result = validateWithRegex('password', password);
      if (!result.isValid) return res.status(400).json({ message: 'رمز عبور فقط باید شامل رقم و حداقل ۵ رقم باشد.' });
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${index++}`);
      values.push(hashed);
    }

    if (role !== undefined) {
      if (!CONSTANTS.roles.includes(role)) {
        return res.status(400).json({ message: 'نقش وارد شده معتبر نیست.' });
      }
      fields.push(`role = $${index++}`);
      values.push(role);
    }

    values.push(userId);
    const updateQuery = `UPDATE login SET ${fields.join(', ')} WHERE id = $${index}`;

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `کاربری با شناسه ${userId} یافت نشد.` });
    }

    res.status(200).json({ message: 'کاربر با موفقیت به‌روزرسانی شد.' });

  } catch (err) {
    console.error('❌ خطا در به‌روزرسانی کاربر:', err);
    res.status(500).json({ message: 'خطای سرور در به‌روزرسانی کاربر.' });
  }
};
