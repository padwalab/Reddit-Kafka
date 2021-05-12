import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const db = mysql.createPool({
  host: process.env.RDBMS_HOST,
  user: process.env.RDBMS_USER,
  port: process.env.RDBMS_PORT,
  password: process.env.RDBMS_PWD,
  database: process.env.RDBMS_DB,
  connectionLimit: 100,
});

export default db;
