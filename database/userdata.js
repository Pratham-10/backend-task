const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  database: 'mydb',
  user: process.env.USER,
  password: process.env.PASSWORD,
  multipleStatements: true,
});

module.exports = pool;
