const pool = require('../../db');
const moment = require('moment-jalaali');
const ExcelJS = require('exceljs');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.exportLogsExcel = async (req, res) => {
    const userRole = req.user?.role;
    const dealerId = req.user?.dealer_id;

    if (userRole !== 'مدیریت') {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    try {
        const { startDate, endDate, user_name } = req.query;

        const startDateMiladi = startDate ? moment(startDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD') : null;
        const endDateMiladi = endDate ? moment(endDate, 'jYYYY/jMM/jDD').endOf('day').format('YYYY-MM-DD') : null;

        const params = [];
        let whereClauses = [];

        if (dealerId) {
            params.push(dealerId);
            whereClauses.push(`dealer_id = $${params.length}`);
        }

        if (startDateMiladi) {
            params.push(startDateMiladi);
            whereClauses.push(`log_time >= $${params.length}`);
        }

        if (endDateMiladi) {
            params.push(endDateMiladi);
            whereClauses.push(`log_time <= $${params.length}`);
        }

        if (user_name) {
            params.push(`%${user_name}%`);
            whereClauses.push(`user_name ILIKE $${params.length}`);
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const result = await pool.query(`
      SELECT user_name, action, message, log_time, phone_number
      FROM logs
      ${whereSQL}
      ORDER BY log_time DESC
    `, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('سوابق فعالیت');

        sheet.columns = [
            { header: 'نام کاربر', key: 'user_name', width: 25 },
            { header: 'عملیات', key: 'action', width: 25 },
            { header: 'پیام', key: 'message', width: 20 },
            { header: 'تاریخ', key: 'date', width: 15 },
            { header: 'ساعت', key: 'time', width: 10 },
            { header: "شماره تلفن", key: 'phone_number', width: 20}
        ];

        result.rows.forEach(row => {
            const localMoment = moment(row.log_time).tz('Asia/Tehran');
            sheet.addRow({
                user_name: row.user_name,
                action: row.action,
                message: row.message,
                date: localMoment.format('jYYYY/jMM/jDD'),
                time: localMoment.format('HH:mm'),
                phone_number: row.phone_number
            });
        });

        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        const headerRow = sheet.getRow(1);
        headerRow.height = 20;
        headerRow.font = { name: 'IranSans', size: 12, bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.eachCell(cell => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; 
            let maxLines = 1;

            row.eachCell(cell => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'IranSans', size: 11 };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                if (cell.value) {
                    const lines = cell.value.toString().split('\n').length;
                    const approxLines = Math.ceil(cell.value.toString().length / 50);
                    maxLines = Math.max(maxLines, lines, approxLines);
                }
            });

            row.height = maxLines * 20; 
        });

        const messageColumn = sheet.getColumn('message');
        let maxLength = 20;
        messageColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber === 1) return;
            const cellValue = cell.value ? cell.value.toString() : '';
            if (cellValue.length > maxLength) maxLength = cellValue.length;
        });
        messageColumn.width = Math.min(maxLength + 5, 100);

        let fileName = `سوابق فعالیت`;
        if (user_name) {
            fileName += ` "${user_name}"`;}
        if (startDate && endDate) {
            fileName += ` از ${startDate} تا ${endDate}`;}
        const encodedFileName = encodeURIComponent(fileName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('exportLogsExcel error:', err);
        res.status(500).json({ error: 'خطای سرور در خروجی اکسل لاگ‌ها' });
    }
};
