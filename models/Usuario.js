const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Usuario = sequelize.define('Usuario', {
	id_usuario: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	nombre: {
		type: DataTypes.STRING,
		allowNull: false
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true
		}
	}
}, {
	timestamps: true
});

module.exports = Usuario;
