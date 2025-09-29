const pool = require('../../../../core/config/db');
const createLog = require('../logcontrollers/createlog');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.updateLostOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const lostOrderId = parseInt(req.params.id, 10);
        const {
            part_id,
            piece_name,
            car_name,
            lost_description,
            count,
            lost_date,
            lost_time
        } = req.body;

        const existing = await client.query(`SELECT * FROM lost_orders WHERE id = $1`, [lostOrderId]);
        const originalPieceName = existing.rows[0]?.piece_name || 'نامشخص';

        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'قطعه‌ای با این شناسه یافت نشد یا قبلاً حذف شده است.' });
        }

        if (piece_name !== undefined && piece_name.trim() === '') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'نام قطعه نمی‌تواند خالی باشد.' });
        }

        if (car_name !== undefined && car_name.trim() === '') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'نام خودرو نمی‌تواند خالی باشد.' });
        }

        if (count !== undefined && !/^\d+$/.test(count)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'فیلد count باید فقط شامل عدد باشد.' });
        }

        let miladiDate = null;
        if (lost_date) {
            const isValidJalali = moment(lost_date, ['jYYYY/jMM/jDD', 'jYYYY-MM-DD'], true).isValid();
            if (!isValidJalali) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'فرمت تاریخ واردشده نامعتبر است. مثلاً: ۱۴۰۳/۰۴/۲۰' });
            }
            miladiDate = moment(lost_date, ['jYYYY/jMM/jDD', 'jYYYY-MM-DD']).format('YYYY-MM-DD');
        }

        let formattedTime = null;
        if (lost_time) {
            const isValidTime = moment(lost_time, ['HH:mm', 'hh:mm A', 'hh:mm:ss A'], true).isValid();
            if (!isValidTime) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'فرمت ساعت واردشده نامعتبر است. مثلاً: 14:30' });
            }
            formattedTime = moment(lost_time, ['HH:mm', 'hh:mm A', 'hh:mm:ss A']).format('HH:mm:ss');
        }

        const updateQuery = `
      UPDATE lost_orders
      SET
        part_id = COALESCE($1, part_id),
        piece_name = COALESCE($2, piece_name),
        car_name = COALESCE($3, car_name),
          lost_description = CASE
            WHEN $4::text IS NOT NULL AND $4::text <> '' THEN CONCAT_WS(' / ', lost_description::text, $4::text)
            ELSE lost_description
            END,
        count = COALESCE($5, count),
        lost_date = COALESCE($6, lost_date),
        lost_time = COALESCE($7, lost_time)
      WHERE id = $8
    `;

        await client.query(updateQuery, [
            part_id,
            piece_name,
            car_name,
            lost_description,
            count,
            miladiDate,
            formattedTime,
            lostOrderId
        ]);

        await createLog(
            req.user.id,
            'ویرایش قطعه از دست رفته',
            `قطعه از دست رفته "${originalPieceName}" ویرایش شد`
        );

        await client.query('COMMIT');

        return res.status(200).json({ message: 'قطعه با موفقیت به‌روزرسانی شد.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('خطا در به‌روزرسانی قطعه گم‌شده:', err);
        return res.status(500).json({
            message: 'خطا در سرور هنگام به‌روزرسانی قطعه.',
            error: err.message
        });
    } finally {
        client.release();
    }
};
