const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const usuarioSchema = new Schema({
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isadmin: {
    type: Number,
    required: true
  },
  carrito: {
    productos: [
      {
        idProducto: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
        cantidad: { type: Number, required: true }
      }
    ]
  }
});

usuarioSchema.methods.agregarAlCarrito = function (producto, cantidad = null) {
  if (!this.carrito) {
    this.carrito = { productos: [] };
  }
  const indiceEnCarrito = this.carrito.productos.findIndex(cp => {
    return cp.idProducto.toString() === producto._id.toString();
  });
  let nuevaCantidad = 1;
  const productosActualizados = [...this.carrito.productos];

  if (indiceEnCarrito >= 0) {
    nuevaCantidad = cantidad != null ? (this.carrito.productos[indiceEnCarrito].cantidad + cantidad) : (this.carrito.productos[indiceEnCarrito].cantidad + 1);
    productosActualizados[indiceEnCarrito].cantidad = nuevaCantidad;
  } else {
    productosActualizados.push({
      idProducto: producto._id,
      cantidad: cantidad != null ? cantidad : nuevaCantidad
    });
  }
  const carritoActualizado = {
    productos: productosActualizados
  };

  this.carrito = carritoActualizado;
  return this.save();
};
usuarioSchema.methods.deleteProductoDelCarrito = function (idProducto) {
  const productosActualizados = this.carrito.productos.filter(producto => {
    return producto.idProducto.toString() !== idProducto.toString();
  });
  this.carrito.productos = productosActualizados;
  return this.save();
};

usuarioSchema.methods.limpiarCarrito = function () {
  this.carrito = { productos: [] };
  return this.save();
};

module.exports = mongoose.model('Usuarios', usuarioSchema);