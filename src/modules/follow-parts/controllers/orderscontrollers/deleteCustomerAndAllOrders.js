const pool = require('../../../../core/config/db');
const createLog = require('../logcontrollers/createlog');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.deleteCustomerAndAllOrders = async (req, res) => {
  const client = await pool.connect();
  const customerId = parseInt(req.params.customerId, 10);

  try {
    await client.query('BEGIN');

    const customerResult = await client.query(
      'SELECT customer_name, dealer_id, phone_number FROM customers WHERE id = $1',
      [customerId]
    );

    const customer = customerResult.rows[0];
    if (!customer) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'مشتری با این شناسه یافت نشد.' });
    }

    if (customer.dealer_id !== req.dealer_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'شما اجازه حذف مشتری‌های سایر نمایندگی‌ها را ندارید.' });
    }

    const customerName = customer.customer_name || 'نامشخص';
    const customerPhone = customer.phone_number || null;

    const receptionsRes = await client.query(
      'SELECT id FROM receptions WHERE customer_id = $1',
      [customerId]
    );
    const receptionIds = receptionsRes.rows.map(row => row.id);

    for (const receptionId of receptionIds) {
      const ordersRes = await client.query(
        'SELECT id, status FROM orders WHERE reception_id = $1',
        [receptionId]
      );

      for (const order of ordersRes.rows) {
        const orderId = order.id;
        const status = order.status;

        if (status === 'حذف شده') {
          await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

          const remainingOrders = await client.query(
            'SELECT COUNT(*) FROM orders WHERE reception_id = $1',
            [receptionId]
          );

          if (parseInt(remainingOrders.rows[0].count, 10) === 0) {
            await client.query('DELETE FROM receptions WHERE id = $1', [receptionId]);
          }

        } else {
          await client.query(
            `UPDATE orders SET status = 'حذف شده' WHERE id = $1`,
            [orderId]
          );
        }
      }
    }

    const finalOrders = await client.query(
      `SELECT COUNT(*) FROM orders o
       INNER JOIN receptions r ON o.reception_id = r.id
       WHERE r.customer_id = $1`,
      [customerId]
    );

    if (parseInt(finalOrders.rows[0].count, 10) === 0) {
      await client.query('DELETE FROM customers WHERE id = $1', [customerId]);

      await createLog(
        req.user.id,
        'حذف مشتری',
        `مشتری "${customerName}" و تمام پذیرش‌ها و قطعات حذف شده کامل پاک شدند.`,
        customerPhone
      );

      await client.query('COMMIT');
      return res.status(200).json({
        message: 'مشتری، تمام سفارش‌های حذف‌شده و پذیرش‌های مرتبط به‌صورت کامل حذف شدند.'
      });
    } else {
      await createLog(
        req.user.id,
        'علامت‌گذاری سفارش‌های مشتری',
        `تمام سفارش‌های مشتری "${customerName}" به وضعیت "حذف شده" تغییر یافتند.`,
        customerPhone
      );

      await client.query('COMMIT');
      return res.status(200).json({
        message: 'تمام سفارش‌های مشتری به وضعیت "حذف شده" تغییر یافتند. مشتری به دلیل داشتن سفارش باقی‌مانده حذف نشد.'
      });
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in deleteCustomerAndAllOrders:', err);
    res.status(500).json({ message: 'خطای سرور در حذف مشتری و اطلاعات وابسته.' });
  } finally {
    client.release();
  }
};
