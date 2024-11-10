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
});

module.exports = mongoose.model('Categoria', categoriaSchema);
