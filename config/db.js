const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME || 'KanglungDine_db', process.env.DB_USER || 'postgres', process.env.DB_PASS, {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    },
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
        schema: 'public'
    }
});

// Test connection
sequelize.authenticate()
    .then(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Database connected successfully.');
        }
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err.message);
    });

module.exports = { sequelize, Sequelize };
