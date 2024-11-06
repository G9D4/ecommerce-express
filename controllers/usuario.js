// const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const APIKEY = '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';

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        APIKEY
    }
  })
);

let esPasswordComplejo = (password) => {
  return password.length > 7;
}

exports.getLogin = async (req, res, next) => {
  let mensaje = req.flash('error');
  mensaje = mensaje.length > 0 ? mensaje[0] : null;

  res.render("login-usuario", {
    titulo: "Inicio de sesión del cliente",
    path: "/",
    mensajeError: mensaje
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  Usuario.findOne({ email: email })
    .then(usuario => {
      if (!usuario) {
        req.flash('error', 'El usuario no existe')
        return res.redirect('/usuario/login');
      }
      bcrypt.compare(password, usuario.password)
        .then(hayCoincidencia => {
          if (hayCoincidencia) {
            req.session.autenticado = true;
            req.session.usuario = usuario;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/')
            })
          }
          req.flash('error', 'Las credenciales son invalidas')
          res.redirect('/usuario/login');
        })
        .catch(err => console.log(err));
    })

};

exports.postLogout = async (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getSignup = async (req, res, next) => {
  let mensaje = req.flash('error');
  mensaje = mensaje.length > 0 ? mensaje[0] : null;
  res.render("signup-usuario", {
    titulo: "Creación de nueva cuenta",
    mensajeError: mensaje,
    path: "/usuario",
  });
};

exports.postSignup = async (req, res, next) => {
  const { nombres, apellidos, email, password, password2 } = req.body;

  if (password !== password2) {
    req.flash('error', 'Debe usar el mismo password')
    return res.redirect('/usuario/signup');
  }
  if (!esPasswordComplejo(password)) {
    req.flash('error', 'El password debe tener longitud minima de 8 caracteres, letras y numeros....')
    return res.redirect('/usuario/signup');
  }
  Usuario.findOne({ email: email })
    .then(usuarioDoc => {
      if (usuarioDoc) {
        req.flash('error', 'Dicho email ya esta en uso')
        return res.redirect('/usuario/signup');
      }
      return bcrypt.hash(password, 12)
        .then(passwordCifrado => {
          const usuario = new Usuario({
            nombres: nombres,
            apellidos: apellidos,
            email: email,
            password: passwordCifrado,
            isadmin: 0,
            carrito: { productos: [] }
          });
          return usuario.save();
        });
    })
    .then(result => {
      res.redirect('/usuario/login');
      return transporter.sendMail({
        to: email,
        from: 'proyectosamsungpucp@gmail.com',
        subject: 'Registro exitoso',
        html: '<h1>Ha sido registrado exitosamente en proyecto Samsung</h1>'
      })
    })
    .catch(err => {
      console.log(err);
    });
};
