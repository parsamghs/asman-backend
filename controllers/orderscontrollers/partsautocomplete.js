const pool = require('../../db');
const redisClient = require('../../config/redisClient');

exports.suggestParts = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 5) {
    return res.status(400).json({ message: 'حداقل 5 کاراکتر برای جستجو لازم است.' });
  }

  const category = req.user.category;
  let tableName;

  if (category === 'ایران خودرو') {
    tableName = 'irankhodro_parts_id';
  } else if (category === 'مدیران خودرو') {
    tableName = 'parts_id';
  } else {
    return res.status(400).json({ message: 'دسته‌بندی نمایندگی معتبر نیست.' });
  }

  const cacheKey = `suggest:${category}:${q.trim()}`;

  try {
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }

    console.log('🔸 پاسخ از دیتابیس گرفته شد و کش خواهد شد');

    const result = await pool.query(
      `SELECT technical_code, part_name 
       FROM ${tableName} 
       WHERE technical_code ILIKE $1
       ORDER BY technical_code
       LIMIT 50`,
      [`%${q.trim()}%`]
    );

    await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));

    res.json(result.rows);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ message: 'خطای سرور در جستجوی قطعه' });
  }
};
