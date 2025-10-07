const pool = require('../../db');

exports.deleteDealer = async (req, res) => {
  const { dealer_id } = req.params;

  if (!dealer_id)
    return res.status(400).json({ message: 'شناسه نمایندگی ارسال نشده است.' });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM setting WHERE dealer_id = $1`, [dealer_id]);

    await client.query(`DELETE FROM logs WHERE dealer_id = $1`, [dealer_id]);

    const customersRes = await client.query(
      `SELECT id FROM customers WHERE dealer_id = $1`,
      [dealer_id]
    );
    const customerIds = customersRes.rows.map(r => r.id);

    if (customerIds.length > 0) {
      const receptionsRes = await client.query(
        `SELECT id FROM receptions WHERE customer_id = ANY($1::int[])`,
        [customerIds]
      );
      const receptionIds = receptionsRes.rows.map(r => r.id);

      if (receptionIds.length > 0) {
        await client.query(
          `DELETE FROM orders WHERE reception_id = ANY($1::int[])`,
          [receptionIds]
        );

        await client.query(
          `DELETE FROM receptions WHERE id = ANY($1::int[])`,
          [receptionIds]
        );
      }

      await client.query(
        `DELETE FROM customers WHERE id = ANY($1::int[])`,
        [customerIds]
      );
    }

    await client.query(`DELETE FROM login WHERE dealer_id = $1`, [dealer_id]);

    const dealerDeleteRes = await client.query(
      `DELETE FROM dealers WHERE id = $1 RETURNING *`,
      [dealer_id]
    );

    if (dealerDeleteRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'نمایندگی یافت نشد.' });
    }

    await client.query('COMMIT');
    res.json({
      message: '✅ نمایندگی و تمام وابستگی‌هایش با موفقیت حذف شدند.',
      deletedDealer: dealerDeleteRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ خطا در حذف نمایندگی با cascade:', err);
    res.status(500).json({ message: 'خطای سرور در حذف نمایندگی.' });
  } finally {
    client.release();
  }
};
