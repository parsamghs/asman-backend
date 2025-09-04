const pool = require('../../db');
const moment = require('moment-jalaali');
const ExcelJS = require('exceljs');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.exportOrdersExcel = async (req, res) => {
    try {
        const { status, date_type, start_date, end_date } = req.query;
        const dealerId = req.user.dealer_id;

        const canceledStatuses = [
            'لغو توسط شرکت',
            'عدم پرداخت حسابداری',
            'عدم دریافت',
            'انصراف مشتری',
            'تحویل نشد',
            'حذف شده'
        ];

        const criticalStatuses = [
            'در انتظار تائید شرکت',
            'در انتظار تائید حسابداری',
            'در انتظار دریافت',
            'در انتظار نوبت دهی',
            'دریافت شد',
            'نوبت داده شد'
        ];

        const specialStatusMap = {
            "لغو شده ها": {
                condition: (paramIndex) => `AND orders.status = ANY($${paramIndex})`,
                values: () => canceledStatuses
            },
            "بحرانی ها": {
                condition: (paramIndex) => `AND orders.estimated_arrival_days <= 0 AND orders.status = ANY($${paramIndex})`,
                values: () => criticalStatuses
            },
            "در انتظار تائید حسابداری": {
                condition: (paramIndex) => `AND orders.status = ANY($${paramIndex})`,
                values: () => ["در انتظار تائید حسابداری", "پیش درخواست"]
            }
        };

        let filters = `WHERE customers.dealer_id = $1`;
        const values = [dealerId];
        let paramIndex = 2;

        if (status && status !== 'all' && specialStatusMap[status]) {
            const mapEntry = specialStatusMap[status];
            filters += ' ' + mapEntry.condition(paramIndex);
            const vals = mapEntry.values();
            if (vals) values.push(vals);
            paramIndex++;
        } else if (status && status !== 'all') {
            filters += ` AND orders.status = $${paramIndex++}`;
            values.push(status);
        }

        if (date_type && start_date && end_date) {
            const column = date_type === 'reception_date' ? 'receptions.reception_date' : 'orders.order_date';
            const start = moment(start_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
            const end = moment(end_date, 'jYYYY/jMM/jDD').endOf('day').format('YYYY-MM-DD');
            filters += ` AND ${column} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
            values.push(start, end);
        }

        const result = await pool.query(`
            SELECT 
                customers.customer_name,
                customers.phone_number,
                receptions.reception_number,
                receptions.reception_date,
                receptions.car_status,
                receptions.chassis_number,
                receptions.orderer,
                receptions.admissions_specialist,
                orders.order_number,
                orders.final_order_number,
                orders.piece_name,
                orders.part_id,
                orders.number_of_pieces,
                orders.car_name,
                orders.order_channel,
                orders.market_name,
                orders.market_phone,
                orders.order_date,
                orders.estimated_arrival_days,
                orders.estimated_arrival_date,
                orders.delivery_date,
                orders.appointment_date,
                orders.appointment_time,
                orders.cancellation_date,
                orders.cancellation_time,
                orders.status,
                orders.accounting_confirmation,
                orders.description,
                orders.all_description
            FROM customers
            LEFT JOIN receptions ON receptions.customer_id = customers.id
            LEFT JOIN orders ON orders.reception_id = receptions.id
            ${filters}
            ORDER BY customers.id, receptions.id, orders.id
        `, values);

        const safeValue = (value) => value ?? '—';
        const workbook = new ExcelJS.Workbook();

        // --- تعریف شیت‌ها ---
        const customerSheet = workbook.addWorksheet('اطلاعات مشتری');
        customerSheet.columns = [
            { header: 'نام مشتری', key: 'customer_name' },
            { header: 'شماره تلفن', key: 'phone_number' }
        ];

        const receptionSheet = workbook.addWorksheet('اطلاعات پذیرش');
        receptionSheet.columns = [
            { header: 'نام مشتری', key: 'customer_name' },
            { header: 'شماره پذیرش', key: 'reception_number' },
            { header: 'تاریخ پذیرش', key: 'reception_date' },
            { header: 'وضعیت خودرو', key: 'car_status' },
            { header: 'شماره شاسی', key: 'chassis_number', width:30 },
            { header: 'کارشناس پذیرش', key: 'admissions_specialist' },
            { header: 'سفارش‌ دهنده', key: 'orderer' }
        ];

        const orderSheet = workbook.addWorksheet('اطلاعات سفارشات');
        orderSheet.columns = [
            { header: 'نام مشتری', key: 'customer_name' },
            { header: 'شماره پذیرش', key: 'reception_number' },
            { header: 'شماره سفارش', key: 'order_number' },
            { header: 'شماره حواله', key: 'final_order_number' },
            { header: 'نام قطعه', key: 'piece_name' },
            { header: 'کد قطعه', key: 'part_id' },
            { header: 'تعداد', key: 'number_of_pieces' },
            { header: 'نام خودرو', key: 'car_name' },
            { header: 'کانال سفارش', key: 'order_channel' },
            { header: 'نام بازار', key: 'market_name' },
            { header: 'تلفن بازار', key: 'market_phone' },
            { header: 'تاریخ سفارش', key: 'order_date' },
            { header: 'روز تحویل', key: 'estimated_arrival_days' },
            { header: 'تاریخ تخمینی رسیدن', key: 'estimated_arrival_date' },
            { header: 'تاریخ تحویل', key: 'delivery_date' },
            { header: 'تاریخ نوبت‌دهی', key: 'appointment_date' },
            { header: 'ساعت نوبت‌دهی', key: 'appointment_time' },
            { header: 'تاریخ لغو', key: 'cancellation_date' },
            { header: 'ساعت لغو', key: 'cancellation_time' },
            { header: 'وضعیت', key: 'status' },
            { header: 'تأیید حسابداری', key: 'accounting_confirmation' },
            { header: 'توضیحات لغو', key: 'description' },
            { header: 'توضیحات کلی', key: 'all_description' }
        ];

        // --- پر کردن داده‌ها ---
        const customersSeen = new Set();
        const receptionsSeen = new Set();

        result.rows.forEach(row => {
            if (!customersSeen.has(row.phone_number)) {
                customersSeen.add(row.phone_number);
                customerSheet.addRow({
                    customer_name: safeValue(row.customer_name),
                    phone_number: safeValue(row.phone_number)
                });
            }

            if (row.reception_number && !receptionsSeen.has(row.reception_number)) {
                receptionsSeen.add(row.reception_number);
                receptionSheet.addRow({
                    reception_number: safeValue(row.reception_number),
                    reception_date: safeValue(row.reception_date ? moment(row.reception_date).format('jYYYY/jMM/jDD') : null),
                    car_status: safeValue(row.car_status),
                    chassis_number: safeValue(row.chassis_number),
                    orderer: safeValue(row.orderer),
                    admissions_specialist: safeValue(row.admissions_specialist),
                    customer_name: safeValue(row.customer_name)
                });
            }

            orderSheet.addRow({
                order_number: safeValue(row.order_number),
                final_order_number: safeValue(row.final_order_number),
                piece_name: safeValue(row.piece_name),
                part_id: safeValue(row.part_id),
                number_of_pieces: safeValue(row.number_of_pieces),
                car_name: safeValue(row.car_name),
                order_channel: safeValue(row.order_channel),
                market_name: safeValue(row.market_name),
                market_phone: safeValue(row.market_phone),
                order_date: safeValue(row.order_date ? moment(row.order_date).format('jYYYY/jMM/jDD HH:mm') : null),
                estimated_arrival_days: safeValue(row.estimated_arrival_days),
                estimated_arrival_date: safeValue(row.estimated_arrival_date ? moment(row.estimated_arrival_date).format('jYYYY/jMM/jDD') : null),
                delivery_date: safeValue(row.delivery_date ? moment(row.delivery_date).format('jYYYY/jMM/jDD HH:mm') : null),
                appointment_date: safeValue(row.appointment_date ? moment(row.appointment_date).format('jYYYY/jMM/jDD') : null),
                appointment_time: safeValue(row.appointment_time ? row.appointment_time.substring(0, 5) : null),
                cancellation_date: safeValue(row.cancellation_date ? moment(row.cancellation_date).format('jYYYY/jMM/jDD') : null),
                cancellation_time: safeValue(row.cancellation_time ? row.cancellation_time.substring(0, 5) : null),
                status: safeValue(row.status),
                accounting_confirmation: safeValue(row.accounting_confirmation),
                description: safeValue(row.description),
                all_description: safeValue(row.all_description),
                customer_name: safeValue(row.customer_name),
                reception_number: safeValue(row.reception_number)
            });
        });

        // --- استایل و ارتفاع/عرض خودکار ---
        [customerSheet, receptionSheet, orderSheet].forEach(sheet => {
            sheet.views = [{ state: 'frozen', ySplit: 1 }];
            const headerRow = sheet.getRow(1);
            headerRow.height = 25;
            headerRow.font = { name: 'IranSans', bold: true, size: 12 };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };

            headerRow.eachCell(cell => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // ارتفاع و عرض خودکار
            sheet.eachRow({ includeEmpty: false }, row => {
                let maxLines = 1;
                row.eachCell(cell => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.font = { name: 'IranSans', size: 11 };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                    if (cell.value) {
                        const lines = cell.value.toString().split(/\r\n|\r|\n/).length;
                        const approxLines = Math.ceil(cell.value.toString().length / 50);
                        maxLines = Math.max(maxLines, lines, approxLines);
                    }
                });
                row.height = maxLines * 20;
            });

            // محاسبه عرض ستون‌ها
            sheet.columns.forEach(column => {
                let maxLength = column.header.length;
                column.eachCell({ includeEmpty: false }, cell => {
                    if (cell.value) {
                        const cellLength = cell.value.toString().length;
                        if (cellLength > maxLength) maxLength = cellLength;
                    }
                });
                column.width = Math.min(maxLength + 5, 50);
            });
        });

        // --- رنگ‌بندی وضعیت و تیک حسابداری ---
        orderSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;
            const statusCell = row.getCell('status');
            let fillColor = 'FFD3D3D3';
            const cell = row.getCell('accounting_confirmation');
            if (cell.value === true || cell.value === 'TRUE') cell.value = '☑';
            else cell.value = '☐';

            if (canceledStatuses.includes(statusCell.value)) fillColor = 'FFFFC0C0';
            else if (statusCell.value === 'تحویل شد') fillColor = 'FFB0FFB0';

            row.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
            });
        });

        let fileName = `لیست سفارشات-نمایندگی-${req.user.dealer_name || 'NA'}-کد-${req.user.dealer_id || 'NA'}`;
        if (start_date && end_date) fileName += `-از-${start_date}-تا-${end_date}`;
        const encodedFileName = encodeURIComponent(fileName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('exportOrdersExcel error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
