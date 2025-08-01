const pool = require('../../db');
const { validateWithRegex } = require('../../utils/validation');

exports.addPart = async (req, res) => {
    const { technical_code, part_name } = req.body;

    let result = validateWithRegex('technical_code', technical_code);
    if (!result.isValid) {
        return res.status(400).json({ message: `کد قطعه: ${result.message || 'نامعتبر است.'}` });
    }

    result = validateWithRegex('part_name', part_name);
    if (!result.isValid) {
        return res.status(400).json({ message: `نام قطعه: ${result.message}` });
    }

    if (!result.isValid) {
        return res.status(400).json({ message: `کد قطعه: ${result.message || 'نامعتبر است.'}` });
    }

    try {
        const check = await pool.query(
            'SELECT * FROM parts_id WHERE technical_code = $1',
            [technical_code]
        );

        if (check.rows.length > 0) {
            return res.status(409).json({ message: 'این کد قطعه قبلاً ثبت شده است.' });
        }

        await pool.query(
            'INSERT INTO parts_id (technical_code, part_name) VALUES ($1, $2)',
            [technical_code, part_name]
        );

        return res.status(201).json({ message: 'قطعه با موفقیت اضافه شد.' });

    } catch (err) {
        console.error('❌ خطا در افزودن قطعه:', err);
        return res.status(500).json({ message: 'خطای سرور' });

    }
};
