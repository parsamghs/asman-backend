const bcrypt = require('bcryptjs');
bcrypt.hash('1234', 10).then(console.log);