const pool = require('../config/db');

async function sendSMSWithDealerCredit({ dealerId, message, phone }) {
    try {
        const dealerRes = await pool.query(
            'SELECT sms_credit, dealer_name FROM dealers WHERE id = $1',
            [dealerId]
        );

        if (dealerRes.rowCount === 0) {
            console.warn(`نمایندگی با ID ${dealerId} پیدا نشد.`);
            return { success: false, warning: 'نمایندگی پیدا نشد.' };
        }

        const { sms_credit, dealer_name } = dealerRes.rows[0];

        if (sms_credit <= 0) {
            console.warn(`نمایندگی "${dealer_name}" اعتبار پیامک ندارد.`);
            return { success: false, warning: 'اعتبار پیامک نمایندگی کافی نیست.' };
        }

        const smsSent = await sendSMS({ message, phone });

        if (!smsSent.success) {
            console.error(`خطا در ارسال پیامک برای ${phone}`);
            return { success: false, warning: 'خطا در ارسال پیامک.' };
        }

        await pool.query(
            'UPDATE dealers SET sms_credit = sms_credit - 1 WHERE id = $1',
            [dealerId]
        );

        return { success: true };

    } catch (err) {
        console.error('خطای کلی در ارسال پیامک:', err);
        return { success: false, warning: 'خطای کلی در ارسال پیامک.' };
    }
}
