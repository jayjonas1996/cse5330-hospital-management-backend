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

app.post('/paginated_query', async (req, res) => {
    console.error('Not Implemented');
    let default_page = 1;
    let default_page_size = 30;

});

app.use(function (err, req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
});