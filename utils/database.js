const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
// const uri = process.env.DB_URI;
const uri='mongodb+srv://santaaparicioc:typing1234@cluster0.9o6gj.mongodb.net/'

const client = new MongoClient(uri);
const database = client.db('samsung');

module.exports = database;