const pool = require('../../db');
const redisClient = require('../../config/redisClient');

exports.suggestPartsByName = async (req, res) => {
  const q = req.params.partname_id;

  const plainQuery = q?.trim().replace(/\*/g, '');
  if (!plainQuery || plainQuery.length < 1) {
    return res.status(400).json({ message: 'حداقل 1 کاراکتر معتبر برای جستجو لازم است.' });
  }

  const cacheKey = `suggest_lost_name:${q.trim()}`;

  try {
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }

    console.log('🔸 پاسخ از دیتابیس گرفته شد و کش خواهد شد');

    const rawWords = q.trim().split(/\s+/);

    const conditions = [];
    const values = [];

    rawWords.forEach((word, idx) => {
      const clean = word.replace(/\*/g, '');
      if (clean.length === 0) return;

      if (word.includes('*')) {
        conditions.push(`piece_name ILIKE $${idx + 1}`);
        values.push(`%${clean}%`);
      } else {
        conditions.push(`piece_name ILIKE $${idx + 1}`);
        values.push(`%${clean}%`);
      }
    });

    const query = `
      SELECT DISTINCT part_id, piece_name
      FROM lost_orders
      WHERE ${conditions.join(' AND ')}
      ORDER BY piece_name
      LIMIT 20
    `;

    const result = await pool.query(query, values);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));

    res.json(result.rows);
  } catch (error) {
    console.error('Autocomplete by name error:', error);
    res.status(500).json({ message: 'خطای سرور در جستجوی نام قطعه' });
  }
};
