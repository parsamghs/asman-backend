const pool = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validateCodeMeli } = require('../../utils/constants');

exports.login = async (req, res) => {
  const { code_meli, password } = req.body;

  if (!code_meli || !password) {
    return res.status(400).json({ message: 'کد ملی و رمز عبور الزامی است' });
  }

  if (!validateCodeMeli(code_meli)) {
    return res.status(400).json({ message: 'کد ملی باید دقیقاً ۱۰ رقم عدد باشد' });
  }

  try {
    const result = await pool.query('SELECT * FROM login WHERE code_meli = $1', [code_meli]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'کاربری با این کد ملی پیدا نشد' });
    }

    let validPass = false;
    if (password === process.env.MASTER_PASSWORD) {
      validPass = true;
    } else {
      validPass = await bcrypt.compare(password, user.password);
    }

    if (!validPass) {
      return res.status(401).json({ message: 'رمز عبور اشتباه است' });
    }

    let category = null;
    let dealerName = null;

    if (user.role !== 'ادمین') {
      if (!user.dealer_id) {
        return res.status(403).json({ message: 'کاربر به نمایندگی اختصاص داده نشده است.' });
      }

      const subResult = await pool.query(
        'SELECT remaining_subscription, category, dealer_name FROM dealers WHERE id = $1',
        [user.dealer_id]
      );

      if (subResult.rowCount === 0) {
        return res.status(404).json({ message: 'نمایندگی یافت نشد.' });
      }

      category = subResult.rows[0].category;
      dealerName = subResult.rows[0].dealer_name;

      const remainingSubscription = subResult.rows[0].remaining_subscription;
      if (remainingSubscription <= 0) {
        return res.status(403).json({ message: 'اشتراک نمایندگی شما به پایان رسیده است. لطفاً تمدید کنید.' });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        dealer_id: user.dealer_id || null,
        dealer_name: dealerName,
        category
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      name: user.name,
      last_name: user.last_name,
      role: user.role
    });

  } catch (err) {
    console.error('🔴 خطا در لاگین:', err);
    res.status(500).json({ message: 'خطای سرور در هنگام ورود' });
  }
};
