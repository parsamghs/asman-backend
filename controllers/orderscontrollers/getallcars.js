const pool = require('../../db');

exports.getAllCars = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mvm_cars ORDER BY car_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'خطا در دریافت لیست خودروها' });
  }
};
