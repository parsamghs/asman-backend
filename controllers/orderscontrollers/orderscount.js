const pool = require('../../db');
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.getOrderscounts = async (req, res) => {
    try {
        const dealerId = req.user.dealer_id;
        let { start_date, end_date } = req.query;

        if (start_date) start_date = moment(start_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
        if (end_date) end_date = moment(end_date, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');

        const specialStatuses = ["در انتظار تائید حسابداری", "پیش درخواست"];
        const statuses = [
            'در انتظار تائید شرکت',
            ...specialStatuses,
            'در انتظار دریافت',
            'دریافت شد',
            'در انتظار نوبت دهی',
            'نوبت داده شد',
            'تحویل شد'
        ];

        const canceledStatuses = [
            'لغو توسط شرکت',
            'عدم پرداخت حسابداری',
            'حذف شده',
            'تحویل نشد',
            'انصراف مشتری',
            'عدم دریافت'
        ];

        const criticalStatuses = [
            'در انتظار تائید شرکت',
            'در انتظار تائید حسابداری',
            'در انتظار دریافت',
            'در انتظار نوبت دهی',
            'دریافت شد',
            'نوبت داده شد'
        ];

        let dateCondition1 = '';
        const statusCountsParams = [statuses, dealerId];
        if (start_date) {
            statusCountsParams.push(start_date);
            dateCondition1 += ` AND orders.order_date >= $${statusCountsParams.length}`;
        }
        if (end_date) {
            statusCountsParams.push(end_date);
            dateCondition1 += ` AND orders.order_date <= $${statusCountsParams.length}`;
        }

        const statusCountsQuery = `
            SELECT orders.status, COUNT(*) AS count
            FROM orders
            JOIN receptions ON orders.reception_id = receptions.id
            JOIN customers ON receptions.customer_id = customers.id
            WHERE orders.status = ANY($1)
              AND customers.dealer_id = $2
              ${dateCondition1}
            GROUP BY orders.status
        `;
        const statusCountsResult = await pool.query(statusCountsQuery, statusCountsParams);

        let dateCondition2 = '';
        const canceledCountParams = [canceledStatuses, dealerId];
        if (start_date) {
            canceledCountParams.push(start_date);
            dateCondition2 += ` AND orders.order_date >= $${canceledCountParams.length}`;
        }
        if (end_date) {
            canceledCountParams.push(end_date);
            dateCondition2 += ` AND orders.order_date <= $${canceledCountParams.length}`;
        }

        const canceledCountQuery = `
            SELECT COUNT(*) AS canceled_count
            FROM orders
            JOIN receptions ON orders.reception_id = receptions.id
            JOIN customers ON receptions.customer_id = customers.id
            WHERE orders.status = ANY($1)
              AND customers.dealer_id = $2
              ${dateCondition2}
        `;
        const canceledCountResult = await pool.query(canceledCountQuery, canceledCountParams);

        let dateCondition3 = '';
        const criticalCountParams = [dealerId, criticalStatuses];
        if (start_date) {
            criticalCountParams.push(start_date);
            dateCondition3 += ` AND orders.order_date >= $${criticalCountParams.length}`;
        }
        if (end_date) {
            criticalCountParams.push(end_date);
            dateCondition3 += ` AND orders.order_date <= $${criticalCountParams.length}`;
        }

        const criticalCountQuery = `
            SELECT COUNT(*) AS critical_count
            FROM orders
            JOIN receptions ON orders.reception_id = receptions.id
            JOIN customers ON receptions.customer_id = customers.id
            WHERE orders.estimated_arrival_days <= 0
              AND orders.status = ANY($2)
              AND customers.dealer_id = $1
              ${dateCondition3}
        `;
        const criticalCountResult = await pool.query(criticalCountQuery, criticalCountParams);

        const stats = {
            'در انتظار تائید شرکت': 0,
            'در انتظار تائید حسابداری': 0,
            'در انتظار دریافت': 0,
            'دریافت شد': 0,
            'در انتظار نوبت دهی': 0,
            'نوبت داده شد': 0,
            'تحویل شد': 0,
            'بحرانی': parseInt(criticalCountResult.rows[0].critical_count),
            'لغو شده': parseInt(canceledCountResult.rows[0].canceled_count)
        };

        statusCountsResult.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });

        if (stats['پیش درخواست']) {
            stats['در انتظار تائید حسابداری'] += stats['پیش درخواست'];
            delete stats['پیش درخواست'];
        }

        res.json({ stats });

    } catch (err) {
        console.error('getOrdersStats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
