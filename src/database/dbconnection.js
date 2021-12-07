const net = require('net');
const oracledb = require('oracledb');
const {Client} = require('ssh2');

const connectSSH = async (sshConfig) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn
            .on('ready', () => resolve(conn))
            .on('error', reject)
            .connect(sshConfig);
    });
};

const createServer = async (conn, oracleConfig) => {
    return new Promise((resolve, reject) => {
        const server = net.createServer(sock => {
            conn.forwardOut(sock.remoteAddress, sock.remotePort, oracleConfig.host, oracleConfig.port, (err, stream) => {
                if (err) {
                    sock.end();
                } else {
                    sock.pipe(stream).pipe(sock);
                }
            });
        });
        server.on('error', reject).listen(0, () => resolve(server));
    });
};

const closePoolAndExit = async () => {
    try {
        // Get the pool from the pool cache and close it when no
        // connections are in use, or force it closed after 10 seconds
        // If this hangs, you may need DISABLE_OOB=ON in a sqlnet.ora file
        await oracledb.getPool().close(10);
    } catch(err) {
        throw err;
    }
};

module.exports = {
    async connect(sshConfig, oracleConfig) {
        const conn = await connectSSH(sshConfig);
        const server = await createServer(conn, oracleConfig);
        const {user,password,database} = oracleConfig;

        const connection = await oracledb.createPool({
            user: user,
            password: password,
            connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${oracleConfig.host})(PORT=${oracleConfig.port}))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=${oracleConfig.service})))`,
            poolMax:          44,
            poolMin:          2,
            poolIncrement:    5,
            poolTimeout:      4
        });

        const client = await connection.getConnection();

        return {
            client,
            conn,
            server,
            close: async () => {
                await client.close();
                await closePoolAndExit();
                await server.close();
                await conn.end();
            },
        };
    },
};
