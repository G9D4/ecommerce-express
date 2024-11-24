const express = require('express');

const router = express.Router();

const empresaController = require('../controllers/empresa')
const isAuth = require('../middleware/is-auth')

router.get('/nosotros', isAuth, empresaController.getNosotros);
router.get('/fqas', isAuth, empresaController.getSoporte);
router.get('/condiciones-compra', isAuth, empresaController.getCondicionesCompra);

module.exports = router;