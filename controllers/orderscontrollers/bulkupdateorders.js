const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.updateMultipleOrderStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { order_ids, new_status, description, final_order_number, appointment_date, appointment_time } = req.body;

        if (!Array.isArray(order_ids) || order_ids.length === 0) {
            return res.status(400).json({ message: 'لیست سفارش‌ها خالی است.' });
        }

        if (!new_status || typeof new_status !== 'string') {
            return res.status(400).json({ message: 'وضعیت جدید معتبر نیست.' });
        }

        const mandatoryDescriptionStatuses = [
            'لغو توسط شرکت',
            'عدم پرداخت حسابداری',
            'عدم دریافت',
            'انصراف مشتری',
            'تحویل نشد'
        ];

        if (mandatoryDescriptionStatuses.includes(new_status)) {
            if (!description || typeof description !== 'string' || description.trim() === '') {
                return res.status(400).json({
                    message: `وارد کردن توضیحات برای وضعیت "${new_status}" الزامی است.`
                });
            }
        }

        if (new_status === 'نوبت داده شد') {
            if (!appointment_date || !appointment_time || appointment_date.trim() === '' || appointment_time.trim() === '') {
                return res.status(400).json({
                    message: 'وارد کردن تاریخ و ساعت نوبت برای وضعیت "نوبت داده شد" الزامی است.'
                });
            }
        }

        let convertedAppointmentDate = appointment_date;
        if (new_status === 'نوبت داده شد' && appointment_date) {
            const m = moment(appointment_date, 'jYYYY/jMM/jDD');
            if (!m.isValid()) {
                return res.status(400).json({ message: 'تاریخ نوبت‌دهی وارد شده معتبر نیست.' });
            }
            convertedAppointmentDate = m.format('YYYY-MM-DD');
        }

        const orderDetailsRes = await client.query(
            `SELECT o.id, o.piece_name, r.customer_id, COALESCE(c.customer_name, 'نامشخص') AS customer_name, c.phone_number
             FROM orders o
             LEFT JOIN receptions r ON o.reception_id = r.id
             LEFT JOIN customers c ON r.customer_id = c.id
             WHERE o.id = ANY($1::int[])`,
            [order_ids]
        );

        if (orderDetailsRes.rows.length === 0) {
            return res.status(404).json({ message: 'هیچ سفارشی با این شناسه‌ها یافت نشد.' });
        }

        const customerGroupsWithPhone = {};
        for (const row of orderDetailsRes.rows) {
            const customerName = row.customer_name;
            const phoneNumber = row.phone_number || null;
            if (!customerGroupsWithPhone[customerName]) {
                customerGroupsWithPhone[customerName] = { pieces: [], phone: phoneNumber };
            }
            customerGroupsWithPhone[customerName].pieces.push(row.piece_name || 'نامشخص');
        }

        const deliveryDate = new_status === 'دریافت شد'
            ? moment().tz('Asia/Tehran').format('YYYY-MM-DD HH:mm')
            : null;

        if (new_status === 'در انتظار تائید حسابداری') {
            if (!final_order_number || final_order_number.trim() === '') {
                return res.status(400).json({
                    message: 'وارد کردن شماره سفارش نهایی برای وضعیت "در انتظار تائید حسابداری" الزامی است.'
                });
            }
        }

        await client.query('BEGIN');

        const isAppointmentStatus = new_status === 'نوبت داده شد';

        const updateResult = await client.query(
            `UPDATE orders
             SET status = $1,
                 delivery_date = COALESCE($3, delivery_date),
                 final_order_number = COALESCE($4, final_order_number),
                 appointment_date = CASE WHEN $8 THEN $6 ELSE appointment_date END,
                 appointment_time = CASE WHEN $8 THEN $7 ELSE appointment_time END,
                 description = CASE
                     WHEN $2::text IS NOT NULL THEN CONCAT_WS(' / ', description::text, $2::text)
                     ELSE description
                 END
             WHERE id = ANY($5::int[])`,
            [
                new_status,
                description,
                deliveryDate,
                final_order_number?.trim() || null,
                order_ids,
                convertedAppointmentDate,
                appointment_time,
                isAppointmentStatus
            ]
        );

        if (['لغو توسط شرکت', 'عدم پرداخت حسابداری'].includes(new_status)) {
            const now = momentTZ().tz('Asia/Tehran');
            const lostDate = now.format('YYYY-MM-DD');
            const lostTime = now.format('HH:mm');

            const fullOrderInfoRes = await client.query(
                `SELECT id, part_id, piece_name, car_name, number_of_pieces
                 FROM orders
                 WHERE id = ANY($1::int[])`,
                [order_ids]
            );

            for (const order of fullOrderInfoRes.rows) {
                await client.query(`
                    INSERT INTO lost_orders (
                        part_id,
                        piece_name,
                        car_name,
                        lost_description,
                        count,
                        lost_date,
                        lost_time,
                        status,
                        dealer_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    order.part_id || null,
                    order.piece_name || 'نامشخص',
                    order.car_name || 'نامشخص',
                    description?.trim() || 'بدون توضیحات',
                    order.number_of_pieces?.toString() || '1',
                    lostDate,
                    lostTime,
                    new_status,
                    req.user.dealer_id || null
                ]);
            }
        }

        for (const [customerName, data] of Object.entries(customerGroupsWithPhone)) {
            const piecesText = data.pieces.map(name => `«${name}»`).join('، ');
            const phone = data.phone;
            let logMessage = '';

            switch (new_status) {
                case 'در انتظار تائید حسابداری':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" توسط شرکت تأیید شد و در انتظار تائید حسابداری است`;
                    break;
                case 'لغو توسط شرکت':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" به دلیل "${description || 'بدون توضیحات'}" توسط شرکت لغو شد`;
                    break;
                case 'در انتظار دریافت':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" توسط حسابدار پرداخت شد و در انتظار دریافت است`;
                    break;
                case 'عدم پرداخت حسابداری':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" به دلیل "${description || 'بدون توضیحات'}" توسط حسابدار پرداخت نشد`;
                    break;
                case 'در انتظار نوبت دهی':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" به دلیل "${description || 'بدون توضیحات'}" توسط حسابدار پرداخت شد و در انتظار نوبت دهی است`;
                    break;
                case 'دریافت شد':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" توسط انباردار دریافت شد`;
                    break;
                case 'عدم دریافت':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" به دلیل "${description || 'بدون توضیحات'}" دریافت نشد`;
                    break;
                case 'نوبت داده شد':
                    let appointmentShamsi = 'نامشخص';
                    if (convertedAppointmentDate) {
                        appointmentShamsi = moment(convertedAppointmentDate, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
                    }
                    const appointmentTime = appointment_time || 'نامشخص';
                    logMessage = `برای سفارشات ${piecesText} مربوط به مشتری "${customerName}" در تاریخ "${appointmentShamsi}" ساعت "${appointmentTime}" نوبت‌گذاری شد`;
                    break;
                case 'انصراف مشتری':
                    logMessage = `مشتری "${customerName}" از ادامه‌ی سفارشات ${piecesText} به دلیل "${description || 'بدون توضیحات'}" انصراف داد`;
                    break;
                case 'تحویل شد':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" تحویل داده شد`;
                    break;
                case 'تحویل نشد':
                    logMessage = `سفارشات ${piecesText} مربوط به مشتری "${customerName}" به دلیل "${description || 'بدون توضیحات'}" تحویل داده نشد`;
                    break;
                default:
                    logMessage = `وضعیت سفارشات ${piecesText} مربوط به مشتری "${customerName}" به "${new_status}" تغییر یافت`;
            }

            await createLog(req.user.id, 'به‌روزرسانی گروهی سفارش‌ها', logMessage, phone);
        }

        await client.query('COMMIT');

        return res.status(200).json({
            message: `${updateResult.rowCount} سفارش با موفقیت بروزرسانی شد.`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('خطا در تغییر گروهی وضعیت سفارش‌ها:', err);
        return res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش‌ها.', error: err.message });
    } finally {
        client.release();
    }
};
