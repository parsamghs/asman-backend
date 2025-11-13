const pool = require('../../../../core/config/db');

exports.updateSetting = async (req, res) => {
  try {
    const allowedFields = ['vor', 'vis', 'market', 'warhouse_charge', 'accounting_approval'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        const value = req.body[key];

        if (key !== 'accounting_approval') {
          if (typeof value !== 'string' || value.length > 2) {
            return res.status(400).json({ message: `مقدار "${key}" نامعتبر است.` });
          }
        } else {
          if (typeof value !== 'boolean') {
            return res.status(400).json({ message: `مقدار "${key}" باید بولین (true/false) باشد.` });
          }
        }
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'هیچ فیلدی برای ویرایش ارسال نشده است.' });
    }

    const dealerId = req.user.dealer_id;
    if (!dealerId) {
      return res.status(400).json({ message: 'شناسه نمایندگی نامعتبر است.' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `SELECT id FROM setting WHERE dealer_id = $1 LIMIT 1`,
        [dealerId]
      );

      if (existing.rows.length > 0) {
        const updateQuery = `
          UPDATE setting
          SET ${fields.join(', ')}
          WHERE dealer_id = $${paramIndex}
        `;
        values.push(dealerId);

        await client.query(updateQuery, values);

      } else {
        const insertFields = [...allowedFields.filter(f => req.body[f] !== undefined), 'dealer_id'];
        const insertValues = insertFields.map(f => f === 'dealer_id' ? dealerId : req.body[f]);
        const insertParams = insertFields.map((_, i) => `$${i + 1}`);

        const insertQuery = `
          INSERT INTO setting (${insertFields.join(', ')})
          VALUES (${insertParams.join(', ')})
        `;

        await client.query(insertQuery, insertValues);
      }

      await client.query('COMMIT');
      return res.status(200).json({ message: 'تنظیمات با موفقیت ثبت/ویرایش شدند.' });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('خطا در ویرایش تنظیمات:', error);
    return res.status(500).json({ message: 'خطای سرور هنگام ویرایش تنظیمات.' });
  }
};
