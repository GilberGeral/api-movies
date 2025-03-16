const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize('kubo-test', 'ktest', 'AWXZZK8LDh0W-1', {
//   host: 'localhost',
//   dialect: 'mysql'
// });


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT // Aquí va el puerto de MySQL
});

async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL con Sequelize');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

module.exports = { sequelize, conectarDB };