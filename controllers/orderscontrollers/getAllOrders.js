const pool = require('../../db');
const moment = require('moment-jalaali');
const momentTZ = require('moment-timezone');
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 200;
    const offset = (page - 1) * limit;
    const status = req.query.status === 'all' ? null : req.query.status || null;
    const isCanceled = status === 'لغو شده ها';
    const isCritical = status === 'بحرانی ها';

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

    const dealerId = req.user.dealer_id;

    const specialStatuses = (status === "در انتظار تائید حسابداری")
      ? ["در انتظار تائید حسابداری", "پیش درخواست"]
      : status ? [status] : null;

    const totalCountResult = await pool.query(`
  SELECT COUNT(DISTINCT customers.id) AS total
  FROM customers
  LEFT JOIN receptions ON receptions.customer_id = customers.id
  LEFT JOIN orders ON orders.reception_id = receptions.id
  WHERE customers.dealer_id = $2
    AND (
      $1::text IS NULL
      OR ($1 = 'لغو شده ها' AND orders.status = ANY($3))
      OR ($1 = 'بحرانی ها' AND orders.estimated_arrival_days <= 0 AND orders.status = ANY($4))
      OR ($1 NOT IN ('لغو شده ها', 'بحرانی ها') AND orders.status = ANY($5))
    )
`, [status, dealerId, canceledStatuses, criticalStatuses, specialStatuses]);

    const totalCustomers = parseInt(totalCountResult.rows[0].total);
    const totalPages = Math.ceil(totalCustomers / limit);


    const customerIdsResult = await pool.query(`
  SELECT DISTINCT customers.id
  FROM customers
  LEFT JOIN receptions ON receptions.customer_id = customers.id
  LEFT JOIN orders ON orders.reception_id = receptions.id
  WHERE customers.dealer_id = $2
    AND (
      $1::text IS NULL
      OR ($1 = 'لغو شده ها' AND orders.status = ANY($3))
      OR ($1 = 'بحرانی ها' AND orders.estimated_arrival_days <= 0 AND orders.status = ANY($4))
      OR ($1 NOT IN ('لغو شده ها', 'بحرانی ها') AND orders.status = ANY($5))
    )
  ORDER BY customers.id
  LIMIT $6 OFFSET $7
`, [status, dealerId, canceledStatuses, criticalStatuses, specialStatuses, limit, offset]);


    const customerIds = customerIdsResult.rows.map(row => row.id);



    if (customerIds.length === 0) {
      return res.json({
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCustomers: 0,
          limit
        }
      });
    }

    const result = await pool.query(`
  SELECT 
    customers.id AS customer_id,
    customers.customer_name,
    customers.phone_number AS customer_phone,
    receptions.id AS reception_id,
    receptions.reception_date,
    receptions.reception_number,
    receptions.car_status,
    receptions.chassis_number,
    reception.car_name,
    orders.id AS order_id,
    orders.order_number,
    orders.order_date,
    orders.estimated_arrival_date,
    orders.delivery_date,
    orders.piece_name,
    orders.part_id,
    orders.number_of_pieces,
    orders.order_channel,
    orders.market_name,
    orders.market_phone,
    orders.estimated_arrival_days,
    orders.status,
    orders.description,
    orders.all_description,
    orders.appointment_date,
    orders.appointment_time,
    orders.final_order_number,
    orders.accounting_confirmation 
  FROM customers
  LEFT JOIN receptions ON receptions.customer_id = customers.id
  LEFT JOIN orders ON orders.reception_id = receptions.id
  WHERE customers.id = ANY($1) AND customers.dealer_id = $2
    AND (
      $3::text IS NULL
      OR ($3 = 'لغو شده ها' AND orders.status = ANY($4))
      OR ($3 = 'بحرانی ها' AND orders.estimated_arrival_days <= 0 AND orders.status = ANY($5))
      OR ($3 NOT IN ('لغو شده ها', 'بحرانی ها') AND orders.status = ANY($6))
    )
  ORDER BY customers.id, receptions.id, orders.id
`, [customerIds, dealerId, status, canceledStatuses, criticalStatuses, specialStatuses]);

    const groupedByCustomer = {};

    result.rows.forEach(row => {
      const customerId = row.customer_id;

      if (!groupedByCustomer[customerId]) {
        groupedByCustomer[customerId] = {
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          latest_unreceived_estimated_arrival_date: null,
          earliest_unreceived_estimated_arrival_date: null,
          receptions: []
        };
      }

      const customer = groupedByCustomer[customerId];

      let reception = customer.receptions.find(r => r.reception_id === row.reception_id);

      if (!reception) {
        reception = {
          reception_id: row.reception_id,
          reception_date: row.reception_date ? moment(row.reception_date).format('jYYYY/jMM/jDD HH:mm') : null,
          reception_number: row.reception_number,
          car_status: row.car_status,
          chassis_number: row.chassis_number,
          car_name:row.car_name,
          settlement_status: null,
          orders: []
        };

        customer.receptions.push(reception);
      }

      reception.orders.push({
        order_id: row.order_id,
        order_number: row.order_number,
        final_order_number: row.final_order_number,
        order_date: row.order_date ? moment(row.order_date).format('jYYYY/jMM/jDD HH:mm') : null,
        estimated_arrival_date: row.estimated_arrival_date ? moment(row.estimated_arrival_date).format('jYYYY/jMM/jDD HH:mm') : null,
        delivery_date: row.delivery_date ? moment(row.delivery_date).format('jYYYY/jMM/jDD HH:mm') : null,
        piece_name: row.piece_name,
        part_id: row.part_id,
        number_of_pieces: row.number_of_pieces,
        order_channel: row.order_channel,
        market_name: row.market_name,
        market_phone: row.market_phone,
        estimated_arrival_days: row.estimated_arrival_days,
        status: row.status,
        appointment_date: row.appointment_date ? moment(row.appointment_date).format('jYYYY/jMM/jDD') : null,
        appointment_time: row.appointment_time ? row.appointment_time.substring(0, 5) : null,
        description: row.description,
        all_description: row.all_description,
        accounting_confirmation: row.accounting_confirmation,
      });
    });

    Object.values(groupedByCustomer).forEach(customer => {
      let latestOverallUnreceived = null;
      let earliestOverallUnreceived = null;

      const settledStatuses = [
        "در انتظار نوبت دهی",
        "تحویل شد",
        "دریافت شد",
        "در انتظار دریافت",
        "پرداخت شد",
        "نوبت داده شد"
      ];

      customer.receptions.forEach(reception => {
        let allSettled = reception.orders.every(order =>
          settledStatuses.includes(order.status)
        );

        reception.settlement_status = allSettled ? "تسویه‌ شده" : "تسویه‌ نشده";

        reception.orders.forEach(order => {
          if (
            [
              "در انتظار تائید شرکت",
              "تائید توسط شرکت",
              "در انتظار تائید حسابداری",
              "پرداخت شد",
              "در انتظار دریافت"
            ].includes(order.status) &&
            order.estimated_arrival_date
          ) {
            const date = moment(order.estimated_arrival_date, 'jYYYY/jMM/jDD HH:mm');

            if (!latestOverallUnreceived || date.isAfter(latestOverallUnreceived)) {
              latestOverallUnreceived = date;
            }

            if (!earliestOverallUnreceived || date.isBefore(earliestOverallUnreceived)) {
              earliestOverallUnreceived = date;
            }
          }
        });
      });

      customer.latest_unreceived_estimated_arrival_date = latestOverallUnreceived
        ? latestOverallUnreceived.format('jYYYY/jMM/jDD')
        : null;

      customer.earliest_unreceived_estimated_arrival_date = earliestOverallUnreceived
        ? earliestOverallUnreceived.format('jYYYY/jMM/jDD')
        : null;
    });

    res.json({
      data: Object.values(groupedByCustomer),
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers,
        limit
      }
    });

  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};