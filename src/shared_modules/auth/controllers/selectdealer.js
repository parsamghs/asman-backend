const pool = require('../../../core/config/db');
const jwt = require('jsonwebtoken');

exports.selectDealer = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'توکن ارسال نشده یا معتبر نیست.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'توکن نامعتبر است.' });
    }

    const userId = decoded.id;
    const { selected_dealer_id } = req.body;

    if (!selected_dealer_id) {
      return res.status(400).json({ message: 'انتخاب نمایندگی الزامی است.' });
    }

    const userDealerRes = await pool.query(
      'SELECT * FROM user_dealers WHERE user_id = $1 AND dealer_id = $2',
      [userId, selected_dealer_id]
    );

    if (userDealerRes.rowCount === 0) {
      return res.status(403).json({ message: 'شما به این نمایندگی دسترسی ندارید.' });
    }

    const dealerRes = await pool.query(
      'SELECT dealer_name, category, remaining_subscription FROM dealers WHERE id = $1',
      [selected_dealer_id]
    );

    if (dealerRes.rowCount === 0) {
      return res.status(404).json({ message: 'نمایندگی یافت نشد.' });
    }

    const dealer = dealerRes.rows[0];

    if (dealer.remaining_subscription <= 0) {
      return res.status(403).json({ message: 'اشتراک نمایندگی به پایان رسیده است.' });
    }

    const userRes = await pool.query('SELECT id, role FROM login WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    const finalToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        dealer_id: selected_dealer_id,
        dealer_name: dealer.dealer_name,
        category: dealer.category
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: finalToken,
      dealer_name: dealer.dealer_name,
      category: dealer.category
    });

  } catch (err) {
    console.error('🔴 خطا در انتخاب نمایندگی:', err);
    res.status(500).json({ message: 'خطای سرور' });
  }
};
