const express = require('express');

const router = express.Router();

const usuarioController = require('../controllers/usuario')


router.post('/login', usuarioController.postLogin);
router.post('/logout', usuarioController.postLogout);
router.post('/signup', usuarioController.postSignup);

router.get('/login', usuarioController.getLogin);
router.get('/signup', usuarioController.getSignup);

module.exports = router;
