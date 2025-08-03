const bcrypt = require('bcryptjs');
bcrypt.hash('1111', 10).then(console.log);