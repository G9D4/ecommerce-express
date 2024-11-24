const { ObjectId } = require("mongodb");
const Usuario = require('../models/usuario');
const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
const { validationResult } = require("express-validator");

const ITEMS_POR_PAGINA = 5;

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
        categorias: categorias,
        mensajeError: null,
        tieneError: false,
        erroresValidacion: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCrearProducto = async (req, res, next) => {
  const nombreproducto = req.body.nombreproducto;
  const urlImagen = req.body.urlImagen;
  const precio = Number(req.body.precio);
  const descripcion = req.body.descripcion;
  const caracteristicas = req.body.caracteristicas != "" ? req.body.caracteristicas.split(",") : null;
  const categoria_id = req.body.categoria;

  const categorias = await Categoria.find().then(categorias => { return categorias })
  
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/editar-producto', {
        titulo: "Crear Producto",
        path: "/admin/crear-producto",
        modoEdicion: false,
        tieneError: true,
        mensajeError: errors.array()[0].msg,
        tienecaracteristicas: true,
        erroresValidacion: errors.array(),
        categorias,
        producto: {
            nombreproducto: nombreproducto,
            urlImagen: urlImagen,
            precio: precio,
            descripcion: descripcion,
            caracteristicas: caracteristicas,
            categoria_id: categoria_id,
        },
    });
  }

  const producto = new Producto({ nombreproducto: nombreproducto, precio: precio, descripcion: descripcion, urlImagen: urlImagen, caracteristicas: caracteristicas, categoria_id: categoria_id, idUsuario: req.usuario._id });

  producto.save()
    .then(result => {
      console.log(result);
      res.redirect('/admin/productos');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProductos = (req, res, next) => {
  let page = +req.query.page || 1; // Página predeterminada si no se especifica
  let categoriaId = req.query.categoria || null; // Filtro por categoría
  let creadorId = req.query.creador || req.session.usuarioId || null; // Filtro por creador, se usa el id de sesión si no se especifica
  
  let nroProductos;
  
  const filter = {};
  if (categoriaId) filter.categoria_id = categoriaId; // Filtrar por categoría
  if (creadorId) filter.idUsuario = creadorId; // Filtrar por creador (idUsuario)

  Producto.find(filter) // Filtrar los productos según los parámetros
    .populate('categoria_id') // Incluir la información de la categoría
    .countDocuments() // Contar el número total de productos
    .then(nroDocs => {
      nroProductos = nroDocs;
      return Producto.find(filter)
        .skip((page - 1) * ITEMS_POR_PAGINA)
        .limit(ITEMS_POR_PAGINA)
        .populate('categoria_id'); // Asegurar paso de cateogoria de productos
    })
    .then(productos => {
      Categoria.find()
        .then(categorias => {
          Usuario.find({ isadmin: 1 }) // Filtrar usuarios con isadmin: 1
            .then(creadores => {
              res.render('admin/productos', {
                prods: productos,
                categorias: categorias,
                creadores: creadores,
                titulo: "Administración de Productos",
                path: "/admin/productos",
                autenticado: req.session.autenticado,
                page: page,
                lastPage: Math.ceil(nroProductos / ITEMS_POR_PAGINA),
                categoriaSeleccionada: categoriaId, // Pasar la categoría seleccionada al front-end
                creadorSeleccionado: creadorId // Pasar el creador seleccionado al front-end
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
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getCategorias = (req, res, next) => {
  const editMode = req.query.edit;
  let categoria = null;

  Categoria.find()
    .sort({ orden: 1 }) // Orden ascendente según el campo 'orden'
    .then(categorias => {
      if (editMode) {
        return Categoria.findById(editMode)
          .then(categoriaEditada => {
            if (!categoriaEditada) {
              return res.redirect('/admin/categorias');
            }
            res.render("admin/categorias", {
              titulo: "Administración de Categorías",
              path: "/admin/categorias",
              categorias: categorias,
              categoria: categoriaEditada, 
              autenticado: req.session.autenticado,
              mensajeError: null,
              tieneError: false,
              erroresValidacion: []
            });
          });
      }
      res.render("admin/categorias", {
        titulo: "Administración de Categorías",
        path: "/admin/categorias",
        categorias: categorias,
        categoria: null, // No hay categoría a editar, es modo creación
        autenticado: req.session.autenticado,
        mensajeError: null,
        tieneError: false,
        erroresValidacion: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCategoria = (req, res, next) => {
  const { idCategoria, categoria, ruta, orden } = req.body;

  const categoriaId = idCategoria || undefined;

  Categoria.find() 
    .then(categorias => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).render('admin/categorias', {
          titulo: idCategoria ? "Editar Categoría" : "Crear Categoría",
          path: "/admin/categorias",
          modoEdicion: !!idCategoria,
          tieneError: true,
          mensajeError: errors.array()[0].msg,
          erroresValidacion: errors.array(),
          categorias: categorias,
          categoria: {
            idCategoria: idCategoria,
            categoria: categoria,
            ruta: ruta,
            orden: orden
          }
        });
      }

      return Categoria.findOne({ orden: orden, _id: { $ne: categoriaId } })
        .then(ordenExiste => {
          if (ordenExiste) {
            return res.status(422).render('admin/categorias', {
              titulo: idCategoria ? "Editar Categoría" : "Crear Categoría",
              path: "/admin/categorias",
              modoEdicion: !!idCategoria,
              tieneError: true,
              mensajeError: "El orden ya existe. Por favor, elige otro.",
              erroresValidacion: [],
              categorias: categorias,
              categoria: {
                idCategoria: idCategoria,
                categoria: categoria,
                ruta: ruta,
                orden: orden
              }
            });
          }

          if (idCategoria) {
            // Modo edición
            return Categoria.findById(idCategoria)
              .then(categoriaObj => {
                if (!categoriaObj) {
                  return res.redirect('/admin/categorias');
                }
                categoriaObj.categoria = categoria;
                categoriaObj.ruta = ruta.toLowerCase().replace(/\s+/g, "-");
                categoriaObj.orden = orden;
                categoriaObj.idUsuario = req.usuario._id;
                return categoriaObj.save();
              })
              .then(() => {
                console.log('Categoría actualizada');
                res.redirect('/admin/categorias');
              })
              .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
          } else {
            // Modo creación
            const nuevaCategoria = new Categoria({
              categoria: categoria,
              ruta: ruta.toLowerCase().replace(/\s+/g, "-"),
              orden: orden,
              idUsuario: req.usuario._id
            });

            return nuevaCategoria.save()
              .then(() => {
                console.log('Categoría creada');
                res.redirect('/admin/categorias');
              })
              .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
          }
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

exports.postEliminarCategoria = (req, res, next) => {
  const categoriaId = req.params.id;

  Categoria.deleteOne({ _id: categoriaId })
    .then(() => {
      console.log('Categoría eliminada');
      res.redirect('/admin/categorias');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


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
            categorias: categorias,
            mensajeError: null,
            tieneError: false,
            erroresValidacion: []
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

// Controlador para guardar los cambios del producto editado
exports.postEditProductos = async (req, res, next) => {
  const productoId = req.body.idProducto; // Obtiene el ID del producto de los parámetros de la URL
  const nombreproducto = req.body.nombreproducto;
  const precio = Number(req.body.precio);
  const descripcion = req.body.descripcion;
  const urlImagen = req.body.urlImagen;
  const categoria_id = new ObjectId(req.body.categoria);
  const caracteristicas = req.body.caracteristicas != "" ? req.body.caracteristicas.split(",") : null;

  const categorias = await Categoria.find().then(categorias => { return categorias });

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/editar-producto', {
        titulo: "Editar Producto",
        path: "/admin/editar-producto",
        modoEdicion: true,
        tieneError: true,
        categorias: categorias,
        mensajeError: errors.array()[0].msg,
        tienecaracteristicas: true,
        erroresValidacion: errors.array(),
        producto: {
            _id: productoId,
            nombreproducto: nombreproducto,
            urlImagen: urlImagen,
            precio: precio,
            descripcion: descripcion,
            caracteristicas: caracteristicas,
            categoria_id: categoria_id, // categoria: categoria_id
        },
    });
  }

  // Actualiza el producto
  Producto.findById(productoId)
    .then(producto => {
      if (producto.idUsuario.toString() !== req.usuario._id.toString()) {
        // Si el producto no es del usuario, no permite actualizar
        return res.redirect('/');
    }
      producto.nombreproducto = nombreproducto;
      producto.precio = precio;
      producto.descripcion = descripcion;
      producto.urlImagen = urlImagen;
      producto.categoria_id = categoria_id;
      producto.caracteristicas = caracteristicas;
      return producto.save();
    })
    .then(result => {
      console.log('Producto actualizado satisfactoriamente');
      res.redirect('/admin/productos');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEliminarProducto = async (req, res) => {
  const idProducto = req.body.idProducto;
  Producto.deleteOne({_id: idProducto, idUsuario: req.usuario._id})
    .then(result => {
      console.log('Producto eliminado satisfactoriamente');
      res.redirect('/admin/productos');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

function actualizarOrdenCategorias() {
  return Categoria.find()
    .sort({ orden: 1 }) // Ordenar categorías por el campo 'orden'
    .then(categorias => {
      // Aquí podrías actualizar un archivo de navegación o una caché si es necesario
      console.log('Categorías reordenadas para la navegación:', categorias.map(c => c.categoria));
    })
    .catch(err => {
      console.error('Error actualizando el orden de las categorías:', err);
      throw err;
    });
}
