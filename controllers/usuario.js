// const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");
const bcrypt = require('bcryptjs');


// const jwt_secret = "grupo-4";

let esPasswordComplejo = (password) => {
  return password.length > 7;
}

exports.getLogin = async (req, res, next) => {
  let mensaje = req.flash('error');
  mensaje=mensaje.length > 0?  mensaje[0]:null;

  res.render("login-usuario", {
    titulo: "Inicio de sesión del cliente",
    path: "/",
    mensajeError: mensaje
  });
};


// exports.isLoggedIn = async (req, res, next) => {
//   if (req.cookies.jwt) {
//     try {
//       const token = req.cookies.jwt;
//       const decoded = jwt.verify(token, jwt_secret);
//       const user = await Usuario.findById(decoded.id);
//       if (user) {
//         const currentUser = user;
//         res.locals.user = currentUser;
//         return next();
//       }
//       return next();
//     } catch (err) {
//       return next();
//     }
//   }
//   return next();
// };

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
          if(hayCoincidencia) {
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
  mensaje=mensaje.length > 0?  mensaje[0]:null;
  console.log('mensaje!!',mensaje)
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
            nombres:nombres,
            apellidos:apellidos,
            email: email,
            password: passwordCifrado,
            isadmin:0,
            carrito: { productos: [] }
          });
          return usuario.save();
        });
    })
    .then(result => {
      res.redirect('/usuario/login');
    })
    .catch(err => {
      console.log(err);
    });
};
