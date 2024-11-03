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
    type: String,
    required: true
  },
  categoria_id: {
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  }
});

module.exports = mongoose.model('Producto', productoSchema);




// const { ObjectId } = require("mongodb");

// const db = require("../utils/database");

// const productosCollection = db.collection("productos");
// const categoriasCollection = db.collection("categorias");

// class Producto {
//   constructor(
//     id,
//     nombreproducto,
//     urlImagen,
//     precio,
//     descripcion,
//     caracteristicas,
//     categoria_id
//   ) {
//     this.id = id;
//     this.nombreproducto = nombreproducto;
//     this.urlImagen = urlImagen;
//     this.precio = precio;
//     this.descripcion = descripcion;
//     this.caracteristicas = caracteristicas;
//     this.categoria_id = categoria_id;
//   }

//   async save() {
//     const producto = {
//       nombreproducto: this.nombreproducto,
//       urlImagen: this.urlImagen,
//       precio: this.precio,
//       descripcion: this.descripcion,
//       caracteristicas: this.caracteristicas,
//       categoria_id: this.categoria_id,
//     };
//     return await productosCollection.insertOne(producto);
//   }

//   static async fetchAll(ruta) {
//     let result = [];
//     if (ruta) {
//       const categoria = await categoriasCollection.findOne({ ruta: ruta });
    
//       result = categoria ? productosCollection
//         .find({ categoria_id: categoria._id })
//         .toArray() : null;
//     } else {
//       result = await productosCollection.find().toArray();
//     }
//     return result;
//   }

//   static async findById(id) {
//     const result = await productosCollection.findOne({ _id: new ObjectId(id) });
//     return result;
//   }

//   static async getCategorias() {
//     const result = await categoriasCollection.find().toArray();
//     return result;
//   }

//   static async update(id, updatedData) {
//     const result = await productosCollection.updateOne(
//       { _id: new ObjectId(id) },
//       {
//         $set: {
//           nombreproducto: updatedData.nombreproducto,
//           urlImagen: updatedData.urlImagen,
//           precio: updatedData.precio,
//           descripcion: updatedData.descripcion,
//           caracteristicas: updatedData.caracteristicas,
//           categoria_id: updatedData.categoria_id,
//         },
//       }
//     );
//     return result;
//   }

//   static async deleteById(id) {
//     const result = await productosCollection.deleteOne({
//       _id: new ObjectId(id),
//     });
//     return result;
//   }
// }
// module.exports = Producto;
