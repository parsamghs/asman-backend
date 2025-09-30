const categoryTableMap = {
  'ایران خودرو': 'irankhodro_cars',
  'مدیران خودرو': 'mvm_cars',
  'تویوتا': 'toyota_cars',
  'ماموت':'mammut_cars',
  'کرمان موتور':'kermanmotor_cars',
  'تست':'test_cars'
};

/**
 * 
 * @param {object} client
 * @param {string} userCategory
 * @param {string} carName 
 */
async function insertCarIfNotExists(client, userCategory, carName) {
  const tableName = categoryTableMap[userCategory];
  if (!tableName || !carName) return;

  const existing = await client.query(
    `SELECT car_name FROM ${tableName} WHERE car_name = $1`,
    [carName]
  );

  if (existing.rows.length === 0) {
    await client.query(
      `INSERT INTO ${tableName} (car_name) VALUES ($1)`,
      [carName]
    );
  }
}

module.exports = { insertCarIfNotExists };
