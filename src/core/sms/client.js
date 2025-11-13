const soap = require('soap');
const WSDL_URL = 'http://niksms.com:1370/NiksmsWebservice.svc?wsdl';

let cachedClient = null;

async function createClient() {
  if (cachedClient) return cachedClient;

  try {
    cachedClient = await soap.createClientAsync(WSDL_URL);
    return cachedClient;
  } catch (error) {
    console.error('❌ خطا در ساخت SOAP Client:', error);
    throw error;
  }
}

module.exports = createClient;