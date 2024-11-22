const { ObjectId } = require("mongodb");

const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
const Pedido = require("../models/pedido");

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
    .catch(err => console.log(err));

};

exports.getProductos = async (req, res) => {
  const categoria_ruta = req.params.categoria_ruta ? req.params.categoria_ruta : null;
  const categorias = await Categoria.find().then(categorias => { return categorias });
  const categoria_id = categoria_ruta ? categorias.find(x => x.ruta == categoria_ruta) : null;

  Producto.find(categoria_id ? { categoria_id: categoria_id } : {}).populate('categoria_id')
    .then(productos => {
      productos.forEach(producto => { producto.categoria = producto.categoria_id.categoria })
      res.render('tienda/index', {
        prods: productos,
        titulo: `${categoria_id.categoria}`,
        categoria: `${categoria_id.categoria}`,
        categoriaRuta: categoria_ruta,
        sortBy: 'position',
        path: `/${categoria_ruta || ""}`,
        thirdBreadcrumb: false,
        autenticado: req.session.autenticado,
      });
    })
    .catch(err => console.log(err));

};

exports.getProductosSorted = async (req, res) => {
  const sortBy = req.query.productOrder
  const categoria_ruta = req.params.categoria_ruta ? req.params.categoria_ruta : null;
  const categorias = await Categoria.find().then(categorias => { return categorias });
  const categoria_id = categoria_ruta ? categorias.find(x => x.ruta == categoria_ruta) : null;

  Producto.find(categoria_id ? { categoria_id: categoria_id } : {}).populate('categoria_id')
    .then(productos => {
      productos.forEach(producto => { producto.categoria = producto.categoria_id.categoria })
      if (sortBy === 'low-price') {
        productos.sort((a, b) => a.precio - b.precio);
      } else if (sortBy === 'high-price') {
        productos.sort((a, b) => b.precio - a.precio);
      } else if (sortBy === 'name') {
        productos.sort((a, b) => a.nombreproducto.localeCompare(b.nombreproducto));
      }

      res.render('tienda/index', {
        prods: productos,
        titulo: `${categoria_id.categoria}`,
        categoria: `${categoria_id.categoria}`,
        categoriaRuta: categoria_ruta,
        sortBy: sortBy,
        path: `/${categoria_ruta || ""}`,
        autenticado: req.session.autenticado
      });
    })
    .catch(err => console.log(err));

};

exports.getCarrito = async (req, res, next) => {

  req.usuario
    .populate('carrito.productos.idProducto')
    .then(usuario => {
      const productos = usuario.carrito.productos;
      productos.forEach(x => x.dataProducto = x.idProducto);

      res.render('tienda/carrito', {
        path: '/carrito',
        titulo: 'Mi Carrito',
        productos: productos,
        autenticado: req.session.autenticado
      });
    })
    .catch(err => console.log(err));

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
      res.redirect('/carrito');
    })
    .catch(err => console.log(err));
};

exports.postEliminarProductoCarrito = async (req, res) => {

  const idProducto = req.body.idProducto;
  req.usuario.deleteProductoDelCarrito(idProducto)
    .then(result => {
      res.redirect('/carrito');
    })
    .catch(err => console.log(err));
};

exports.getProducto = (req, res) => {
  const idProducto = req.params.idProducto;
  Producto.findById(idProducto).then((producto) => {
    Categoria.findById(producto.categoria_id).then ((p) => {
      res.render("tienda/detalle-producto", {
        producto: producto,
        titulo: producto.nombreproducto,
        categoria: p.categoria,
        categoriaRuta: p.ruta,
        path: "/",
        thirdBreadcrumb: true,
      });
    })
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
    .catch(err => console.log(err));

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
    .catch(err => console.log(err));
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
          precio: item.idProducto.precio,
          imagen: item.idProducto.urlImagen
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
      console.error(err);
      res.status(500).json({ error: 'Error al obtener el carrito' });
    });
};