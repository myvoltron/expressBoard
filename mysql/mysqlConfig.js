const mysql = require('mysql'); 
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '111111',
  database: 'sns',
  port: '3306',
  dateStrings: 'date', 
}, () => {
  console.log('MySQL Connected');
});

module.exports = connection; 