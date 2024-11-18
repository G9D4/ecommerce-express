const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin')
const isAuth = require('../middleware/is-auth');

router.get('/crear-producto', isAuth, adminController.getCrearProducto);
router.post('/crear-producto', isAuth, adminController.postCrearProducto);

router.get('/productos', isAuth, adminController.getProductos);


// Categorias Administrator
router.get('/categorias', isAuth, adminController.getCategorias);
router.post('/categorias', isAuth, adminController.postCategoria); // Crea o edita categorías
router.post('/categorias/eliminar/:id', isAuth, adminController.postEliminarCategoria); // Elimina categorías

// Cambia la ruta de editar producto para incluir el ID del producto
router.get('/editar-producto/:id', isAuth, adminController.getEditProductos);
router.post('/editar-producto', isAuth, adminController.postEditProductos);
router.post('/eliminar-producto', isAuth, adminController.postEliminarProducto);


module.exports = router;