const { Sequelize } = require('sequelize');
require('dotenv').config();

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in environment variables!');
}

const sequelize = new Sequelize(databaseUrl || 'postgres://localhost/dummy', {
    dialect: 'postgres',
    dialectOptions: databaseUrl ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    logging: (msg) => console.log('📁 Sequelize:', msg),
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;

