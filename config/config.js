require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sherubtse@2025', // Using hardcoded password from your db.js as fallback
    database: process.env.DB_NAME || 'KanglungDine_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    schema: 'public', // Added schema from your db.js
    dialectOptions: {
      // ssl: {
      //   require: true, // or process.env.DB_SSL === 'true'
      //   rejectUnauthorized: false // Adjust as per your SSL certificate setup
      // }
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sherubtse@2025',
    database: process.env.DB_NAME_TEST || 'KanglungDine_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    schema: 'public',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    schema: 'public', // Ensure schema is consistent
    dialectOptions: {
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false // For environments like Heroku, Render etc.
      // }
    },
    logging: false
  }
};