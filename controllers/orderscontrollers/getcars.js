const pool = require('../../db');

exports.getAllCars = async (req, res) => {
  try {
    const category = req.user.category;

    const categoryTableMap = {
      'ایران خودرو': 'irankhodro_cars',
      'مدیران خودرو': 'mvm_cars',
      'تویوتا': 'toyota_cars',
      'ماموت':'mammut_cars'
    };

    const tableName = categoryTableMap[category];

    if (!tableName) {
      return res.status(400).json({ message: 'دسته‌بندی نمایندگی معتبر نیست.' });
    }

    const result = await pool.query(
      `SELECT car_name
       FROM ${tableName}
       ORDER BY car_name`
    );

    const carsWithLabel = result.rows.map(car => ({
      value: car.car_name,
      label: car.car_name
    }));

    res.json(carsWithLabel);
  } catch (error) {
    console.error('Get all cars error:', error);
    res.status(500).json({ message: 'خطای سرور در دریافت نام خودروها' });
  }
};