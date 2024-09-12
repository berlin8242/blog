require('dotenv').config();

const pg = require('pg');
const { Pool } = pg;
const pool = new Pool({
user: 'postgres',
password: 'password',
host: 'localhost',
port: '5433',
database: 'postgres',
});

async function query(req, params) {
    try {
        return await pool.query(req, params);
    } catch (err) {
        return err;
    }
}

module.exports = query;




