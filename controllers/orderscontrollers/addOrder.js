const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');
const { CONSTANTS } = require('../../utils/constants');
const { insertPartIfNotExists } = require('../../helpers/partshelper');
const { insertCarIfNotExists } = require('../../helpers/carshelper');
const {
  validateJalaliDate,
  validateWithRegex
} = require('../../utils/validation');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.addOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer_name, phone_number, reception_number, reception_date, car_status, car_name, chassis_number, orderer, admissions_specialist, orders, order_type } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'لیست سفارش‌ها نمی‌تواند خالی باشد.' });
    }

    result = validateWithRegex('phone', phone_number);
    if (!result.isValid) return res.status(400).json({ message: result.message });

    if (!car_name || typeof car_name !== 'string' || car_name.trim().length > 30) {
      return res.status(400).json({
        message: `نام خودرو الزامی است و نباید بیشتر از ۳۰ کاراکتر باشد.`
      });
    }

    if (chassis_number && chassis_number.trim().length > 20) {
      return res.status(400).json({ message: `شماره شاسی نباید بیشتر از 20 کاراکتر باشد.` });
    }

    const receptionDateResult = validateJalaliDate(reception_date, 'پذیرش');
    if (!receptionDateResult.isValid) {
      return res.status(400).json({ message: receptionDateResult.message });
    }

    if (!CONSTANTS.car_status.includes(car_status)) {
      return res.status(400).json({
        message: `وضعیت خودرو نامعتبر است. باید یکی از این گزینه‌ها باشد: ${CONSTANTS.car_status.join('، ')}`
      });
    }

    for (const order of orders) {
      if (!Number.isInteger(order.number_of_pieces) || order.number_of_pieces <= 0) {
        return res.status(400).json({ message: `تعداد قطعات باید عدد صحیح مثبت باشد.` });
      }

      if (!CONSTANTS.order_channels.includes(order.order_channel)) {
        return res.status(400).json({
          message: `کانال سفارش نامعتبر است. باید یکی از این گزینه‌ها باشد: ${CONSTANTS.order_channels.join('، ')}`
        });
      }

      if (!Number.isInteger(order.estimated_arrival_days) || order.estimated_arrival_days < 0) {
        return res.status(400).json({ message: `estimated_arrival_days باید عدد صحیح غیرمنفی باشد.` });
      }

      if (!order.piece_name || typeof order.piece_name !== 'string' || order.piece_name.trim() === '') {
        return res.status(400).json({ message: `نام قطعه الزامی است.` });
      }

      if (order.order_channel !== 'VOR') {
        if (!order.order_number || typeof order.order_number !== 'string' || order.order_number.trim() === '') {
          return res.status(400).json({ message: `شماره سفارش الزامی است.` });
        }
      }

      if (!['real_order', 'pre_order'].includes(order_type)) {
        return res.status(400).json({ message: 'پارامتر order_type نامعتبر است. باید یکی از این موارد باشد: real_order، pre_order' });
      }

      if (order_type === 'pre_order') {
        order.status = 'پیش درخواست';
      } else {
        order.status = order.order_channel === 'بازار آزاد'
          ? 'در انتظار تائید حسابداری'
          : 'در انتظار تائید شرکت';
      }
    }

    await client.query('BEGIN');

    let customerId;
    let customerExists = false;

    const existingCustomerRes = await client.query(
      `SELECT id FROM customers WHERE phone_number = $1`,
      [phone_number]
    );

    if (!req.user || !req.user.dealer_id) {
      return res.status(403).json({ message: 'شناسه نمایندگی پیدا نشد.' });
    }

    if (existingCustomerRes.rows.length > 0) {
      customerId = existingCustomerRes.rows[0].id;
      customerExists = true;
    } else {
      const customerRes = await client.query(
        `INSERT INTO customers (customer_name, phone_number, dealer_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [customer_name, phone_number, req.user.dealer_id]
      );
      customerId = customerRes.rows[0].id;
    }

    let receptionId;
    const existingReceptionRes = await client.query(
      `SELECT id FROM receptions WHERE customer_id = $1 AND reception_number = $2`,
      [customerId, reception_number]
    );

    if (existingReceptionRes.rows.length > 0) {
      receptionId = existingReceptionRes.rows[0].id;
    } else {
      const activeOrdersRes = await client.query(
        `SELECT COUNT(*) AS active_count
         FROM orders
         WHERE customer_id = $1
           AND status NOT IN (
             'لغو توسط شرکت',
             'عدم دریافت',
             'عدم پرداخت حسابداری',
             'حذف شده',
             'انصراف مشتری',
             'تحویل شد',
             'تحویل نشد'
           )`,
        [customerId]
      );

      const activeCount = parseInt(activeOrdersRes.rows[0].active_count, 10);
      if (activeCount > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'شماره پذیرش جدید نمی‌تواند ثبت شود زیرا سفارش‌های قبلی این مشتری هنوز فعال یا باز هستند.'
        });
      }

      const receptionRes = await client.query(
        `INSERT INTO receptions (reception_date, reception_number, customer_id, car_status , chassis_number, orderer, admissions_specialist)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          receptionDateResult.date.format('YYYY-MM-DD'),
          reception_number,
          customerId,
          car_status,
          chassis_number?.trim() || null,
          orderer || null,
          admissions_specialist || null
        ]
      );
      receptionId = receptionRes.rows[0].id;
    }

    for (const order of orders) {
      const iranTime = moment().tz('Asia/Tehran').format('HH:mm:ss');
      const todayJalali = moment().tz('Asia/Tehran').format('jYYYY/jMM/jDD');
      const orderDateTime = moment(`${todayJalali} ${iranTime}`, 'jYYYY/jMM/jDD HH:mm:ss');
      const orderDateFormatted = orderDateTime.format('YYYY-MM-DD HH:mm:ss');
      order.accounting_confirmation = order.accounting_confirmation ?? true;


      const estimatedArrivalDate = orderDateTime.clone().add(order.estimated_arrival_days, 'days').format('YYYY-MM-DD');

      if (!['بازار آزاد', 'شارژ انبار'].includes(order.order_channel)) {
        if (!order.part_id || typeof order.part_id !== 'string' || order.part_id.trim() === '') {
          return res.status(400).json({
            message: `وارد کردن کد قطعه برای سفارش های vis  و vor الزامی است`
          });
        }
      }

      if (typeof order.accounting_confirmation !== 'boolean') {
        return res.status(400).json({ message: `مقدار accounting_confirmation باید بولین باشد.` });
      }

      await insertPartIfNotExists(client, req.user.category, order.part_id, order.piece_name);
      await insertCarIfNotExists(client, req.user.category, car_name);

      const insertOrder = await client.query(
        `INSERT INTO orders (
    customer_id, piece_name, part_id, number_of_pieces,
    order_channel, market_name, market_phone,
    order_date, estimated_arrival_days,
    estimated_arrival_date, all_description,
    reception_id, status, order_number,
    car_name, accounting_confirmation
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13,
    $14, $15, $16
  ) RETURNING id`,
        [
          customerId,
          order.piece_name,
          order.part_id,
          order.number_of_pieces,
          order.order_channel,
          order.market_name || null,
          order.market_phone || null,
          orderDateFormatted,
          order.estimated_arrival_days,
          estimatedArrivalDate,
          order.all_description || null,
          receptionId,
          order.status,
          order.order_number || null,
          car_name,
          order.accounting_confirmation
        ]
      );
    }

    await createLog(
      req.user.id,
      order_type === 'pre_order' ? 'ثبت پیش‌ درخواست' : 'ثبت سفارش جدید',
      `${order_type === 'pre_order' ? 'پیش درخواست جدیدی' : 'سفارش جدیدی'} با شماره پذیرش ${reception_number} ثبت شد`,
      phone_number
    );


    await client.query('COMMIT');
    res.status(201).json({
      message: 'سفارش‌ها با موفقیت ثبت شدند.',
      ...(customerExists && { note: 'این مشتری قبلاً در سیستم ثبت شده بود.' })
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in addOrder:', err);
    res.status(500).json({ message: 'خطای سرور' });
  } finally {
    client.release();
  }
};
