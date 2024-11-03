const express = require('express');

const router = express.Router();

const usuarioController= require('../controllers/usuario')
const adminController= require('../controllers/admin')

router.get('/crear-producto', usuarioController.isLoggedIn, adminController.getCrearProducto);
router.post('/crear-producto', usuarioController.isLoggedIn, adminController.postCrearProducto);

router.get('/productos', usuarioController.isLoggedIn, adminController.getProductos);


// Cambia la ruta de editar producto para incluir el ID del producto
router.get('/editar-producto/:id', usuarioController.isLoggedIn, adminController.getEditProductos);
router.post('/editar-producto', usuarioController.isLoggedIn, adminController.postEditProductos);
router.post('/eliminar-producto', usuarioController.isLoggedIn, adminController.getEliminarProducto);


module.exports = router;