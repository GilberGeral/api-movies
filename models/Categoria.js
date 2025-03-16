const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); // 👈 Importa la conexión a la BD

const Categoria = sequelize.define('Categoria', {
  id_categoria: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Categoria;