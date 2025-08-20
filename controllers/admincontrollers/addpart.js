const pool = require('../../db');
const { validateWithRegex } = require('../../utils/validation');
const { insertPartIfNotExists } = require('../../helpers/partshelper');

exports.addPart = async (req, res) => {
    const { technical_code, part_name } = req.body;
    const category = req.user?.category;

    if (!category) {
        return res.status(400).json({ message: 'دسته‌بندی کاربر نامعتبر است.' });
    }

    let result = validateWithRegex('technical_code', technical_code);
    if (!result.isValid) {
        return res.status(400).json({ message: `کد قطعه: ${result.message || 'نامعتبر است.'}` });
    }

    result = validateWithRegex('part_name', part_name);
    if (!result.isValid) {
        return res.status(400).json({ message: `نام قطعه: ${result.message}` });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await insertPartIfNotExists(client, category, technical_code, part_name);

        await client.query('COMMIT');
        return res.status(201).json({ message: `قطعه با موفقیت در دسته "${category}" اضافه شد.` });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ خطا در افزودن قطعه:', err);
        return res.status(500).json({ message: 'خطای سرور' });
    } finally {
        client.release();
    }
};
