const pool = require('../../db');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });
const createLog = require('../logcontrollers/createlog');

exports.updateOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderId = parseInt(req.params.orderId, 10);

    const orderInfoRes = await client.query(
      `SELECT o.id,
              o.reception_id,
              o.piece_name,
              r.customer_id,
              COALESCE(c.customer_name, 'نامشخص') AS customer_name
       FROM orders o
       LEFT JOIN receptions r ON o.reception_id = r.id
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderInfoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'سفارشی با این شناسه یافت نشد.' });
    }

    const { reception_id, customer_id, customer_name: customerName } = orderInfoRes.rows[0];

    const { status, delivery_date, description, all_description, appointment_date, appointment_time } = req.body;
    const userRole = req.user?.role;

    console.log(`شروع به‌روزرسانی سفارش با id=${orderId} توسط نقش ${userRole}`);

    let successMessages = [];
    let errorMessages = [];

    let newStatus = null;
    let newDeliveryDate = null;
    let newDescription = null;
    let newAllDescription = null;
    let newAppointmentDate = null;
    let newAppointmentTime = null;
    let newCancellationDate = null;
    let newCancellationTime = null;
    let newFinalOrderNumber = null;


    const canEditStatus = ['پذیرش', 'انباردار', 'حسابدار', 'مدیریت'].includes(userRole);
    const canEditDeliveryDate = userRole === 'انباردار';

    if (
      (status === 'دریافت شد' || status === 'در انتظار نوبت دهی') &&
      canEditStatus
    ) {
      newDeliveryDate = moment().tz('Asia/Tehran').format('YYYY/MM/DD hh:mm');
      successMessages.push('تاریخ تحویل به‌صورت خودکار ثبت شد.');
    }

    if (status !== undefined) {
      if (canEditStatus) {
        newStatus = status;
        successMessages.push('وضعیت قطعه با موفقیت تغییر کرد.');
      } else {
        errorMessages.push('شما اجازه تغییر وضعیت قطعه را ندارید.');
      }
      if (['لغو توسط شرکت', 'عدم پرداخت حسابداری'].includes(newStatus)) {
        const now = momentTZ().tz('Asia/Tehran');
        newCancellationDate = now.format('YYYY/MM/DD');
        newCancellationTime = now.format('hh:mm');

        newDescription = description?.trim() || 'بدون توضیحات';

        const lostDate = now.format('YYYY-MM-DD');
        const lostTime = now.format('HH:mm');

        const fullOrderInfoRes = await client.query(
          `SELECT part_id, piece_name, car_name, number_of_pieces
     FROM orders
     WHERE id = $1`,
          [orderId]
        );

        const orderData = fullOrderInfoRes.rows[0];

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
          orderData.part_id || null,
          orderData.piece_name || 'نامشخص',
          orderData.car_name || 'نامشخص',
          newDescription || 'بدون توضیحات',
          orderData.number_of_pieces?.toString() || '1',
          lostDate,
          lostTime,
          newStatus,
          req.user.dealer_id || null
        ]);
      }
    }

    if (status === 'در انتظار تائید حسابداری') {
      if (!req.body.final_order_number || req.body.final_order_number.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'وارد کردن شماره سفارش نهایی الزامی است.'
        });
      }
    }

    if (req.body.final_order_number) {
      newFinalOrderNumber = req.body.final_order_number.trim();
    }

    const canEditAllDescription = ['مدیریت', 'انباردار', 'پذیرش', 'حسابدار'].includes(userRole);

    if (all_description !== undefined) {
      if (canEditAllDescription) {
        newAllDescription = all_description;
        successMessages.push('توضیحات کلی با موفقیت به‌روزرسانی شد');
      } else {
        errorMessages.push('شما اجازه ویرایش توضیحات کلی را ندارید.');
      }
    }

    const mandatoryDescriptionStatuses = ['انصراف مشتری', 'عدم دریافت', 'تحویل نشد', 'لغو توسط شرکت', 'عدم تائید حسابداری'];

    if (newStatus && mandatoryDescriptionStatuses.includes(newStatus)) {
      if (!description || description.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `وارد کردن توضیحات برای وضعیت "${newStatus}" الزامی است.`
        });
      }
      newDescription = description.trim();
    }

    if (
      newStatus === null &&
      newDeliveryDate === null &&
      newDescription === null &&
      newAllDescription === null &&


      errorMessages.length > 0
    ) {
      await client.query('ROLLBACK');
      return res.status(403).json({ errors: errorMessages });
    }

    if (status === 'نوبت داده شد') {
      if (!appointment_date || !appointment_time || appointment_date.trim() === '' || appointment_time.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'وارد کردن تاریخ و ساعت نوبت برای وضعیت "نوبت داده شد" الزامی است.'
        });
      }

      const isValidJalaliDate = moment(appointment_date, 'jYYYY/jMM/jDD', true).isValid();
      const isValidTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(appointment_time.trim());

      if (!isValidJalaliDate || !isValidTime) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'فرمت تاریخ یا ساعت نوبت نامعتبر است. فرمت صحیح تاریخ: ۱۴۰۳/۰۴/۲۰، ساعت: 14:30'
        });
      }

      const miladiDate = moment(appointment_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');

      newAppointmentDate = miladiDate;
      newAppointmentTime = appointment_time.trim();
    }

    const updateQuery = `
  UPDATE orders
  SET
  status = COALESCE($1, status),
  delivery_date = COALESCE($2, delivery_date),
  description = CASE
    WHEN $3::text IS NOT NULL THEN CONCAT_WS(' / ', description::text, $3::text)
    ELSE description
  END,
  all_description = CASE
    WHEN $4::text IS NOT NULL THEN CONCAT_WS(' / ', all_description::text, $4::text)
    ELSE all_description
  END,
  appointment_date = COALESCE($5, appointment_date),
  appointment_time = COALESCE($6, appointment_time),
  cancellation_date = COALESCE($7, cancellation_date),
  cancellation_time = COALESCE($8, cancellation_time),
  final_order_number = COALESCE($9, final_order_number)
WHERE id = $10;`;

    const updateResult = await client.query(updateQuery, [
      newStatus,
      newDeliveryDate,
      newDescription,
      newAllDescription,
      newAppointmentDate,
      newAppointmentTime,
      newCancellationDate,
      newCancellationTime,
      newFinalOrderNumber,
      orderId
    ]);

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: `سفارشی با شناسه ${orderId} یافت نشد یا تغییر نکرد.`
      });
    }

    let logMessage = `سفارش مشتری "${customerName}" ویرایش شد`;

    if (newStatus) {
      switch (newStatus) {
        case 'در انتظار تائید حسابداری':
          logMessage = `سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}" توسط شرکت تأیید شد`;
          break;
        case 'لغو توسط شرکت':
          logMessage = `سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}" به دلیل "${newDescription || 'نداشتن توضیحات'}" توسط شرکت لغو شد`;
          break;
        case 'در انتظار دریافت':
          logMessage = `سفارش "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مشتری "${customerName}" توسط حسابداری پرداخت گردید`;
          break;
        case 'عدم پرداخت حسابداری':
          logMessage = `سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}" به دلیل "${newDescription || 'نداشتن توضیحات'}" توسط حسابدار پرداخت نشد`;
          break;
        case 'در انتظار نوبت دهی':
          logMessage = `سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}"توسط انباردار دریافت شد و در انتظار نوبت دهی است`;
          break;
        case 'دریافت شد':
          logMessage = `سفارش "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مشتری "${customerName}" توسط انباردار دریافت شد`;
          break;
        case 'عدم دریافت':
          logMessage = `سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}" به دلیل "${newDescription || 'نداشتن توضیحات'}" دریافت نگردید`;
          break;
        case 'نوبت داده شد':
          logMessage = `برای سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}"، نوبت‌ گذاری انجام شد`;
          break;
        case 'انصراف مشتری':
          logMessage = `مشتری "${customerName}" از ادامه‌ی سفارش "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" به دلیل "${newDescription || 'نداشتن توضیحات'}" انصراف داد`;
          break;
        case 'تحویل شد':
          logMessage = `سفارش قطعه‌ی "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مربوط به مشتری "${customerName}" تحویل داده شد`;
          break;
        case 'تحویل نشد':
          logMessage = `سفارش "${orderInfoRes.rows[0].piece_name || 'نامشخص'}" مشتری "${customerName}" به دلیل "${newDescription || 'بدون توضیحات'}" تحویل نشد`;
          break;
        default:
          logMessage = `سفارش مشتری "${customerName}" ویرایش شد`;
      }
    }

    await createLog(req.user.id, 'به‌روزرسانی سفارش', logMessage);

    await client.query('COMMIT');

    const responseMessage = {
      message: 'عملیات به‌روزرسانی با موفقیت انجام شد.',
      details: successMessages
    };

    if (errorMessages.length > 0) {
      responseMessage.warnings = errorMessages;
    }

    res.status(200).json(responseMessage);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('خطای سرور در updateOrder:', err);
    res.status(500).json({ message: 'خطای سرور', error: err.message });
  } finally {
    client.release();
  }
};
