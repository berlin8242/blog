// query.js
const pool = require('./db.config');

async function executeSqlQuery(sqlQuery, params) {
  try {
    const result = await pool.query(sqlQuery, params);
    return result;
  } catch (error) {
    throw new Error(`Erreur de requête SQL : ${error.message}`);
  }
}

module.exports = executeSqlQuery;