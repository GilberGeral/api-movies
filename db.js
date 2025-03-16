const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT
});

async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log('MySQL ok');
  } catch (error) {
    console.error('MYSQL fail :', error);
  }
}

module.exports = { sequelize, conectarDB };