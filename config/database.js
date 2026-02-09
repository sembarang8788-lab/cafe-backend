const { Sequelize } = require('sequelize');
require('dotenv').config();

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in environment variables!');
}

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: (msg) => console.log('📁 Sequelize:', msg),
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    })
    : new Sequelize({ dialect: 'postgres' }); // Fallback to avoid crash, but will fail authenticate

module.exports = sequelize;

