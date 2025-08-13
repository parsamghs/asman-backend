const bcrypt = require('bcryptjs');
bcrypt.hash('4321', 10).then(console.log);