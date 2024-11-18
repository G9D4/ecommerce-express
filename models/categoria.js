const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categoriaSchema = new Schema({
  categoria: {
    type: String,
    required: true
  },
  ruta: {
    type: String,
    required: true
  },
  idUsuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
});

module.exports = mongoose.model('Categoria', categoriaSchema);
