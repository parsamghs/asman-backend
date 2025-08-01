const moment = require('moment-jalaali');
require('moment/locale/fa');

const { CONSTANTS } = require('./constants');

function validateJalaliDate(dateStr, fieldName) {
  const date = moment(dateStr, 'jYYYY/jMM/jDD', true);
  if (!date.isValid()) {
    return {
      isValid: false,
      message: `تاریخ ${fieldName} نامعتبر است.`
    };
  }
  return { isValid: true, date };
}


function validateDeliveryAfterOrder(orderDateStr, deliveryDateStr) {
  const orderDate = moment(orderDateStr, 'jYYYY/jMM/jDD', true);
  const deliveryDate = moment(deliveryDateStr, 'jYYYY/jMM/jDD', true);

  if (!orderDate.isValid()) {
    return { isValid: false, message: 'تاریخ سفارش نامعتبر است.' };
  }
  if (!deliveryDate.isValid()) {
    return { isValid: false, message: 'تاریخ پیش‌بینی تحویل نامعتبر است.' };
  }
  if (deliveryDate.isBefore(orderDate)) {
    return {
      isValid: false,
      message: 'تاریخ پیش‌بینی تحویل نمی‌تواند قبل از تاریخ سفارش باشد.'
    };
  }

  return { isValid: true, orderDate, deliveryDate };
}

function validateWithRegex(field, value) {
  const regex = CONSTANTS.regex[field];
  if (!regex) return { isValid: true };

  if (!regex.test(value)) {
    let message = '';
    switch (field) {
      case 'name':
        message = 'نام باید فقط شامل حروف فارسی و فاصله باشد (حداکثر ۵۰ کاراکتر).';
        break;
      case 'part_name':
        message = 'نام قطعه باید فقط شامل حروف فارسی، انگلیسی، عدد و علائم مجاز باشد (حداکثر ۷۰ کاراکتر).';
        break;
      case 'phone':
        message = 'شماره تلفن باید ۱۱ رقم باشد.';
        break;
      case 'number':
        message = 'مقدار باید یک عدد تا حداکثر ۳۰ رقم باشد.';
        break;
      default:
        message = `فرمت ${field} نامعتبر است.`;
    }
    return { isValid: false, message };
  }

  return { isValid: true };
}

module.exports = {
  validateJalaliDate,
  validateDeliveryAfterOrder,
  validateWithRegex
};