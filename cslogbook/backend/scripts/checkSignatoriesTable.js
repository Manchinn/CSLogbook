const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env.development' });

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await connection.execute("SHOW TABLES LIKE 'signatories'");
    if (rows.length > 0) {
      console.log("Table 'signatories' exists.");
    } else {
      console.log("Table 'signatories' does NOT exist.");
    }

    const [docCols] = await connection.execute("SHOW COLUMNS FROM documents LIKE 'signatory_id'");
    if (docCols.length > 0) {
      console.log("Column 'signatory_id' exists in 'documents' table.");
    } else {
      console.log("Column 'signatory_id' does NOT exist in 'documents' table.");
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    await connection.end();
  }
}

checkTable();
