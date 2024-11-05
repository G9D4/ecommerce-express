const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productoSchema = new Schema({
  nombreproducto: {
    type: String,
    required: true
  },
  urlImagen: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  caracteristicas: {
    type: Array,
  },
  categoria_id: {
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  }
});

module.exports = mongoose.model('Producto', productoSchema);
