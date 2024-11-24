const express = require('express');
const { check, body } = require('express-validator');

const router = express.Router();

const usuarioController = require('../controllers/usuario')
const adminController = require('../controllers/admin')
const isAuth = require('../middleware/is-auth');

router.get('/crear-producto', isAuth, adminController.getCrearProducto);
router.get('/productos', isAuth, adminController.getProductos);
router.get('/editar-producto/:id', isAuth, adminController.getEditProductos);

router.post('/crear-producto',
    [
        body('nombreproducto', 'El nombre del producto debe ser un texto de no menos de 3 caracteres')
            .trim()
            .isString()
            .isLength({ min: 3 }),
        body('urlImagen', 'Ingrese un URL válido')
            .isURL(),
        body('precio', 'El precio debe ser un número')
            .isFloat(),
        body('descripcion', 'La descripción debe ser un texto de entre 10 a 400 caracteres')
            .trim()
            .isLength({ min: 10, max: 400 }),
        body('caracteristicas', 'Las caracteristicas deben estar entre 10 a 300 caracteres')
            .trim()
            .isString()
            .isLength({ min: 10, max: 300 }),
    ],
    isAuth,
    adminController.postCrearProducto);

router.post('/editar-producto',
    [
        body('nombreproducto', 'El nombre del producto debe ser un texto de no menos de 3 caracteres')
            .trim()
            .isString()
            .isLength({ min: 3 }),
        // body('urlImagen', 'Ingrese un URL válido')
            // .isURL(),
        body('precio', 'El precio debe ser un número')
            .isFloat(),
        body('descripcion', 'La descripción debe ser un texto de entre 10 a 400 caracteres')
            .trim()
            .isLength({ min: 10, max: 400 }),
        body('caracteristicas', 'Las caracteristicas deben estar entre 10 a 300 caracteres')
            .trim()
            .isString()
            .isLength({ min: 10, max: 300 }),
    ],
    isAuth,
    adminController.postEditProductos);
router.post('/eliminar-producto', isAuth, adminController.postEliminarProducto);


module.exports = router;