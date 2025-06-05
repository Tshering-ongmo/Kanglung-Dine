const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'KanglungDine_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false // Required for some managed Postgres (like Render, Heroku)
        } : false
    },
    logging: process.env.NODE_ENV === 'development', // enable logging only in dev
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

(async () => {
    try {
        await sequelize.authenticate();
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Database connected successfully.');
        }
    } catch (err) {
        console.error('❌ Unable to connect to the database:', err);
    }
})();

module.exports = { sequelize, Sequelize };

