require('dotenv').config({path:__dirname+'/./../../.env'});
const express = require('express');
var cors = require('cors');
const db = require('./database/initConnection');

const port = 3000
const app = express()
app.use(require('body-parser').json());

app.use(cors());


app.listen(port, () => {
    console.log(`Hospital management app listening at http://localhost:${port} inside Docker`);
})

app.post('/query', async (req, res) => {
    let result = await db.execute(req.body.query, []);
    res.json(result);
});

app.post('/queries', async (req, res) => {
    res.json(await db.execute_multiple(req.body.queries, []));
});

app.get('/query/list_employees/:employee_type', async(req, res) => {
    const type = req.params.employee_type;
    const mapping = {
        'doctor': 'F21_S001_13_DOCTOR',
        'nurse': 'F21_S001_13_NURSE',
        'staff': 'F21_S001_13_STAFF',
        'trustee': 'F21_S001_13_TRUSTEE'
    }

    if (type === undefined || !(type in mapping)) {
        res.status(400).send({
            message: `Invalid employee type provided`
         });
         return;
    }
    const query = `SELECT * FROM ${process.env.DB_DATABASE}.F21_S001_13_EMPLOYEE WHERE EMP_ID IN (SELECT EMP_ID FROM ${mapping[type]})`;
    try {
        let result = await db.execute(query, []);
        res.json(result);
    } catch(err) {
        console.log(err);
        res.status(400).send({
            message: err
        });
    }
    
});

app.get('/query/patient/:id', async(req, res) => {
    if (req.params.id) {
        const query = `SELECT * FROM ${process.env.DB_DATABASE}.F21_S001_13_PATIENT WHERE P_ID = ${req.params.id}`;
        try {
            let results = await db.execute(query, []);
            res.json(results);
        } catch(err) {
            console.error(err);
            res.status(400).send({
                message: err
            });
        }
    }
});

app.get('/query/employee/:id', async(req, res) => {
    if (req.params.id) {
        const query = `SELECT * FROM ${process.env.DB_DATABASE}.F21_S001_13_EMPLOYEE WHERE EMP_ID = ${req.params.id}`;
        try {
            let results = await db.execute(query, []);
            res.json(results);
        } catch(err) {
            console.error(err);
            res.status(400).send({
                message: err
            });
        }
    }
});


app.post('/query/patient/:id', async(req, res) => {
    if (req.params.id && req.body.address) {
        const id = req.params.id;
        const new_address = req.body.address;
        const query_1 = `UPDATE ${process.env.DB_DATABASE}.F21_S001_13_PATIENT SET ADDRESS = '${new_address}' WHERE P_ID = ${id}`;
        const query_2 = `SELECT * FROM ${process.env.DB_DATABASE}.F21_S001_13_PATIENT WHERE P_ID = ${id}`;
        try {
            let result = await db.execute_multiple([query_1, query_2], []);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(400).send({
                message: err
            });
        }
    }
});


app.post('/paginated_query/', async (req, res) => {
    console.error('Not Implemented');
    let default_page = req.body.page || 1;
    let default_page_size = req.body._size || 30;

});

app.use(function (err, req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
});