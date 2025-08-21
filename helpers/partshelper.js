const categoryTableMap = {
  'ایران خودرو': 'irankhodro_parts_id',
  'مدیران خودرو': 'mvm_parts_id',
  'تویوتا': 'toyota_parts_id',
  'ماموت': 'mammut_parts_id'
};

/**
 * 
 * @param {object} client
 * @param {string} userCategory
 * @param {string} partId 
 * @param {string} partName 
 */
async function insertPartIfNotExists(client, userCategory, partId, partName) {
  const tableName = categoryTableMap[userCategory];
  if (!tableName || !partId) return;

  const existing = await client.query(
    `SELECT technical_code FROM ${tableName} WHERE technical_code = $1`,
    [partId]
  );

  if (existing.rows.length === 0) {
    await client.query(
      `INSERT INTO ${tableName} (technical_code, part_name) VALUES ($1, $2)`,
      [partId, partName]
    );
  }
}

module.exports = { insertPartIfNotExists };
