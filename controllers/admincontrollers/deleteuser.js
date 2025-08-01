const pool = require('../../db');

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT * FROM login WHERE id = $1', [id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'کاربری با این کد ملی یافت نشد.' });
    }

    await pool.query('DELETE FROM login WHERE id = $1', [id]);

    res.status(200).json({ message: 'کاربر با موفقیت حذف شد.' });

  } catch (err) {
    console.error('❌ خطا در حذف کاربر:', err);
    res.status(500).json({ message: 'خطای سرور هنگام حذف کاربر.' });
  }
};
