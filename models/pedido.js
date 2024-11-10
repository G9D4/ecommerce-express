const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pedidoSchema = new Schema({
  productos: [
    {
      idProducto: { type: Schema.Types.ObjectId, required: true, ref: 'Producto' },
      cantidad: { type: Number, required: true }
    }
  ],
  idUsuario: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Usuario'
  }

});

module.exports = mongoose.model('Pedido', pedidoSchema);
