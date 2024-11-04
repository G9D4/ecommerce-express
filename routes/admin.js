const express = require('express');

const router = express.Router();

const usuarioController= require('../controllers/usuario')
const adminController= require('../controllers/admin')
const isAuth = require('../middleware/is-auth');

router.get('/crear-producto', isAuth, adminController.getCrearProducto);
router.post('/crear-producto', isAuth, adminController.postCrearProducto);

router.get('/productos',isAuth, adminController.getProductos);


// Cambia la ruta de editar producto para incluir el ID del producto
router.get('/editar-producto/:id', isAuth, adminController.getEditProductos);
router.post('/editar-producto', isAuth, adminController.postEditProductos);
router.post('/eliminar-producto', isAuth, adminController.getEliminarProducto);


module.exports = router;