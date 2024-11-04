

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pedidoSchema = new Schema({
  productos: [
    {
      idProducto: { type: Schema.Types.ObjectId, required: true, ref: 'Producto'},
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

// const { ObjectId } = require("mongodb");

// const db = require("../utils/database");
// const pedidosCollection = db.collection("pedidos");

// class Pedido {
//     constructor(
//       id,
//       usuarioId,
//       productos
//     ) {
//       this.id = id;
//       this.usuarioId = usuarioId;
//       this.productos = productos;
//     }

//     async save() {
//         const pedido = {
//             usuarioId: new ObjectId(this.usuarioId),
//             productos: this.productos
//         };
//         return await pedidosCollection.insertOne(pedido);
//     }

//     static async fetchAll(usuarioId) {
//         const pedidos = await pedidosCollection.find({ usuarioId: usuarioId }).toArray()
//         return pedidos;
//     }
// }      

// module.exports = Pedido;
