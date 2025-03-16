const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Usuario = require('./Usuario');
const Pelicula = require('./Pelicula');

const UsuarioPelicula = sequelize.define('UsuarioPelicula', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Usuario,
      key: 'id_usuario'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  id_pelicula: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Pelicula,
      key: 'id_pelicula'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false
});

// 🔥 Definir relaciones correctamente
Usuario.belongsToMany(Pelicula, { through: UsuarioPelicula, foreignKey: 'id_usuario' });
Pelicula.belongsToMany(Usuario, { through: UsuarioPelicula, foreignKey: 'id_pelicula' });

// 🔴 Importante: Exportar todos los modelos correctamente
module.exports = { UsuarioPelicula, Usuario, Pelicula };

