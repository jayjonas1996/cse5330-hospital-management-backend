require('dotenv').config({path:__dirname+'/./../../.env'});
const express = require('express')
const router = express.Router();
const app = express()
const port = 3000

const Oracle = require('./database/dbconnection')
const oracledb = require('oracledb');

const db = require('./database/initConnection');



app.listen(port, () => {
    db.execute('SELECT * FROM naikj.F21_S001_13_DEPARTMENT', []).then(result => {
        console.log(result);
    })
    console.log(`Example app listening at http://localhost:${port}`);
 
})

router.get('/query', async function (req, res) {
    let result = await db.execute('SELECT * FROM naikj.F21_S001_13_DEPARTMENT', [])
    res.json(result);
})
