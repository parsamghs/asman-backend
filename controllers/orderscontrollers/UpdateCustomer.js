const pool = require('../../db');
const createLog = require('../logcontrollers/createlog');
const { CONSTANTS } = require('../../utils/constants');
const { validateJalaliDate, validateWithRegex } = require('../../utils/validation');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.updateOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const { reception_id, order_id, customer, reception, order } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: 'customerId در URL الزامی است.' });
    }

    if (reception && !reception_id) {
      return res.status(400).json({ message: 'برای ویرایش پذیرش، reception_id الزامی است.' });
    }

    if (order && (!reception_id || !order_id)) {
      return res.status(400).json({ message: 'برای ویرایش سفارش، reception_id و order_id الزامی هستند.' });
    }

    await client.query('BEGIN');

    if (customer) {
      if (customer.phone_number) {
        const result = validateWithRegex('phone', customer.phone_number);
        if (!result.isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: result.message });
        }
      }

      const customerFields = [];
      const customerValues = [];
      let idx = 1;

      for (const [key, value] of Object.entries(customer)) {
        customerFields.push(`${key} = $${idx++}`);
        customerValues.push(value);
      }

      if (customerFields.length > 0) {
        customerValues.push(customerId);
        await client.query(
          `UPDATE customers SET ${customerFields.join(', ')} WHERE id = $${idx}`,
          customerValues
        );
      }
    }

    if (reception) {
      if (reception.reception_date) {
        const receptionDateResult = validateJalaliDate(reception.reception_date, 'پذیرش');
        if (!receptionDateResult.isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: receptionDateResult.message });
        }
        reception.reception_date = receptionDateResult.date.format('YYYY-MM-DD');
      }

      if (reception.car_status && !CONSTANTS.car_status.includes(reception.car_status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `وضعیت خودرو نامعتبر است. باید یکی از این گزینه‌ها باشد: ${CONSTANTS.car_status.join('، ')}`
        });
      }

      const receptionFields = [];
      const receptionValues = [];
      let idx = 1;

      for (const [key, value] of Object.entries(reception)) {
        receptionFields.push(`${key} = $${idx++}`);
        receptionValues.push(value);
      }

      if (receptionFields.length > 0) {
        receptionValues.push(reception_id, customerId);
        await client.query(
          `UPDATE receptions SET ${receptionFields.join(', ')} WHERE id = $${idx++} AND customer_id = $${idx}`,
          receptionValues
        );
      }
    }

    if (order) {
      if (order.number_of_pieces !== undefined) {
        if (!Number.isInteger(order.number_of_pieces) || order.number_of_pieces <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'تعداد قطعات باید عدد صحیح مثبت باشد.' });
        }
      }

      if (order.order_channel && !CONSTANTS.order_channels.includes(order.order_channel)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `کانال سفارش نامعتبر است. باید یکی از این گزینه‌ها باشد: ${CONSTANTS.order_channels.join('، ')}`
        });
      }

      if (order.estimated_arrival_days !== undefined) {
        if (!Number.isInteger(order.estimated_arrival_days) || order.estimated_arrival_days < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'estimated_arrival_days باید عدد صحیح غیرمنفی باشد.' });
        }
      }

      if (order.order_date) {
        const orderDateResult = validateJalaliDate(order.order_date, 'تاریخ سفارش');
        if (!orderDateResult.isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: orderDateResult.message });
        }
        order.order_date = orderDateResult.date.format('YYYY-MM-DD');
      }

      if (order.estimated_arrival_date) {
        const arrivalDateResult = validateJalaliDate(order.estimated_arrival_date, 'تاریخ پیش‌بینی تحویل');
        if (!arrivalDateResult.isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: arrivalDateResult.message });
        }
        order.estimated_arrival_date = arrivalDateResult.date.format('YYYY-MM-DD');
      }

      if (order.appointment_date) {
        const appointmentDateResult = validateJalaliDate(order.appointment_date, 'تاریخ نوبت');
        if (!appointmentDateResult.isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: appointmentDateResult.message });
        }
        order.appointment_date = appointmentDateResult.date.format('YYYY-MM-DD');
      }

      const orderFields = [];
      const orderValues = [];
      let idx = 1;

      for (const [key, value] of Object.entries(order)) {
        orderFields.push(`${key} = $${idx++}`);
        orderValues.push(value);
      }

      if (orderFields.length > 0) {
        orderValues.push(order_id, reception_id, customerId);
        await client.query(
          `UPDATE orders SET ${orderFields.join(', ')} WHERE id = $${idx++} AND reception_id = $${idx++} AND customer_id = $${idx}`,
          orderValues
        );
      }
    }

    await client.query('COMMIT');

    let updatedCustomerName = 'نامشخص';
    let customerPhone = 'نامشخص';

    const customerResult = await pool.query(
      'SELECT customer_name, phone_number FROM customers WHERE id = $1',
      [customerId]
    );

    if (customerResult.rows.length > 0) {
      updatedCustomerName = customerResult.rows[0].customer_name || 'نامشخص';
      customerPhone = customerResult.rows[0].phone_number || 'نامشخص';
    }

    await createLog(
      req.user.id,
      'ویرایش اطلاعات مشتری',
      `اطلاعات مشتری "${updatedCustomerName}" ویرایش شد`,
      customerPhone
    );

    res.json({ message: 'ویرایش با موفقیت انجام شد.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in updateOrder:', err);
    res.status(500).json({ message: 'خطای سرور' });
  } finally {
    client.release();
  }
};
