const { ObjectId } = require("mongodb");
const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
//const file = require('../utils/file')


exports.getCrearProducto = async (req, res, next) => {
  try {
    const categorias = await Categoria.find().then(categorias => { return categorias })

    res.render("admin/editar-producto", {
      titulo: "Crear Producto",
      path: "/admin/crear-producto",
      tienecaracteristicas: false,
      modoEdicion: false,
      categorias,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postCrearProducto = async (req, res, next) => {
  console.log("bazinga");
  const nombreproducto = req.body.nombreproducto;
  //const urlImagen = req.body.urlImagen;

  const imagen = req.file;
  console.log("COnsole log: " + imagen);
  const precio = Number(req.body.precio);
  const descripcion = req.body.descripcion;
  const caracteristicas = req.body.caracteristicas.split(", ");
  const categoria_id = req.body.categoria; // Capturando la categoría


  if(!imagen){
    return res.status(422).render('admin/editar-productos', {
      path: 'admin/editar-productos',
      titulo: 'Crear Producto',
      modoEdicion: false,
      tieneError: true,
      mensajeError: 'No hay imagen de Producto',
      erroresValidacion: [],
      producto: {
        nombre: nombre,
        precio: precio,
        descripcion: descripcion
      },
    });

  }

  const urlImagen = imagen.path;

  const producto = new Producto({ 
    nombreproducto: nombreproducto, 
    precio: precio, 
    descripcion: descripcion, 
    urlImagen: urlImagen, caracteristicas: caracteristicas, categoria_id: categoria_id, idUsuario: req.usuario._id });

  producto.save()
    .then(result => {
      console.log(result);
      res.redirect('/admin/productos');
    })
    .catch(err => console.log(err));

};

exports.getProductos = async (req, res, next) => {
  try {
    const productos = await Producto.find().populate('categoria_id').then(productos => { return productos })
    productos.forEach(producto => { producto.categoria = producto.categoria_id.categoria })

    res.render("admin/productos", {
      prods: productos,
      titulo: "Administracion de Productos",
      path: "/admin/productos",
    });
  } catch (error) {
    console.log(error);
  }
};

// Controlador para obtener el producto a editar
exports.getEditProductos = async (req, res, next) => {

  try {
    const categorias = await Categoria.find().then(categorias => { return categorias })
    const productoId = req.params.id; // Obtiene el ID del producto de los parámetros de la URL
    const producto = await Producto.findById(productoId);

    if (!producto) {
      return res.status(404).send("Producto no encontrado");
    }

    res.render("admin/editar-producto", {
      titulo: "Editar Producto",
      path: "/admin/editar-producto",
      producto: producto, // Pasar el producto a la vista
      tienecaracteristicas: producto.caracteristicas != null ? true : false,
      modoEdicion: true,
      categorias,
    });
  } catch (error) {
    console.log(error);
  }
};

// Controlador para guardar los cambios del producto editado
exports.postEditProductos = async (req, res, next) => {
  const productoId = req.body.idProducto; // Obtiene el ID del producto de los parámetros de la URL
  const nombreproducto = req.body.nombreproducto;
  const precio = Number(req.body.precio);
  const descripcion = req.body.descripcion;
  //const urlImagen = req.body.urlImagen;
  const imagen = req.file;
  const categoria_id = new ObjectId(req.body.categoria);
  const caracteristicas = req.body.caracteristicas != "" ? req.body.caracteristicas.split(",") : null;

  // Actualiza el producto
  Producto.findById(productoId)
    .then(producto => {
      if (producto.idUsuario.toString() !== req.usuario._id.toString()) {
        return res.redirect('/');
    }
      producto.nombreproducto = nombreproducto;
      producto.precio = precio;
      producto.descripcion = descripcion;
      if(imagen){ 
        producto.urlImagen = imagen.path;
      }
      producto.categoria_id = categoria_id;
      producto.caracteristicas = caracteristicas;
      return producto.save();
    })
    .then(result => {
      console.log('Producto actualizado satisfactoriamente');
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
