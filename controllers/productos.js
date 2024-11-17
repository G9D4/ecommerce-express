const { ObjectId } = require("mongodb");

const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
const Pedido = require("../models/pedido");

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

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
        titulo: "Productos de la tienda",
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

      // console.log('productos', productos)
      res.render('tienda/carrito', {
        path: '/carrito',
        titulo: 'Mi Carrito',
        productos: productos,
        autenticado: req.session.autenticado
      });
    })
    .catch(err => console.log(err));

};

exports.postCarrito = (req, res, next) => {
  const idProducto = req.body.idProducto;
  const cantidad = req.body.quantity && req.body.quantity.trim() !== '' ? Number(req.body.quantity) : null;

  if (cantidad != null && cantidad <= 0) {
    req.flash('error', 'Cantidad inválida');
    return res.redirect('/carrito');
  }

  Producto.findById(idProducto)
    .then(producto => {
      if (!producto) {
        req.flash('error', 'Producto no encontrado');
        return res.redirect('/carrito');
      }
      return req.usuario.agregarAlCarrito(producto, cantidad);
    })
    .then(() => {
      res.redirect('/carrito');
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
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
    res.render("tienda/detalle-producto", {
      producto: producto,
      titulo: producto.nombre,
      path: "/",
    });
  });
};

exports.getPedidos = (req, res, next) => {
  req.usuario
      Pedido.find({ 'usuario.idUsuario': req.usuario._id })
      .then(pedidos => {
          res.render('tienda/pedidos', {
              path: '/pedidos',
              titulo: 'Mis Pedidos',
              pedidos: pedidos,
              autenticado: req.session.autenticado
          });
      })
      .catch(err => console.log(err));
};

exports.postPedido = (req, res, next) => {
  req.usuario
      .populate('carrito.productos.idProducto')
      .then(usuario => {
      const productos = usuario.carrito.productos.map(i => {
          return { 
            cantidad: i.cantidad, 
            producto: { ...i.idProducto._doc } 
          };
      });
      const pedido = new Pedido({
          usuario: {
            nombre: req.usuario.email, // aca no hay valor para nombre asi que se pone email por el mmomento
            idUsuario: req.usuario
          },
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
          console.error(err);
          res.status(500).json({ error: 'Error al obtener el carrito' });
      });
};

exports.modificarCantidadCarrito = (req, res, next) => {
  const idProducto = req.body.idProducto;
  const nuevaCantidad = parseInt(req.body.nuevaCantidad, 10);

  if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
    req.flash('error', 'Cantidad inválida');
    return res.redirect('/carrito');
  }

  Producto.findById(idProducto)
    .then(producto => {
      if (!producto) {
        req.flash('error', 'Producto no encontrado en el carrito');
        return res.redirect('/carrito');
      }

      if (nuevaCantidad === 0) {
        return req.usuario.deleteProductoDelCarrito(idProducto);
      }

      return req.usuario.agregarAlCarrito(producto, nuevaCantidad);
    })
    .then(() => {
      res.redirect('/carrito');
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
};



exports.getComprobante = (req, res, next) => {
  const idPedido = req.params.idPedido;
  Pedido.findById(idPedido)
  .then(pedido => {
      if (!pedido) {
          return next(new Error('No se encontro el pedido'));
      }
      if (pedido.usuario.idUsuario.toString() !== req.usuario._id.toString()) {
          return next(new Error('No Autorizado'));
      }
      const nombreComprobante = 'comprobante-' + idPedido + '.pdf';
      // const nombreComprobante = 'comprobante' + '.pdf';
      const rutaComprobante = path.join('data', 'comprobantes', nombreComprobante);
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
          'Content-Disposition',
          'attachment; filename="' + nombreComprobante + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(rutaComprobante));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text('Comprobante', {
          underline: true
      });
      pdfDoc.fontSize(14).text('---------------------------------------');
      let precioTotal = 0;
      pedido.productos.forEach(prod => {
          precioTotal += prod.cantidad * prod.producto.precio;
          pdfDoc
              .fontSize(14)
              .text(
                  prod.producto.nombre +
                  ' - ' +
                  prod.cantidad +
                  ' x ' +
                  'S/ ' +
                  prod.producto.precio
              );
      });
      pdfDoc.text('---------------------------------------');
      pdfDoc.fontSize(20).text('Precio Total: S/' + precioTotal);
      pdfDoc.end();
  })
  .catch(err => console.log(err));
};