const { ObjectId } = require("mongodb");
const Producto = require("../models/producto");
const Categoria = require("../models/categoria");

exports.getCrearProducto = (req, res, next) => {
  Categoria
    .find()
    .then(categorias => {
      res.render('admin/editar-producto', { 
        titulo: 'Crear Producto',
        path: '/admin/crear-producto',
        tienecaracteristicas: false,
        modoEdicion: false,
        autenticado: req.session.autenticado,
        // tieneError: false,
        // mensajeError: null,
        // erroresValidacion: [],
        categorias: categorias,
      });
    })
    .catch(err => console.log(err));
};

exports.postCrearProducto = async (req, res, next) => {
  const nombreproducto = req.body.nombreproducto;
  const urlImagen = req.body.urlImagen;
  const precio = Number(req.body.precio);
  const descripcion = req.body.descripcion;
  const caracteristicas = req.body.caracteristicas != "" ? req.body.caracteristicas.split(",") : null;
  const categoria_id = req.body.categoria; // Capturando la categoría
  const producto = new Producto({ nombreproducto: nombreproducto, precio: precio, descripcion: descripcion, urlImagen: urlImagen, caracteristicas: caracteristicas, categoria_id: categoria_id, idUsuario: req.usuario._id });

  producto.save()
    .then(result => {
      console.log(result);
      res.redirect('/admin/productos');
    })
    .catch(err => console.log(err));
};

exports.getProductos = (req, res, next) => {
  Producto.find()
    .populate('categoria_id') // Esto incluye la información completa de la categoría en cada producto
    .then(productos => {
      Categoria.find()
        .then(categorias => {
          res.render('admin/productos', {
            prods: productos,
            categorias: categorias,
            titulo: "Administración de Productos",
            path: "/admin/productos",
            autenticado: req.session.autenticado
          });
        })
        .catch(err => {
          console.log('Error al obtener las categorías', err);
          next(err);
        });
    })
    .catch(err => {
      console.log('Error al obtener los productos', err);
      next(err); 
    });
};

exports.getCategorias = (req, res, next) => {
  const editMode = req.query.edit;
  let categoria = null;

  Categoria.find()
    .then(categorias => {
      if (editMode) {
        return Categoria.findById(editMode)
          .then(categoriaEditada => {
            if (!categoriaEditada) {
              return res.redirect('/admin/categorias');
            }
            categoria = categoriaEditada;
            res.render("admin/categorias", {
              titulo: "Administración de Categorías",
              path: "/admin/categorias",
              categorias: categorias,
              categoria: categoria, // Se envía la categoría a editar
              autenticado: req.session.autenticado
            });
          });
      }
      res.render("admin/categorias", {
        titulo: "Administración de Categorías",
        path: "/admin/categorias",
        categorias: categorias,
        categoria: null, // No hay categoría a editar, es modo creación
        autenticado: req.session.autenticado
      });
    })
    .catch(err => console.log(err));
};

exports.postCategoria = (req, res, next) => {
  const { idCategoria, categoria, ruta } = req.body;

  if (idCategoria) {
    // Modo edición
    Categoria.findById(idCategoria)
      .then(categoriaObj => {
        if (!categoriaObj) {
          return res.redirect('/admin/categorias');
        }
        categoriaObj.categoria = categoria;
        categoriaObj.ruta = ruta.toLowerCase().replace(/\s+/g, "_"); // reemplaza los espacios con guion bajo
        return categoriaObj.save();
      })
      .then(() => {
        console.log('Categoría actualizada');
        res.redirect('/admin/categorias');
      })
      .catch(err => console.log(err));
  } else {
    // Modo creación
    const nuevaCategoria = new Categoria({
      categoria: categoria,
      ruta: ruta.toLowerCase().replace(/\s+/g, "-"),
      idUsuario: req.usuario._id
    });
    nuevaCategoria.save()
      .then(() => {
        console.log('Categoría creada');
        res.redirect('/admin/categorias');
      })
      .catch(err => console.log(err));
  }
};

exports.postEliminarCategoria = (req, res, next) => {
  const categoriaId = req.params.id;

  Categoria.deleteOne({ _id: categoriaId })
    .then(() => {
      console.log('Categoría eliminada');
      res.redirect('/admin/categorias');
    })
    .catch(err => console.log(err));
};

// Controlador para obtener el producto a editar
exports.getEditProductos = (req, res, next) => {
  const idProducto = req.params.id;
  // console.log('Producto', idProducto);
  Producto.findById(idProducto)
    .populate('categoria_id') 
    .then(producto => {
      if (!producto) {
        return res.redirect('/admin/productos');
      }
      Categoria.find()
        .then(categorias => {
          // console.log(categorias);
          res.render('admin/editar-producto', {
            titulo: 'Editar Producto',
            path: '/admin/editar-producto',
            producto: producto,
            tienecaracteristicas: producto.caracteristicas != null ? true : false,
            modoEdicion: true,
            autenticado: req.session.autenticado,
            categorias: categorias
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

// Controlador para guardar los cambios del producto editado
exports.postEditProductos = async (req, res, next) => {
  const productoId = req.body.idProducto; // Obtiene el ID del producto de los parámetros de la URL
  const nombreproducto = req.body.nombreproducto;
  const precio = Number(req.body.precio);
  const descripcion = req.body.descripcion;
  const urlImagen = req.body.urlImagen;
  const categoria_id = new ObjectId(req.body.categoria);
  // console.log(categoria_id);
  const caracteristicas = req.body.caracteristicas != "" ? req.body.caracteristicas.split(",") : null;

  // Actualiza el producto
  Producto.findById(productoId)
    .then(producto => {
      // console.log(producto.idUsuario.toString());
      // console.log(req.usuario._id.toString());
      if (producto.idUsuario.toString() !== req.usuario._id.toString()) {
        console.log("No tienes permisos para editar este producto"); // New Error Message
        return res.redirect('/');
      }
      producto.nombreproducto = nombreproducto;
      producto.precio = precio;
      producto.descripcion = descripcion;
      producto.urlImagen = urlImagen;
      producto.caracteristicas = caracteristicas;
      producto.categoria_id = categoria_id;
      // producto.idUsuario = req.usuario._id
      console.log("Nuevo",producto);
      return producto.save();
    })
    .then(result => {
      console.log('Producto actualizado satisfactoriamente', result);
      res.redirect('/admin/productos');
    })
    .catch(err => console.log(err));
};

exports.postEliminarProducto = async (req, res) => {
  const idProducto = req.body.idProducto;
  Producto.deleteOne({_id: idProducto, idUsuario: req.usuario._id})
    .then(result => {
      console.log('Producto eliminado satisfactoriamente');
      res.redirect('/admin/productos');
    })
    .catch(err => console.log(err));
};
