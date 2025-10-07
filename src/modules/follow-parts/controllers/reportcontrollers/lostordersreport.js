const pool = require('../../../../core/config/db');
const moment = require('moment-jalaali');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.downloadLostOrdersReport = async (req, res) => {
  try {
    const { from_date, to_date, format } = req.query;

    const fromDateGregorian = moment(from_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
    const toDateGregorian = moment(to_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');

    const result = await pool.query(
      `
      SELECT 
        part_id,
        piece_name,
        car_name,
        lost_description,
        count,
        lost_date,
        lost_time,
        status
      FROM lost_orders
      WHERE lost_date BETWEEN $1 AND $2 AND dealer_id = $3
      ORDER BY lost_date DESC
      `,
      [fromDateGregorian, toDateGregorian, req.user.dealer_id]
    );

    const data = result.rows.map(row => ({
      ...row,
      lost_date: moment(row.lost_date).format('jYYYY/jMM/jDD'),
      lost_time: moment(row.lost_time, 'HH:mm:ss').format('HH:mm')
    }));

    if (format === 'csv') {
      const fields = [
        'part_id',
        'piece_name',
        'car_name',
        'lost_description',
        'count',
        'lost_date',
        'lost_time',
        'status',
      ];
      const json2csv = new Parser({ fields });
      const csv = json2csv.parse(data);
      const csvWithBOM = '\uFEFF' + csv;

      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.attachment(`گزارش_قطعات_از_دست_رفته_${from_date}_تا_${to_date}.csv`);
      return res.send(csvWithBOM);

    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('گزارش قطعات از دست رفته');

      worksheet.columns = [
        { header: 'نام قطعه', key: 'piece_name', width: 25 },
        { header: 'کد قطعه', key: 'part_id', width: 20 },
        { header: 'تعداد', key: 'count', width: 10 },
        { header: 'کاربرد', key: 'car_name', width: 20 },
        { header: 'تاریخ', key: 'lost_date', width: 15 },
        { header: 'ساعت', key: 'lost_time', width: 15 },
        { header: 'وضعیت', key: 'status', width: 15 },
        { header: 'توضیحات', key: 'lost_description', width: 20 },
      ];

      data.forEach(row => worksheet.addRow(row));

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      const headerRow = worksheet.getRow(1);
      headerRow.height = 20;
      headerRow.font = { name: 'IranSans', size: 12, bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        row.height = 20;
        row.eachCell(cell => {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.font = { name: 'IranSans', size: 11 };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      const descColumn = worksheet.getColumn('lost_description');
      let maxLength = 20;
      descColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber === 1) return;
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      descColumn.width = Math.min(maxLength + 5, 50);

      const fileName = `گزارش قطعات از دست رفته از ${from_date} تا ${to_date}`;
      const encodedFileName = encodeURIComponent(fileName);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

    } else {
      return res.status(400).json({ message: 'فرمت خروجی نامعتبر است (csv یا excel).' });
    }

  } catch (err) {
    console.error('خطا در دریافت گزارش:', err);
    res.status(500).json({ message: 'خطا در دریافت گزارش.' });
  }
};
