const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');
const { CONSTANTS } = require('../../utils/constants');
const { insertPartIfNotExists } = require('../../helpers/partshelper');
const { insertCarIfNotExists } = require('../../helpers/carshelper');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.addPiecesToExistingReception = async (req, res) => {
  try {
    const reception_id = parseInt(req.params.reception_id);
    if (!reception_id || isNaN(reception_id)) {
      return res.status(400).json({ message: 'شناسه پذیرش معتبر نیست.' });
    }

    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'لیست سفارش‌ها خالی یا معتبر نیست.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const receptionRes = await client.query(
        'SELECT customer_id, reception_number FROM receptions WHERE id = $1',
        [reception_id]
      );
      if (receptionRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'پذیرش با این شناسه یافت نشد.' });
      }

      const { customer_id, reception_number } = receptionRes.rows[0];

      const customerResult = await client.query(
        'SELECT customer_name, phone_number FROM customers WHERE id = $1',
        [customer_id]
      );

      const customerName = customerResult.rows[0]?.customer_name || 'نامشخص';
      const phoneNumber = customerResult.rows[0]?.phone_number || null;

      const carNameRes = await client.query(
        'SELECT car_name FROM orders WHERE reception_id = $1 LIMIT 1',
        [reception_id]
      );

      const existingCarName = carNameRes.rows[0]?.car_name;

      if (!existingCarName) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'نام خودرو برای پذیرش مورد نظر یافت نشد.' });
      }

      for (const [index, order] of orders.entries()) {
        if (order.order_channel !== 'VOR' && !order.order_number) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `شماره سفارش برای سفارش شماره ${index + 1} الزامی است.`
          });
        }

        if (
          !order.piece_name ||
          (order.order_channel !== 'بازار آزاد' && !order.part_id) ||
          !order.number_of_pieces ||
          !order.order_channel ||
          !CONSTANTS.order_channels.includes(order.order_channel)
        ) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `فیلدهای ضروری سفارش شماره ${index + 1} ناقص یا معتبر نیستند.`
          });
        }

        let status = order.order_channel === 'بازار آزاد'
          ? 'در انتظار تائید حسابداری'
          : 'در انتظار تائید شرکت';

        const iranTime = momentTZ().tz('Asia/Tehran').format('HH:mm:ss');
        const todayJalali = momentTZ().tz('Asia/Tehran').format('jYYYY/jMM/jDD');
        const orderDateTime = moment(`${todayJalali} ${iranTime}`, 'jYYYY/jMM/jDD HH:mm:ss');
        const orderDateFormatted = orderDateTime.format('jYYYY/jMM/jDD HH:mm:ss');
        order.accounting_confirmation = order.accounting_confirmation ?? true;

        let estimatedArrivalDate = null;
        if (order.estimated_arrival_days != null) {
          estimatedArrivalDate = moment(orderDateFormatted, 'jYYYY/jMM/jDD HH:mm:ss')
            .add(order.estimated_arrival_days, 'days')
            .format('jYYYY/jMM/jDD HH:mm:ss');
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

        await client.query(
          `INSERT INTO orders (
            customer_id, reception_id, order_number, piece_name, part_id, number_of_pieces, 
            order_channel, market_name, market_phone, order_date, delivery_date, 
            estimated_arrival_days, estimated_arrival_date, status, all_description,
            car_name , accounting_confirmation
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
  $7, $8, $9, $10, $11,
  $12, $13, $14, $15, $16, $17
          )`,
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
            null,
            order.estimated_arrival_days || null,
            estimatedArrivalDate,
            status,
            order.all_description || null,
            existingCarName,
            order.accounting_confirmation
          ]
        );
      }

      await createLog(
        req.user.id,
        'افزودن سفارش به پذیرش',
        `سفارش جدید به پذیرش شماره "${reception_number}" مشتری "${customerName}" اضافه شد.`,
        phoneNumber
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'قطعات جدید با موفقیت اضافه شدند.' });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('خطا در افزودن قطعات جدید:', error);
      return res.status(500).json({ message: 'خطا در افزودن قطعات جدید.', error: error.message });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('خطا در اتصال به پایگاه داده:', error);
    return res.status(500).json({ message: 'خطا در اتصال به پایگاه داده.', error: error.message });
  }
};
