const normalizeText = str => str?.replace(/\u200C/g, '').replace(/\s+/g, ' ').trim();

const rawConstants = {
  car_status: ["متوقف", "متوقع"],
  order_channels: ["VOR", "VIS", "بازار آزاد", "شارژ انبار"],
  status_options: ['در انتظار تائید شرکت', 'لغو توسط شرکت', 'در انتظار تائید حسابداری', 'تائید توسط شرکت',
    'عدم پرداخت حسابداری', 'پرداخت شد', 'در انتظار دریافت', 'دریافت شد', 'عدم دریافت', 'در انتظار نوبت دهی',
    'نوبت داده شد', 'انصراف مشتری', 'تحویل شد', "تحویل نشد", 'حذف شده', 'پیش درخواست'],
  roles: ["پذیرش", "انباردار", "حسابدار", "مدیریت", "ادمین"],

  
  regex: {
    name: /^[\u0600-\u06FF\s]{1,50}$/,
    phone: /^(0|\+98|0098)?[1-9][0-9]{9}$/,
    number: /^[0-9]{1,30}$/,
    password: /^.{4,10}$/,
    code_meli: /^\d{1,30}$/,
    part_id: /^[A-Za-z0-9_\-\/]{1,50}$/,
    part_name: /^[\u0600-\u06FFa-zA-Z0-9\s\-()\/+.,]{1,70}$/
  }
};

const CONSTANTS = {
  car_status: rawConstants.car_status.map(normalizeText),
  order_channels: rawConstants.order_channels.map(normalizeText),
  status_options: rawConstants.status_options.map(normalizeText),
  roles: rawConstants.roles.map(normalizeText),
  regex: rawConstants.regex
};

function validateCodeMeli(code_meli) {
  return CONSTANTS.regex.code_meli.test(code_meli);
}

module.exports = {
  CONSTANTS,
  normalizeText,
  validateCodeMeli
};
