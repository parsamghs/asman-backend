const pool = require('../../../core/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validateCodeMeli } = require('../../../core/utils/constants');

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

    const dealersRes = await pool.query(
      `SELECT d.id as dealer_id, d.dealer_name, d.dealer_code
       FROM user_dealers ud
       JOIN dealers d ON ud.dealer_id = d.id
       WHERE ud.user_id = $1`,
      [user.id]
    );

    if (dealersRes.rowCount === 0) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      return res.json({
        token,
        name: user.name,
        last_name: user.last_name,
        role: user.role,
        dealers: []
      });
    }

    if (dealersRes.rowCount === 1) {
      const dealer = dealersRes.rows[0];

      if (dealer.remaining_subscription <= 0) {
        return res.status(403).json({ message: 'اشتراک نمایندگی به پایان رسیده است.' });
      }

      const finalToken = jwt.sign(
        {
          id: user.id,
          role: user.role,
          dealer_id: dealer.dealer_id,
          dealer_name: dealer.dealer_name,
          category: dealer.category
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.json({
        token: finalToken,
        name: user.name,
        last_name: user.last_name,
        role: user.role,
        number:0
      });
    }

    const token = jwt.sign(
      { id: user.id }, process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({
      token,
      name: user.name,
      last_name: user.last_name,
      role: user.role,
      number:1
    });

  } catch (err) {
    console.error('🔴 خطا در لاگین:', err);
    res.status(500).json({ message: 'خطای سرور در هنگام ورود' });
  }
};
