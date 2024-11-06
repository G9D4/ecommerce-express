const express = require('express');
const { check } = require('express-validator');

const router = express.Router();

const usuarioController = require('../controllers/usuario')


router.post('/login', usuarioController.postLogin);
router.post('/logout', usuarioController.postLogout);
router.post(
    '/signup', 
    check('email').isEmail().withMessage('Por favor ingrese un correo válido'), 
    usuarioController.postSignup
);
router.post('/reset-password', usuarioController.postResetPassword);
router.post('/new-password', usuarioController.postNewPassword);

router.get('/login', usuarioController.getLogin);
router.get('/signup', usuarioController.getSignup);
router.get('/reset-password', usuarioController.getResetPassword);
router.get('/reset-password', usuarioController.getResetPassword);
router.get('/reset-password/:token', usuarioController.getNewPassword);

module.exports = router;
