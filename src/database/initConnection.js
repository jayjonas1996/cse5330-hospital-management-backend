const Oracle = require('./dbconnection');
const oracledb = require('oracledb');



module.exports = {
    async execute(query, bind) {
        let connection;
        try {
            console.log('connecting...');
            connection = await Oracle.connect(
                {
                    host: process.env.SSH_HOST, // Your server host name
                    port: 22, // Your server ssh port as default in ssh is 22
                    user: process.env.SSH_USER, // Your server username
                    password: process.env.SSH_PASSWORD, // Your server password
    
                    algorithms: {
                        kex: [
                          "diffie-hellman-group-exchange-sha256",
                          "diffie-hellman-group14-sha1"
                        ],
                    }
                },
                {
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_DATABASE,
                    service: process.env.DB_SERVICE
                }
            );
            console.log('connected');

            const options = {outFormat: oracledb.OUT_FORMAT_OBJECT};
            const result = await connection.client.execute(query, bind, options);
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
    }
}
