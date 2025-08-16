const pool = require('../../db');

exports.getOrderscounts = async (req, res) => {
    try {
        const dealerId = req.user.dealer_id;

        const statuses = [
            'در انتظار تائید شرکت',
            'در انتظار تائید حسابداری',
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

        const statusCountsQuery = `
            SELECT orders.status, COUNT(*) AS count
            FROM orders
            JOIN receptions ON orders.reception_id = receptions.id
            JOIN customers ON receptions.customer_id = customers.id
            WHERE orders.status = ANY($1) AND customers.dealer_id = $2
            GROUP BY orders.status
        `;
        const statusCountsResult = await pool.query(statusCountsQuery, [statuses, dealerId]);

        const canceledCountQuery = `
            SELECT COUNT(*) AS canceled_count
            FROM orders
            JOIN receptions ON orders.reception_id = receptions.id
            JOIN customers ON receptions.customer_id = customers.id
            WHERE orders.status = ANY($1) AND customers.dealer_id = $2
        `;
        const canceledCountResult = await pool.query(canceledCountQuery, [canceledStatuses, dealerId]);

        const criticalCountQuery = `
            SELECT COUNT(*) AS critical_count
            FROM orders
            JOIN receptions ON orders.reception_id = receptions.id
            JOIN customers ON receptions.customer_id = customers.id
            WHERE orders.estimated_arrival_days <= 0
              AND orders.status = ANY($2)
              AND customers.dealer_id = $1
        `;
        const criticalCountResult = await pool.query(criticalCountQuery, [dealerId, criticalStatuses]);

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

        res.json({ stats });

    } catch (err) {
        console.error('getOrdersStats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
