// const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const APIKEY = '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';

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        APIKEY
    }
  })
);

// let esPasswordComplejo = (password) => {
//   return password.length > 7;
// }

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

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('signup-usuario', {
      path: '/usuario',
      titulo: 'Creación de nueva cuenta',
      mensajeError: errors.array()[0].msg,
      datosAnteriores: {
        email: email,
        password: password
      },
      erroresValidacion: errors.array()
    });
  }

  // if (password !== password2) {
  //   req.flash('error', 'Debe usar el mismo password')
  //   return res.redirect('/usuario/signup');
  // }
  // if (!esPasswordComplejo(password)) {
  //   req.flash('error', 'El password debe tener longitud minima de 8 caracteres, letras y numeros....')
  //   return res.redirect('/usuario/signup');
  // }
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

exports.getResetPassword = async (req, res, next) => {
  let mensaje = req.flash('error');
  mensaje = mensaje.length > 0 ? mensaje[0] : null;

  res.render('reinicio-usuario', {
    path: '/usuario/reset-password',
    titulo: 'Recuperación de contraseña',
    mensajeError: mensaje
  });
};

exports.postResetPassword = async (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset-password');
    }
    const token = buffer.toString('hex');
    Usuario.findOne({ email: req.body.email })
      .then(usuario => {
        if (!usuario) {
          req.flash('error', 'No se encontro usuario con dicho email');
          return res.redirect('/reset-password');
        }
        usuario.tokenReinicio = token;
        usuario.expiracionTokenReinicio = Date.now() + 3600000; // + 1 hora
        return usuario.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'proyectosamsungpucp@gmail.com',
          subject: 'Reinicio de password',
          html: `
            <p>Se ha solicitado un reinicio de password</p>
            <p>Click aqui <a href="http://localhost:3000/usuario/reset-password/${token}">link</a> para establecer una nuevo password.</p>
          `
        });
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  Usuario.findOne({ tokenReinicio: token, expiracionTokenReinicio: { $gt: Date.now() } })
    .then(usuario => {
      let mensaje = req.flash('error');
      mensaje = mensaje.length > 0 ? mensaje[0] : null;

      res.render('new-password-usuario', {
        path: '/new-password',
        titulo: 'Nueva contraseña',
        mensajeError: mensaje,
        idUsuario: usuario._id.toString(),
        tokenPassword: token
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const nuevoPassword = req.body.password;
  const idUsuario = req.body.idUsuario;
  const tokenPassword = req.body.tokenPassword;
  let usuarioParaActualizar;

  Usuario.findOne({
    tokenReinicio: tokenPassword,
    expiracionTokenReinicio: { $gt: Date.now() },
    _id: idUsuario
  })
    .then(usuario => {
      usuarioParaActualizar = usuario;
      return bcrypt.hash(nuevoPassword, 12);
    })
    .then(hashedPassword => {
      usuarioParaActualizar.password = hashedPassword;
      usuarioParaActualizar.tokenReinicio = undefined;
      usuarioParaActualizar.expiracionTokenReinicio = undefined;
      return usuarioParaActualizar.save();
    })
    .then(result => {
      res.redirect('/usuario/login');
    })
    .catch(err => {
      console.log(err);
    });
};