const pool = require('../../../../core/config/db');

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const dealer_id = req.user?.dealer_id;

  if (!dealer_id) {
    return res.status(403).json({ message: 'دسترسی غیرمجاز: شناسه نمایندگی یافت نشد.' });
  }

  try {
    const check = await pool.query('SELECT * FROM login WHERE id = $1 AND dealer_id = $2', [id, dealer_id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'کاربری با این شناسه یا نمایندگی یافت نشد.' });
    }

    await pool.query('DELETE FROM login WHERE id = $1 AND dealer_id = $2', [id, dealer_id]);

    res.status(200).json({ message: 'کاربر با موفقیت حذف شد.' });

  } catch (err) {
    console.error('❌ خطا در حذف کاربر:', err);
    res.status(500).json({ message: 'خطای سرور هنگام حذف کاربر.' });
  }
};
