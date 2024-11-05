const express = require('express');

const router = express.Router();

const usuarioController = require('../controllers/usuario')
const productosController = require('../controllers/productos')
const isAuth = require('../middleware/is-auth')

router.get('/carrito', isAuth, productosController.getCarrito);
router.post('/carrito', isAuth, productosController.postCarrito)
router.post('/eliminar-producto-carrito', isAuth, productosController.postEliminarProductoCarrito);
router.get('/categoria/:categoria_ruta?', isAuth, productosController.getProductos);
router.get('/', isAuth, productosController.getProductos);

router.get('/productos/:idProducto', isAuth, productosController.getProducto);

router.get('/pedidos', isAuth, productosController.getPedidos);
router.post('/crear-pedido', isAuth, productosController.postPedido);

module.exports = router;