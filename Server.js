const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const Utils = require('./utils.js');
const { sequelize, conectarDB } = require('./db');
const { Op } = require('sequelize');
const stringSimilarity = require('string-similarity');

const { body, validationResult } = require('express-validator');

const Usuario = require('./models/Usuario');
const Pelicula = require('./models/Pelicula');
const Categoria = require('./models/Categoria');
const { UsuarioPelicula } = require('./models/UsuarioPelicula');

const UMBRAL_NOMBRE_PELICULA = 0.8; // Ajusta el umbral de similitud entre 2 nombres ed pelicula

conectarDB();
sequelize.sync()
	.then(() => console.log('🟢 Base de datos sincronizada'))
	.catch(err => console.error('🔴 Error al sincronizar:', err));
  
app.use(express.json()); // Middleware para procesar JSON

app.get('/', (req, res) => {
  res.json({ mensaje: 'API funcionando' });
});

app.post('/user/create', async (req, res) => {

  const { nombre, email } = req.body;

  if (!Utils.validarEmail(email)) {
    return res.status(400).json({ mensaje: 'Email inválido' });
  }

  if( nombre.length < 2 || nombre.length > 30) {
    return res.status(400).json({ mensaje: 'Nombre inválido' });  
  }

  try {
    // Verificamos si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });

    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Crear el nuevo usuario
    const nuevoUsuario = await Usuario.create({ nombre, email });

    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

app.post('/user/list', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll(); // Obtener todos los usuarios

    res.json({
      total: usuarios.length,
      usuarios
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/user/seen/movie', async (req, res) => {
  const { id_user, id_movie } = req.body;

  if (!id_user || !id_movie) {
    return res.status(400).json({ mensaje: 'El id usuario y id pelicula son requeridos' });
  }

  try {
    
    const usuario = await Usuario.findByPk(id_user);
    const pelicula = await Pelicula.findByPk(id_movie);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    if (!pelicula) {
      return res.status(404).json({ mensaje: 'Película no encontrada' });
    }
    
    const [favorito, creado] = await UsuarioPelicula.findOrCreate({
      where: { id_usuario: id_user, id_pelicula: id_movie },
      defaults: { id_usuario: id_user, id_pelicula: id_movie }
    });

    if (!creado) {
      return res.status(409).json({ mensaje: 'La película ya está en vistas' });
    }

    res.status(201).json({ mensaje: 'Película agregada a vistas exitosamente' });

  } catch (error) {
    console.error('Error al agregar película a ya vistas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/user/seen/movies', async (req, res) => {
  const { id_user } = req.body;

  if (!id_user || isNaN(id_user)) {
    return res.status(400).json({ mensaje: 'ID de usuario inválido' });
  }

  try {
    
    const usuario = await Usuario.findByPk(id_user, {
      include: { model: Pelicula }
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ peliculas: usuario.Peliculas });
  } catch (error) {
    console.error('Error al obtener las películas favoritas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/user/seen/movie/remove', async (req, res) => {
  const { id_user, id_movie } = req.body;

  if (!id_user || !id_movie) {
    return res.status(400).json({ mensaje: 'El id_user y id_movie son requeridos' });
  }

  try {
    
    const favorito = await UsuarioPelicula.findOne({
      where: { id_usuario: id_user, id_pelicula: id_movie }
    });

    if (!favorito) {
      return res.status(404).json({ mensaje: 'La película no está en ya vistas' });
    }

    await favorito.destroy();

    res.status(200).json({ mensaje: 'Película eliminada de ya vistas exitosamente' });

  } catch (error) {
    console.error('Error al eliminar película de ya vistas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/user/delete', async (req, res) => {
  const { id_user } = req.body;

  try {
    // Buscar el usuario
    const usuario = await Usuario.findByPk(id_user);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Eliminar registros en la tabla intermedia "UsuarioPelicula" antes de eliminar el usuario
    await UsuarioPelicula.destroy({ where: { id_usuario: id_user } });

    // Ahora sí, eliminar el usuario
    await usuario.destroy();

    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/movie/create', [
    body('nombre')
      .isLength({ min: 2, max: 30 })
      .withMessage('El nombre debe tener entre 2 y 30 caracteres'),
    body('categoria')
      .isInt({ min: 1, max: 3 })
      .withMessage('La categoría debe ser un número entre 1 y 3'),
    body('fecha_estreno')
      .isISO8601()
      .withMessage('Fecha inválida, debe estar en formato YYYY-MM-DD')
  ], async (req, res) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  
  const { nombre, categoria, fecha_estreno } = req.body;

  //asegurarse que el nombre de la pelicula no este repetido
  const peliculas = await Pelicula.findAll({ attributes: ['nombre'] });
  const nombresPeliculas = peliculas.map(p => p.nombre);

  const coincidencias = stringSimilarity.findBestMatch(nombre, nombresPeliculas);
  const mejorCoincidencia = coincidencias.bestMatch;

  if (mejorCoincidencia.rating >= UMBRAL_NOMBRE_PELICULA) { // Ajusta el umbral según necesites
    return res.status(400).json({
      mensaje: `El nombre es muy similar a "${mejorCoincidencia.target}" (${Math.round(mejorCoincidencia.rating * 100)}%)`,
    });
  }

  try {
    

    const nuevaPelicula = await Pelicula.create({ "nombre": nombre, "id_categoria": categoria, "fecha_estreno": fecha_estreno });

    res.status(201).json({ mensaje: 'Película creada exitosamente', pelicula: nuevaPelicula });
  } catch (error) {
    console.error('Error al crear la película:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }

});

app.post('/movie/list', async (req, res) => {
  try {
    const { filtro_nombre, filtro_categoria, order } = req.body;
    let { page, limit } = req.query; // Obtener page y limit de los query params

    // Valores por defecto
    page = parseInt(page) || 1; // Si no existe, es 1
    limit = parseInt(limit) || 10; // Si no existe, es 10
    const offset = (page - 1) * limit; // Calcular desde dónde empezar

    let whereClause = {};

    // Si hay filtro por nombre, buscar coincidencias parciales
    if (filtro_nombre) {
      whereClause.nombre = { [Op.like]: `%${filtro_nombre}%` };
    }

    // Si hay filtro por categoría, agregarlo a la consulta
    if (filtro_categoria && filtro_categoria > 0 && filtro_categoria <= 3) {
      whereClause.id_categoria = filtro_categoria;
    }

    // Determinar el orden de los resultados
    let orderClause = [];
    if (order === 'new') {
      orderClause.push(['fecha_estreno', 'DESC']);
    } else if (order === 'old') {
      orderClause.push(['fecha_estreno', 'ASC']);
    }

    // Consultar la base de datos con paginación
    const { rows: peliculas, count: total } = await Pelicula.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit,
      offset
    });

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      peliculas
    });

  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/movie/recent', async (req, res) => {
  try {
    const { Op } = require('sequelize');

    // Calcular la fecha límite (hace 21 días)
    const fechaHoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 21);

    // Buscar películas estrenadas entre hace 21 días y hoy
    const peliculasRecientes = await Pelicula.findAll({
      where: {
        fecha_estreno: {
          [Op.between]: [fechaLimite, fechaHoy] // Entre hace 21 días y hoy
        }
      },
      order: [['fecha_estreno', 'DESC']] // Ordenar de la más reciente a la más antigua
    });

    res.json({ peliculas: peliculasRecientes });
  } catch (error) {
    console.error('Error al obtener películas recientes:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.post('/categories/view', async (req, res) => {
  try {
    const categorias = await Categoria.findAll(); // Obtiene todas las categorías
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});