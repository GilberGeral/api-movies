const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Categoria = require('./Categoria');

const Pelicula = sequelize.define('Pelicula', {
  id_pelicula: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Categoria,
      key: 'id_categoria'
    },
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE'
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_estreno: {
    type: DataTypes.DATEONLY, 
    allowNull: false
  }
}, {
  timestamps: true 
});


Categoria.hasMany(Pelicula, { foreignKey: 'id_categoria' });
Pelicula.belongsTo(Categoria, { foreignKey: 'id_categoria' });

module.exports = Pelicula;
