const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');

exports.deleteLostOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lostOrderId = parseInt(req.params.id, 10);
    if (isNaN(lostOrderId)) {
      return res.status(400).json({ message: 'شناسه قطعه نامعتبر است.' });
    }

    const pieceRes = await pool.query(
      'SELECT piece_name FROM lost_orders WHERE id = $1',
      [lostOrderId]
    );

    const deletedPieceName = pieceRes.rows[0]?.piece_name || 'نامشخص';


    const existing = await client.query('SELECT * FROM lost_orders WHERE id = $1', [lostOrderId]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'قطعه‌ای با این شناسه یافت نشد.' });
    }

    await client.query('DELETE FROM lost_orders WHERE id = $1', [lostOrderId]);

    await createLog(
      req.user.id,
      'حذف قطعه از دست رفته',
      `قطعه "${deletedPieceName}" از لیست از دست رفته‌ها حذف شد`
    );

    await client.query('COMMIT');

    return res.status(200).json({ message: 'قطعه از دست رفته با موفقیت حذف شد.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('خطا در حذف قطعه از دست رفته:', error);
    return res.status(500).json({ message: 'خطا در سرور هنگام حذف قطعه.' });
  } finally {
    client.release();
  }
};
