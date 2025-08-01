
/**
 * 
 * @param  {...string} allowedRoles 
 */
module.exports = function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: 'دسترسی غیرمجاز: اطلاعات کاربری یافت نشد.',
          detail: 'ممکن است توکن احراز هویت ارسال نشده باشد یا منقضی شده باشد.'
        });
      }

      if (!user.role) {
        return res.status(403).json({
          message: 'دسترسی غیرمجاز: نقش کاربر مشخص نیست.',
          detail: 'نقش شما برای بررسی سطح دسترسی الزامی است. لطفاً با پشتیبانی تماس بگیرید.'
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: 'دسترسی رد شد: شما اجازه دسترسی به این عملیات را ندارید.',
          userRole: user.role,
          allowedRoles: allowedRoles,
          detail: 'برای انجام این عملیات باید نقش شما یکی از موارد مجاز باشد.'
        });
      }

      next();
    } catch (err) {
      console.error('خطا در اجرای middleware نقش‌ها:', err);
      res.status(500).json({
        message: 'خطای داخلی سرور هنگام بررسی نقش کاربر.',
        error: err.message
      });
    }
  };
};
