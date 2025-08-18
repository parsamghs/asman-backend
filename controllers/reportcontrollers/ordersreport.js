const pool = require('../../db');
const moment = require('moment-jalaali');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.downloadOrdersReport = async (req, res) => {
  try {
    const { status, date_type, from_date, to_date, format } = req.query;

    if (!['reception_date', 'order_date'].includes(date_type)) {
      return res.status(400).json({ message: 'date_type نامعتبر است.' });
    }

    const fromDateGregorian = moment(from_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
    const toDateGregorian = moment(to_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');

    let statusFilter = '';
    if (status) {
      if (status === 'لغو شده') {
        statusFilter = `AND o.status IN ('لغو توسط شرکت','عدم پرداخت حسابداری','حذف شده','تحویل نشد','انصراف مشتری','عدم دریافت')`;
      } else if (status === 'بحرانی') {
        statusFilter = `AND o.estimated_arrival_days <= 0 AND o.status IN ('در انتظار تائید شرکت','در انتظار تائید حسابداری','در انتظار دریافت','در انتظار نوبت دهی','دریافت شد','نوبت داده شد')`;
      } else {
        statusFilter = `AND o.status = '${status}'`;
      }
    }

    const query = `
      SELECT
        c.customer_id,
        c.customer_name,
        c.customer_phone,
        r.reception_id,
        r.reception_number,
        r.reception_date,
        r.car_status,
        r.chassis_number,
        r.settlement_status,
        o.order_id,
        o.order_number,
        o.final_order_number,
        o.order_date,
        o.estimated_arrival_date,
        o.delivery_date,
        o.piece_name,
        o.part_id,
        o.number_of_pieces,
        o.order_channel,
        o.market_name,
        o.market_phone,
        o.estimated_arrival_days,
        o.status,
        o.appointment_date,
        o.appointment_time,
        o.description,
        o.all_description
      FROM customers c
      JOIN receptions r ON c.customer_id = r.customer_id
      JOIN orders o ON r.reception_id = o.reception_id
      WHERE r.dealer_id = $1
      AND ${date_type} BETWEEN $2 AND $3
      ${statusFilter}
      ORDER BY ${date_type} DESC
    `;

    const result = await pool.query(query, [req.user.dealer_id, fromDateGregorian, toDateGregorian]);
    const data = result.rows;

    data.forEach(row => {
      row.reception_date = row.reception_date ? moment(row.reception_date).format('jYYYY/jMM/jDD') : '';
      row.order_date = row.order_date ? moment(row.order_date).format('jYYYY/jMM/jDD') : '';
      row.estimated_arrival_date = row.estimated_arrival_date ? moment(row.estimated_arrival_date).format('jYYYY/jMM/jDD') : '';
      row.delivery_date = row.delivery_date ? moment(row.delivery_date).format('jYYYY/jMM/jDD') : '';
      row.appointment_date = row.appointment_date ? moment(row.appointment_date).format('jYYYY/jMM/jDD') : '';
    });

    if (format === 'csv') {
      const fields = Object.keys(data[0] || {});
      const json2csv = new Parser({ fields });
      const csv = json2csv.parse(data);
      const csvWithBOM = '\uFEFF' + csv;

      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.attachment('orders_report.csv');
      return res.send(csvWithBOM);

    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('گزارش سفارشات');

      worksheet.columns = Object.keys(data[0] || {}).map(key => ({ header: key, key, width: 20 }));
      data.forEach((row) => worksheet.addRow(row));

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=orders_report.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();

    } else {
      return res.status(400).json({ message: 'فرمت خروجی نامعتبر است (csv یا excel).' });
    }
  } catch (err) {
    console.error('خطا در دریافت گزارش سفارشات:', err);
    res.status(500).json({ message: 'خطا در دریافت گزارش سفارشات.' });
  }
};
