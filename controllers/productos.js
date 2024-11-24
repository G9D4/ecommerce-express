const { ObjectId } = require("mongodb");

const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
const Pedido = require("../models/pedido");
const ITEMS_PER_PAGE = 5;

exports.getHome = async (req, res) => {
  const categoria_ruta = req.params.categoria_ruta ? req.params.categoria_ruta : null;
  const categorias = await Categoria.find().then(categorias => { return categorias });
  const categoria_id = categoria_ruta ? categorias.find(x => x.ruta == categoria_ruta) : null;

  Producto.find(categoria_id ? { categoria_id: categoria_id } : {}).populate('categoria_id')
    .then(productos => {
      productos.forEach(producto => { producto.categoria = producto.categoria_id.categoria })

      res.render('tienda/home', {
        prods: productos,
        titulo: "Home",
        path: '/',
        autenticado: req.session.autenticado
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.getProductos = async (req, res) => {
  const categoria_ruta = req.params.categoria_ruta ? req.params.categoria_ruta : null;
  const categorias = await Categoria.find().then(categorias => { return categorias });
  const categoria_id = categoria_ruta ? categorias.find(x => x.ruta == categoria_ruta) : null;

  const page = parseInt(req.query.page) || 1;

  const documentCount = await Producto.find(categoria_id ? { categoria_id: categoria_id } : {}).countDocuments();

  Producto.find(categoria_id ? { categoria_id: categoria_id } : {})
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .populate('categoria_id')
    .then(productos => {
      productos.forEach(producto => { producto.categoria = producto.categoria_id.categoria })

      res.render('tienda/index', {
        prods: productos,
        titulo: "Productos de la tienda",
        path: `/${categoria_ruta || ""}`,
        autenticado: req.session.autenticado,
        page: page,
        lastPage : Math.ceil(documentCount / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.getCarrito = async (req, res, next) => {

  req.usuario
    .populate('carrito.productos.idProducto')
    .then(usuario => {
      const productos = usuario.carrito.productos;
      productos.forEach(x => x.dataProducto = x.idProducto);

      console.log('productos', productos)
      res.render('tienda/carrito', {
        path: '/carrito',
        titulo: 'Mi Carrito',
        productos: productos,
        autenticado: req.session.autenticado
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.postCarrito = async (req, res) => {

  const idProducto = req.body.idProducto;
  const producto = await Producto.findById(idProducto);
  const cantidad = req.body.quantity != '' ? Number(req.body.quantity) : null;

  Producto.findById(producto._id)
    .then(producto => {
      return req.usuario.agregarAlCarrito(producto, cantidad);
    })
    .then(result => {
      console.log(result);
      res.redirect('/carrito');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEliminarProductoCarrito = async (req, res) => {

  const idProducto = req.body.idProducto;
  req.usuario.deleteProductoDelCarrito(idProducto)
    .then(result => {
      res.redirect('/carrito');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducto = (req, res) => {
  const idProducto = req.params.idProducto;
  Producto.findById(idProducto).then((producto) => {
    res.render("tienda/detalle-producto", {
      producto: producto,
      titulo: producto.nombre,
      path: "/",
    });
  });
};

exports.getPedidos = async (req, res, next) => {

  Pedido.find({ 'idUsuario': req.usuario._id }).populate('productos.idProducto')
    .then(pedidos => {
      pedidos.forEach(x => x.productos.forEach(y => { y.nombreproducto = y.idProducto.nombreproducto }))

      res.render('tienda/pedidos', {
        path: '/pedidos',
        titulo: 'Mis Pedidos',
        pedidos: pedidos,
        autenticado: req.session.autenticado
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

};

exports.postPedido = async (req, res, next) => {
  req.usuario
    .populate('carrito.productos.idProducto')
    .then(usuario => {
      const productos = usuario.carrito.productos.map(i => {

        return { cantidad: i.cantidad, idProducto: new ObjectId(i.idProducto._doc._id) };
      });
      const pedido = new Pedido({
        idUsuario: new ObjectId(req.usuario._id),
        productos: productos
      });
      return pedido.save();
    })
    .then(result => {
      return req.usuario.limpiarCarrito();
    })
    .then(() => {
      res.redirect('/pedidos');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}; 

exports.getCarritoDesplegable = (req, res, next) => {
  req.usuario
      .populate('carrito.productos.idProducto')
      .then(usuario => {
          const productosCarrito = usuario.carrito.productos.map(item => {
              return {
                  id: item.idProducto._id,
                  nombreproducto: item.idProducto.nombreproducto,
                  cantidad: item.cantidad,
                  precio: item.idProducto.precio
              };
          });

          const precioTotal = productosCarrito.reduce((total, item) => {
              return total + item.precio * item.cantidad; // Calcular el precio total del carrito
          }, 0);

          res.json({
              productos: productosCarrito,
              precioTotal: precioTotal
          });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);  
      });
};