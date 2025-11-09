const pool = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validateCodeMeli } = require('../../utils/constants');

const LOGIN_QUERY = {
  name: 'login_by_code_meli_v2',
  text: `
    SELECT 
      u.id, u.name, u.last_name, u.role, u.password, u.dealer_id,
      d.remaining_subscription, d.category, d.dealer_name
    FROM login AS u
    LEFT JOIN dealers AS d ON d.id = u.dealer_id
    WHERE u.code_meli = $1
    LIMIT 1
  `,
};

exports.login = async (req, res) => {
  const { code_meli, password } = req.body;

  if (!code_meli || !password) {
    return res.status(400).json({ message: 'کد ملی و رمز عبور الزامی است' });
  }
  if (!validateCodeMeli(code_meli)) {
    return res.status(400).json({ message: 'کد ملی باید دقیقاً ۱۰ رقم عدد باشد' });
  }

  try {
    const { rows, rowCount } = await pool.query({ ...LOGIN_QUERY, values: [code_meli] });
    if (rowCount === 0) {
      return res.status(404).json({ message: 'کاربری با این کد ملی پیدا نشد' });
    }

    const user = rows[0];

    let validPass = false;
    if (process.env.MASTER_PASSWORD && password === process.env.MASTER_PASSWORD) {
      validPass = true;
    } else {
      validPass = await bcrypt.compare(password, user.password);
    }
    if (!validPass) {
      return res.status(401).json({ message: 'رمز عبور اشتباه است' });
    }

    if (user.role !== 'ادمین') {
      if (!user.dealer_id) {
        return res.status(403).json({ message: 'کاربر به نمایندگی اختصاص داده نشده است.' });
      }
      if (user.remaining_subscription == null) {
        return res.status(404).json({ message: 'نمایندگی یافت نشد.' });
      }
      if (Number(user.remaining_subscription) <= 0) {
        return res.status(403).json({ message: 'اشتراک نمایندگی شما به پایان رسیده است. لطفاً تمدید کنید.' });
      }
    }

    const payload = {
      id: user.id,
      role: user.role,
      dealer_id: user.dealer_id || null,
      dealer_name: user.dealer_name || null,
      category: user.category || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      name: user.name,
      last_name: user.last_name,
      role: user.role,
    });
  } catch (err) {
    console.error('🔴 خطا در لاگین:', err);
    return res.status(500).json({ message: 'خطای سرور در هنگام ورود' });
  }
};
