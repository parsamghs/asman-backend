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

    const dateColumn = date_type === 'order_date' ? 'o.order_date' : 'r.reception_date';

    const fromDateGregorian = moment(from_date, 'jYYYY/jMM/jDD')
      .startOf('day')
      .format('YYYY-MM-DD');
    const toDateGregorianExclusive = moment(to_date, 'jYYYY/jMM/jDD')
      .add(1, 'day')
      .startOf('day')
      .format('YYYY-MM-DD');

    // فیلتر وضعیت
    let statusFilter = '';
    if (status && status !== 'all') {
      if (status === 'لغو شده') {
        statusFilter = `
          AND o.status IN (
            'لغو توسط شرکت','عدم پرداخت حسابداری','حذف شده','تحویل نشد','انصراف مشتری','عدم دریافت'
          )
        `;
      } else if (status === 'بحرانی') {
        statusFilter = `
          AND o.estimated_arrival_days <= 0
          AND o.status IN ('در انتظار تائید شرکت','در انتظار تائید حسابداری','در انتظار دریافت','در انتظار نوبت دهی','دریافت شد','نوبت داده شد')
        `;
      } else {
        statusFilter = `AND o.status = $4`;
      }
    }

    const baseQuery = `
      SELECT
        c.id AS customer_id,
        c.customer_name,
        c.phone_number AS customer_phone,
        r.id AS reception_id,
        r.reception_number,
        r.reception_date,
        r.car_status,
        r.chassis_number,
        o.id AS order_id,
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
        o.description,
        o.all_description,
        o.appointment_date,
        o.appointment_time,
        o.accounting_confirmation,
        o.car_name
      FROM customers c
      JOIN receptions r ON c.id = r.customer_id
      JOIN orders o ON r.id = o.reception_id
      WHERE c.dealer_id = $1
        AND ${dateColumn} >= $2
        AND ${dateColumn} <  $3
      ${statusFilter}
      ORDER BY ${dateColumn} DESC
    `;

    const params = [req.user.dealer_id, fromDateGregorian, toDateGregorianExclusive];
    if (status && status !== 'all' && status !== 'لغو شده' && status !== 'بحرانی') {
      params.push(status);
    }

    const result = await pool.query(baseQuery, params);
    const data = result.rows;

    // تاریخ‌ها رو به شمسی برگردون
    data.forEach(row => {
      row.reception_date = row.reception_date ? moment(row.reception_date).format('jYYYY/jMM/jDD') : '';
      row.order_date = row.order_date ? moment(row.order_date).format('jYYYY/jMM/jDD') : '';
      row.estimated_arrival_date = row.estimated_arrival_date ? moment(row.estimated_arrival_date).format('jYYYY/jMM/jDD') : '';
      row.delivery_date = row.delivery_date ? moment(row.delivery_date).format('jYYYY/jMM/jDD') : '';
      row.appointment_date = row.appointment_date ? moment(row.appointment_date).format('jYYYY/jMM/jDD') : '';
    });

    // خروجی CSV
    if (format === 'csv') {
      const fields = [
        'customer_id', 'customer_name', 'customer_phone',
        'reception_id', 'reception_number', 'reception_date', 'car_status', 'chassis_number',
        'order_id', 'order_number', 'final_order_number', 'order_date', 'estimated_arrival_date', 'delivery_date',
        'piece_name', 'part_id', 'number_of_pieces', 'order_channel', 'market_name', 'market_phone',
        'estimated_arrival_days', 'status', 'description', 'all_description',
        'appointment_date', 'appointment_time', 'accounting_confirmation', 'car_name'
      ];
      const json2csv = new Parser({ fields });
      const csv = json2csv.parse(data);
      const csvWithBOM = '\uFEFF' + csv;

      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.attachment('orders_report.csv');
      return res.send(csvWithBOM); // ✅ return مهمه
    }

    // خروجی Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('گزارش سفارشات');

      worksheet.columns = [
        { header: 'کد مشتری', key: 'customer_id', width: 15 },
        { header: 'نام مشتری', key: 'customer_name', width: 25 },
        { header: 'تلفن مشتری', key: 'customer_phone', width: 20 },
        { header: 'کد پذیرش', key: 'reception_id', width: 15 },
        { header: 'شماره پذیرش', key: 'reception_number', width: 20 },
        { header: 'تاریخ پذیرش', key: 'reception_date', width: 15 },
        { header: 'وضعیت خودرو', key: 'car_status', width: 15 },
        { header: 'شماره شاسی', key: 'chassis_number', width: 20 },
        { header: 'کد سفارش', key: 'order_id', width: 15 },
        { header: 'شماره سفارش', key: 'order_number', width: 20 },
        { header: 'شماره نهایی سفارش', key: 'final_order_number', width: 25 },
        { header: 'تاریخ سفارش', key: 'order_date', width: 15 },
        { header: 'تاریخ رسیدن', key: 'estimated_arrival_date', width: 15 },
        { header: 'تاریخ تحویل', key: 'delivery_date', width: 15 },
        { header: 'نام قطعه', key: 'piece_name', width: 25 },
        { header: 'کد قطعه', key: 'part_id', width: 20 },
        { header: 'تعداد', key: 'number_of_pieces', width: 10 },
        { header: 'کانال سفارش', key: 'order_channel', width: 20 },
        { header: 'نام بازار', key: 'market_name', width: 20 },
        { header: 'تلفن بازار', key: 'market_phone', width: 20 },
        { header: 'روزهای تاخیر', key: 'estimated_arrival_days', width: 15 },
        { header: 'وضعیت', key: 'status', width: 20 },
        { header: 'توضیحات', key: 'description', width: 40 },
        { header: 'توضیحات کامل', key: 'all_description', width: 40 },
        { header: 'تاریخ نوبت', key: 'appointment_date', width: 15 },
        { header: 'ساعت نوبت', key: 'appointment_time', width: 15 },
        { header: 'تایید حسابداری', key: 'accounting_confirmation', width: 20 },
        { header: 'نام خودرو', key: 'car_name', width: 20 }
      ];

      data.forEach(row => {
        Object.keys(row).forEach(key => {
          if (typeof row[key] === 'string') {
            row[key] = row[key].normalize('NFC');
          }
        });
        worksheet.addRow(row);
      });


      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=orders_report.xlsx'
      );

      await workbook.xlsx.write(res);
      return res.end(); // ✅ return بزنی اینجا
    }

    // اگر فرمت اشتباه بود
    return res.status(400).json({ message: 'فرمت خروجی نامعتبر است (csv یا excel).' });

  } catch (err) {
    console.error('خطا در دریافت گزارش سفارشات:', err);
    return res.status(500).json({ message: 'خطا در دریافت گزارش سفارشات.' });
  }
};
