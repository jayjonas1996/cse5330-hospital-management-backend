const Oracle = require('./dbconnection');
const oracledb = require('oracledb');


const sshCredentials = {
    host: process.env.SSH_HOST,
    port: 22,
    user: process.env.SSH_USER,
    password: process.env.SSH_PASSWORD,

    algorithms: {
        kex: [
          "diffie-hellman-group-exchange-sha256",
          "diffie-hellman-group14-sha1"
        ],
    }
}

const databaseCredentials = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    service: process.env.DB_SERVICE
}


module.exports = {
    async execute(query, bind) {
        let connection;
        try {
            console.log('connecting...');
            connection = await Oracle.connect(
                sshCredentials,
                databaseCredentials
            );
            console.log('connected');
            console.log(`Executing: ${query}`);
            const options = {outFormat: oracledb.OUT_FORMAT_OBJECT};
            const result = await connection.client.execute(query, bind, options);
            console.log(`${result.rows?.length} rows fetched`);
            return result;

        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    throw err;
                }
            }
        }
    },
    
    async execute_multiple(queries, bind) {
        let connection;
        try {
            console.log('connecting...');
            connection = await Oracle.connect(
                sshCredentials,
                databaseCredentials
            );
            console.log('connected');

            const options = {outFormat: oracledb.OUT_FORMAT_OBJECT};
            const results = [];

            await queries.forEach(async (query) => {
                try {
                    console.log(`Executing: ${query}`);
                    let result = await connection.client.execute(query, bind, options);
                    console.log(`${result.rows?.length} rows fetched`);
                    results.push(result);
                } catch(err) {
                    results.push(err);
                }
            });
            return results;
        } catch (err) {
            console.error(err);
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    throw err;
                }
            }
        }
    }
}
