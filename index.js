const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const { Client } = require('pg');
const cron = require('node-cron');
const { backupDB } = require('./src/backup');

const backupDatabases = async () => {
  console.log('Start backup');
  
  const excludeDB = process.env.DB_EXCLUDE.split(',').map(db => db.trim());

  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });

  const query = `SELECT "datname" AS "db_name" FROM "pg_database"`;
  try {
    await client.connect();
    const { rows } = await client.query(query);
    console.table(rows);
    rows.forEach(async (item) => {
      if (!excludeDB.includes(item.db_name)) {
        await backupDB(item.db_name)
      }
    });
  } catch (err) {
    console.error('backupDatabases', err.stack);
    return false;
  } finally {
    await client.end();
  }
};

backupDatabases();
cron.schedule(`${process.env.CRON}`, async () => {
  console.log('running a task every minute');
  await backupDatabases();
});

// set up server
app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is awake on port ${process.env.SERVER_PORT}`)
});