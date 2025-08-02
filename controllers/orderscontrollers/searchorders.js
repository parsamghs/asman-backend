const pool = require('../../db');

exports.searchOrders = async (req, res) => {
    try {
        const { status, filter, search } = req.query;
        const dealerId = req.user.dealer_id;

        const cancellationStatuses = [
            'لغو توسط شرکت',
            'عدم پرداخت حسابداری',
            'حذف شده',
            'تحویل نشد',
            'انصراف مشتری',
            'عدم دریافت'
        ];

        let statusCondition = '';
        let values = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            if (status === 'Cancellations') {
                statusCondition = `AND o.status = ANY($${paramIndex++})`;
                values.push(cancellationStatuses);
            } else if (status === 'criticals') {
                statusCondition = `AND o.estimated_arrival_days <= 0`;
            } else {
                statusCondition = `AND o.status = $${paramIndex++}`;
                values.push(status);
            }
        }

        const filtersMap = {
            customer_name: 'c.customer_name',
            phone_number: 'c.phone_number',
            piece_name: 'o.piece_name',
            part_id: 'o.part_id',
            order_number: 'o.order_number',
            reception_number: 'r.reception_number'
        };

        let filterCondition = '';
        if (filter && search && filtersMap[filter]) {
            filterCondition = `AND ${filtersMap[filter]} ILIKE $${paramIndex++}`;
            values.push(`%${search}%`);
        }

        const dealerIdParam = `$${paramIndex++}`;
        const dealerCondition = `AND c.dealer_id = ${dealerIdParam}`;
        values.push(dealerId);

        const query = `
      SELECT 
        o.*, 
        c.customer_name, c.phone_number, 
        r.reception_number, r.reception_date,
        r.car_status, r.chassis_number 
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN receptions r ON o.reception_id = r.id
      WHERE 1=1
      ${statusCondition}
      ${filterCondition}
      ${dealerCondition}
      ORDER BY o.id DESC
    `;

        const result = await pool.query(query, values);

        const rawOrders = result.rows;

        const groupedData = {};

        for (const row of rawOrders) {
            const customerId = row.customer_id;
            if (!groupedData[customerId]) {
                groupedData[customerId] = {
                    customer_id: row.customer_id,
                    customer_name: row.customer_name,
                    customer_phone: row.phone_number,
                    receptions: []
                };
            }

            const customer = groupedData[customerId];

            const receptionId = row.reception_id;
            let reception = customer.receptions.find(r => r.reception_id === receptionId);

            if (!reception) {
                reception = {
                    reception_id: row.reception_id,
                    reception_date: formatDateTime(row.reception_date),
                    reception_number: row.reception_number,
                    car_status: row.car_status || null,
                    chassis_number: row.chassis_number || null,
                    settlement_status: row.settlement_status || 'تسویه‌ نشده',
                    orders: []
                };
                customer.receptions.push(reception);
            }

            reception.orders.push({
                order_id: row.id,
                order_number: row.order_number,
                final_order_number: row.final_order_number,
                order_date: formatDateTime(row.order_date),
                estimated_arrival_date: formatDateTime(row.estimated_arrival_date),
                delivery_date: row.delivery_date ? formatDateTime(row.delivery_date) : null,
                piece_name: row.piece_name,
                part_id: row.part_id,
                number_of_pieces: row.number_of_pieces,
                order_channel: row.order_channel,
                market_name: row.market_name,
                market_phone: row.market_phone,
                estimated_arrival_days: row.estimated_arrival_days,
                status: row.status,
                appointment_date: row.appointment_date,
                appointment_time: row.appointment_time,
                description: row.description,
                all_description: row.all_description
            });
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return null;
            const d = new Date(dateStr);
            return d.toLocaleDateString('fa-IR-u-nu-latn') + ' ' +
                d.toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
        }

        res.json(Object.values(groupedData));

    } catch (err) {
        console.error('❌ searchOrders error:', err);
        res.status(500).json({ message: 'خطا در جستجوی سفارشات' });
    }
};
