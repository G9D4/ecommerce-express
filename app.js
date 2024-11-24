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
const multer = require('multer');



//from project
const usuarioRouter = require('./routes/usuario')
const ecommerceRouter = require('./routes/ecommerce')
const adminRouter = require('./routes/admin');
const Usuario = require('./models/usuario');




const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

//Definicion de almacenamiento de archivos
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'imagenes');
    
  },
  filename: (req, file, cb) => {
    //cb(null, new Date().toISOString() + '-' + file.originalname); //no funciona esta shit
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);//esta si funciona :D
  }
});

//Definicion de tipo de archivos permitidos
const fileFilter = (req, file, cb) => {
  if(
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.get("/favicon.ico", function (req, res) {
  res.sendStatus(204);
});

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('imagen'));

app.use(express.static(path.join(raizDir, 'public')));
app.use('/imagenes',express.static(path.join(__dirname,'imagenes')));

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
      req.usuario = usuario;
      res.locals.user = usuario;
      next();
    })
    .catch(err => console.log(err));

});

app.use((req, res, next) => {
  res.locals.autenticado = req.session.autenticado;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRouter);
app.use('/usuario', usuarioRouter)
app.use(ecommerceRouter);


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


