const pool = require('../../db');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });
const createLog = require('../logcontrollers/createlog');

exports.deleteOrderPiece = async (req, res) => {
  const { order_id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderInfo = await client.query(
      `SELECT o.id, o.reception_id, o.piece_name, o.status, r.customer_id
       FROM orders o
       LEFT JOIN receptions r ON o.reception_id = r.id
       WHERE o.id = $1`,
      [order_id]
    );

    if (orderInfo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'سفارشی با این آیدی یافت نشد.' });
    }

    const { reception_id, customer_id, status, piece_name } = orderInfo.rows[0];

    const customerResult = await client.query(
      'SELECT customer_name, phone_number FROM customers WHERE id = $1',
      [customer_id]
    );

    const customerName = customerResult.rows[0]?.customer_name || 'نامشخص';
    const phoneNumber = customerResult.rows[0]?.phone_number || null;

    if (status === 'حذف شده') {
      await client.query('DELETE FROM orders WHERE id = $1', [order_id]);

      const remainingOrders = await client.query(
        'SELECT COUNT(*) AS count FROM orders WHERE reception_id = $1',
        [reception_id]
      );

      if (parseInt(remainingOrders.rows[0].count, 10) === 0) {
        await client.query('DELETE FROM receptions WHERE id = $1', [reception_id]);

        const remainingReceptions = await client.query(
          'SELECT COUNT(*) AS count FROM receptions WHERE customer_id = $1',
          [customer_id]
        );

        if (parseInt(remainingReceptions.rows[0].count, 10) === 0) {
          await client.query('DELETE FROM customers WHERE id = $1', [customer_id]);
        }
      }

      await createLog(
        req.user.id,
        'حذف کامل سفارش',
        `قطعه "${piece_name || 'نامشخص'}" به‌صورت کامل از سفارشات مشتری "${customerName}" حذف شد.`,
        phoneNumber
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'قطعه قبلاً حذف شده بود و اکنون به‌صورت کامل پاک شد.' });
    } else {
      await client.query(
        `UPDATE orders SET status = 'حذف شده' WHERE id = $1`,
        [order_id]
      );

      await createLog(
        req.user.id,
        'علامت‌گذاری حذف سفارش',
        `قطعه "${piece_name || 'نامشخص'}" از سفارشات مشتری "${customerName}" به عنوان "حذف شده" علامت‌گذاری شد.`,
        phoneNumber
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'قطعه با موفقیت به وضعیت "حذف شده ها" تغییر یافت.' });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('خطا در حذف سفارش:', err);
    res.status(500).json({ message: 'خطای سرور هنگام حذف سفارش.' });
  } finally {
    client.release();
  }
};
