import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const db = mysql.createPool({
  host: "reddit-1.ciyuzmcv7xt0.us-west-1.rds.amazonaws.com",
  user: "admin",
  port: 3306,
  password: "redditdb",
  database: "reddit_schema",
  connectionLimit: 10,
});

export default db;
