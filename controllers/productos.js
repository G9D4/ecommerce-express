const { ObjectId } = require("mongodb");

const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
const Pedido = require("../models/pedido");
const ITEMS_PER_PAGE = 5;

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

exports.getHome = (req, res, next) => {
  const categoria_ruta = req.params.categoria_ruta || null;
  const page = parseInt(req.query.page) || 1;

  Categoria.find()
    .then(categorias => {
      const categoriaSeleccionada = categoria_ruta
        ? categorias.find(cat => cat.ruta === categoria_ruta)
        : null;

      const filtro = categoriaSeleccionada
        ? { categoria_id: categoriaSeleccionada._id }
        : {};

      return Promise.all([
        Producto.find(filtro).countDocuments(), // Total de documentos
        Producto.find(filtro) // Productos filtrados
          .skip((page - 1) * ITEMS_PER_PAGE)
          .limit(ITEMS_PER_PAGE)
          .populate('categoria_id'),
        categorias,
      ]);
    })
    .then(([documentCount, productos, categorias]) => {
      const titulo = categoria_ruta
        ? `Categoría: ${categorias.find(cat => cat.ruta === categoria_ruta)?.categoria || 'No encontrada'}`
        : 'Página principal de la Tienda';

      res.render(categoria_ruta ? 'tienda/index' : 'tienda/home', {
        prods: productos,
        categorias: categorias,
        titulo: titulo,
        path: `/${categoria_ruta || ''}`,
        autenticado: req.session.autenticado,
        page: page,
        lastPage: Math.ceil(documentCount / ITEMS_PER_PAGE),
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getProductos = (req, res, next) => {
  const categoria_ruta = req.params.categoria_ruta ? req.params.categoria_ruta : null;
  Categoria.find().then(categorias => {
    const categoria_id = categoria_ruta ? categorias.find(x => x.ruta == categoria_ruta) : null;

    // Filtra si hay una categoría seleccionada
    Producto.find(categoria_id ? { categoria_id: categoria_id } : {})
      .populate('categoria_id')
      .then(productos => {
        productos.forEach(producto => { 
          producto.categoria = producto.categoria_id.categoria 
        });
        res.render('tienda/index', {
          prods: productos,
          categorias: categorias, 
          titulo: "Productos de la tienda",
          path: `/${categoria_ruta || ""}`,
          autenticado: req.session.autenticado
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
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

      // console.log('productos', productos)
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
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
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
            nombres: req.usuario.nombres,
            apellidos: req.usuario.apellidos,
            email: req.usuario.email,
            // telefono: req.usuario.telefono
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

      return req.usuario.actualizarAlCarrito(producto, nuevaCantidad);
    })
    .then(() => {
      res.redirect('/carrito');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getComprobante = (req, res, next) => {
  const idPedido = req.params.idPedido;

  Pedido.findById(idPedido)
    .populate('productos.producto') // Asegura que los datos de los productos estén disponibles
    .then(pedido => {
      if (!pedido) {
        return next(new Error('No se encontró el pedido'));
      }

      if (pedido.usuario.idUsuario.toString() !== req.usuario._id.toString()) {
        return next(new Error('No autorizado'));
      }

      const nombreComprobante = `comprobante-${idPedido}.pdf`;
      const rutaComprobante = path.join('data', 'comprobantes', nombreComprobante);
      const pdfDoc = new PDFDocument({ margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${nombreComprobante}"`
      );

      pdfDoc.pipe(fs.createWriteStream(rutaComprobante));
      pdfDoc.pipe(res);

      // Encabezado con logotipo
      const logoPath = path.join('public', 'imagencomprobante', 'logo.jpeg');
      if (fs.existsSync(logoPath)) {
        pdfDoc.image(logoPath, 50, 40, { width: 100 });
      }
      pdfDoc
        .fontSize(20)
        .text('Comprobante de Pedido', 150, 50, { align: 'center' })
        .moveDown();

      // Información del comprador
      pdfDoc
        .fontSize(12)
        .text(`Nombre: ${pedido.usuario.nombres} ${req.usuario.apellidos}`)
        .text(`Correo: ${pedido.usuario.email}`)
        .text(`Fecha: ${new Date(pedido.fecha).toLocaleDateString()}`)
        .moveDown();

      // Detalles del pedido
      pdfDoc.fontSize(14).text('Detalles del Pedido:').moveDown();

      let precioTotal = 0;

      pedido.productos.forEach(prod => {
        const subTotal = prod.cantidad * prod.producto.precio;
        precioTotal += subTotal;

        pdfDoc
          .fontSize(12)
          .text(
            `${prod.producto.nombreproducto} - ${prod.cantidad} x S/ ${prod.producto.precio.toFixed(
              2
            )} = S/ ${subTotal.toFixed(2)}`
          );
      });

      pdfDoc
        .fontSize(14)
        .text('---------------------------------------')
        .fontSize(16)
        .text(`Precio Total: S/ ${precioTotal.toFixed(2)}`, { align: 'right' })
        .moveDown();

      // Pie de página
      pdfDoc
        .fontSize(10)
        .text(
          'Gracias por su compra. Por favor, conserve este comprobante para futuras referencias.',
          { align: 'center' }
        )
        .moveDown();

      pdfDoc.end();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};