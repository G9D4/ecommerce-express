const port = 3000;
const MONGODB_URI = 'mongodb+srv://santaaparicioc:typing1234@cluster0.9o6gj.mongodb.net/samsung?retryWrites=true&w=majority'

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const path = require('path');

const express = require('express');

const raizDir = require('./utils/path');

const bodyParser = require('body-parser');
const flash = require('connect-flash');
const csrf = require('csurf');

//from project
const usuarioRouter = require('./routes/usuario')
const ecommerceRouter = require('./routes/ecommerce')
const adminRouter = require('./routes/admin');
const Usuario = require('./models/usuario');
const errorController = require('./controllers/error')


const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

app.get("/favicon.ico", function (req, res) {
  res.sendStatus(204);
});

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(raizDir, 'public')));
app.use(session({ secret: 'algo muy secreto', resave: false, saveUninitialized: false, store: store }));
app.use(flash());
app.use(csrfProtection);


app.use((req, res, next) => {
  // console.log(req.session);
  if (!req.session.usuario) {
    return next();
  }
  Usuario.findById(req.session.usuario._id)
    .then(usuario => {
      if (!usuario) {
        return next();
      }  
      req.usuario = usuario;
      res.locals.user = usuario;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });

});

app.use((req, res, next) => {
  res.locals.autenticado = req.session.autenticado;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRouter);
app.use('/usuario', usuarioRouter)
app.use(ecommerceRouter);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((err, req, res, next) => {
  console.log(err);
  res.redirect('/500');
})

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(raizDir, 'views', '404.ejs'));
})

mongoose
  .connect(MONGODB_URI)
  .then(result => {

    app.listen(port, (e) => { console.log(`...running port ${port}`) });
  })
  .catch(err => {
    console.log(err);
  });


