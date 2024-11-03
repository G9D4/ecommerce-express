const MONGODB_URI='mongodb+srv://santaaparicioc:typing1234@cluster0.9o6gj.mongodb.net/samsung?retryWrites=true&w=majority'

const mongoose = require('mongoose');

const path = require('path');

const express = require('express');

const raizDir = require('./utils/path');

const bodyParser = require('body-parser')

// cookieParser
const cookieParser= require('cookie-parser')

//from project
const usuarioRouter = require('./routes/usuario')
const ecommerceRouter = require('./routes/ecommerce')
const adminRouter = require('./routes/admin');

const app = express();

app.get("/favicon.ico", function (req, res) {
    res.sendStatus(204);
  });

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(raizDir, 'public')));


// cookie parser
app.use(cookieParser())

app.use('/admin', adminRouter);

app.use('/usuario',usuarioRouter)
app.use(ecommerceRouter);


app.use((req, res, next) => {
    res.status(404).sendFile(path.join(raizDir, 'views', '404.ejs'));
})

const port=3000;
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    // console.log(result)

    // Usuario.findOne().then(usuario => {
    //     if (!usuario) {
    //       const usuario = new Usuario({
    //         nombre: 'Juan',
    //         email: 'juan@gmail.com',
    //         carrito: {
    //           items: []
    //         }
    //       });
    //       usuario.save();
    //     }
    //   });
    app.listen(port,(e)=>{console.log(`...running port ${port}`)});
  })
  .catch(err => {
    console.log(err);
  });


