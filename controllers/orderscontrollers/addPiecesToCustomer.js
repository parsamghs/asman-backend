const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');
const { CONSTANTS } = require('../../utils/constants');
const { insertPartIfNotExists } = require('../../helpers/partshelper');
const { insertCarIfNotExists } = require('../../helpers/carshelper');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.addPiecesToCustomer = async (req, res) => {
  try {
    const customer_id = parseInt(req.params.customer_id);

    if (!customer_id || isNaN(customer_id)) {
      return res.status(400).json({ message: 'شناسه مشتری معتبر نیست.' });
    }

    const { reception_number, reception_date, car_status, car_name, chassis_number, orderer, admissions_specialist, orders } = req.body;

    if (!reception_number || typeof reception_number !== 'string') {
      return res.status(400).json({ message: 'شماره پذیرش وارد نشده یا معتبر نیست.' });
    }

    if (!reception_date || typeof reception_date !== 'string') {
      return res.status(400).json({ message: 'تاریخ پذیرش وارد نشده یا معتبر نیست.' });
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'لیست سفارش‌ها خالی یا معتبر نیست.' });
    }

    if (!car_status || !CONSTANTS.car_status.includes(car_status)) {
      return res.status(400).json({
        message: `وضعیت خودرو نامعتبر است. باید یکی از این گزینه‌ها باشد: ${CONSTANTS.car_status.join('، ')}`
      });
    }

    if (!car_name || typeof car_name !== 'string' || car_name.trim().length > 30) {
      return res.status(400).json({
        message: 'نام خودرو الزامی است و نباید بیشتر از ۳۰ کاراکتر باشد.'
      });
    }

    if (chassis_number != null) {
      if (typeof chassis_number !== 'string') {
        return res.status(400).json({ message: 'شماره شاسی باید رشته باشد.' });
      }
      if (chassis_number.trim().length > 20) {
        return res.status(400).json({ message: 'شماره شاسی نباید بیشتر از ۲۰ کاراکتر باشد.' });
      }
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let formattedReceptionDate;
      try {
        formattedReceptionDate = moment(reception_date, 'jYYYY/jMM/jDD', true);
        if (!formattedReceptionDate.isValid()) {
          throw new Error();
        }
        formattedReceptionDate = formattedReceptionDate.format('YYYY-MM-DD');
      } catch {
        return res.status(400).json({ message: 'فرمت تاریخ پذیرش صحیح نیست.' });
      }

      const receptionResult = await client.query(
        `INSERT INTO receptions (customer_id, reception_number, reception_date, car_status, chassis_number, orderer, admissions_specialist) 
         VALUES ($1, $2, $3, $4 , $5, $6, $7) RETURNING id`,
        [customer_id, reception_number, formattedReceptionDate, car_status, chassis_number?.trim() || null, orderer || null,
        admissions_specialist || null]
      );

      const reception_id = receptionResult.rows[0].id;

      const customerResult = await client.query(
        'SELECT customer_name, phone_number FROM customers WHERE id = $1',
        [customer_id]
      );

      const customerName = customerResult.rows[0]?.customer_name || 'نامشخص';
      const phoneNumber = customerResult.rows[0]?.phone_number || null;

      for (const [index, order] of orders.entries()) {
        try {
          if (order.order_channel !== 'VOR' && !order.order_number) {
            return res.status(400).json({ message: `شماره سفارش برای سفارش شماره ${index + 1} الزامی است.` });
          }
          if (
            (order.order_channel !== 'VOR' && (!order.order_number || order.order_number.trim() === '')) ||
            !order.piece_name ||
            !order.part_id ||
            !order.number_of_pieces ||
            !order.order_channel
          ) {
            return res.status(400).json({ message: `فیلدهای ضروری سفارش شماره ${index + 1} ناقص یا اشتباه است.` });
          }

          let status = order.order_channel === 'بازار آزاد'
            ? 'در انتظار تائید حسابداری'
            : 'در انتظار تائید شرکت';


          const iranTime = moment().tz('Asia/Tehran').format('HH:mm:ss');
          const todayJalali = moment().tz('Asia/Tehran').format('jYYYY/jMM/jDD');
          const orderDateTime = moment(`${todayJalali} ${iranTime}`, 'jYYYY/jMM/jDD HH:mm:ss');
          const orderDateFormatted = orderDateTime.format('YYYY-MM-DD HH:mm:ss');
          order.accounting_confirmation = order.accounting_confirmation ?? true;

          let estimatedArrivalDate = null;
          if (order.estimated_arrival_days != null) {
            estimatedArrivalDate = moment(orderDateFormatted)
              .add(order.estimated_arrival_days, 'days')
              .format('YYYY-MM-DD HH:mm:ss');
          }

          if (!CONSTANTS.order_channels.includes(order.order_channel)) {
            return res.status(400).json({
              message: `کانال سفارش نامعتبر است. باید یکی از این گزینه‌ها باشد: ${CONSTANTS.order_channels.join('، ')}`
            });
          }

          if (order.order_channel !== 'بازار آزاد') {
            if (!order.part_id || typeof order.part_id !== 'string' || order.part_id.trim() === '') {
              return res.status(400).json({ message: `کد قطعه (part_id) برای سفارش‌های غیر بازار آزاد الزامی است.` });
            }
          }

          if (typeof order.accounting_confirmation !== 'boolean') {
            return res.status(400).json({ message: `مقدار accounting_confirmation باید بولین باشد.` });
          }

          await insertPartIfNotExists(client, req.user.category, order.part_id, order.piece_name);
          await insertCarIfNotExists(client, req.user.category, car_name);

          const insertResult = await client.query(
            `INSERT INTO orders (
    customer_id, reception_id, order_number, piece_name, part_id, number_of_pieces, 
    order_channel, market_name, market_phone, order_date,
    estimated_arrival_days, estimated_arrival_date, status, all_description,
    car_name, accounting_confirmation
  )
  VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13, $14,
    $15, $16
  ) RETURNING id`,
            [
              customer_id,
              reception_id,
              order.order_number,
              order.piece_name,
              order.part_id,
              order.number_of_pieces,
              order.order_channel,
              order.market_name || null,
              order.market_phone || null,
              orderDateFormatted,
              order.estimated_arrival_days || null,
              estimatedArrivalDate,
              status,
              order.all_description || null,
              car_name,
              order.accounting_confirmation
            ]
          );


          const orderId = insertResult.rows[0].id;

        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ خطا در ثبت سفارش شماره ${index + 1}:`, err);
          return res.status(500).json({
            message: `خطا در ثبت سفارش شماره ${index + 1} در دیتابیس.`,
            error: err.message
          });
        }
      }

      await createLog(
        req.user.id,
        'ثبت پذیرش جدید',
        `پذیرش جدید برای مشتری "${customerName}"به شماره ${reception_number} ثبت شد`,
        phoneNumber
      );

      await client.query('COMMIT');
      res.status(200).json({ message: 'سفارش‌ها با موفقیت ثبت شدند.' });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ خطای کلی در فرآیند ثبت سفارش‌ها:', err);
      res.status(500).json({ message: 'خطای کلی در ثبت سفارش‌ها.', error: err.message });

    } finally {
      client.release();
    }

  } catch (err) {
    console.error('❌ خطای اتصال به پایگاه داده:', err);
    res.status(500).json({ message: 'خطا در اتصال به پایگاه داده.', error: err.message });
  }
};
