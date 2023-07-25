require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const authRoute = require('./routes/user');

const journalRoute = require('./routes/journal');

const app = express();

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: 'Pratham123',
//     database: 'mydb',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
//   });


app.use(bodyParser.json());

app.use("/",authRoute);

app.use("/journal",journalRoute);


app.listen(3000,()=>{
    console.log("Server is running");
});