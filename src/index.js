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

app.get('/report/department_sex_rollup', async(req, res) => {
    try {
        const result = await db.execute('SELECT D_NAME, SEX, COUNT(E.EMP_ID) NUMBER_OF_EMPLOYEES \
        FROM F21_S001_13_DEPARTMENT D INNER JOIN F21_S001_13_EMPLOYEE E ON D.D_ID = E.D_ID \
        GROUP BY ROLLUP (D.D_NAME, E.SEX)', []);
        res.json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: err
        });
    }
});

app.get('/report/revenue_department_room_cube', async(req, res) => {
    try {
        const result = await db.execute('SELECT D.D_NAME, R.ROOM_TYPE, SUM(CHARGES) AS REVENUE \
            FROM F21_S001_13_DEPARTMENT D, F21_S001_13_ROOM R, F21_S001_13_APPOINTMENT A \
            WHERE D.D_ID = R.D_ID AND A.R_ID = R.R_ID \
            GROUP BY CUBE(D.D_NAME, R.ROOM_TYPE) \
            ORDER BY D_NAME', []);
        res.json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: err
        })
    }
});


app.post('/report/most_busy_department', async (req, res) => {
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const format = req.body.format;
    try {
        const query = `SELECT D.D_NAME, SUM(A.APP_ID) AS NO_OF_APPOINTMENT \
        FROM F21_S001_13_EMPLOYEE E, F21_S001_13_PATIENT P, F21_S001_13_APPOINTMENT A, F21_S001_13_DEPARTMENT D \
        WHERE E.EMP_ID = A.EMP_ID AND P.P_ID = A.P_ID AND E.D_ID = D.D_ID and A.START_TIME BETWEEN TO_DATE('${start_date}', '${format}') AND TO_DATE('${end_date}', '${format}') \
        GROUP BY D.D_NAME ORDER BY NO_OF_APPOINTMENT DESC`
        const result = await db.execute(query, []);
        res.json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: err
        })
    }
});

app.post('/report/patient_count_by_insurance_company_and_bloog_group', async (req, res) => {
    const blood_group = req.body.blood_group;
    try {
        const query = `SELECT INS_COMP, BLOOD_GROUP, COUNT(P.P_ID) COUNT_OF_PATIENT FROM F21_S001_13_PATIENT P INNER JOIN F21_S001_13_INSURANCE_COMPANY I ON P.P_ID = I.P_ID \
        GROUP BY I.INS_COMP, P.BLOOD_GROUP HAVING BLOOD_GROUP = '${blood_group}' ORDER BY COUNT_OF_PATIENT DESC`;

        const result = await db.execute(query, []);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.send(400).json({
            message: err
        });
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