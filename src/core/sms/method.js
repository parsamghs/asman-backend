const createClient = require('./client');
const { username, password } = require('../config/sms');

const auth = {
    security: {
        Username: username,
        Password: password,
    }
};

async function getCredit() {
    try {
        const client = await createClient();
        const [result] = await client.GetCreditAsync(auth);
        return result.GetCreditResult;
    } catch (error) {
        console.error('❌ خطا در دریافت اعتبار:', error);
        throw error;
    }
}

module.exports = {
    getCredit,
};